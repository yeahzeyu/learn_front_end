import { Component, STATE, ATTRIBUTE} from "./framework.js"
import { enableGesture } from "./gesture.js"
import { Timeline, Animation } from "./animation.js"
import { ease } from "./cubicBezier.js"

export {STATE, ATTRIBUTE} from "./framework.js"; //可能会有其他组件会继承carousel.js，所以还需要再export一次
console.log("STATE", STATE);

export class Carousel extends Component {
    constructor() {
        super(); //不能在super里面调render，这是有问题的
        /*
        this.attributes = Object.create(null); //创建一个空对象，我们尽量用比较正确的名字
        // this.props = Object.create(null); //react这里是用props，因为它的attribute和property不分
        */
    }
    /*
    setAttribute(name, value) {
        this.attributes[name] = value;
    }
    */
   //通过carousel组件的设计，反推了component的机制
    render() {
        this.root = document.createElement("div");
        this.root.classList.add("carousel");
        for (let record of this[ATTRIBUTE].src) {
            let child = document.createElement('div');
            child.style.backgroundImage = `url('${record.img}')`;
            this.root.appendChild(child);
        }

        enableGesture(this.root);

        let timeline = new Timeline;
        timeline.start(); //初始化一个时间线

        let handler = null;


        let children = this.root.children;
        //需要让图片真正地挪动地方
        //let position = 0; //这里的局部变量是做为state的，代表当前滚动到的位置
        this[STATE].position = 0;
        
        //组件化里面，并不是说state一定要写成某种代码形态，而是要客观上有这个东西
        //比如这里都写在render里面，就可以用局部变量做state
        let t = 0; //保存动画开始的时间，不同时间之间通讯使用到的局部状态
        let ax = 0; //动画生成的位移

        this.root.addEventListener("start", event => {
            timeline.pause();
            clearInterval(handler);
            if(Date.now() - t < 1500) {
                let progress = (Date.now() - t) / 500;
                ax = ease(progress) * 500 - 500;
            } else {
                ax = 0;
            }
        })
        this.root.addEventListener("pan", event => {
            let x = event.clientX - event.startX - ax; //计算出鼠标移动的水平
            //鼠标拖动比自动轮播更为复杂，鼠标拖动还需要考虑水平或垂直的正反两个方向
            //首先必须计算出当前显示的元素的位置
            let current = this[STATE].position - ((x - x % 500) / 500);

            for (let offset of [-1, 0, 1]) { //如果想要避免一些比较奇特的bug，这里也可以算多几个，比如5个 -2, -1, 0, 1, 2
                //同时处理当前显示的元素的前一个和后一个
                let pos = current + offset; //不希望出现负数
                pos = (pos % children.length + children.length) % children.length; //加一个children的length还是不能保证它不出现负数，可能还是会有出现连续拖动的情况，所以这里乘了一个三

                children[pos].style.transition = "none";
                children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`;
                //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
            }
        })
        this.root.addEventListener("tap", event => {
            //在浏览器模拟移动端环境下，mousedown和touchstart像都会触发
            //代码中已尝试解决这一问题，请老师审阅方案是否可行
            //console.log("tap event trigger!!!!!");
            this.triggerEvent("click", {
                data: this[ATTRIBUTE].src[this[STATE].position],
                position: this[STATE].position
            })
        })
        this.root.addEventListener("end", event => {

            //重新打开时间线
            timeline.reset();
            timeline.start();
            handler = setInterval(nextPicture, 3000)

            let x = event.clientX - event.startX - ax; //计算出鼠标移动的水平
            //鼠标拖动比自动轮播更为复杂，鼠标拖动还需要考虑水平或垂直的正反两个方向
            //首先必须计算出当前显示的元素的位置
            let current = this[STATE].position - ((x - x % 500) / 500);

            //
            let direction = Math.round((x % 500) / 500); //-1, 0, 1，要吧结束的值换成direction乘500

            if(event.isFlick) {
                if(event.velocity > 0) {
                    direction = Math.floor((x % 500) / 500); //取下界
                } else {
                    direction = Math.ceil((x % 500) / 500); //取上界
                }
                console.log(event.velocity);
            }

            for (let offset of [-1, 0, 1]) { //如果想要避免一些比较奇特的bug，这里也可以算多几个，比如5个 -2, -1, 0, 1, 2
                //同时处理当前显示的元素的前一个和后一个
                let pos = current + offset; //不希望出现负数
                pos = (pos % children.length + children.length) % children.length; //加一个children的length还是不能保证它不出现负数，可能还是会有出现连续拖动的情况，所以这里乘了一个三

                children[pos].style.transition = "none";

                //起始值跟pan的一致，终止值跟direction一致
                timeline.add(new Animation(children[pos].style, "transform", 
                - pos * 500 + offset * 500 + x % 500, 
                - pos * 500 + offset * 500 + direction % 500, 
                500, 0, ease, v => `translateX(${v}px)`));
                //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
            }

            this[STATE].position = this[STATE].position - ((x - x % 500) / 500) - direction;
            this[STATE].position = (this[STATE].position % children.length + children.length) % children.length;
            this.triggerEvent("Change", {position: this[STATE].position}); //这里没有等动画播完

            /*
            //重新基于pan的逻辑去设计panend，因为前面的实现比较偷懒，导致代码结构没办法调整
            let x = event.clientX - event.startX - ax; //计算出鼠标移动的水平
            //this.root.removeEventListener("mousemove", move);
            //this.root.removeEventListener("mouseup", up);
            //现代浏览器中在document上监听还会有额外的好处，document它可以产生，即使我们鼠标移出到浏览器外，它也能监听到事件并触发他们
            position = position - Math.round(x / 500);
            for (let offset of [0, -Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) { //Math.round(x / 500) - x表示滚动的方向，再对其进行取符号的操作，变成+1或-1
                //同时处理当前显示的元素的前一个和后一个
                let pos = position + offset; //不希望出现负数
                pos = (pos + children.length) % children.length;
                children[pos].style.transition = "";
                children[pos].style.transform = `translateX(${-pos * 500 + offset * 500}px)`;
                //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
            }
            */
        })

        let nextPicture = () => {
            let children = this.root.children;
            let nextPosition = (this[STATE].position + 1) % children.length;
            let current = children[this[STATE].position];
            let next = children[nextPosition];

            //保存动画开始的时间
            t = Date.now();
            
            //如果想精确的操控，就必须用px，不能用百分比
            timeline.add(new Animation(current.style, "transform", - this[STATE].position * 500, -500 - this[STATE].position * 500, 500, 0, ease, v => `translateX(${v}px)`));
            timeline.add(new Animation(next.style, "transform", 500 - nextPosition * 500, - nextPosition * 500, 500, 0, ease, v => `translateX(${v}px)`));
            
            this[STATE].position = nextPosition;
            this.triggerEvent("change", {position: this[STATE].position});
            //如果用requestAnimationFrame的话要用两次，逻辑比较复杂
        }
        //nextPicture();
        handler = setInterval(nextPicture, 3000)

        /*
        this.root.addEventListener("mousedown", event => {
            //拖拽动作需要通过mousedown、mousemove、mouseup三个事件组合实现
            console.log("mousedown");
            let children = this.root.children;
            let startX = event.clientX;

            let move = event => {
                console.log("mousemove");
                let x = event.clientX - startX; //计算出鼠标移动的水平
                //鼠标拖动比自动轮播更为复杂，鼠标拖动还需要考虑水平或垂直的正反两个方向

                //首先必须计算出当前显示的元素的位置
                let current = position - Math.round((x - x % 500) / 500);

                for (let offset of [-2, -1, 0, 1, 2]) { //如果想要避免一些比较奇特的bug，这里也可以算多几个，比如5个 -2, -1, 0, 1, 2
                    //同时处理当前显示的元素的前一个和后一个
                    let pos = current + offset; //不希望出现负数
                    pos = (pos + children.length) % children.length;

                    children[pos].style.transition = "none";
                    children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`;
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }

                //还是由于同一时刻可是区域最多只能显示两张图，所以进行偏移的图片只需要有两张，并不需要所有，这里可优化
                //比较推荐使用clientX和clientY
                //表示相对浏览器中间可见区域的相对位置
                //好处就在不会因为滚动等操作而改变
                //console.log(event.clientX, event.clientY)
            };
            let up = event => {
                console.log("mouseup");
                let x = event.clientX - startX; //计算出鼠标移动的水平
                //this.root.removeEventListener("mousemove", move);
                //this.root.removeEventListener("mouseup", up);
                //现代浏览器中在document上监听还会有额外的好处，document它可以产生，即使我们鼠标移出到浏览器外，它也能监听到事件并触发他们
                position = position - Math.round(x / 500);
                for (let offset of [0, -Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) { //Math.round(x / 500) - x表示滚动的方向，再对其进行取符号的操作，变成+1或-1
                    //同时处理当前显示的元素的前一个和后一个
                    let pos = position + offset; //不希望出现负数
                    pos = (pos + children.length) % children.length;
                    children[pos].style.transition = "";
                    children[pos].style.transform = `translateX(${-pos * 500 + offset * 500}px)`;
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }

                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
        */
        /*
        //实现自动循环轮播
        //由于轮播窗口可视区域同时出现的只有两张图，可以定义为current和next
        //思路是先用一帧的时间，将next图偏移到合适的位置，注意要取消掉动画，然后再跟current图一起，执行向左偏移的动画
        let currentIndex = 0;
        setInterval(() => {
            let children = this.root.children;
            let nextIndex = (currentIndex + 1) % children.length;
            let current = children[currentIndex];
            let next = children[nextIndex];
            next.style.transition = "none";
            next.style.transform = `translateX(${100 - nextIndex * 100}%)`;

            setTimeout(() => {
                next.style.transition = "";
                current.style.transform = `translateX(${-100 - currentIndex * 100}%)`;
                next.style.transform = `translateX(${- nextIndex * 100}%)`;
                currentIndex = nextIndex;
            }, 16); //16毫秒是浏览器里面一帧的时间
            //如果用requestAnimationFrame的话要用两次，逻辑比较复杂
        }, 3000)
        */

        /*
        //到达最后一张图时，往回滚动到了第一张图
        let current = 0;
        setInterval(() => {
            let children = this.root.children;
            ++current;
            current = current % children.length;
            for(let child of children) {
                child.style.transform = `translateX(-${current * 100}%)`;
            }
        }, 3000)
        */

        return this.root;
    }
    /*
    mountTo(parent) {
        parent.appendChild(this.render()); //这样才能保证render一定在setAttribute后被调用
    }
    */
}