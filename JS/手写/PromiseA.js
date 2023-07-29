//2.1 Promise的状态,Promise 必须处于以下三种状态之一:pending,fulfilled,rejected
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
class MyPromise {
    constructor(fn) {
        this.status = PENDING;//初始化状态
        this.onFulfilledCallback = [];
        this.onRejectedCallback = [];
        const _this = this;
        // 2.1.1. 当 Promise 处于 pending 状态时：
        // 2.1.1.1. 可以转换到 fulfilled 或 rejected 状态。
        // 2.1.2. 当 Promise 处于 fulfilled 状态时：
        // 2.1.2.1. 不得过渡到任何其他状态。
        // 2.1.2.2. 必须有一个不能改变的值。
        const resolve = (data) => {
            setTimeout(() => {
                if (_this.status !== PENDING) return;
                _this.status = FULFILLED;
                _this.value = data;
                // 2.2.6.1. 如果 promise 处于 fulfilled 状态，所有相应的 onFulfilled 回调必须按照它们对应的 then 的原始调用顺序来执行。
                _this.onFulfilledCallback.forEach(callback => callback(data))
            }, 0);
        }
        const reject = (reason) => {
            // 2.1.1. 当 Promise 处于 pending 状态时：
            // 2.1.1.1. 可以转换到 fulfilled 或 rejected 状态。
            // 2.1.3. 当 Promise 处于 rejected 状态时：
            // 2.1.2.1. 不得过渡到任何其他状态。
            // 2.1.2.2. 必须有一个不能改变的值。
            setTimeout(() => {
                if (_this.status !== PENDING) return;
                _this.status = REJECTED;
                _this.value = reason;
                // 2.2.6.2. 如果 promise 处于 rejected 状态，所有相应的 onRejected 回调必须按照它们对应的 then 的原始调用顺序来执行。
                _this.onRejectedCallback.forEach(callback => callback(reason))
            }, 0);
        };

        try {
            fn(resolve, reject);
        } catch (err) {
            reject(err)
        }
    }
    // 2.2.7. then 必须返回一个 promise
    then(onFulfilled, onRejected) {
        const _this = this;
        let promise2;
        return promise2 = new MyPromise((resolve, reject) => {
            if (_this.status === FULFILLED) {
                setTimeout(() => {
                    if (typeof onFulfilled === 'function') {
                        try {
                            const result = onFulfilled(_this.value);
                            _this._promiseResolutionProcedure(promise2, result, resolve, reject)
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        resolve(_this.value)
                    }
                })
            }
            else if (_this.status === REJECTED) {
                setTimeout(() => {
                    // 2.2.1. onFulfilled 和 onRejected 都是可选参数：
                    // 2.2.1.1. 如果 onFulfilled 不是一个函数，它必须被忽略。
                    if (typeof onRejected === 'function') {
                        try {
                            // 2.2.2.1. 它必须在 promise 的状态变为 fulfilled 后被调用，并将 promise 的值作为它的第一个参数。
                            // 2.2.5. onFulfilled 和 onRejected 必须作为函数调用。
                            const result = onRejected(_this.value);
                            _this._promiseResolutionProcedure(promise2, result, resolve, reject)
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject(_this.value)
                    }
                })
            }
            else if (_this.status === PENDING) {
                _this.onFulfilledCallback.push((value) => {
                    if (typeof onFulfilled === 'function') {
                        try {
                            const result = onFulfilled(_this.value);
                            _this._promiseResolutionProcedure(promise2, result, resolve, reject)
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        resolve(value)
                    }
                })
                _this.onRejectedCallback.push((value) => {
                    if (typeof onRejected === 'function') {
                        try {
                            const result = onRejected(_this.value);
                            _this._promiseResolutionProcedure(promise2, result, resolve, reject)
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject(value)
                    }
                })
            }
        })
    }
    _promiseResolutionProcedure(promise, result, resolve, reject) {
        const _this = this;
        // 2.3.1. 如果 promise 和 result 引用的是同一个对象，promise 将以一个 TypeError 作为 reason 来进行 reject。
        if (promise === result) return reject(new TypeError("Chaining cycle detected for promise"));
        // 2.3.2. 如果 result 是一个 promise，根据它的状态：
        if (result instanceof MyPromise) {
            if (result.status === PENDING) {
                result.then(value => {
                    _this._promiseResolutionProcedure(promise, value, resolve, reject);
                }, reject)
            } else if (result.status === FULFILLED) {
                resolve(result.value)
            } else if (result.status === REJECTED) {
                reject(result.value)
            }
            return;
        }
        if (result && (typeof result === 'object' || typeof result === 'function')) {
            let isCalled = false;
            try {
                const then = result.then;
                if (typeof then === 'function') {
                    then.call(result, (res) => {
                        if (isCalled) return;
                        isCalled = true;
                        return _this._promiseResolutionProcedure(promise, res, resolve, reject);
                    }, (err) => {
                        if (isCalled) return;
                        isCalled = true;
                        return reject(err);
                    })
                } else {
                    resolve(result)
                }
            } catch (err) {
                if (isCalled) return;
                isCalled = true;
                reject(err)
            }
        } else {
            resolve(result)
        }
    }
    static all(promises) {
        return new MyPromise((reslove, reject) => {
            const length = promises.length;
            const result = [];
            let count = 0;


            promises.forEach((item, index) => {
                MyPromise.resolve(item).then(res => {
                    count++;

                    result[index] = res;
                    if (count === length) reslove(result);
                }, err => {
                    reject(err);
                })

            })
        })
    }
    static resolve(value) {
        if (value && typeof value === 'object' && (value instanceof MyPromise)) {
            return value
        }
        // 否则其他情况一律再通过Promise包装一下
        return new MyPromise((resolve) => {
            resolve(value)
        })
    }
    static reject(value) {
        return new MyPromise((_, reject) => {
            reject(value)
        })
    }
}
Promise.all = (promises) => {
    return new Promise((reslove, reject) => {
        const len = promises.length;
        let count = 0;
        const result = [];
        if (!len) reslove([])
        len && promises.forEach((item, index) => {
            Promise.resolve(item).then(res => {
                count++;
                result[index] = res
                if (count === len) reslove(result);
            }).catch(err => {
                reject(err);
            })
        })
    })
}
MyPromise.deferred = function () {
    const defer = {}
    defer.promise = new MyPromise((resolve, reject) => {
        defer.resolve = resolve
        defer.reject = reject
    })
    return defer
}

try {
    module.exports = MyPromise
} catch (e) {
    console.log("测试出错")
}

