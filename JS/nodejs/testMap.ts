class Test1 {
    public name: number;
    constructor() {
        console.log(1);
        this.name = 1;
    }
    update() {
        console.log(2);
    }
}
class Test2 {
    public name: number;
    constructor() {
        console.log(1);
        this.name = 1;
    }
    update() {
        console.log(2);
    }
}

class Test3 {
    public name: number;
    constructor() {
        console.log(1);
        this.name = 1;
    }
    update() {
        console.log(2);
    }
}
class Test4 {
    public name: number;
    constructor() {
        console.log(1);
        this.name = 1;
    }
    update() {
        console.log(2);
    }
}
enum Type {
    Test1 = 1,
    Test2 = 2,
    Test3 = 3,
    Test4 = 4,
}
const CON = {
    [Type.Test1]: Test1,
    [Type.Test2]: Test2,
    [Type.Test3]: Test3,
    [Type.Test4]: Test4,
};
type TT = {
    name: number;
};
const map = new Map<Type, TT>();
const crea = <T extends Type>(arg: T) => {
    map.set(arg, new CON[arg]());
    
};
