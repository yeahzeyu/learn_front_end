function createElement(type, attributes, ...children) {
    let element;
    if(typeof type === "string") //原生标签
        element = new ElementWrapper(type);
    else //type为class，需生成实例
        element = new type;
    for(let name in attributes) {
        element.setAttribute(name, attributes[name]);
    }
    for(let child of children) {
        if(typeof child === "string") {
            child = new TextWrapper(child);
        }
        element.appendChild(child);
    }
    return element;
}

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }
    appendChild(child) {
        child.mountTo(this.root);
    }
    mountTo(parent) {
        parent.appendChild(this.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }
    appendChild(child) {
        child.mountTo(this.root);
    }
    mountTo(parent) {
        parent.appendChild(this.root);
    }
}

class Div {
    constructor() {
        this.root = document.createElement("div");
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }
    appendChild(child) {
        child.mountTo(this.root);
    }
    mountTo(parent) {
        parent.appendChild(this.root);
    }
}

let a = <div id="a">
            <span>a</span>
            <span>b</span>
            <span>c</span>
        </div>

//document.body.appendChild(a);
a.mountTo(document.body);
//自定义的标签应该用什么办法使其像普通的html元素一样操作呢？
//在最新版的DOM标准里面是有办法的，需要注册一下自定义标签/元素的名称和类型
//但是现行的比较安全的浏览器版本里面，不建议这样做
//所以在使用element的时候，建议使用一个另外的接口，这里用了反向的操作