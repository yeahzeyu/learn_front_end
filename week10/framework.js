export function createElement(type, attributes, ...children) {
    console.log("type:", type);
    let element;
    if (typeof type === "string") //原生标签
        element = new ElementWrapper(type);
    else //type为class，需生成实例
        element = new type;
    for (let name in attributes) {
        element.setAttribute(name, attributes[name]);
    }
    //递归调用
    let processChildren = (children) => {
        for (let child of children) {
            if(typeof child === "object" && child instanceof Array) {
                processChildren(child);
                continue;
            }
            if (typeof child === "string") {
                child = new TextWrapper(child);
            }
            element.appendChild(child);
        }
    }
    processChildren(children);
    return element;
}

export const STATE = Symbol("state");
export const ATTRIBUTE = Symbol("attribute");
//这种实现方式下，你必须通过import，才能取到state，比较类似其他语言类的属性的protected模式

export class Component {
    constructor(type) {
        //this.root = this.render();
        this[ATTRIBUTE] = Object.create(null); //创建一个空对象，我们尽量用比较正确的名字
        // this.props = Object.create(null); //react这里是用props，因为它的attribute和property不分
        this[STATE] = Object.create(null);
    }
    render() {
        return this.root;
    }
    setAttribute(name, value) {
        //this.root.setAttribute(name, value);
        this[ATTRIBUTE][name] = value;
    }
    appendChild(child) {
        child.mountTo(this.root);
    }
    mountTo(parent) {
        if(!this.root)
            this.render();
        parent.appendChild(this.root);
    }
    triggerEvent(type, args) {
        this[ATTRIBUTE]["on" + type.replace(/^[\s\S]/, s=>s.toUpperCase())](new CustomEvent(type, {detail: args}));
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super();
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super();
        this.root = document.createTextNode(content);
    }
}