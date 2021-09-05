let http = require("http");
let fs = require("fs");
let archiver = require("archiver");
let child_process = require("child_process");
let querystring = require("querystring");

// 1. 打开 https://github.com/login/oauth/authorzize

child_process.exec(`open https://github.com/login/oauth/authorize?client_id=Iv1.2ca49cf972b3d6a7`)

// 2. 创建server，接受token，后点击发布
http.createServer(function() {
    let query = querystring.parse(request.url.match(/^\/\?([\s\S]+)$/)[1]);
    publish(query.token);
}).listen(8083);

function publish(token) {
    let request = http.request({
        hostname: "127.0.0.1",
        port: 8082,
        method: "POST",
        path: "/publish/token=" + token,
        headers: {
            "Content-Type": "application/octet-stream"
        }
    }, response => {
        console.log(response);
    });

    // let file = fs.createReadStream("./sample.html");

    const archive = archiver('zip', {
        zlib: {level: 9}
    });

    archive.directory('./sample/', false);

    archive.finalize();

    archive.pipe(request);
}