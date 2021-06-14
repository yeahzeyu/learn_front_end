import {Component, createElement} from "./framework.js"

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
        for(let record of this.attributes.src) {
            let child = document.createElement('img');
            child.src = record;
            this.root.appendChild(child);
        }
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
let a = <Carousel src={d}/>
a.mountTo(document.body);
//自定义的标签应该用什么办法使其像普通的html元素一样操作呢？
//在最新版的DOM标准里面是有办法的，需要注册一下自定义标签/元素的名称和类型
//但是现行的比较安全的浏览器版本里面，不建议这样做
//所以在使用element的时候，建议使用一个另外的接口，这里用了反向的操作