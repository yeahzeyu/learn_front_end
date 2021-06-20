import {Timeline, Animation} from "./animation.js"
import { ease, easeIn, easeOut, easeInOut, linear } from "./cubicBezier.js";

let tl = new Timeline();

tl.start();
tl.add(new Animation(document.querySelector("#el").style, "transform", 0, 500, 2000, 0, ease, v => `translate(${v}px)`));

document.querySelector("#el2").style.transition = 'transform 2s ease';
document.querySelector('#el2').style.transform = 'translateX(500px)';

document.querySelector('#pause-btn').addEventListener("click", () => tl.pause());
document.querySelector('#resume-btn').addEventListener("click", () => tl.resume());
document.querySelector('#reset-btn').addEventListener("click", () => tl.reset());