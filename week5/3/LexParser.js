class XRegExp {
    constructor(source, flag, root = "root") {
        this.table = new Map();
        this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag);
        //console.log('regexp', this.regexp);
        //console.log('table', this.table);
    }
    compileRegExp(source, name, start) {
        if (source[name] instanceof RegExp)
            return {
                source: source[name].source,
                length: 0
            };

        let length = 0;

        let regexp = source[name].replace(/\<([^>]+)\>/g, (str, $1) => {
            this.table.set(start + length, $1);
            //this.table.set($1, start + length);

            ++length;

            let r = this.compileRegExp(source, $1, start + length);

            length += r.length;
            return "(" + r.source + ")";
        });
        return {
            source: regexp,
            length: length
        };
    }
    exec(string) {
        let r = this.regexp.exec(string);
        for (let i = 1; i < r.length; i++) {
            if (r[i] !== void 0) {
                r[this.table.get(i - 1)] = r[i];
            }
        }
        //console.log(JSON.stringify(r[0]));
        return r;
    }
    get lastIndex() {
        return this.regexp.lastIndex;
    }
    set lastIndex(value) {
        return this.regexp.lastIndex = value;
    }
}

//由于scan是可以返回一个iterator（迭代器）的，所以这里可以用一个新的语法特性function*，这样可以使得正则表达式之间不会互相干扰
//function* 这种声明方式(function关键字后跟一个星号）会定义一个生成器函数 (generator function)，它返回一个  Generator  对象 
/*
    1、函数生成器特点是函数名前面有一个‘*’
  2、通过调用函数生成一个控制器
  3、调用next()方法开始执行函数
  4、遇到yield函数将暂停
  5、再次调用next()继续执行函数
*/
//iterator跟异步是没有关系的，我们现在对iterator的使用才是它原汁原味的用法，像CO这样的框架，它其实只是借了iterator在语法上的便利然后来让我们的异步更简单，它其实不是一个非常好的实践的方式
//在当时没有async出现之前，它是比较方便的
export function* scan(str) {
    let regexp = new XRegExp({
        InputElement: "<Whitespace>|<LineTerminator>|<Comments>|<Token>",
        Whitespace: / /,
        LineTerminator: /\n/,
        Comments: /\/\*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
        Token: "<Literal>|<Keywords>|<Identifier>|<Punctuator>",
        Literal: "<NumericLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>",
        NumericLiteral: /(?:[1-9][0-9]*|0)(?:\.[0-9]*)?|\.[0-9]+/,
        BooleanLiteral: /true|false/,
        StringLiteral: /\"(?:[^"\n]|\\[\s\S])*\"|\'(?:[^'\n]|\\[\s\S])*\'/,
        NullLiteral: /null/,
        Identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
        Keywords: /if|else|for|function|let|var/,
        Punctuator: /\+|\,|\?|\:|\{|\}|\.|\(|\=|\<|\+\+|\=\=|\=\>|\*|\)|\[|\]|;/
    }, "g", "InputElement");
    //let r = regexp.exec("(a)");
    //console.log(r);
    while (regexp.lastIndex < str.length) {
        let r = regexp.exec(str);
        //由于我们扩展的正则表达式最终match出来的可能命中上面的多个表达式，因为我们这个也是分层次的，所以需要手工去做一下区分，看它是属于哪一个
        yield r;
        //这里需要把它包成我们想要的symbol
        //因为exec是返回一个数组的
        if (r.Whitespace) {
            //空白则忽略

        } else if (r.LineTerminator) {
            //这里暂忽略，实际上js中不能忽略，它会影响自动插入

        } else if (r.Comments) {
            //这里暂忽略

        } else if (r.NumericLiteral) {
            //非终结符要展开成终结符后处理，如token
            yield {
                type: "NumericLiteral",
                value: r[0]
            }
        } else if (r.BooleanLiteral) {
            yield {
                type: "BooleanLiteral",
                value: r[0]
            }
        } else if (r.StringLiteral) {
            yield {
                type: "StringLiteral",
                value: r[0]
            }
        } else if (r.NullLiteral) {
            yield {
                type: "NullLiteral",
                value: null
            }
        } else if (r.Identifier) {
            yield {
                type: "Identifier",
                name: r[0]
            }
        } else if (r.Keywords) {
            //keywords需要特殊处理，因为它在语法上是完全不同的东西
            yield {
                type: r[0]
            }
        } else if (r.Punctuator) {
            yield {
                type: r[0]
            }
        } else {
            throw new Error("unexpected token " + r[0]);
        }

        if (!r[0].length)
            break;
    }
    yield {
        type: "EOF"
    }
}

/*
//测试用代码
let source = (`
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            let cell = document.createElement("div");
            cell.classList.add("cell");
            cell.innerText = pattern[i * 3 + j] == 2 ? "❌" : pattern[i * 3 + j] == 1 ? "⭕" : "";
            cell.addEventListener("click", () => userMove(j, 1));
            board.appendChild(cell);
        }
        board.appendChild(document.createElement("br"));
    }
`);

for (let element of scan(source)) {
    console.log(element);
}
*/