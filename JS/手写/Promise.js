const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';
class MyPromise{
    constructor(fn) {
        this.status = PENDING;//初始化状态
        this.value = null;//初始化值，用于来保存resolve和rejecte传入的值
        this.resolvedCallbacks = [];//初始化resolved回调函数数组，用来保存执行then时仍处于PENDING状态时resolve的回调函数
        this.rejectedCallbacks = [];//初始化rejected回调函数数组，用来保存执行then时仍处于PENDING状态时rejecte的回调函数
        const _this =this;
        const resolve = (value) => {
            if (value instanceof MyPromise) return value.then(resolve, rejecte);//详看代码解析一
            //自身状态改变之前，需要先等待值的状态确定之后再进行改变
            if (this.status !== PENDING) return;
            this.value = value;
            this.status = RESOLVED;
            this.resolvedCallbacks.forEach(callback => {
                callback(this.value)
            })
        }
        const rejecte = (value) => {
            if (this.status !== PENDING) return;
            this.value = value;
            this.status = REJECTED;
            this.rejectedCallbacks.forEach(callback => {
                callback(this.value)
            })
        }
        try {
            fn(resolve, rejecte);
        } catch (err) {
            // 遇到错误时，捕获错误，执行 reject 函数
            rejecte(err);
        }
    }
    //这种then不具备链式调用
    then(onFulfilled, onRejected) {
        const _this = this;
        //可选参数 记得修正一下，避免bug出现
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
        onRejected = typeof onRejected === "function" ? onRejected : value => value;
        setTimeout(() => {
            if (_this.status === PENDING) {
                // 如果是等待状态，则将函数加入对应列表中
                _this.rejectedCallbacks.push(onRejected);
                _this.resolvedCallbacks.push(onFulfilled);
            }
            if (_this.status === RESOLVED) {
                onFulfilled(_this.value);
            }
            if (_this.status === REJECTED) {
                onRejected(_this.value);
            }
        })
    }
    link_then(onFulfilled, onRejected) {
        const _this = this;
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
        onRejected = typeof onRejected === "function" ? onRejected : value => value;
        return new MyPromise((res, rej) => {
            const fulfilled = () => {//详看dai
                try {
                    let result = onFulfilled(_this.value);
                    return  result instanceof MyPromise ? result.then(res, rej) : res(result);
                } catch (err) {
                    rej(err);
                }
            }
            const rejected = () => {
                try {
                    let result = onRejected(_this.value);
                    return result instanceof MyPromise ? result.then(res, rej) : res(result);
                } catch (err) {
                    rej(err);
                }
            }
            setTimeout(() => {
                if (_this.status === PENDING) {
                    _this.rejectedCallbacks.push(rejected);
                    _this.resolvedCallbacks.push(fulfilled);
                }
                if (_this.status === RESOLVED) {
                    fulfilled();
                }
                if (_this.status === REJECTED) {
                    rejected();
                }
            })
        })
    }
    static all(arr) {
        let args = Array.prototype.slice.call(arr)
        return new Promise(function (resolve, reject) {
            if (args.length === 0) return resolve([])
            let remaining = args.length
            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        let then = val.then
                        if (typeof then === 'function') {
                            then.call(val, function (val) { // 这里如果传入参数是 promise的话需要将结果传入 args, 而不是 promise实例
                                res(i, val) 
                            }, reject)
                            return
                        }
                    }
                    args[i] = val
                    if (--remaining === 0) {
                        resolve(args)
                    }
                } catch (ex) {
                    reject(ex)
                }
            }
            for (let i = 0; i < args.length; i++) {
                res(i, args[i])
            }
        })
    }
}