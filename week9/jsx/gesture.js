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

let start = (point) => {
    console.log("start", point.clientX, point.clientY);
}

let move = (point) => {
    console.log("move", point.clientX, point.clientY);
}

let end = (point) => {
    console.log("end", point.clientX, point.clientY);
}

let cancel = (point) => {
    console.log("cancel", point.clientX, point.clientY);
}