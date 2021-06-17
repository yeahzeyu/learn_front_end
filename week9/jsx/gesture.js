let element = document.documentElement;

element.addEventListener("mousedown", event => {
    start(event);
    let mousemove = event => {
        //console.log(event.clientX, event.clientY);
        move(event);
    }
    let mouseup = event => {
        end(event);
        element.removeEventListener("mousemove", mousemove);
        element.removeEventListener("mouseup", mouseup);
    }
    element.addEventListener("mousemove", mousemove);
    element.addEventListener("mouseup", mouseup);
});

//touch系列的事件跟鼠标有所不同，一旦触发了touchstart，之后必定会触发touchmove，且作用在同一元素上，因此不需要跟mousedown一样才去嵌套的写法
//理解上可以与mouse系列的一一对应，但其内在逻辑和我们写出来的代码是完全不一样的
//因为touchmove无法脱离touchstart而单独触发的，而鼠标不同，按不按都可以晃
//touch系列事件比mouse系列事件多了一个cancel
element.addEventListener("touchstart", event => {
    //event里面有多个触点
    //identifier是用来表示touch的唯一id
    //console.log(event.changedTouches);
    for(let touch of event.changedTouches) {
        //console.log("start", touch.clientX, touch.clientY);
        start(touch);
    }
})

element.addEventListener("touchmove", event => {
    //console.log(event.changedTouches);
    for(let touch of event.changedTouches) {
        //console.log("move", touch.clientX, touch.clientY);
        move(touch);
    }
})

element.addEventListener("touchend", event => {
    //console.log(event.changedTouches);
    for(let touch of event.changedTouches) {
        //console.log("end", touch.clientX, touch.clientY);
        end(touch);
    }
})

element.addEventListener("touchcancel", event => {
    //console.log(event.changedTouches);
    //被异常事件打断，如alert
    for(let touch of event.changedTouches) {
        //console.log("cancel", touch.clientX, touch.clientY);
        move(touch);
    }
})

let handler;
let startX, startY;
let isPan = false, isTap = true, isPress = false; //是否应该是全局的呢？
//如果从触屏的角度考虑，会有多个触点的情况
//如果从鼠标的角度考虑，会有左右键的区分
//所以全局变量的形式是错误的
//那么除了全局之外，剩下的只有一个选项，context

let start = (point, context) => {
    //console.log("start", point.clientX, point.clientY);
    context.startX = point.clientX, context.startY = point.clientY;
    context.isTap = true;
    context.isPan = false;
    context.isPress = false;
    context.handler = setTimeout(() => {
        context.isTap = false;
        context.isPan = false;
        context.isPress = true;
        context.handler = null;
        console.log("press");
    }, 500)
}

let move = (point) => {
    let dx = point.clientX - startX;
    let dy = point.clientY - startY;
    if(dx ** 2 + dy ** 2 > 100) {
        isTap = false;
        isPan = true;
        isPress = false;
        console.log("panstart");
        clearTimeout(handler);
    }
    if(isPan) {
        console.log(dx, dy);
        console.log("pan");
    }
    

    //console.log("move", point.clientX, point.clientY);
}

let end = (point) => {
    if(isTap) {
        console.log("tap");
        clearTimeout(handler);
    }
    if(isPan) {
        console.log("panEnd");
    }
    if(isPress) {
        console.log("pressEnd");
    }
    //console.log("end", point.clientX, point.clientY);
}

let cancel = (point) => {
    clearTimeout(handler);
    console.log("cancel", point.clientX, point.clientY);
}