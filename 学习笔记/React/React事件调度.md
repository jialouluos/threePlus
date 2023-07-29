# React事件调度

## 前言

对于大型的React应用，会存在一次更新，递归遍历大量的虚拟DOM，占用js线程，造成浏览器没有时间去做一些动画效果，随着项目越来越大，这种现象会越明显。为了解决这个难题，React将更新交给浏览器自己控制，在空闲的时候再来进行相关的更新任务，调度(Scheduler)便是具体的实现方式

## 时间分片

在浏览器一帧中，首先进行事件的处理例如用户的点击、输入事件，接着处理一些定时器和执行js代码，再然后调用requestAnimation ，Layout、Paint。在一帧执行后，如果没有其他的事件，那么浏览器就会进入休息，这时候就可以进行React更新

时间片规定的是单个任务在这一帧内最大的执行时间，任务一旦执行时间超过时间片，则会被打断，有节制地执行任务。这样可以保证页面不会因为任务连续执行的时间过长而产生卡顿。

### requestIdleCallback

`requestIdleCallback`会在谷歌浏览器空闲时被调用`requestIdleCallback(callback,{ timeout })`，第二个参数是超时时间，如果浏览器长时间没有空闲时间，那么超过了这个时间，回调就会被强制执行

## 模拟requestIdleCallback

`requestIdleCallback`目前只有谷歌浏览器支持，为了兼容每一个浏览器，那么必须重新实现一个`requestIdleCallback`，对于这个`requestIdleCallback`,应当具备两个条件：

+   能够让出浏览器线程
+   一次事件循环只执行一次，执行完之后还会请求下一次执行

所以采用`宏任务`来进行模拟

#### setTimeout(fn,0)

该函数可以满足上诉的条件，但是对于`setTimeout`,其在递归执行时，间隔可能会发生一些偏差(4ms左右~6ms左右)，对于一帧的16ms(60帧)来说4ms的时间被浪费，这是很不值得的，所以setTimeout不是浏览器环境合适的选择，但是Scheduler区分了浏览器环境和非浏览器环境，为`requestHostCallback`做了两套不同的实现。在**非浏览器环境**下，不存在屏幕刷新率，没有帧的概念，也就不会有时间片，这与在浏览器环境下执行任务有本质区别，因为非浏览器环境基本不会有用户交互，所以该场景下不判断任务执行时间是否超出了时间片限制，所以可以**采用setTimeout实现**。

#### MessageChannel

MessageChannel 接口允许开发者创建一个新的消息通道，并通过它的两个 MessagePort 属性发送数据。

-   MessageChannel.port1 只读返回 channel 的 port1 。
-   MessageChannel.port2 只读返回 channel 的 port2 。

举例:

```js
let scheduledHostCallback = null ;
const test =()=>{
    console.log("我是消息")
}
const message = new MessageChannel();
const port = message.port2;
message.port1.onmessage  = () =>{
    scheduledHostCallback();
    scheduledHostCallback = null;
}
const send = (callback) => {
    scheduledHostCallback = callback;
    port.postMessage(null);
};
send(test);
```

在源码中的体现:

```js
let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  // Node.js and old IE.
  // There's a few reasons for why we prefer setImmediate.
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
} else if (typeof MessageChannel !== 'undefined') {
  // DOM and Worker environments.
  // We prefer MessageChannel because of the 4ms setTimeout clamping.
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {//该函数会随着游览器环境不同而绑定不同的函数，它起着触发的作用
    port.postMessage(null);
  };
} else {
  // We should only fallback here in non-browser environments.
  schedulePerformWorkUntilDeadline = () => {
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}
```

## 任务优先级

任务优先级让任务按照自身的紧急程度排序，这样可以让优先级最高的任务最先被执行到。

React 为了防止 requestIdleCallback 中的任务由于浏览器没有空闲时间而卡死，所以设置了 5 个优先级。对于不同的任务，Scheduler给出了不同的优先级

