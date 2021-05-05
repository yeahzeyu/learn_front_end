//根据浏览器的属性进行排版
//建立二维坐标系
//主轴为横向（row）时，其相关参数为width、x、left、right，交叉轴为纵向（column），相关参数为height、y、top、bottom
//主轴为纵向（column）时，其相关参数为height、y、top、bottom，交叉轴为横向（row），相关参数为width、x、left、right
//因为flex布局一定是需要知道子元素的，所以我们可以认为它的子元素一定是发生在标签的结束标签之前，所以我们选择的实际是token的type为endTag的位置


function getStyle(element) {
    if(!element.style)
        element.style = {};
}

function layout(element) {
    if (!element.computedStyle)
        return;
    let elementStyle = getStyle(element);
    if(elementStyle.display !== 'flex')
        return;
    let items = element.children.filter(e => e.type === 'element');
    items.sort(function(a,b) {
        return (a.order || 0) - (b.order || 0);
    });
    let style = elementStyle;
    ['width', 'height'].forEach(size => {
        if(style[size] === 'auto' || style[size] === '') {

        }
    })
}


/*

第一课：
本节课还没开始编码的算法，而是完成预处理的准备工作，主要是处理flexDirection和wrap相关的属性，重点是把具体的width、height、left、right、top、bottom等属性抽象成了main cross相关的属性
第一代排版：正常流，position，display，float
第二代排版：flex
第三代排版：grid
第四代排版：CSS Houdini

*/