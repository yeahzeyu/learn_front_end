import { scan } from "./LexParser.js"

//尝试在老师第一节课及上周的abnf的基础示例上，尽量补全了syntaxParser，包括UnaryExpression、VariableDeclaration、带参数的FunctionDeclaration等
let syntax = {
    Program: [["StatementList", "EOF"]], //需要通过递归的结构来表示可以重复，因为我们用的是一个或的关系，所以所有的外面都加一个中括号，加上EOF，使得program能接收一个end of file的标志用于终止
    StatementList: [
        ["Statement"], //用数组来表示或的关系，可以是1个或多个
        ["StatementList", "Statement"],
    ], //中间结构，用来实现递归
    Statement: [
        ["ExpressionStatement"],
        ["IFStatement"],
        ["WhileStatement"],
        ["VariableDeclaration"],
        ["FunctionDeclaration"],
        ["Block"],
        ["BreakStatement"],
        ["ContinueStatement"]
        
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"] //这里不能写成Program，虽然Program就是statementList组成的
    ],
    BreakStatement: [
        ["break", ";"]
    ],
    ContinueStatement: [
        ["continue", ";"]
    ],
    Block: [
        ["{", "Statement", "}"],
        ["{", "}"]
    ],
    WhileStatement: [
        ["while", "(", "Expression", ")", "Statement"]
    ],
    IfStatement: [
        ["if", "(", "Expression", ")", "Statement"]
    ],
    VariableDeclaration: [
        //["var", "Identifier", ";"], //因为source那里变量声明后面写了分号
        ["let", "Identifier", ";"]
    ],
    ExpressionStatement: [
        ["Expression", ";"]
    ],
    Expression: [
        ["AssignmentExpression"]
    ],
    AssignmentExpression: [
        ["LeftHandSideExpression", "=", "LogicalORExpression"],
        ["LogicalORExpression"]
    ],
    LogicalORExpression: [
        ["LogicalORExpression"],
        ["LogicalORExpression", "||", "LogicalANDExpression"]
    ],
    LogicalANDExpression: [
        ["AdditiveExpression"],
        ["LogicalANDExpression", "&&", "AdditiveExpression"]
    ],
    AdditiveExpression: [
        ["MultiplicativeExpression"],
        ["AdditiveExpression", "+", "MultiplicativeExpression"],
        ["AdditiveExpression", "-", "MultiplicativeExpression"]
    ],
    MultiplicativeExpression: [
        ["LeftHandSideExpression"],
        ["MultiplicativeExpression", "*", "UnaryExpression"],
        ["MultiplicativeExpression", "/", "UnaryExpression"]
    ],
    LeftHandSideExpression: [
        ["CallExpression"],
        ["NewExpression"]
    ],
    CallExpression: [
        ["MemberExpression", "Arguments"],
        ["CallExpression", "Arguments"]
    ],
    Arguments: [
        ["(", ")"],
        ["(", "ArgumentList", ")"]
    ],
    ArgumentList: [
        ["AssignmentExpression"],
        ["ArgumentList", ",", "AssignmentExpression"]
    ],
    NewExpression: [
        ["MemberExpression"],
        ["new", "NewExpression"]
    ],
    MemberExpression: [
        ["PrimaryExpression"],
        ["PrimaryExpressoin", ".", "Identifier"],
        ["PrimaryExpression", "[", "Expression", "]"]
    ],
    PrimaryExpression: [
        ["(", "Expression", ")"],
        ["Literal"],
        ["Identifier"]
    ],
    Literal: [
        ["NumericLiteral"],
        ["StringLiteral"],
        ["BooleanLiteral"],
        ["NullLiteral"],
        ["RegularExpressionLiteral"],
        ["ObjectLiteral"],
        ["ArrayLiteral"]
    ],
    ObjectLiteral: [
        ["{", "}"],
        ["{", "PropertyList", "}"]
    ],
    PropertyList: [
        ["Property"],
        ["PropertyList", ",", "Property"]
    ],
    Property: [
        ["StringLiteral", ":", "AdditiveExpression"],
        ["Identifier", ":", "AdditiveExpression"]
    ]
}

//创建一个哈希表，这里暂用对象，有兴趣可以改成map，map是比较新的结构，但代码可读性没那么好
let hash = {

}

