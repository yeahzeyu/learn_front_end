import { Component, createElement } from "./framework.js"

class Carousel extends Component {
    constructor() {
        super(); //不能在super里面调render，这是有问题的
        this.attributes = Object.create(null); //创建一个空对象，我们尽量用比较正确的名字
        // this.props = Object.create(null); //react这里是用props，因为它的attribute和property不分
    }
    setAttribute(name, value) {
        this.attributes[name] = value;
    }
    render() {
        this.root = document.createElement("div");
        this.root.classList.add("carousel");
        for (let record of this.attributes.src) {
            let child = document.createElement('div');
            child.style.backgroundImage = `url('${record}')`;
            this.root.appendChild(child);
        }
        
        //需要让图片真正地挪动地方
        let position = 0;
        
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
                let current = position - Math.round((x - x % 500)/ 500);

                for(let offset of [-2, -1, 0, 1, 2]) { //如果想要避免一些比较奇特的bug，这里也可以算多几个，比如5个 -2, -1, 0, 1, 2
                    //同时处理当前显示的元素的前一个和后一个
                    let pos = current + offset; //不希望出现负数
                    pos = (pos + children.length) % children.length;
                    children[pos].style.transition = "none";
                    children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`; 
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }
                /*
                //还是由于同一时刻可是区域最多只能显示两张图，所以进行偏移的图片只需要有两张，并不需要所有，这里可优化
                for(let child of children) {
                    child.style.transition = "none";
                    child.style.transform = `translateX(${-position * 500 + x}px)`; 
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }*/
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
                for(let offset of [0, -Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) { //Math.round(x / 500) - x表示滚动的方向，再对其进行取符号的操作，变成+1或-1
                    //同时处理当前显示的元素的前一个和后一个
                    let pos = position + offset; //不希望出现负数
                    pos = (pos + children.length) % children.length;
                    children[pos].style.transition = "";
                    children[pos].style.transform = `translateX(${-pos * 500 + offset * 500}px)`; 
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }
                /*
                for(let child of children) {
                    child.style.transition = ""; //重新打开动画
                    child.style.transform = `translateX(${-position * 500}px)`; 
                    //为什么要加500呢，因为挪到第二张的时候，就是第二张的translate了，500是当前的图片宽，正常应该去取children的getClientRect的
                }
                */
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
        
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
    mountTo(parent) {
        parent.appendChild(this.render()); //这样才能保证render一定在setAttribute后被调用
    }
}

let d = [
    "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
    "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
    "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
    "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg"
]

//document.body.appendChild(a);
let a = <Carousel src={d} />
a.mountTo(document.body);
//自定义的标签应该用什么办法使其像普通的html元素一样操作呢？
//在最新版的DOM标准里面是有办法的，需要注册一下自定义标签/元素的名称和类型
//但是现行的比较安全的浏览器版本里面，不建议这样做
//所以在使用element的时候，建议使用一个另外的接口，这里用了反向的操作