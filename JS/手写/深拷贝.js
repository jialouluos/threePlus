const deepClone = (obj) => {
    const isObject = (obj) => {
        return (typeof obj === "object" && obj) || typeof obj === 'function';
    }
    const isMap = (obj) => {
        return obj instanceof Map || obj instanceof WeakMap;
    }
    const isCanConstructor = (obj) => {
        return [Date, RegExp].includes(obj.constructor);
    }
    const isFunction = (obj) => {
        return typeof obj === "function";
    }
    const isSet = (obj) => {
        return obj instanceof Set;
    }
    const hash = new WeakMap();
    const clone = (obj) => {
        if (!isObject(obj)) return obj;
        if (hash.has(obj)) {
            return hash.get(obj);
        }
        let target = null;
        //处理map
        if (isMap(obj)) {
            target = new Map();
            hash.set(obj, target);
            for (let [item, value] of obj.entries()) {
                target.set(item, clone(value));
            }
        }
        else if (isCanConstructor(obj)) {
            target = new obj.constructor(obj)
            hash.set(obj, target);
        }
        else if (isFunction(obj)) {
            // target = obj.bind();//拷贝版
            target = obj;//函数一般我们不拷贝
            hash.set(obj, target);
        }
        else if (isSet(obj)) {
            target = new Set();
            hash.set(obj, target);
            for (let val of obj) {
                target.add(clone(val));
            }
        }
        else {
            const allDesc = Object.getOwnPropertyDescriptors(obj)
            target = Object.create(Object.getPrototypeOf(obj), allDesc)
            hash.set(obj, target);
            Reflect.ownKeys(obj).forEach(item => {
                target[item] = clone(obj[item])
                console.log(item, target[item], target[item] === obj[item])
            })
        }
        return target;
    }
    return clone(obj);
}

// 测试的obj对象
const obj = {
    // =========== 1.基础数据类型 ===========
    num: 0, // number
    str: '', // string
    bool: true, // boolean
    unf: undefined, // undefined
    nul: null, // null
    sym: Symbol('sym'), // symbol
    bign: BigInt(1n), // bigint

    // =========== 2.Object类型 ===========
    // 普通对象
    obj: {
        name: '我是一个对象',
        id: 1
    },
    // 数组
    arr: [0, 1, 2],
    // 函数
    func: function () {
        console.log('我是一个函数')
    },
    // 日期
    date: new Date(0),
    // 正则
    reg: new RegExp('/我是一个正则/ig'),
    // Map
    map: new Map().set('mapKey', 1),
    // Set
    set: new Set().add('set'),
    // =========== 3.其他 ===========
    [Symbol('1')]: 1  // Symbol作为key
};

// 4.添加不可枚举属性
Object.defineProperty(obj, 'innumerable', {
    enumerable: false,
    writable: true,
    value: '不可枚举属性'
});

// 5.设置原型对象
Object.setPrototypeOf(obj, {
    proto: 'proto'
})

// 6.设置loop成循环引用的属性
obj.loop = obj

const reslt = deepClone(obj)

console.log(reslt)