```javascript
export const NoPriority = 0; // 没有任何优先级
export const ImmediatePriority = 1; // 立即执行的优先级，级别最高 Immediate -1 需要立刻执行。
export const UserBlockingPriority = 2; // 用户阻塞级别的优先级 UserBlocking 250ms 超时时间250ms，一般指的是用户交互。
export const NormalPriority = 3; // 正常的优先级 Normal 5000ms 超时时间5s，不需要直观立即变化的任务，比如网络请求。
export const LowPriority = 4; // 较低的优先级 Low 10000ms 超时时间10s，肯定要执行的任务，但是可以放在最后处理。
export const IdlePriority = 5; // 优先级最低，表示任务可以闲置 Idle 一些没有必要的任务，可能不会执行。
```

## 流程概述

*Scheduler要实现这样的调度效果需要两个角色：**任务的调度者、任务的执行者**。调度者调度一个执行者，执行者去循环taskQueue，逐个执行任务。当某个任务的执行时间比较长，执行者会根据时间片中断任务执行，然后告诉调度者：我现在正执行的这个任务被中断了，还有一部分没完成，但现在必须让位给更重要的事情，你再调度一个执行者吧，好让这个任务能在之后被继续执行完（任务的恢复）。于是，调度者知道了任务还没完成，需要继续做，它会再调度一个执行者去继续完成这个任务。
通过执行者和调度者的配合，可以实现任务的中断和恢复。*

React 发生一次更新，会统一走 ensureRootIsScheduled（调度应用）。

-   对于正常更新会走 performSyncWorkOnRoot 逻辑，最后会走 `workLoopSync` 。

-   对于低优先级的异步更新会走 performConcurrentWorkOnRoot 逻辑，最后会走 `workLoopConcurrent` 。

    ```js
    function workLoopSync() {
      // Already timed out, so perform work without checking if we need to yield.
      while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
      }
    }
    function workLoopConcurrent() {
      // Perform work until Scheduler asks us to yield
      while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
      }
    }
    ```

    *在一次更新调度过程中，workLoop 会更新执行每一个待更新的 fiber 。他们的区别就是异步模式会调用一个 shouldYield() ，如果当前浏览器没有空余时间， shouldYield 会中止循环，直到浏览器有空闲时间后再继续遍历，从而达到终止渲染的目的。这样就解决了一次性遍历大量的 fiber ，导致浏览器没有时间执行一些渲染任务，导致了页面卡顿。*

## React与Scheduler的连接

*Scheduler帮助React调度各种任务，但是本质上它们是两个完全不耦合的东西，二者各自都有自己的优先级机制，那么这时就需要有一个中间角色将它们连接起来。*

*实际上，在react-reconciler中提供了这样一个文件专门去做这样的工作，它就是`SchedulerWithReactIntegration.old(new).js`。它将二者的优先级翻译了一下，让React和Scheduler能读懂对方。另外，封装了一些Scheduler中的函数供React使用。*

*在执行React任务的重要文件`ReactFiberWorkLoop.js`中，关于Scheduler的内容都是从`SchedulerWithReactIntegration.old(new).js`导入的。它可以理解成是React和Scheduler之间的桥梁。*

## 调度入口scheduleCallback

无论是上述正常更新任务 `workLoopSync` 还是低优先级的任务 `workLoopConcurrent` ，都是由调度器 `scheduleCallback` 统一调度。React中通过下面的代码，让fiber树的构建任务进入调度流程：

```javascript
scheduleCallback(
  schedulerPriorityLevel,
  performConcurrentWorkOnRoot.bind(null, root),
);
```

对于正常更新的任务

```js
scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);
```

对于异步任务,其中schedulerPriorityLevel就是其对于的优先级(超时等级)

```jsx
newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root),
);
```

### scheduleCallback做了什么

-   `taskQueue`，里面存的都是过期的任务，依据任务的过期时间( `expirationTime` ) 排序，需要在调度的 `workLoop` 中循环执行完这些任务。
-   `timerQueue` 里面存的都是没有过期的任务，依据任务的开始时间( `startTime` )排序，在调度 workLoop 中 会用`advanceTimers`检查任务是否过期，如果过期了，放入 `taskQueue` 队列。
-   如果任务过期，并且没有调度中的任务，那么调度 requestHostCallback。本质上调度的是 flushWork。
-    用 requestHostTimeout 让一个未过期的任务能够到达恰好过期的状态， 那么需要延迟 startTime - currentTime 毫秒就可以了。requestHostTimeout 就是通过 setTimeout 来进行延时指定时间的。

