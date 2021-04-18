function hasABCDEF(string) {
    let hitA = false;
    let hitB = false;
    let hitC = false;
    let hitD = false;
    let hitE = false;
    for(let c of string) {
        if(c == "a") {
            hitA = true;
        } else if(hitA && c=="b") {
            hitB = true;
        } else if(hitB && c=="c") {
            hitC = true;
        } else if(hitC && c=="d") {
            hitD = true;
        } else if(hitD && c=="e") {
            hitE = true;
        } else if(hitE && c=="f") {
            return true;
        } else {
            hitA = false;
            hitB = false;
            hitC = false;
            hitD = false;
            hitE = false;
        }
    }
    return false;
}

console.log(hasABCDEF("acdabcdefa"));