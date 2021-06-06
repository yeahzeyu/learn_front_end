//尝试在老师第一节课及上周的abnf的基础示例上，尽量补全了syntaxParser，包括UnaryExpression、VariableDeclaration、带参数的FunctionDeclaration等
let syntax = {
    Program: [["StatementList"]], //需要通过递归的结构来表示可以重复，因为我们用的是一个或的关系，所以所有的外面都加一个中括号
    StatementList: [
        ["Statement"], //用数组来表示或的关系，可以是1个或多个
        ["StatementList", "Statement"], 
    ], //中间结构，用来实现递归
    Statement: [
        ["ExpressionStatement"],
        ["IFStatement"],
        ["ForStatement"],
        ["WhileStatement"],
        ["VariableDeclaration"],
        ["FunctionDeclaration"],
        ["ClassDeclaration"],
        ["BreakStatement"],
        ["ContinueStatement"],
        ["ReturnStatement"],
        ["ThrowStatement"],
        ["TryStatement"],
        ["Block"]
    ],
    ExpressionStatement: [
        ["Expression", ";"]
    ],
    Expression: [
        ["AdditiveExpression"]
    ],
    AdditiveExpression: [
        ["MultiplicativeExpression"],
        ["AdditiveExpression", "+", "MultiplicativeExpression"],
        ["AdditiveExpression", "-", "MultiplicativeExpression"]
    ],
    MultiplicativeExpression: [
        ["UnaryExpression"],
        ["MultiplicativeExpression", "*", "UnaryExpression"],
        ["MultiplicativeExpression", "/", "UnaryExpression"]
    ],
    UnaryExpression: [
        ["PrimaryExpression"],
        ["+", "PrimaryExpression"],
        ["-", "PrimaryExpression"],
        ["typeof", "PrimaryExpression"],
    ],
    PrimaryExpression: [
        ["(", "Expression", ")"],
        ["Literal"],
        ["Identifier"]
    ],
    Literal: [
        ["NumberLiteral"],
        ["BooleanLiteral"],
        ["StringLiteral"],
        ["NullLiteral"]
    ],
    IfStatement: [
        ["if", "(", "Expression", ")", "Statement"]
    ],
    ForStatement: [
        ["for", "(", "Statement", ";", "Statement", ";", "Statement", ")", "Statement"],
        ["for", "(", "Identifier", "in", "Identifier", ")", "Statement"],
        ["for", "(", "Identifier", "of", "Identifier", ")", "Statement"],
    ],
    WhileStatement: [
        ["while", "(", "Expression", ")", "Statement"]
    ],
    VariableDeclaration: [
        ["var", "Identifier"],
        ["let", "Identifier"]
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"], //这里不能写成Program，虽然Program就是statementList组成的
        ["function", "Identifier", "(", "ArgumentList", ")", "{", "StatementList", "}"],
    ],
    ArgumentList: [
        ["Expression"],
        ["ArgumentList", ",", "Expression"]
    ],
    FunctionDeclarationList: [
        ["FunctionDeclaration"],
        ["FunctionDeclarationList", "FunctionDeclaration"]
    ],
    ClassDeclaration: [
        ["function", "Identifier", "{", "FunctionDeclarationList", "}"]
    ],
    BreakStatement: [
        ["break", ";"],
        ["break", "Identifier", ";"]
    ],
    ContinueStatement: [
        ["continue", ";"],
        ["continue", "Identifier", ";"]
    ],
    ReturnStatement: [
        ["return", "ExpressionStatement"]
    ],
    ThrowStatement: [
        ["return", "ExpressionStatement"]
    ],
    TryStatement: [
        ["try", "{", "Statement", "}", "catch", "(", "Expression", ")", "{", "Statement", "}"]
    ],
    Block: [
        ["{", "Statement", "}"]
    ]
}

/*
【总结】
第一课：
经过本节课的编码，已经可以用当前这种基础的语法定义去写一些代码了，但是我们光把它用JSON描述出来实际上是不够的，我们还需要让代码能够分析出来
我们这里头每个对象的定义都属于非终结符（Non-terminal Symbol），因为它是由其他的符号（Symbol）去组合而成的，而这些符号里面，有一些是终结符，另一些是非终结符
下一步是根据这棵语法树进一步去分析token流
*/