```jsx
function unstable_scheduleCallback(priorityLevel, callback, options) {
  var startTime;//当前时间
  var timeout;//根据优先度计算而来
  var expirationTime = startTime + timeout;//超过时间

  var newTask = {
    id: taskIdCounter++,
    callback,//任务函数
    priorityLevel,//任务优先级
    startTime,//开始时间
    expirationTime,//任务过期时间
    sortIndex: -1,//排序依据
  };
  if (startTime > currentTime) {//说明是一个未过期任务
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
      //如果taskQueue中没有任务并且当前新建的任务是timerQueue最靠前的任务
      //那么需要检查timerQueue中有没有需要放到taskQueue中的任务，这一步通过调用
      // requestHostTimeout实现
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
     
      if (isHostTimeoutScheduled) {
        //取消掉已经存在的调度
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
        /**
        requestHostTimeout = function (cb, ms) {
			_timeoutID = setTimeout(cb, ms);
		};
		cancelHostTimeout = function () {
			clearTimeout(_timeoutID);
		};
        * */
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }
  return newTask;
}
```

```js
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);//调用advanceTimers，检查timerQueue队列中过期的任务，放到taskQueue中。
    //检查是否已经开始调度，如尚未调度，检查taskQueue中是否已经有任务
    //如果有，而且现在是空闲的，说明之前的advanceTimers已经将过期任务放到了taskQueue，那么现在立即开始调度，执行任务
	//如果没有，而且现在是空闲的，说明之前的advanceTimers并没有检查到timerQueue中有过期任务，那么再次调用requestHostTimeout重复这一过程。
    //总之，要把timerQueue中的任务全部都转移到taskQueue中执行掉才行。
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```

## requestHostCallback(flushWork)

Scheduler通过调用`requestHostCallback`让任务进入调度流程

```js
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();//这里的schedulePerformWorkUntilDeadline，在MessageChannel在源码中的体现里被赋值，这里相当于发送一个消息，让channel.port1的监听函数performWorkUntilDeadline得以执行，erformWorkUntilDeadline内部会执行掉scheduledHostCallback，最后taskQueue被清空。
     //这个回调将会被执行 channel.port1.onmessage = performWorkUntilDeadline;
  }
}
```

## 任务执行-performWorkUntilDeadline

`scheduledHostCallback`就是`flushWork`

`flushWork`作为真正的执行函数，他会去循环taskQueue，逐一调用里面的任务函数

```js
const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    const hasTimeRemaining = true;
       // hasTimeRemaining表示任务是否还有剩余时间
       // 它和时间片一起限制任务的执行。如果没有时间，
      // 或者任务的执行时间超出时间片限制了，那么中断任务。
      // 它的默认为true，表示一直有剩余时间
      // 因为MessageChannel的port在postMessage，
      // 是比setTimeout还靠前执行的宏任务，这意味着
      // 在这一帧开始时，总是会有剩余时间
      // 所以现在中断任务只看时间片的了
    let hasMoreWork = true;
    try {
        //当任务因为时间片的原因被打断，则返回true表示任务被中断，还需要调度者再调度一个执行者来继续执行
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();//这里可以再次发起调度
      } else {
          //这里表示 本次任务执行完毕
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  needsPaint = false;
};
```

## flushWork
```js
function flushWork(hasTimeRemaining, initialTime) {
    ...
    isHostCallbackScheduled = false;
    if (isHostTimeoutScheduled) {
      //flushWork 如果有延时任务执行的话，那么会先暂停延时任务，然后调用 workLoop ，去真正执行超时的更新任务。
        isHostTimeoutScheduled = false;
        cancelHostTimeout();
    }
    return workLoop(hasTimeRemaining, initialTime);//这里将workloop的返回值返回,那么workLoop里面便是真正在执行函数
	...
}
```

## 任务中断和恢复-workLoop

`workLoop`作为实际执行任务的函数，它做的事情肯定与任务的中断恢复有关，**若任务函数返回值为函数，那么就说明当前任务尚未完成，需要继续调用任务函数，否则任务完成**。`workLoop`就是通过这样的办法**判断单个任务的完成状态**。

