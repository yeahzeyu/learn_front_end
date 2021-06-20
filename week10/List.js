import { Component, STATE, ATTRIBUTE, createElement} from "./framework.js"
import { enableGesture } from "./gesture.js"


export {STATE, ATTRIBUTE} from "./framework.js"; //可能会有其他组件会继承carousel.js，所以还需要再export一次

export class List extends Component {
    constructor() {
        super();
    }

    render() {
        this.children = this[ATTRIBUTE].data.map(this.template);
        this.root = (<div>{this.children}</div>).render();
        return this.root;
    }

    appendChild(child) {
        this.template = (child);
        //this.render();
    }
}