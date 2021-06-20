//let element = document.documentElement;

//let handler;
//let startX, startY;
//let isPan = false, isTap = true, isPress = false; //是否应该是全局的呢？
//如果从触屏的角度考虑，会有多个触点的情况
//如果从鼠标的角度考虑，会有左右键的区分
//所以全局变量的形式是错误的
//那么除了全局之外，剩下的只有一个选项，context



//flick事件是以上事件中当中最为特殊的一个，因为它还需要判断速度
//我们可以在move的时候得到当前这一次move的速度，但是这个并不能够帮助我们去处理，因为这个速度如果我们只判断两个点之间的速度，根据浏览器实现的不同，会有一个较大的误差，
//所以我们对速度的判断，应该是取数个点的速度进行平均
//这里会采用一个存储一段时间内的点的方式，来做平均速度的计算


//进一步实现事件派发，dom里面事件的派发是使用new event实现的
export class Dispatcher {
    constructor(element) {
        this.element = element;
    }

    dispatch(type, properties) { //将原本的context, point先预处理成properties这样的kv结构后再传进来
        //let event = new CustomEvent(type, {});
        let event = new Event(type);
        for (let name in properties) {
            event[name] = properties[name];
        }
        //dispatch实际上是需要是一个元素的
        this.element.dispatchEvent(event);
        //console.log(event);
    }
}


//待补充，将剩余事件都实现派发，把事件加上必要的参数，我们所有需要的参数，基本都在context里面了
//做一个解耦的分析，上述内容会分为三个部分
//listen => recognize => dispatch
//监听、识别而后重新分发
// new Listener(new Recognizer(new Dispatcher))
// new Listener(new Recognizer(dispatch))
// Listerner可以是一个DOM Listener或者是别的
// Dispatcher可以是一个DOM Dispatcher或者是别的


export class Listerner {
    constructor(element, recognizer) { //把element和识别器放进来
        let isTouch = false;
        let touchTimeout = null;
        let isListeningMouse = false; //用这个全局变量来表示是否已经开始监听鼠标了，如果已经开始监听，则不再绑定新的监听
        let contexts = new Map();
        this.element = element;
        this.recognizer = recognizer;
        //在模拟环境下，mousedown和touchstart好像会同时触发，touchstart快一些，之后是mousedown
        //鼠标支持左键、右键、中键、前进、后退，在浏览器的模型里面，它至少支持5个建的down和up
        let mousedown = event => {
            if(isTouch) return;
            //console.log(event.button);
            //左中右：0、1、2，前后：3、4
            let context = Object.create(null);
            //使用Object.create(null)表示我们要对一个对象做一个kv的匹配，这样可以避免object上那些原始的属性的干扰
            contexts.set("mouse" + (1 << event.button), context);

            this.recognizer.start(event, context);

            let mousemove = event => {
                //console.log(event.clientX, event.clientY);
                //mousedown是分按键的，可mousemove是不分按键的
              
                //但它包含一个buttons，buttons的值采用了一个古典的设计，使用二进制的掩码来做的，比如0b00001，代表的是左键被按下了，0b00010代表的是中键被按下，0b00011代表的是中键和左键被按下
                let button = 1;
                while (button <= event.buttons) {
                    //这个判断是为了保证button不会移出界
                    //这里还需要加一个判断，只有某个键被按下去了，才会进一步触发move，不能循环全部都调用move
                    //要用一个按位与的运算，这就是掩码的作用，在本例这里只有当button与event.button相同时，值才大于0
                    //这里其实还有一个坑，buttons的顺序跟我们通过1移动event.button位构造出来的数不是完全相同的，它们的第二位和第三位刚好是相反的，代表鼠标的中键和右键的那两位刚好是相反的
                    //所以这里需要做一个额外的处理
                    //order of buttons & button property is not same
                    if (button & event.buttons) {
                        let key;
                        if (button === 2)
                            key = 4;
                        else if (button === 4)
                            key = 2;
                        else
                            key = button;
                        let context = contexts.get("mouse" + key);
                        this.recognizer.move(event, context);
                    }
                    button = button << 1;
                }
            }
            let mouseup = event => {
                //mouseup也是有button属性的
                //console.log("end", event.button);
                //教程里面winter老师的测试当中是end 0发生了两次，实际上，end2等也有可能发生，当多个键被按下的时候，会触发多次mousedown的事件，由于左右键未必是真正同时被按下，
                //所以先被按下的那个键会被绑定多次mouse move和mouse up的时间监听
                let context = contexts.get("mouse" + (1 << event.button));
                this.recognizer.end(event, context);
                contexts.delete("mouse" + (1 << event.button));
                if (event.buttons === 0) {
                    document.removeEventListener("mousemove", mousemove);
                    document.removeEventListener("mouseup", mouseup);
                    isListeningMouse = false;
                }
            }
            if (!isListeningMouse) {
                document.addEventListener("mousemove", mousemove);
                document.addEventListener("mouseup", mouseup);
                isListeningMouse = true;
            }
        };

        this.element.addEventListener("mousedown", mousedown);



        //touch系列的事件跟鼠标有所不同，一旦触发了touchstart，之后必定会触发touchmove，且作用在同一元素上，因此不需要跟mousedown一样才去嵌套的写法
        //理解上可以与mouse系列的一一对应，但其内在逻辑和我们写出来的代码是完全不一样的
        //因为touchmove无法脱离touchstart而单独触发的，而鼠标不同，按不按都可以晃
        //touch系列事件比mouse系列事件多了一个cancel
        this.element.addEventListener("touchstart", event => {
            isTouch = true;
            //event.stopPropagation(); 
            //event.preventDefault();
            //element.removeEventListener("mousedown", mousedown);
            //event里面有多个触点
            //identifier是用来表示touch的唯一id
            //console.log(event.changedTouches);
            for (let touch of event.changedTouches) {
                let context = Object.create(null);
                contexts.set(touch.identifier, context);
                //console.log("start", touch.clientX, touch.clientY);
                this.recognizer.start(touch, context);
            }
        })

        this.element.addEventListener("touchmove", event => {
            //console.log(event.changedTouches);
            for (let touch of event.changedTouches) {
                //console.log("move", touch.clientX, touch.clientY);
                let context = contexts.get(touch.identifier);
                this.recognizer.move(touch, context);
            }
        })

        this.element.addEventListener("touchend", event => {
            clearTimeout(touchTimeout);
            touchTimeout = setTimeout(() => {isTouch = false}, 500)
            //console.log(event.changedTouches);
            for (let touch of event.changedTouches) {
                //console.log("end", touch.clientX, touch.clientY);
                let context = contexts.get(touch.identifier);
                this.recognizer.end(touch, context);
                contexts.delete(touch.identifier);
            }
        })

        this.element.addEventListener("touchcancel", event => {
            isTouch = false;
            //console.log(event.changedTouches);
            //被异常事件打断，如alert
            for (let touch of event.changedTouches) {
                let context = contexts.get(touch.identifier);
                //console.log("cancel", touch.clientX, touch.clientY);
                recognizer.cancel(touch);
                contexts.delete(touch.identifier);
            }
        })
    }
}

