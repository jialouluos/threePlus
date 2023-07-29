# Promise简易实现

本版本采用setTimeout(宏任务)模拟微任务来实现，关于微任务和宏任务的区别和机制在我异步那一篇记录过，这一篇记录的是异步中Promise的简易实现，主要包括了，then的链式调用，以及Promise.all()的实现.

```js
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
```

 ## 代码解析

### 代码解析一

```js
if (value instanceof MyPromise) return value.then(resolve, rejecte);
```

+   这里的`resolve`和`reject`传入的是自身的函数地址(即属于当前`this`)，他将会在`value`这个**Promise**状态改变时，在回调数组(`value`存在异步，即在处理`setTimeout`**宏任务**之时状态仍处于**PENDING**，该回调数组指的是`value`的回调数组)或者回调函数(在处理`setTimeout`**宏任务**之前状态已经改变)中被再次执行，其中被执行的函数(数组对应`callback`，回调函数对应`onFulfilled`)的形参是`value`这个**Promise**的`value`值

### 代码解析二

```js
const fulfilled = () => {
    try {
        let result = onFulfilled(_this.value);//承前
        return result = result instanceof MyPromise ? result.then(res, rej) : res(result);//启后
    } catch (err) {
        rej(err);
    }
}
```

+   首先，Promise的then方法返回的是一个Promise对象，也正因为如此，链式调用才可以实现，我们最开始写的MyPromise的then方法并没有返回MyPromise对象，所以不能够实现链式调用

+   所以，我们将then方法进行了进一步修改，让then方法直接返回一个MyPromise对象，然后再这个对象里再来处理then方法里面的内容

+   返回的这个Promise对象，构建了两个方法，解析其中一个，另一个原理一样，对于fulfilled方法来说它具备了承前启后的作用

    +   承前：当前面的一个 `promise` 完成后，调用其 `resolve` 变更状态，在这个 `resolve` 里会依次调用 `callbacks` 里的回调，这样就执行了 `then` 里的方法了，通俗一点来说就是返回一个新的**Promise**，这个Promise的构造函数里，存在着一个异步任务(宏)

        ```js
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
        ```

        这样做的好处是在链式调用的时候 `promise.then().then().then()`。能保证所有`then`执行完毕后，任务队列中是按顺序依次处理每个`then`里面的内容，保证了**前一个`then`处理完毕再处理后一个`then`的需求**,当前面一个MyPromise状态确定了的时候，如果是存在异步，会等待异步完成之后通过调用resolve里面的回调来进一步调用`onFulfilled(_this.value)`来执行自己then里面的回调，如果不存在异步，会在seTtimeout里面的代码执行时(这时状态已更改，因为是主线程直接调用的resolve，没有被压入过任务队列，会比settimeout快一步执行)直接执行then里面的回调，这就是承前，主要保证自身的then得到调用，同时也可以将值进行传递给最外层的MyPromise

    +   启后：如果存在一种情况：`promise.then(res=>{return new MyPromise((res,rej)=>{res(2)})}).then(res=>console.log(res))`,即then的执行内容是返回一个MyPromise，如果这时候我们只去执行这个函数即`onFulfilled`这时候result就是这个MyPromise，此时存在两个问题。

        +   一：该MyPromise没有指令去运行then
        +   二：该MyPromise并没有更新到then方法执行完后的MyPromise(注意这里是then方法返回的，而不是方法里面返回的)上，【还需要注意then方法经过了一层MyPromise封装，而then方法里面的内容在这个封装之后的`fulfilled`里面运行，所以then方法里面的返回值其实是`fulfilled`的返回值，而不是then的返回值，then的返回值一直都是一个新的MyPromise】，这样的结果就是then方法里面的MyPromise实例上的value没有更新到then的返回值上，导致后面链式调用时，拿不到这个值

        针对这个两个问题，所以我们需要对这个result进行进一步处理

        +   如果result是MyPromise【2】则调用result的then并将两个参数设置为新的MyPromise【1】(即then方法返回的那个MyPromise)的resolve和reject，这样在后面触发新的MyPromise【3】(result调用了then所以有新的MyPromise)中的setTimeout运行里面的代码时就可以更新MyPromise【1】的值（由MyPromise【3】中注册了的setTimeout(这个setTimeout是为MyPromise【2】服务的)来执行(由于前面result已经更改了状态，因为直接是`res(2)`不存在异步，所以不是通过回调数组执行而是直接通过方法`fulfilled`来执行,具体更新值的代码是承前那一行代码，后面MyPromise【2】中启后的那一行代码更新的是MyPromise【3】本身的值，为undefined，因为承前那一行运行之后这个时候不存在返回值),只是更新值，其他不变
        +   如果result是一个值，那就直接更新到then的返回MyPromise【1】上(即调用MyPromise【1】的resolve(result))比如`.then(res=> {return 10000;}).then(res=>console.log(res))`,只是更新值，其他不变

+   连续多个 `then` 里的回调方法是同步注册的，但注册到了不同的 `callbacks` 数组中，因为每次 `then` 都返回新的 `promise` 实例

+   注册完成后开始执行构造函数中的异步事件，异步完成之后依次调用 `callbacks` 数组中提前注册的回调

### 参考链接

[万字长文，重学JavaScript异步编程](https://juejin.cn/post/6995357238277701668#heading-32)

[图解 Promise 实现原理](https://zhuanlan.zhihu.com/p/58428287)

[详细的Promise源码实现](https://juejin.cn/post/6860037916622913550)
