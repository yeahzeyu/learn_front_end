//词法分析 -> 语法分析
//html的的语法用一个栈就能完成分析，toy browser光用一个栈就能完成分析，而真正的浏览器还要家很多特殊的处理实现容错性
const css = require('css');
const EOF = Symbol("EOF"); //EOF: End Of File，ES6 引入了一种新的原始数据类型 Symbol ，表示独一无二的值，最大的用法是用来定义对象的唯一属性名，也可以用来定义互不相等的一组常量。

let currentToken = null;
let currentAttribute = null;

//type属性值会与tag中的type属性重名，导致赋值覆盖，改成其他名字，例如tagType
let stack = [{ tagType: "document", children: [] }]; //配对良好的HTML最后的栈应该是空的，这样不方便把栈拿出来，所以要设计一个初始的根节点，而HTML的根节点也是document
let currentTextNode = null;

//加入一个新的函数，addCSSRules，这里我们把CSS规则暂存到一个数组里
let rules = [];
function addCSSRules(text) {
    var ast = css.parse(text);
    console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet.rules);
}

//最后状态机里的所有状态创建完token之后要把它在同一个出口输出
function emit(token) {
    //console.log(token)
    let top = stack[stack.length - 1]; //栈顶是最后一个元素
    if (token.tagType == "startTag") {
        //进行入栈操作
        let element = {
            type: "element",
            children: [],
            attributes: []
        };
        element.tagName = token.tagName;
        for (let p in token) {
            if (p != "tagType" && p != "tagName") {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }
        top.children.push(element);
        element.parent = top;
        if(!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
    } else if(token.tagType == "endTag") {
        if(top.tagName != token.tagName) {
            console.log(top.tagName);
            console.log(token.tagName);
            throw new Error("Tag start end doesn't match!");
        } else {
            //遇到style标签时，执行添加CSS规则的操作
            //其实还需要考虑link标签的情况，但是link标签又涉及到多个html请求的情况，这里暂时不考虑了
            //另外还有import的情况，真实的浏览器还需要增加网络请求和异步处理的逻辑
            if(top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.tagType === "text") {
        if(currentTextNode == null) {
            currentTextNode = {
                type: "text",
                content: ""
            };
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}

//尝试把状态机里的状态实现一部分，把HTML里所有的tag做一个解析（大致有三种：开始标签，结束标签，自封闭标签）
function data(c) {
    if (c == '<') {
        return tagOpen;
    } else if (c == EOF) {
        emit({
            tagType: "EOF"
        });
        return;
    } else {
        emit({
            tagType: "text",
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
            tagType: "startTag", //数据结构上，不管是否自封闭，统一认为startTag类型，用一个额外的变量isSelefClosing来标识是否自封闭
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
            tagType: "endTag",
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
    return stack[0];
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

//第六课总结
//从标签构建DOM树的基本技巧是使用栈
//遇到开始标签时创建元素并入栈，遇到结束标签时出栈
//自封闭节点可视为入栈后立刻出栈
//任何元素是父元素是它入栈前的栈顶

//第七课总结
//文本节点与自封闭标签处理类似
//多个文本节点需要合并

//第八课总结
//遇到style标签时，我们把CSS规则保存起来
//这里我们调用CSS Parser来分析CSS规则
//这里我们必须要仔细研究此库分析CSS规则的格式