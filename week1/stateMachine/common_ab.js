function hasAB(string) {
    let hitA = false;
    for(let c of string) {
        if(c == "a") {
            hitA = true;
        } else if(hitA && c=="b") {
            return true;
        } else {
            hitA = false;
        }
    }
    return false;
}

console.log(hasAB("acdab"));