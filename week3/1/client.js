const net = require("net");
const parser = require("./parser.js")

class Request {
    constructor(options) {
        this.method = options.method || "GET";
        this.host = options.host || '127.0.0.1';
        this.port = options.port || 80;
        this.path = options.path || "/";
        this.body = options.body || {};
        //现阶段的toy browser只支持application/json或application/x-www-form-urlencoded（默认）两种content type，其他类型无法正常解析
        this.bodyText = !options.headers ?
            '' : options.headers["Content-Type"] === "application/json" ?
                JSON.stringify(this.body) : !options.headers["Content-Type"] || options.headers["Content-Type"] === "application/x-www-form-urlencoded" ?
                    Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&') : '';
        this.headers = {
            ["Content-Type"]: "application/x-www-form-urlencoded",
            ...(options.headers || {}),
            ["Content-Length"]: this.bodyText.length
        };
    }
    //发送http请求
    send(connection) {
        return new Promise((resolve, reject) => {
            //send过程中，会逐步收到response，直到最后把response构造好后，再执行resolve，所以有必要设计一个response parser，而不是直接设计一个response类，这样parser可以用逐步接收response的信息，最终构建的response对象的各个不同的部分
            const parser = new ResponseParser;
            if (connection) {
                //toString负责把收集到的信息按照request的格式构造
                connection.write(this.toString());
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString())
                })
            }
            connection.on('data', (data) => {
                console.log(data.toString());
                parser.receive(data.toString());
                if (parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            })
            connection.on('error', (err) => {
                console.log(err)
                reject(err);
                connection.end();
            });
        });
    }

    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r\n\r\n${this.bodyText}`;
    }
}

class ResponseParser {
    constructor() {
        //状态机有很多种不同的写法，这里采用的是常量配合if语句实现，但从性能和代码管理的角度，都不如使用函数的方式
        this.WAITING_STATUS_LINE = 0; //初始状态，接收到\r的时候，不会立刻切到WAITING_HEADER状态，而是再等待一个line end的符号
        this.WAITING_STATUS_LINE_END = 1; //以\r\n结束
        this.WAITING_HEADER_NAME = 2; //header的key
        this.WAITING_HEADER_SPACE = 3; //header的空格
        this.WAITING_HEADER_VALUE = 4; //header的value
        this.WAITING_HEADER_LINE_END = 5; //header的结束
        this.WAITING_HEADER_BLOCK_END = 6; //header结束后空一行
        this.WAITING_BODY = 7;//因为body的格式不固定，所以不能在同一个response parser里面解决
        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null; //跟head相关，不能单独创建
    }
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }
    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
    receive(string) {
        for (let i in string) {
            //处理字符串，使用到了状态机，charAt能支持中文
            this.receiveChar(string.charAt(i));
        }
    }
    receiveChar(char) {
        //有限状态机的代码
        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END;
            } else {
                this.statusLine += char;
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') {
                this.current = this.WAITING_HEADER_SPACE;
            } else if (char === '\r') {
                this.current = this.WAITING_HEADER_BLOCK_END;
                //在head结束时创建body parser
                //transfer encoding可以有多个值，但默认的是chunked
                if (this.headers['Transfer-Encoding'] === 'chunked')
                    this.bodyParser = new TrunkedBodyParser();
            } else {
                this.headerName += char;
            }
        } else if (this.current === this.WAITING_HEADER_SPACE) {
            if (char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char == '\r') {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headerName] = this.headerValue;
                this.headerName = "";
                this.headerValue = "";
            } else {
                this.headerValue += char;
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === '\n') {
                this.current = this.WAITING_BODY;
            }
        } else if (this.current === this.WAITING_BODY) {
            //使用专用的body parser处理body部分
            this.bodyParser.receiveChar(char);
        }
    }
}

class TrunkedBodyParser {
    //跟response parser非常相似
    constructor() {
        //trunk body的结构是一个长度后面跟着一个trunk的内容，遇到一个长度为0的trunk时，整个body就结束了，因为trunk里面可以是任何的字符，所以不能通过特定字符来控制分割
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2; //要想退出READING_TRUNK状态，必须去计算chunk的长度，等待出现长度0的情况，不是一个严格的米利状态机了
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char) {

        if (this.current === this.WAITING_LENGTH) {
            if (char === '\r') {
                if (this.length === 0) {
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                //length是16进制的，边读取边将其转为10进制，方便下面的循环
                this.length *= 16;
                this.length += parseInt(char, 16);
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK;
            }
        } else if (this.current === this.READING_TRUNK) {
            this.content.push(char);
            //this.length--; //纯英文、数字的情况
            this.length = this.length - this.getByte(char); //中文字符占用了多个字节
            if (this.length === 0)
                this.current = this.WAITING_NEW_LINE;
        } else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        } else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_LENGTH;
            }
        }
    }
    //为了body中能支持出现中文，需解析一个字符占多少字节
    getByte(char) {
        if (char.charCodeAt(0) <= 0x007f) return 1;
        if (char.charCodeAt(0) <= 0x07ff) return 2;
        if (char.charCodeAt(0) <= 0xffff) return 3;
        return 4;
    }
    /*
        英文字母和中文汉字在不同字符集编码下的字节数:
        英文字母：
            字节数 : 1;编码：GB2312
            字节数 : 1;编码：GBK
            字节数 : 1;编码：GB18030
            字节数 : 1;编码：ISO-8859-1
            字节数 : 1;编码：UTF-8
            字节数 : 4;编码：UTF-16
            字节数 : 2;编码：UTF-16BE
            字节数 : 2;编码：UTF-16LE

        中文汉字：
            字节数 : 2;编码：GB2312
            字节数 : 2;编码：GBK
            字节数 : 2;编码：GB18030
            字节数 : 1;编码：ISO-8859-1
            字节数 : 3;编码：UTF-8
            字节数 : 4;编码：UTF-16
            字节数 : 2;编码：UTF-16BE
            字节数 : 2;编码：UTF-16LE
    */
}

void async function () {
    let request = new Request({
        method: "POST",
        host: "127.0.0.1",
        port: "8088",
        path: "/",
        headers: {
            ["X-Foo2"]: "customed"
        },
        body: {
            name: "WoodyYip"
        }
    });
    //拆分文件
    let response = await request.send();
    //如果是真正的浏览器，这里必须是异步分段地返回的，而不是返回整个body给parser
    let dom = parser.parseHTML(response.body);
    console.log(dom);
}();

//通过CSS计算生成一棵带CSS属性的DOM树
//CSS computing 即是把CSS属性应用到匹配CSS选择器的元素上去
//内联的样式，不需要经过CSS computing
//环境准备：npm install css ，安装好现成的CSS parser，可帮助我们将CSS代码转变成抽象语法树AST，css computing需要对CSS进行词法和语法分析，如果要完全手工来做的话，是需要较多的编译原理基础知识的，不是本期训练营重点学习的部分。我们所要做的，是根据抽象语法树AST抽出各种CSS规则，并且把它们应用到HTML元素上
//发生在DOM树构建的时候
//CSS computing的步骤如下：
//1、收集CSS规则
