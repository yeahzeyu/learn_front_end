let currentToken = null;

//最后状态机里的所有状态创建完token之后要把它在同一个出口输出
function emit(token) {
    //if(token.type != "text")
    console.log(token);
}

const EOF = Symbol("EOF"); //EOF: End Of File，ES6 引入了一种新的原始数据类型 Symbol ，表示独一无二的值，最大的用法是用来定义对象的唯一属性名，也可以用来定义互不相等的一组常量。

//尝试把状态机里的状态实现一部分，把HTML里所有的tag做一个解析（大致有三种：开始标签，结束标签，自封闭标签）
function data(c) {
    if (c == '<') {
        return tagOpen;
    } else if (c == EOF) {
        emit({
            type: "EOF"
        });
        return;
    } else {
        emit({
            type: "text",
            content: c
        });
        return data; //除了左尖括弧外的字符都可以理解为文本节点
    }
}

//<div
function tagOpen(c) {
    if (c == '/') {
        return endTagOpen;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag", //数据结构上，不管是否自封闭，统一认为startTag类型，用一个额外的变量isSelefClosing来标识是否自封闭
            tagName: ""
        }
        return tagName(c);
    } else if (c == '!') { //处理注释及DOCTYPE
        return specialTagOpen
    } else {
        return;
    }
}

function specialTagOpen(c) {
    if (c == '-') {
        return notesOpen1;
    } else if (c == 'D') {
        return docTypeTagOpen1;
    }
}

function notesOpen1(c) {
    if (c == '-') {
        return notesOpen2;
    } else {
        //报错
    }
}

function notesOpen2(c) {
    if (c == '-') {
        return notesClose1;
    } else {
        return notesOpen2;
    }
}

function notesClose1(c) {
    if (c == '-') {
        return notesClose2;
    } else {
        //报错
    }
}

function notesClose2(c) {
    if (c == '>') {
        return data;
    } else {
        //报错
    }
}

function docTypeTagOpen1(c) {
    if (c == 'O') {
        return docTypeTagOpen2;
    } else {
        //报错
    }
}

function docTypeTagOpen2(c) {
    if (c == 'C') {
        return docTypeTagOpen3;
    } else {
        //报错
    }
}

function docTypeTagOpen3(c) {
    if (c == 'T') {
        return docTypeTagOpen4;
    } else {
        //报错
    }
}

function docTypeTagOpen4(c) {
    if (c == 'Y') {
        return docTypeTagOpen5;
    } else {
        //报错
    }
}

function docTypeTagOpen5(c) {
    if (c == 'P') {
        return docTypeTagOpen6;
    } else {
        //报错
    }
}

function docTypeTagOpen6(c) {
    if (c == 'E') {
        return docTypeTagOpen7;
    } else {
        //报错
    }
}

function docTypeTagOpen7(c) {
    if (c == '>') {
        return data;
    } else {
        return docTypeTagOpen7
    }
}

function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        }
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
        currentToken.tagName += c; //c.toLowerCase();
        return tagName;
    } else if (c == ">") { //说明这是一个普通的开始标签，结束掉这个标签w
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}

//<html attribute
function beforeAttributeName(c) {
    //这里暂不处理属性
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c == '/' || c == ">" || c == EOF) {
        return afterAttributeName(c);
    } else if (c == "=") {
        //报错
    } else {
        currentAttribute = {
            name: "",
            value: ""
        }
        //console.log("currentAttribute", currentAttribute);
        return attributeName(c);
    }
}

//<div class="abc" ></div> <div class="abc" />
function attributeName(c) {
    //console.log(currentAttribute);
    if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
        return afterAttributeName(c);
    } else if (c == "=") {
        return beforeAttributeValue;
    } else if (c == "\u0000") { //空格

    } else if (c == "\"" || c == "'" || c == "<") {

    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
        return beforeAttributeValue;
    } else if (c == "\"") {
        return doubleQuotedAttributeValue;
    } else if (c == "\'") {
        return singleQuotedAttributeValue;
    } else if (c == ">") {
        //return data
    } else {
        return UnquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if (c == "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c == "\u0000") { //空格

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if (c == "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c == "\u0000") { //空格

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c == "/") {
        return selfClosingStartTag;
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == EOF) {

    } else {
        currentAttribute.value += c;
        return afterQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c == "/") {
        currentToken[currentAttribute.name] = currentAttribute.vlue;
        return selfClosingStartTag;
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == "\u0000") {

    } else if (c == "\"" || c == "'" || c == "<" || c == "=" || c == "`") {

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}

function selfClosingStartTag(c) {
    if (c == '>') {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c == "EOF") {
        //报错
    } else {
        //报错
    }
}

function afterAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    } else if (c == "/") {
        return selfClosingStartTag;
    } else if (c == "=") {
        return beforeAttributeValue;
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        };
        return attributeName(c);
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

//第四课总结
//在状态机中，除了状态迁移，我们还会加入业务逻辑
//我们在标签结束状态提交标签token

//第五课总结
//属性值分为单引号、双引号、无引号三种写法，因此需要较多状态处理
//处理属性的方式跟标签类似
//属性结束时，我们把属性加到标签Token上