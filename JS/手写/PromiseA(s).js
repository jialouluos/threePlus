/**
 * @2.1 Promise的状态,Promise 必须处于以下三种状态之一:pending,fulfilled,rejected
 *
 * @2.1.1 当一个Promise处于等待(pending)状态时:
 * @2.1.1.1 可以变为解决(fulfilled)或者拒绝(rejected)状态
 *
 * @2.1.2 当一个Promise处于解决状态时:
 * @2.1.2.1 一定不能转变为其他状态
 * @2.1.2.2 一定有一个不能改变的值(这里应该指值的引用,即意味着深度可变性)
 *
 * @2.1.3 当一个Promise处于拒绝状态时:
 * @2.1.3.1 一定不能转变为其他状态
 * @2.1.3.2 一定有一个不能改变的值(这里应该指值的引用,即意味着深度可变性)
 */
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
class MyPromise {
    constructor(executor) {
        this.status = PENDING;//状态
        this.value = null;//值
        this.onFulfilledCallbackQueue = [];//fulfilled队列
        this.onRejectedCallbackQueue = [];//rejected队列

        const reslove = (value) => {
            if (this.status !== PENDING) return;
            queueMicrotask(() => {
                if (value instanceof MyPromise && typeof value.then === "function") {
                    value.then((y) => {
                        reslove(y)
                    }, r => reject(r))
                }
                this.status = FULFILLED;
                this.value = value;
                this.onFulfilledCallbackQueue.forEach(callback => {
                    callback(this.value);
                })
            })
        }
        const reject = (value) => {
            if (this.status !== PENDING) return;
            queueMicrotask(() => {
                this.status = REJECTED;
                this.value = value;
                this.onRejectedCallbackQueue.forEach(callback => {
                    callback(this.value);
                })
            })
        }
        try {
            executor(reslove, reject);
        } catch (err) {
            reject(err)
        }
    }
    reslove(value) {
        if (this.status !== PENDING) return;
        queueMicrotask(() => {
            if (value instanceof MyPromise && typeof value.then === "function") {
                value.then((y) => {
                    reslove(y)
                }, r => reject(r))
            }
            this.status = FULFILLED;
            this.value = value;
            this.onFulfilledCallbackQueue.forEach(callback => {
                callback(this.value);
            })
        })
    }
    /**
     * @2.2 then 方法
     * @Promise必须提供一个then方法来访问当前或最终的值或原因。
     * @Promise的then方法接受俩个参数：onFulfilled、onRejected
     *
     * @2.2.7 then必须返回一个promise [3.3]
     * @2.2.7.1 如果onFulfilled或onRjected返回一个值x，运行promise解决程序[[Resolve]](promise2,x)
     * @2.2.7.2 如果onFulfilled或onRejected抛出一个异常e，promise2必须用e作为原因被拒绝
     * @2.2.7.3 如果onFulfilled不是一个函数并且promise1被解决，promise2必须用与promise1相同的值被解决
     * @2.2.7.4 如果onRejected不是一个函数并且promise1被拒绝，promise2必须用与promise1相同的原因被拒绝
     */

