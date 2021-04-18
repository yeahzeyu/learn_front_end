function hasABCABX(string) {
    let state = start;
    for (let c of string) {
        state = state(c);
    }
    return state === end;
}

function start(c) {
    if (c === "a") {
        return hitA;
    } else {
        return start;
    }
}

function end(c) {
    return end;
}

function hitA(c) {
    if(c === "b") {
        return hitB;
    } else {
        return start(c);
    }
}

function hitB(c) {
    if(c === "c") {
        return hitC;
    } else {
        return start(c);
    }
}

function hitC(c) {
    if(c === "a") {
        return hitA2;
    } else {
        return start(c);
    }
}

function hitA2(c) {
    if(c === "b") {
        return hitB2;
    } else {
        return start(c);
    }
}

function hitB2(c) {
    if(c === "x") {
        return end;
    } else {
        return hitB(c);
    }
}

console.log(hasABCABX("acdabcabx"));