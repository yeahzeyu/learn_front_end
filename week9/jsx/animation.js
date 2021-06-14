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

export class Timeline {
    constructor() {
        //一般做变量的初始化，不会做太多的事情

    }
    start() {
        //一个timeLine一般只要start了就可以了，不会有一个对应的stop，但是它可能有pause和resume

    }
    set rate() {
        //不是所有timeLine都提供的，表示可以让动画倍速，快进或快退

    }
    get rate() {
        //不是所有timeLine都提供的，表示可以让动画倍速，快进或快退
        
    }
    pause() {
        //暂停

    }
    resume() {
        //恢复

    }
}