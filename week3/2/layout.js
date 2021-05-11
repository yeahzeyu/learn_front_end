//根据浏览器的属性进行排版
//建立二维坐标系
//主轴为横向（row）时，其相关参数为width、x、left、right，交叉轴为纵向（column），相关参数为height、y、top、bottom
//主轴为纵向（column）时，其相关参数为height、y、top、bottom，交叉轴为横向（row），相关参数为width、x、left、right
//因为flex布局一定是需要知道子元素的，所以我们可以认为它的子元素一定是发生在标签的结束标签之前，所以我们选择的实际是token的type为endTag的位置


function getStyle(element) {
    if (!element.style)
        element.style = {};
    //将一些属性，比如用px标识的属性，把它变成纯粹的数字，纯数字的再转换一下类型，因为我们写的代码写出来的都是字符串，另外是新加了style这个对象，用来存最后计算的属性，其实应该是用另外一个类似style的名字，只是这里style并没有被属性占掉，所以才为了方便用了style命名
    //console.log("---style---");
    for (let prop in element.computedStyle) {
        //console.log(prop);
        let p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;
        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop])
        }
    }
    return element.style;
}

function layout(element) {
    if (!element.computedStyle)
        return;
    let elementStyle = getStyle(element);
    if (elementStyle.display !== 'flex')
        return;
    //把文本节点都过滤掉
    let items = element.children.filter(e => e.type === 'element');

    items.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    let style = elementStyle;

    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    })

    if (!style.flexDirection || style.flexDirection === 'auto')
        style.flexDirection = 'row';
    if (!style.alignItems || style.alignItems === 'auto')
        style.alignItems = 'stretch';
    if (!style.justifyContent || style.justifyContent === 'auto')
        style.justifyContent = 'flex-start';
    if (!style.flexWrap || style.flexWrap === 'auto')
        style.flexWrap = 'nowrap';
    if (!style.alignContent || style.alignContent === 'auto')
        style.alignContent = 'stretch';

    let mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;

    if (style.flexDirection === 'row') { //主轴为X轴（方向是从左往右），交叉轴为y轴（方向是从上往下）的情况
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0; //初始结点位置

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style.flexDirection === 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style.flexDirection === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'row';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if (style.flexWrap === 'wrap-reverse') {
        let tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    } else {
        crossBase = 0;
        crossSign = 1;
    }

    let isAutoMainSize = false;
    if (!style[mainSize]) { //auto sizeing
        elementStyle[mainSize] = 0;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0))
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
        }
        isAutoMainSize = true;
        //style.flexWrap = 'nowrap';
    }

    let flexLine = [];
    let flexLines = [flexLine];
    let mainSpace = elementStyle[mainSize];
    let crossSpace = 0;

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getStyle(item);

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        if (itemStyle.flex) {
            flexLine.push(item);
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            flexLine.push(item);
        } else {
            if(itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            if(mainSpace < itemStyle[mainSize]) {
                //放不下，则是重置
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                flexLine = [];
                flexLines.push(flexLine);
                flexLine.push(item);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push(item);
            }
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            mainSpace -= itemStyle[mainSize];
        }
    }
    flexLine.mainSpace = mainSpace;
    console.log(items);
}

module.exports = layout;




/*

第一课：
本节课还没开始编码的算法，而是完成预处理的准备工作，主要是处理flexDirection和wrap相关的属性，重点是把具体的width、height、left、right、top、bottom等属性抽象成了main cross相关的属性
第一代排版：正常流，position，display，float
第二代排版：flex
第三代排版：grid
第四代排版：CSS Houdini

第二课：
分行规则：1、根据主轴尺寸，把元素分进行；2、若设置了no-wrap，强行分配进第一行；

*/