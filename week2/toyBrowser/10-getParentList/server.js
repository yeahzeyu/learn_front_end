const http = require('http');

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.log('error：', err);
    }).on('data', (chunk) => {
        //body.push(Buffer.from(chunk).toString());
        body.push(chunk);
    }).on('end', () => {
        //body = Buffer.concat(body).toString('utf8');
        body = Buffer.concat(body).toString();
        console.log("body:", body);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(
            `<!DOCTYPE html>
            <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1,user-scalable=no" />
                    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
                    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
                    <meta name="apple-mobile-web-app-capable" content="yes" />
                    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                    <meta name="screen-orientation" content="portrait" />
                    <meta name="x5-orientation" content="portrait" />
                    <title>练习</title>
                    <meta name="title" content="练习" />
                    <meta name="description" content="练习" />
                    <meta name="keyword" content="练习" />
                    <meta name="copyright" content="练习" />
                    <meta name="author" content="练习" />
                    <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js" type="text/javascript"></script>
                    <style>
                        body div #myid {
                            width: 100px;
                            background-color: #ff5000;
                        }
                        body div img {
                            width: 30px;
                            background-color: #ff1111;
                        }
                    </style>
                </head>
                <body>
                    <img id="myid"/>
                    <img />
                </body>
            </html>`
        );
    })
}).listen(8088);

console.log("server started");