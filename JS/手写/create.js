//Object.create
function create(obj) {
    function F() { }
    F.prototype = obj;
    return new F();
}
//instanceOf
function instanceOf(obj1, obj2) {
    if (!obj1 || !obj2) return Error()
    while (obj1.__proto__ !== null) {
        if (obj1.__proto__ === obj2.prototype) return true;
        obj1 = obj1.__proto__;
    }
    return false;
}
const das = new WeakRef({
    name: 'das',
})
// console.log(das.deref().name)
//new
//1. 创建一个空对象
//2. 为创建的对象添加__proto__属性指向构造函数的原型
//3. 将构造函数的this指向新创建的对象
//4. 返回该对象
function objectFactory(obj, ...args) {
    let newObj = Object.create(obj.prototype);
    const result = obj.apply(newObj, args);
    return typeof result === 'object' ? result : newObj;
}

const ee = Object.assign({}, {
    build: {
        test: 1
    }
}, {
    build: {
        dd: 2
    }
})
console.log(ee);