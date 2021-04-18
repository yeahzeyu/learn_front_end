function hasA(string) {
    for(let c of string) {
        if(c == "a") {
            return true;
        }
    }
    return false;
}

console.log(hasA("I am Woody Yip"));