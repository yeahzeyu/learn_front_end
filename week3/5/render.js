const images = require("images");

function render(viewport, element) {
    if(element.style) {
        var img = images(element.style.width, element.style.height);
        if(element.style["background-color"]) {
            let color = element.style["background-color"] || "rgb(0,0,0)";
            color.match(/rgb\((\d+),(\d+),(\d+)\)/);
            //console.log(color);
            img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3), 1);
            //console.log(img);
            viewport.draw(img, element.style.left || 0, element.style.top || 0);
        }
    }
}

module.exports = render;

/*

第一步 总结
绘制需要依赖一个图形环境
我们这里采用了npm包images（除了background-color，background-image和border也可以做出来，gradient做不了，如果想做需要用webGL库）
绘制在一个viewport上进行
与绘制相关的属性：background-color、border、background-image等

*/