```js
function workLoop(hasTimeRemaining, initialTime) {
    let currentTime = initialTime;
    advanceTimers(currentTime);//调用advanceTimers，检查timerQueue队列中过期的任务，放到taskQueue中。
    currentTask = peek(taskQueue);//取出第一个任务
    while (currentTask !== null &&!(enableSchedulerDebugging && isSchedulerPaused)) {
        if (currentTask.expirationTime > currentTime &&(!hasTimeRemaining || shouldYieldToHost())) {
            //shouldYieldToHost()  根据时间片去限制任务执行
            // break掉while循环(中断的核心)
            break;
        }
        const callback = currentTask.callback;//得到实际执行的函数
        if (typeof callback === 'function') {
            currentTask.callback = null;
            currentPriorityLevel = currentTask.priorityLevel;
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            if (enableProfiling) {
                markTaskRun(currentTask, currentTime);
            }
            const continuationCallback = callback(didUserCallbackTimeout);//执行的返回值如果是一个函数则表明任务还未执行完毕，如果不为函数，则表明执行完毕
            currentTime = getCurrentTime();
            if (typeof continuationCallback === 'function') {
                currentTask.callback = continuationCallback;//改变callback ，让其指向最新的返回值(函数),便于任务恢复继续执行
            }
            else {
                if (currentTask === peek(taskQueue)) {
                    pop(taskQueue);//表明是最后一个
                }
            }
            advanceTimers(currentTime);//调用advanceTimers，检查timerQueue队列中过期的任务，放到taskQueue中。
        } else {
            pop(taskQueue);//如果callback为null，将任务出队
        }
        currentTask = peek(taskQueue);//取出下一个任务，如果执行完毕，则获取到null
    }
    if (currentTask !== null) {
        // 如果currentTask不为空，说明是时间片的限制导致了任务中断
        // return 一个 true告诉外部，此时任务还未执行完，还有任务，
        return true;
    } else {
        //如果currentTask为空，说明taskQueue队列中的任务已经都
        // 执行完了，然后从timerQueue中找任务，调用requestHostTimeout
        // 去把task放到taskQueue中，到时会再次发起调度，但是这次，
        // 会先return false，告诉外部当前的taskQueue已经清空，
        // 先停止执行任务，也就是终止任务调度
        const firstTimer = peek(timerQueue);
        if (firstTimer !== null) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
        return false;
    }
}
```

## 取消调度

取消调度的关键就是将当前这个任务的callback设置为null。在workLoop中，如果callback是null会被移出taskQueue，所以当前的这个任务就不会再被执行了。它取消的是当前任务的执行，while循环还会继续执行下一个任务。

当一个更新任务正在进行的时候，突然有高优先级任务进来了，那么就要取消掉这个正在进行的任务

```js
function unstable_cancelCallback(task) {
    task.callback = null;
}
```

## 总结

事件调度采用Scheduler去依照优先级实现多任务管理，用时间分片的方式来优化任务的执行。采用`MessageChannel`来实现模拟`requestIdleCallback`

利用两个任务栈来实现超时任务和未超时任务的区分，对于未超时任务来说利用一个延时函数去实现未超时到超时的转换，对于超时任务来说，会调度 requestHostCallback。本质上调度的是 flushWork。flushWork会调用workLoop 去依次更新过期任务队列中的任务。

对于任务栈来说，函数内部通过函数执行的返回值来判断超时任务栈是否执行完毕。如果在执行单个任务时由于时间片的原因中断，则会返回false，以便于再次调度。

而对于任务栈的单个任务来说，当开始调度后，调度者调度执行者去执行任务，实际上是执行任务上的callback（也就是任务函数）。如果执行者判断callback返回值为一个function，说明未完成，那么会将返回的这个function再次赋值给任务的callback，由于任务还未完成，所以并不会被剔除出taskQueue，currentTask获取到的还是它，while循环到下一次还是会继续执行这个任务，直到任务完成出队，才会继续下一个。

## 参考链接

[掘金小册](https://juejin.cn/book/6945998773818490884/section/6959910023174717471)
[一篇长文帮你彻底搞懂React的调度机制原理](https://segmentfault.com/a/1190000039101758)