function closure(state) {
    //趁着state还没有被污染之前，先把它存在哈希表
    //这里使用stringify作为哈希的key
    console.log('state', state)
    //if(state.$isEnd) return; //按理isEnd后就不需要对state再做closure了
    hash[JSON.stringify(state)] = state;
    let queue = [];
    for (let symbol in state) {
        //这里准备使用广度有优先搜素算法
        if (symbol.match(/^\$/)) {
            return;
        }
        queue.push(symbol);
    }
    while (queue.length) {
        let symbol = queue.shift();
        //到语法树中寻找symbol的规则
        //console.log(symbol);
        //注意syntax树上有一些递归的写法，会导致出现死循环，需要做处理，若此前已经有过这个symbol了，则无需再次记录
        if (syntax[symbol]) {
            //终结符不会出现在syntaxtree里
            for (let rule of syntax[symbol]) {
                if (!state[rule[0]]) {
                    queue.push(rule[0]);
                    //state[rule[0]] = true;
                    //到上面state[rule[0]] = true这一步只是实现了接收一个状态，下一步是实现状态迁移
                    //需要把rule里面每个symbol的部分串成一串，所以上面注释掉的部分需要重新构造
                }
                let current = state;
                for (let part of rule) {
                    //由于有些rule之前存在共性的部分，需要剔除
                    if (!current[part]) {
                        //这是把currentpart变成一个新的状态
                        current[part] = {};
                    }
                    current = current[part];
                }
                //current.$isRuleEnd = true; //由于我们加上的isRuleEnd并不是代表symbol的，为了将其区分开的，在其前面增加标识符，例如$
                current.$reduceType = symbol;
                //current.$reduceState = state;
                current.$reduceLength = rule.length;
                //以上也只是算了第一层的closure
                //我们应该对每一个当前状态进行closure的处理
            }
        }

    }
    //这里的for循环与前面的已经不同，因为第一层的closure已经被展开
    for (let symbol in state) {
        //递归调用closure，注意要对自身重复的规则进行处理，否则递归后会产生死循环
        //我们在状态机中只需要形成有环的状态迁移结构就可以了
        //即还是判断当前结点是否在之前就已经出现过，出现过就不需要再调用closure了
        console.log('symbol：', symbol);
        console.log(state[symbol]);
        /*
        if (symbol.match(/^\$/) || state[symbol].$isEnd) {
            return;
        }
        */
        if (symbol.match(/^\$/)) {
            continue;
        }
        if (hash[JSON.stringify(state[symbol])])
            state[symbol] = hash[JSON.stringify(state[symbol])]; //如已存在，则直接替换结点
        else closure(state[symbol]);
    }
}

//要定义一个初始状态，整个js可以分为两个状态，一个start状态，一个end状态
let end = {
    $isEnd: true
}

let start = {
    "Program": end
}

closure(start);

let source = `
    var a;
`;

export function parse(source) {
    //let state = start;
    let stack = [start]; //把所有state的逻辑都改成用stack来实现，然后每次我们shift的时候
    let symbolStack = [];
    //做成子函数是为了方便管理状态，因为reduce和shift本质上是一个过程，而不是一个函数
    function reduce() {
        let state = stack[stack.length - 1];
        if (state.$reduceType) {
            //实际上被reduce的这些就是子元素
            let children = [];
            //state = state.$reduceState; //改成出栈的操作
            for (let i = 0; i < state.$reduceLength; i++) {
                stack.pop();
                children.push(symbolStack.pop());
            }

            //create a non-terminal symbol and shift it
            //移入一个non-terminal symbol
            shift({
                type: state.$reduceType,
                children: children.reverse() //rule里面包含的children
            })
        } else {
            throw new Error("unexpected token");
        }
    }
    function shift(symbol) {
        //每次取栈顶最新的作为state
        let state = stack[stack.length - 1];
        if (symbol.type in state) {
            console.log(state);
            //每次shift的时候，都要将state[symbol.type]入栈
            stack.push(state[symbol.type]);
            symbolStack.push(Symbol);
            //state = state[symbol.type]; //采用栈操作，把一路所有的状态都存起来，这里不需要再覆盖state的值
        } else {
            /* reduce to non-terminal symbols */
            //要将得到的终结符合成一个非终结符，deduce
            shift(reduce()); //reduce完后，新的symbol还是没有办法放进去，所以还要再shift(symbol)一次
            shift(symbol);
            //debugger;
        }
    }
    for (let symbol /* terminal symbols */ of scan(source)) {
        shift(symbol);   
        //编译原理中，我们把for循环每一次放入一个token操作的术语叫shift
    }
    console.log(stack);
    reduce();
}



/*
【总结】
第一课：
经过本节课的编码，已经可以用当前这种基础的语法定义去写一些代码了，但是我们光把它用JSON描述出来实际上是不够的，我们还需要让代码能够分析出来
我们这里头每个对象的定义都属于非终结符（Non-terminal Symbol），因为它是由其他的符号（Symbol）去组合而成的，而这些符号里面，有一些是终结符，另一些是非终结符
下一步是根据这棵语法树进一步去分析token流

第二课：
创建一个html去执行syntaxParser，第一步先是还没引入真正的输入，只是对语法树进行处理，目的是构造一个状态机，让它能够帮助我们去处理我们的语法分析
做好的状态机有什么用呢？在后面的课程就将尝试将lexer产出的token流做一个初步的处理，把它变成terminal symbol
因为我们在lexer的定义里面，很多地方的定义都比较粗糙，比如Punctuator，其实每一种Punctuator都是一种独立的symbol，这种情况我们需要把它单独拆分开来
又比如keywords，现在的token名只有一个，实际上我们需要把它变成不同的terminal symbol的
这个是词法跟语法定义之间的一个小小的差别
于是我们需要加入一些硬逻辑来处理这种映射关系
加完之后，我们才能把所有的token都转成terminal symbol
这两个概念其实是非常相近的，只是说我们词法分析器看来我们产出的东西就是token，而语法分析器输入的东西叫terminal symbol，
咱们把这两个联系在一起，就可以把代码的语法结构解析出来了

*/
