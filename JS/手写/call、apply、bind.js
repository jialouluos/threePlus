
Function.prototype.myCall = function (content) {
    if (typeof this !== 'function') return Error("")
    content ??= window;
    const args = [...arguments].slice(1);
    content.fn = this;
    const result = content.fn(...args)
    delete content.fn;
    return result;
}
Function.prototype.myBind = function (content) {
    if (typeof this !== 'function') return Error();
    content ??= window;
    const args = [...arguments].slice(1);
    const fn = this;
    return function Fn() {
        fn.call(this instanceof Fn ? this : content, ...args.concat(...arguments));
    }
}
Function.prototype.myApply = function (content) {
    if (typeof this !== 'function') return Error();
    content ??= window;
    content.fn = this;
    const args = arguments[1] || undefined;
    const result = content.fn(...args);
    delete content.fn;
    return result;
}
//函数柯里化
function add(a, b) {
    return a + b;
}
function add_curry(a) {
    return function (b) {
        return a + b;
    }
}
function add_curry2(a) {
    return function (b) {
        return function (c) {
            return a + b + c;
        }
    }
}
function ceate_curry(fn, ...args) {
    args = args || [];
    return function (...args2) {
        args = args.concat(args2);
        if (args.length === fn.length) {
            console.log('借宿罗');
            return fn(...args);
        } else {
            console.log('为借宿罗');
            return ceate_curry(fn, ...args);
        }
    }
}
const e = ceate_curry(add,)
console.log(e(1)(2))