export class Recognizer {
    constructor(dispatcher) {
        this.dispatcher = dispatcher; //因为最后派发的肯定是一个函数
    }

    start(point, context) {
        //console.log("start", point.clientX, point.clientY);
        context.startX = point.clientX, context.startY = point.clientY;
        context.points = [{
            t: Date.now(),
            x: point.clientX,
            y: point.clientY
        }];
        context.isTap = true;
        context.isPan = false;
        context.isPress = false;
        context.handler = setTimeout(() => {
            context.isTap = false;
            context.isPan = false;
            context.isPress = true;
            context.handler = null;
            //console.log("press");
            this.dispatcher.dispatch("press", {});
        }, 500)
    }
    
    move(point, context) {
        let dx = point.clientX - context.startX;
        let dy = point.clientY - context.startY;
        if (dx ** 2 + dy ** 2 > 100) {
            context.isTap = false;
            context.isPan = true;
            context.isPress = false;
            context.isVertical =  Math.abs(dx) < Math.abs(dy); //用于区分是上下滑，还是左右滑
             //console.log("panstart");
            this.dispatcher.dispatch("panstart", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical
            });
            clearTimeout(context.handler);
        }
        if (context.isPan) {
            //console.log(dx, dy);
            //console.log("pan");
            this.dispatcher.dispatch("pan", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical
            });
        }
        //在放进新的点之前会做一个过滤，让它只存取半秒内的速度，这样我们才能保正计算最新的速度
        context.points = context.points.filter(point => Date.now() - point.t < 500);
        context.points.push({
            t: Date.now(),
            x: point.clientX,
            y: point.clientY
        });
        //console.log("move", point.clientX, point.clientY);
    }
    
    end(point, context) {
        if (context.isTap) {
            //console.log("tap");
            this.dispatcher.dispatch("tap", {});
            clearTimeout(context.handler);
        }
        
        if (context.isPress) {
            this.dispatcher.dispatch("pressend", {});
            //console.log("pressEnd");
        }
        //console.log("end", point.clientX, point.clientY);
        context.points = context.points.filter(point => Date.now() - point.t < 500);
        //由于最后停下来时可能会导致数组为空，因此在此处多push一个点进去
        /*
        context.points.push({
            t: Date.now(),
            x: point.clientX,
            y: point.clientY
        })
        */
        let d, v;
        if (!context.points.length) {
            v = 0;
        } else {
            d = Math.sqrt((point.clientX - context.points[0].x) ** 2 + (point.clientY - context.points[0].y) ** 2); //三角形公式 a**2 + b**2 = c**2
            v = d / (Date.now() - context.points[0].t);
        }
        //根据经验，我们可以认为这个速度是大于1.5像素每毫秒就是比较快的了
        //console.log("v", v);
        if (v > 1.5) {
            //console.log("flick");
            context.isFlick = true;
            this.dispatcher.dispatch("flick", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
                isFlick: context.isFlick,
                velocity: v //速度
            });
        } else {
            context.isFlick = false;
        }

        if (context.isPan) {
            //console.log("panEnd");
            this.dispatcher.dispatch("panend", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
                isFlick: context.isFlick
            });
        }
    }
    
    cancel(point, context) {
        clearTimeout(context.handler);
        //console.log("cancel", point.clientX, point.clientY);
        this.dispatcher.dispatch("cancel", {});
    }
}

//实现一体化的处理方法
export function enableGesture(element) {
    new Listerner(element, new Recognizer(new Dispatcher(element)))
}