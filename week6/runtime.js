export class ExecutionContext {
    constructor(realm, lexicalEnvironment, variableEnvironment) {
        variableEnvironment = variableEnvironment || lexicalEnvironment;
        this.lexicalEnvironment = lexicalEnvironment;
        this.variableEnvironment = variableEnvironment;
        this.realm = realm;
    }
}
export class EnvironmentRecord {
    constructor(outer) {
        this.outer = outer;
        this.variables = new Map;
    }
    add(name) {
        this.variables.set(name, new JSUndefined);
    }
    get(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        } else if (this.outer) {
            return this.outer.get(name);
        } else {
            return JSUndefined;
        }
    }
    set(name, value = new JSUndefined) {
        if (this.variables.has(name)) {
            return this.variables.set(name, value);
        } else if (this.outer) {
            return this.outer.set(name, value);
        } else {
            return this.variables.set(name, value);
        }
    }
}

export class Referentce {
    constructor(object, property) {
        this.object = object;
        this.property = property;
    }
    set(value) {
        this.object.set(this.property, value);
    }
    get() {
        return this.object.get(this.property);
    }
}

export class Realm {
    constructor() {
        this.global = new Map(),
            this.Object = new Map(),
            this.Object.call = function () {

            }
        this.object_prototype = new Map();
    }
}

export class JSValue {
    get type() {
        if (this.constructor === JSNumber) {
            return "number";
        }
        if (this.constructor === JSString) {
            return "string";
        }
        if (this.constructor === JSBoolean) {
            return "boolean";
        }
        if (this.constructor === JSObject) {
            return "object";
        }
        if (this.constructor === JSNull) {
            return "null";
        }
        if (this.constructor === JSSymbol) {
            return "symbol";
        }
        return "undefined";
    }
}

export class JSNumber extends JSValue {
    constructor(value) {
        super();
        this.memory = new ArrayBuffer(8);
        if (arguments.length)
            new Float64Array(this.memory)[0] = value;
        else
            new Float64Array(this.memory)[0] = 0;
    }
    get value() {
        return new Float64Array(this.memory)[0];
    }
    toString() {

    }
    toNumber() {
        return this;
    }
    toBoolean() {
        if (new Float64Array(this.memory)[0] === 0) {
            return new JSBoolean(false)
        } else {
            return new JSBoolean(false)
        }
    }
}


export class JSString extends JSValue {
    constructor(characters) {
        super();
        this.characters = characters;
    }
    toNumber() { }
    toStrig() {
        return this;
    }
    toBoolean() {
        if(new Float64Array(this.memory)[0] === 0) {
            return new JSBoolean(false)
        } else {
            return new JSBoolean(true)
        }
    }
}

export class JSBoolean extends JSValue {
    constructor(value) {
        super();
        this.value = value || false;
    }
    toNumber() {
        if(this.value)
            return new JSNumber(1);
        else
            return new JSNumber(0);
    }
}