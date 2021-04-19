const EOF = Symbol("EOF"); //EOF: End Of File，ES6 引入了一种新的原始数据类型 Symbol ，表示独一无二的值，最大的用法是用来定义对象的唯一属性名，也可以用来定义互不相等的一组常量。

//尝试把状态机里的状态实现一部分，把HTML里所有的tag做一个解析（大致有三种：开始标签，结束标签，自封闭标签）
function data(c) {
    if (c == '<') {
        return tagOpen;
    } else if (c == EOF) {
        return;
    } else {
        return data; //除了左尖括弧外的字符都可以理解为文本节点
    }
}

function tagOpen(c) {
    if (c == '/') {
        return endTagOpen;
    } else if (c.match(/^[a-zA-Z]$/)) {
        return tagName(c);
    } else if (c == '!') { //处理注释及DOCTYPE
        return specialTagOpen
    } else {
        return;
    }
}

function specialTagOpen(c) {
    if( c == '-') {
        return notesOpen1;
    } else if(c == 'D') {
        return docTypeTagOpen1;
    }
}

function notesOpen1(c) {
    if( c == '-') {
        return notesOpen2;
    } else {
        //报错
    }
}

function notesOpen2(c) {
    if( c == '-') {
        return notesClose1;
    } else {
        return notesOpen2;
    }
}

function notesClose1(c) {
    if( c == '-') {
        return notesClose2;
    } else {
        //报错
    }
}

function notesClose2(c) {
    if( c == '>') {
        return data;
    } else {
        //报错
    }
}

function docTypeTagOpen1(c) {
    if( c == 'O') {
        return docTypeTagOpen2;
    } else {
        //报错
    }
}

function docTypeTagOpen2(c) {
    if( c == 'C') {
        return docTypeTagOpen3;
    } else {
        //报错
    }
}

function docTypeTagOpen3(c) {
    if( c == 'T') {
        return docTypeTagOpen4;
    } else {
        //报错
    }
}

function docTypeTagOpen4(c) {
    if( c == 'Y') {
        return docTypeTagOpen5;
    } else {
        //报错
    }
}

function docTypeTagOpen5(c) {
    if( c == 'P') {
        return docTypeTagOpen6;
    } else {
        //报错
    }
}

function docTypeTagOpen6(c) {
    if( c == 'E') {
        return docTypeTagOpen7;
    } else {
        //报错
    }
}

function docTypeTagOpen7(c) {
    if( c == '>') {
        return data;
    } else {
        return docTypeTagOpen7
    }
}

function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        return tagName(c);
    } else if (c == ">") {
        //报错
    } else if (c == EOF) {
        //报错
    } else {

    }
}

//<html prop
function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) { //遇到tab符、换行符、禁止符（prohibited）、空格，说明tagName结束
        return beforeAttributeName;
    } else if (c == "/") {
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        return tagName;
    } else if (c == ">") { //说明这是一个普通的开始标签，结束掉这个标签
        return data;
    } else {
        return tagName;
    }
}

function beforeAttributeName(c) {
    //这里暂不处理属性
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c == ">") {
        return data;
    } else if (c == "=") {
        return beforeAttributeName;
    } else {
        return beforeAttributeName;
    }
}

function selfClosingStartTag(c) {
    if (c == '>') {
        currentToken.isSelfClosing = true;
        return data;
    } else if (c == "EOF") {
        //报错
    } else {
        //报错
    }
}

module.exports.parseHTML = function parseHTML(html) {
    //因为HTML标准里把初始状态叫做data
    let state = data;
    for (let c of html) {
        state = state(c);
    }
    state = state(EOF); //作为最后的输入传给状态机
}

//第一课总结
//为了方便文件管理，我们把parser单独拆到文件中
//parser接受HTML文本作为参数，返回一棵DOM树

//第二课总结
//我们用FSM（有限状态机）来实现HTML的分析
//在HTML标准中，已经规定了HTML的状态
//Toy-Browser只挑选其中一部分状态，完成一个最简版本

//第三课总结
//主要的标签有：开始标签，结束标签和自封闭标签
//在这一步我们暂时忽略属性