    then(onFulfilled, onRejected) {
        //?由2.2.1和2.2.5知道我们需要对这两个可选参数做一些处理
        //?当两个参数不为函数时。我们必须忽略，但是两个参数又一定会被作为函数所调用，所以遇到不是函数的时候，我们给与他一个缺省函数，对于fulfilled，让他返回value,对于rejected，让他抛出错误
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value
        onRejected = typeof onRejected === "function" ? onRejected : value => { throw value }
        //!根据2.2.7规则,then返回一个Promise,所以在运用2.2.7规则之后我们的then需要大改一下
        let promise2;
        return promise2 = new MyPromise((reslove, reject) => {
            const handlerFulfilledCallback = () => {
                queueMicrotask(() => {
                    try {
                        let x = onFulfilled(this.value);
                        //@2.2.7.1 如果onFulfilled或onRjected返回一个值x，运行promise解决程序[[Resolve]](promise2,x)
                        //@规范 2.2.7.3 和 规范 2.2.7.4描述的 onFullfilled 和 onRejected 不为函数的情况我们在 then 方法的开头已经处理了(返回value)，所以可以并入 规范 2.2.7.1 中处理
                        this.promiseresolve(promise2, x, reslove, reject);
                    } catch (e) {
                        //@2.2.7.2 如果onFulfilled或onRejected抛出一个异常e，promise2必须用e作为原因被拒绝
                        reject(e)
                    }
                })
            }
            const handlerRejectedCallback = () => {
                queueMicrotask(() => {
                    try {
                        let x = onRejected(this.value);
                        //@2.2.7.1 如果onFulfilled或onRjected返回一个值x，运行promise解决程序[[Resolve]](promise2,x)
                        //@规范 2.2.7.3 和 规范 2.2.7.4描述的 onFullfilled 和 onRejected 不为函数的情况我们在 then 方法的开头已经处理了(返回value)，所以可以并入 规范 2.2.7.1 中处理
                        this.promiseresolve(promise2, x, reslove, reject);
                    } catch (e) {
                        //@2.2.7.2 如果onFulfilled或onRejected抛出一个异常e，promise2必须用e作为原因被拒绝
                        reject(e)
                    }
                })

            }
            if (this.status === FULFILLED) {
                handlerFulfilledCallback();
            }
            if (this.status === REJECTED) {
                handlerRejectedCallback()
            }
            if (this.status === PENDING) {
                this.onFulfilledCallbackQueue.push(handlerFulfilledCallback);
                this.onRejectedCallbackQueue.push(handlerRejectedCallback);
            }
        });

    }
    /**
     * @2.3 Promise解决程序
     *
     * @2.3.1 如果promise和x引用同一个对象，用一个TypeError作为原因来拒绝promise
     *
     * @2.3.2 如果x是一个promise，采用它的状态：[3.4]
     * @2.3.2.1 如果x是等待态，promise必须保持等待状态，直到x被解决或拒绝
     * @2.3.2.2 如果x是解决态，用相同的值解决promise
     * @2.3.2.3 如果x是拒绝态，用相同的原因拒绝promise
     *
     * @2.3.3 否则，如果x是一个对象或函数
     * @2.3.3.1 让then成为x.then。[3.5]
     * @2.3.3.2 如果检索属性x.then导致抛出了一个异常e，用e作为原因拒绝promise
     * @2.3.3.3 如果then是一个函数，用x作为this调用它。then方法的参数为俩个回调函数，第一个参数叫做resolvePromise，第二个参数叫做rejectPromise：
     *
     * @2.3.3.3.1 如果resolvePromise用一个值y调用，运行[[Resolve]](promise, y)。译者注：这里再次调用[[Resolve]](promise,y)，因为y可能还是promise
     * @2.3.3.3.2 如果rejectPromise用一个原因r调用，用r拒绝promise。译者注：这里如果r为promise的话，依旧会直接reject，拒绝的原因就是promise。并不会等到promise被解决或拒绝
     * @2.3.3.3.3 如果resolvePromise和rejectPromise都被调用，或者对同一个参数进行多次调用，那么第一次调用优先，以后的调用都会被忽略。译者注：这里主要针对thenable，promise的状态一旦更改就不会再改变。
     * @2.3.3.3.4 如果调用then抛出了一个异常e:
     * @2.3.3.4.1 如果resolvePromise或rejectPromise已经被调用，忽略它
     * @2.3.3.4.2 否则，用e作为原因拒绝promise
     *
     * @2.3.3.4 如果then不是一个函数，用x解决promise
     *
     * @2.3.4 如果x不是一个对象或函数，用x解决promise
     */
    promiseresolve(then_promise, x, resolve, reject) {
        //@2.3.1 如果promise和x引用同一个对象，用一个TypeError作为原因来拒绝promise(避免造成循环引用)
        const _this = this;
        if (x === then_promise) return reject(new TypeError("Chaining cycle detected for promise"));
        //@2.3.2 如果x是一个promise，采用它的状态：[3.4]
        else if (x instanceof MyPromise) {
            //@2.3.2.1 如果x是等待态，promise必须保持等待状态，直到x被解决或拒绝
            if (x.status === PENDING) {
                x.then((y) => {
                    //! resolve(y) //y可能还是一个Promise
                    _this.promiseresolve(then_promise, y, resolve, reject);
                }, reject)
            }
            //@2.3.2.2 如果x是解决态，用相同的值解决promise
            else if (x.status === FULFILLED) {
                resolve(x.value)
            }
            //@2.3.2.3 如果x是拒绝态，用相同的原因拒绝promise
            else if (x.status === REJECTED) {
                reject(x.value)
            }
            return;
        }
        //@2.3.3 否则，如果x是一个对象或函数
        if (x && (typeof x === 'object' || typeof x === 'function')) {
            //@合并理解规范 2.3.3.3.3 和 2.3.3.3.4，我们还需要加一个参数来判断 resolvePromise 和 rejectPromise 是否被调用，如果已经被调用，需要以第一次调用为准，后续的调用要被忽略。
            let hasCalled = false;
            try {
                //@2.3.3.1 让then成为x.then。[3.5]
                const then = x.then;
                //@2.3.3.3 如果then是一个函数，用x作为this调用它。then方法的参数为俩个回调函数，第一个参数叫做resolvePromise，第二个参数叫做rejectPromise：
                if (typeof then === 'function') {
                    then.call(x, y => {
                        //@2.3.3.3.1 如果resolvePromise用一个值y调用，运行[[Resolve]](promise, y)。这里再次调用[[Resolve]](promise,y)，因为y可能还是promise
                        if (hasCalled) return;
                        hasCalled = true;
                        _this.promiseresolve(then_promise, y, resolve, reject);
                    }, r => {
                        //@2.3.3.3.2 如果rejectPromise用一个原因r调用，用r拒绝promise。译者注：这里如果r为promise的话，依旧会直接reject，拒绝的原因就是promise。并不会等到promise被解决或拒绝
                        if (hasCalled) return;
                        hasCalled = true;
                        reject(r)
                    })
                } else {
                    // @2.3.3.4 如果then不是一个函数，用x解决promise
                    resolve(x)
                }
            } catch (e) {
                // @2.3.3.2 如果检索属性x.then导致抛出了一个异常e，用e作为原因拒绝promise
                // @2.3.3.3.4 如果调用then抛出了一个异常e:
                // @2.3.3.4.1 如果resolvePromise或rejectPromise已经被调用，忽略它
                if (hasCalled) return;
                hasCalled = true;
                // @2.3.3.4.2 否则，用e作为原因拒绝promise
                reject(e);
            }
        } else {
            //@2.3.4 如果x不是一个对象或函数，用x解决promise
            resolve(x)
        }
    }
    /**
     * @2.2 then 方法
     * @Promise必须提供一个then方法来访问当前或最终的值或原因。
     * @Promise的then方法接受俩个参数：onFulfilled、onRejected
     *
     * @2.2.1 onFulfilled和onRejected都是可选的参数
     * @2.2.1.1. 如果onFulfilled不是一个函数，它必须被忽略
     * @2.2.1.2. 如果onRejected不是一个函数，它必须被忽略
     *
     * @2.2.2 如果onFulfilled是一个函数
     * @2.2.2.1 它必须在promise被解决后调用，promise的值作为它的第一个参数。
     * @2.2.2.2 它一定不能在promise被解决前调用。
     * @2.2.2.3 它一定不能被调用多次。
     *
     * @2.2.3 如果onRejected是一个函数
     * @2.2.3.1 它必须在promise被拒绝之后调用，用promise的原因作为它的第一个参数。
     * @2.2.3.2 它一定不能在promise被拒绝之前调用。
     * @2.2.3.3 它一定不能被调用多次。
     *
     * @2.2.4 在执行上下文栈中只包含平台代码之前，onFulfilled或onRejected一定不能被调用 [3.1]
     *
     * @2.2.5 onFulfilled和onRejected一定被作为函数调用(没有this值)
     *
     * @2.2.6 同一个promise上的then可能被调用多次(这里指代链式调用)
     * @2.2.6.1 如果promise被解决，所有相应的onFulfilled回调必须按照他们原始调用then的顺序执行
     * @2.2.6.2 如果promise被拒绝，所有相应的onRejected回调必须按照他们原始调用then的顺序执行
     */
    //@2.2.7之前的then
    _2_2_7_before_then(onFulfilled, onRejected) {
        //?由2.2.1和2.2.5知道我们需要对这两个可选参数做一些处理
        //?当两个参数不为函数时。我们必须忽略，但是两个参数又一定会被作为函数所调用，所以遇到不是函数的时候，我们给与他一个缺省函数，对于fulfilled，让他返回value,对于rejected，让他抛出错误
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value
        onRejected = typeof onRejected === "function" ? onRejected : value => { throw value }
        //?接下来进行状态的判断
        //!如果当前状态为FULFILLED,则表示处于解决状态,根据2.2.2规则有:
        if (this.status === FULFILLED) {
            queueMicrotask(() => {
                onFulfilled(this.value);
            })
        }
        //!如果当前状态为REJECTED,则表示处于拒绝状态,根据2.2.3规则有:
        if (this.status === REJECTED) {
            queueMicrotask(() => {
                onRejected(this.value);
            })
        }
        //!根据2.2.4规则，在执行上下文栈中只包含平台代码之前，两个函数不能被执行，“平台代码”意味着引擎、环境以及promise的实现代码，简单来说，就是需要函数在本轮事件循环完成之后的下一轮中才能执行，可以选用宏任务(SetTimeout)进行模拟，这里选择一种新的方式-微任务(queueMicrotask)来实现，更符合Promise的实际运行规则
        //!根据2.2.6规则来说，如果发生了多次调用then的情况，我们的预期是让他按照调用的顺序执行，那么队列可以实现我们的需求，所以当状态处于等待时，将onFulfilled, onRejected分别加入执行队列中。这样待状态被改变后，可以使执行的顺序和我们预期一致
        if (this.status === PENDING) {
            this.onFulfilledCallbackQueue.push(() => queueMicrotask(() => onFulfilled(this.value)));
            this.onRejectedCallbackQueue.push(() => queueMicrotask(() => onRejected(this.value)))
        }
    }
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