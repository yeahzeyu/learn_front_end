import { Component, STATE, ATTRIBUTE, createElement} from "./framework.js"
import { enableGesture } from "./gesture.js"


export {STATE, ATTRIBUTE} from "./framework.js"; //可能会有其他组件会继承carousel.js，所以还需要再export一次

export class Button extends Component {
    constructor() {
        super();
    }

    render() {
        //如果要做到像react那样级联的render，这里还需要一定的设计
        this.childContainer = <span />; //这里不能用render，否则不级联
        this.root = (<div>{this.childContainer}</div>).render();
        return this.root;
        //我们目前设计的组件模型是没有办法多次渲染的，所以也就没法像react那样不断地重复去调render
    }

    appendChild(child) {
        if(!this.childContainer)
            this.render();
        this.childContainer.appendChild(child);
    }
}