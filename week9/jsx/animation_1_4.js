/*
    实现动画最重要的是要有一个帧的概念，每帧去执行一个什么样的事件
    JavaScript里面处理帧的集中方案，一般的动画都是16ms一帧，因为1s人眼能识别的最高帧数是60帧，1000ms/60帧 得到16ms一帧
    1、setInterval
    setInterval(() => {}， 16); //比较不推荐，因为setInterval比较不可控，浏览器会不会依据16ms执行不好说，再一个一旦代码没写好，setInterval容易发生积压

    2、setTimeout
    let tick = () => {
        setTimeout(tick, 16); //选择执行完后自重复的写法，比setInterval更加安全
    });

    3、requestAnimationFrame
    let tick = () => {
        let handler = requestAnimationFrame(tick) //现代浏览器中写动画比较常用的，简称rAF，申请浏览器执行下一帧的时候来执行这个代码，与上面不同，它是跟浏览器的帧率相关的，比如浏览器做一些降帧降频的操作时，它可能就会跟着降帧
        //cancelAnimationFrame(handler); //注销，避免资源浪费
    }
    通常会把执行自身的tick包装成一个概念，叫timeLine
*/

import { ease, linear } from "./cubicBezier.js";

//除了本身这个js文件外，其他地方都无法访问到这个symbol，可以用这个symbol做key
//可以把symbol理解成一种特殊的字符串，只不过是它永远不会重复，即使你两个symbol都叫tick，它俩也是不同的
//使用全大写加下划线的风格来表示常量
const TICK = Symbol("tick");
const TICK_HANDLER = Symbol("tick-handler");
const ANIMATIONS = Symbol("animations");
const START_TIME = Symbol("start-time");
const PAUSE_START = Symbol("pause-start");
const PAUSE_TIME = Symbol("pause-time");

export class Timeline {
    constructor() {
        //一般做变量的初始化，不会做太多的事情
        //下面这种写法，tick还是可以被外界调用到的，正确的方法是另写一个常量
        this[ANIMATIONS] = new Set();
        this[START_TIME] = new Map();
    }
    start() {
        //一个timeLine一般只要start了就可以了，不会有一个对应的stop，但是它可能有pause和resume
        //即启动tick，这里应把tick藏起来，变成一个私有的方法
        let startTime = Date.now();
        this[PAUSE_TIME] = 0;
        this[TICK] = () => {
            let now = Date.now();
            for (let animation of this[ANIMATIONS]) {
                let t;
                if (this[START_TIME].get(animation) < startTime) {
                    t = now - startTime - this[PAUSE_TIME] - animation.delay; //减掉暂停的时间
                } else {
                    t = now - this[START_TIME].get(animation) - this[PAUSE_TIME] - animation.delay; //减掉暂停的时间
                }
                if (t > animation.duration) {
                    this[ANIMATIONS].delete(animation);
                    t = animation.duration;
                }
                //console.log("tick"); //tick是用于形容钟表滴答声的词，所以用来表示时间线是比较准确的
                if (t > 0) //如果t < 0，说明动画还没开始，延迟时间还没结束
                    animation.receive(t);
            }
            //要实现暂停和回复，要吧TICK取消掉，用TICK_HANDLER管理
            this[TICK_HANDLER] = requestAnimationFrame(this[TICK]);
        }
        this[TICK]();
    }
    /*
    set rate() {
        //不是所有timeLine都提供的，表示可以让动画倍速，快进或快退

    }
    get rate() {
        //不是所有timeLine都提供的，表示可以让动画倍速，快进或快退

    }
    */
    pause() {
        //暂停，对我们的轮播组件carousel很重要，必须实现
        //需要记录暂停开始的时间，以及暂停截止的时间
        this[PAUSE_START] = Date.now();
        cancelAnimationFrame(this[TICK_HANDLER]);
    }
    resume() {
        this[PAUSE_TIME] += Date.now() - this[PAUSE_START];
        //恢复，对我们的轮播组件carousel很重要，必须实现
        this[TICK]();
    }
    reset() {
        //重启，将时间线状态清空成初始干净的，可以用于复用
        console.log('reset');
        this.pause();
        let startTime = Date.now(); //???
        this[PAUSE_TIME] = 0;
        this[ANIMATIONS] = new Set();
        this[START_TIME] = new Map();
        this[PAUSE_START] = 0;
        this[TICK_HANDLER] = null;
    }
    add(animation, startTime) {
        if (arguments.length < 2) {
            startTime = Date.now();
        }
        //如果addTime本身是在startTime之前的话，可以认为t跟t0之间是相等的关系，都为0
        //如果是在动画开始之后再添加的animation呢，就需要设定一个初始的开始时间
        //相对的还会需要一个remove
        this[ANIMATIONS].add(animation);
        this[START_TIME].set(animation, startTime);
    }
}

export class Animation {
    //CSS的动画transition是有duration、delay的
    //属性动画，把一个对象的属性从一个值变成另外一个值
    //与属性动画相对的，还有帧动画，比如每秒来一张图片
    constructor(object, property, startValue, endValue, duration, delay, timingFunction, template) {
        //对象，属性，初始值，终止值，执行时长，差值函数（如何变，是均匀还是动态）,...（后面还有其他参数，比如值的单位，如像素px）
        timingFunction = timingFunction || (v => v);
        template = template || (v => v);
        this.object = object;
        this.property = property;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.timingFunction = timingFunction;
        this.delay = delay;
        this.template = template;
    }
    //一般timeline里面不会做太多事情的
    receive(time) {
        //用于执行，类似exec,go
        console.log(time);
        //要增加终止的条件
        let range = this.endValue - this.startValue;
        //timingFunction是一个根据0到1的time，来返回0到1的progress的函数，在CSS里面会去写几类，比如linear的timingFunction
        let progress = this.timingFunction(time / this.duration); //进展，为了实现一些缓动的效果，不是直接用range去乘progress
        //这里就需要应用到三次贝塞尔曲线，描述从[0,0]到[1,1]的过程
        this.object[this.property] = this.template(this.startValue + range * progress); //这里没有考虑timingFunction，只实现了一个均匀变化
    }
}