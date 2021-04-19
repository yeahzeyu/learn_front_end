const EOF = Symbol("EOF"); //EOF: End Of File，ES6 引入了一种新的原始数据类型 Symbol ，表示独一无二的值，最大的用法是用来定义对象的唯一属性名，也可以用来定义互不相等的一组常量。

function data(c) {

}

module.exports.parseHTML = function parseHTML(html) {
    //因为HTML标准里把初始状态叫做data
    let state = data;
    for(let c of html) {
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