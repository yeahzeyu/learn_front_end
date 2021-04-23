//词法分析 -> 语法分析
//html的的语法用一个栈就能完成分析，toy browser光用一个栈就能完成分析，而真正的浏览器还要家很多特殊的处理实现容错性
//CSS设计会尽量保证所有选择器都会在DOM树构建到startTag的时候就完成与CSS Rule的匹配
//选择器是层级结构的，最外层叫选择器列表，往里叫复杂选择器（是由一系列空格分隔的一系列复合选择器，根据亲代关系去选择元素的），而复合选择器是针对一个元素本身的属性和特诊的一个判断（由紧连的一系列简单的选择器构成），在本次的toy browser中，假定复杂选择器都是有简单选择构成了，暂不处理复合选择器的情况
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
    let ast = css.parse(text);
    //console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet.rules);
}
//简单选择器：
//.a class选择器
//#a id选择器
//div tagName选择器
//复合选择器
//div.a#a
function match(element, selector) {
    //假设遇到的都是简单选择器
    //如果想把复合选择器写上，可用正则去拆分一下selector，然后加一点关系就可以了
    if (!selector || !element.attributes) //用attributes来判断是不是文本节点，如果是文本节点，则不需要去看它到底跟seletor是否匹配
        return;
    if(selector.charAt(0) == "#") {
        let attr = element.attributes.filter(attr => attr.name === "id")[0];
        if(attr && attr.value === selector.replace('#', ''))
            return true;
    } else if(selector.charAt(0) == ".") {
        //正常的情况下还需要对attribute用空格进行分割，得到多个class，只要其中有一个class存在于选择器中，我们就认为匹配上了
        let attr = element.attributes.filter(attr => attr.name === "class")[0]
        if(attr && attr.value === selector.replace('.', ''))
            return true;
    } else if(element.tagName === selector){
        return true;
    }
    return false;
}
function computeCSS(element) {
    //为什么要获取父元素序列，因为今天的选择器大多数都是跟父元素相关的
    console.log(rules);
    console.log("compute CSS for Element", element);
    let elements = stack.slice().reverse(); //slice原本是用来截取数组的，如果不传参数则是复制一遍数组
    //使用reverse是因为我们的标签匹配是会从当前元素开始逐级地往外匹配，首先获取的是当前元素，然后一级一级往外，往父元素去找
    if (!element.computedStyle)
        element.computedStyle = {};
    for (let rule of rules) {
        let selectorParts = rule.selectors[0].split(" ").reverse(); //暂时不处理list形式的selector，同时为了和element的顺序一致，也做一遍reverse
        //正常情况下selectorParts里头的都是复合选择器，这里我们假设全都只是简单选择器
        if (!match(element, selectorParts[0])) //match函数用于验证element是否与选择器相匹配，如果最复杂选择器最右侧的简单选择都不匹配，则直接判定为该rule与element不匹配
            continue;
        //匹配了复杂选择器最右侧的的简单选择器之后，还要从内往外，逐级检查父元素是否与复杂选择器全部匹配上
        //let matched = false;
        let j = 1;
        for (let i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++;
                if (j >= selectorParts.length) {
                    //matched = true;
                    //如果匹配到，我们要加入
                    console.log("Element", element, "matched rule", rule);
                    break; //选择器已经匹配完，不需要继续检查父元素了
                }
            }
        }
    }
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
                    mame: p,
                    value: token[p]
                })
            }
        }
        computeCSS(element);
        top.children.push(element);
        element.parent = top;
        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
    } else if (token.tagType == "endTag") {
        if (top.tagName != token.tagName) {
            console.log(top.tagName);
            console.log(token.tagName);
            throw new Error("Tag start end doesn't match!");
        } else {
            //遇到style标签时，执行添加CSS规则的操作
            //其实还需要考虑link标签的情况，但是link标签又涉及到多个html请求的情况，这里暂时不考虑了
            //另外还有import的情况，真实的浏览器还需要增加网络请求和异步处理的逻辑
            if (top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.tagType === "text") {
        if (currentTextNode == null) {
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

function UnquotedAttributeValue(c) {

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

function UnquotedAttributeValue() {
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

//第九课总结
//当我们创建一个元素后，立即计算CSS
//理论上，当我们分析一个元素时，所有CSS规则已经手机完毕
//在真实浏览器中，可能遇到写在body的style标签，需要重新CSS计算的情况，这里我们忽略

//第十课总结
//在computeCSS函数中，我们必须知道元素的所有父元素才能判断元素与规则是否匹配
//我们从上一步骤的stack，可以获取本元素所有的父元素
//因为我们首先获取的是“当前元素”，所以我们获得和计算父元素匹配的顺序是从内向外
//div div #myid，先检查最后一个选择器

//第十一课总结
//选择器也要从当前元素向外排列
//复杂选择器拆成针对单个元素的选择器，用循环匹配父元素队列

//第十二课总结
//根据选择器的类型和元素属性，计算是否与当前元素匹配
//这里仅仅实现了三种基本选择器，实际的浏览器中要处理复合选择器
//作业（可选）：实现复合选择器，实现支持空格的class选择器