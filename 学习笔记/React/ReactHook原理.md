

# HOOK



## Hook链表

无论是初次挂载还是更新的时候，每调用一次hook函数，便会生成一个hook对象，产生的hook对象有序依次地存入一条hook链中，由fiber.memoizedState保存，另外还有着一个指针**`workInProgressHook`**去指向当前需要挂载或者更新的hook对象，这样就可以得到hook的调用情况，每调用一次hook函数，就将这个指针的指向移到该hook函数产生的hook对象上。不同 hooks 保存的形式不同。每一个 hooks 通过 next 链表建立起关系。

```js
{
    baseQueue: null,
    baseState: 'hook1',
    memoizedState: null,
    queue: null,
    next: {
        baseQueue: null,
        baseState: null,
        memoizedState: 'hook2',
        next: null
        queue: null
    }
}
```

假设在一个组件中这么写

```js
export default function Index(){
    const [ number,setNumber ] = React.useState(0) // 第一个hooks
    const [ num, setNum ] = React.useState(1)      // 第二个hooks
    const dom = React.useRef(null)                 // 第三个hooks
    React.useEffect(()=>{                          // 第四个hooks
        console.log(dom.current)
    },[])
    return <div ref={dom} >
        <div onClick={()=> setNumber(number + 1 ) } > { number } </div>
        <div onClick={()=> setNum(num + 1) } > { num }</div>
    </div>
}
```

最后在 fiber 上的结构会变成这样。

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b589f284235c477e9e987460862cc5ef~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

## hooks 为什么要通常放在顶部，hooks 不能写在 if 条件语句中

因为在更新过程中，如果通过 if 条件语句，增加或者删除 hooks，在复用 hooks 过程中，会产生复用 hooks 状态和当前 hooks 不一致的问题。

将第一个 hooks 变成条件判断形式，具体如下：

```js
export default function Index({ showNumber }){
    let number, setNumber
    showNumber && ([ number,setNumber ] = React.useState(0)) // 第一个hooks
}
```

第一次渲染时候 `showNumber = true` 那么第一个 hooks 会渲染，第二次渲染时候，父组件将 showNumber 设置为 false ，那么第一个 hooks 将不执行，那么更新逻辑会变成这样。

| hook复用顺序   | 缓存的老hooks | 新的hooks |
| -------------- | ------------- | --------- |
| 第一次hook复用 | useState      | useState  |
| 第二次hook复用 | useState      | useRef    |



![hook3.jpeg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3a10b8466324fa89cf2bc5903b29618~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

第二次复用时候已经发现 hooks 类型不同 `useState !== useRef` ，那么已经直接报错了。所以开发的时候一定注意 hooks 顺序一致性。

## renderWithHooks

React中 所有的函数组件实际是在`renderWithHooks `被触发(执行)，在fiber调和过程中，如果遇到函数组件类型的fiber就会调用`updateFunctionComponent `去更新，在`updateFunctionComponent`内部便会调用`renderWithHooks`

初始挂载和更新时，所用的hooks函数是不同的，比如初次挂载时调用的useEffect，和后续更新时调用的useEffect，虽然都是同一个hook，但是因为在两个不同的渲染过程中调用它们，所以本质上他们两个是不一样的。

hooks 对象本质上是主要以三种处理策略存在 React 中：

-   1 `ContextOnlyDispatcher`： 第一种形态是防止开发者在函数组件外部调用 hooks ，所以第一种就是报错形态，只要开发者调用了这个形态下的 hooks ，就会抛出异常。
-   2 `HooksDispatcherOnMount`： 第二种形态是函数组件初始化 mount ，因为之前讲过 hooks 是函数组件和对应 fiber 桥梁，这个时候的 hooks 作用就是建立这个桥梁，初次建立其 hooks 与 fiber 之间的关系。
-   3 `HooksDispatcherOnUpdate`：第三种形态是函数组件的更新，既然与 fiber 之间的桥已经建好了，那么组件再更新，就需要 hooks 去获取或者更新维护状态。

```js
function renderWithHooks<Props, SecondArg>(current: Fiber | null,workInProgress: Fiber,Component: (p: Props, arg: SecondArg) => any,props: Props,secondArg: SecondArg,nextRenderLanes: Lanes,): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;//workInProgress 正在调和更新函数组件对应的 fiber 树。 每个hooks内部读取的当前fiber信息就是读取currentlyRenderingFiber 的内容。
  workInProgress.memoizedState = null;//memoizedState 保存 hooks 信息
  workInProgress.updateQueue = null;//存放每个 useEffect/useLayoutEffect 产生的副作用组成的链表。在 commit 阶段更新这些副作用。
  workInProgress.lanes = NoLanes;
  ReactCurrentDispatcher.current = current === null || current.memoizedState === null? 
  HooksDispatcherOnMount://初始化走这里
  HooksDispatcherOnUpdate;//更新走这里，这里也表明了在初始化和更新时虽然都是同一个hook，但是实际的走的流程是不一样的
    
  let children = Component(props, secondArg);//这个时候函数组件被真正的执行，里面每一个 hooks 也将依次执行。
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;//防止hooks在函数组件外部调用，调用直接报错。 
  //引用的 React hooks都是从 ReactCurrentDispatcher.current 中的， React 就是通过赋予 current 不同的 hooks 对象达到监控 hooks 是否在函数组件内部调用。
  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);
  workInProgressHook = null;
  return children;
}
```

## mountWorkInProgressHook(挂载时)

在fiber上创建hooks链表。挂载调用的是`mountWorkInProgressHook`，它会创建hook并将他们连接成链表，同时更新workInProgressHook，最终返回新创建的hook。

 > react-reconciler/src/ReactFiberHooks.js

```js
function mountWorkInProgressHook() {
 // 创建hook对象
  const hook: Hook = {
    memoizedState: null,// 当前需要保存的值
    baseState: null,
    baseQueue: null, // 由于之前某些高优先级任务导致更新中断，baseQueue 记录的就是尚未处理的最后一个 update
    queue: null,// 内部存储调用 setValue 产生的 update 更新信息，是个环状单向链表
    next: null,// 下一个hook
  };
  if (workInProgressHook === null) {
    // workInProgressHook为null说明此时还没有hooks链表，
    // 将新hook对象作为第一个元素挂载到fiber.memoizedState，
    // 并将workInProgressHook指向它。
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // workInProgressHook不为null说明已经有hooks链表，此时将
    // 新的hook对象连接到链表后边，并将workInProgressHook指向它。
    workInProgressHook = workInProgressHook.next = hook;
  }
  // 返回的workInProgressHook即为新创建的hook
  return workInProgressHook;
}
```

我们在组件中调用hook函数，就可以获取到hook对象，例如useState，具体实现如下：
```js
const HooksDispatcherOnMount: Dispatcher = {
  ...
  useState: mountState,
  ...
};
function mountState<S>(initialState: (() => S) | S,): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();//得到一个新的hook
  if (typeof initialState === 'function') {//传入参数如果为函数
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;//保存的状态
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,// update 形成的环状链表
    interleaved: null, // 存储最后的插入的 update 
    lanes: NoLanes,
    dispatch: null,// setValue 函数
    lastRenderedReducer: basicStateReducer,//上一次render时使用的reducer
    lastRenderedState: (initialState: any),// 上一次render时的state
  };
  hook.queue = queue;
  const dispatch: Dispatch<BasicStateAction<S>,> = (queue.dispatch = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,//这里因为传入了当前的fiber，所以当用户触发 setNumber 的时候，能够直观反映出来自哪个 fiber 的更新。
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```

### dispatchSetState(老版本叫dispatchAction)

```js
function dispatchSetState<S, A>(fiber: Fiber,queue: UpdateQueue<S, A>,action: A,) {
  const lane = requestUpdateLane(fiber);
  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };
 // 是否在渲染阶段更新
  if (isRenderPhaseUpdate(fiber)) {
      // 将 update 存到 queue.pending 当中
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    enqueueUpdate(fiber, queue, update, lane);
    const alternate = fiber.alternate;
    if (fiber.lanes === NoLanes &&(alternate === null || alternate.lanes === NoLanes)) {
      const lastRenderedReducer = queue.lastRenderedReducer;//如果存在上次render时使用的reducer
      if (lastRenderedReducer !== null) {
        try {
          const currentState: S = (queue.lastRenderedState: any);/* 这一次新的state */
          const eagerState = lastRenderedReducer(currentState, action);/* 上一次的state */
          update.hasEagerState = true;   
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {  /* 如果每一个都改变相同的state，那么组件不更新 */
            return;
          }
        }
      }
    }
    const eventTime = requestEventTime();
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);//调度更新
    if (root !== null) {
      entangleTransitionUpdate(root, queue, lane);
    }
  }
  markUpdateInDevTools(fiber, lane, action);
}
```

## updateWorkInProgressHook(更新)

在更新时实际上调用的是updateReducer

```js
const HooksDispatcherOnUpdate: Dispatcher = {
    ...
    useState: updateState,
    ...
};
function updateState<S>(
   initialState: (() => S) | S,): [S, Dispatch<BasicStateAction<S>>] {
    return updateReducer(basicStateReducer, (initialState: any));
}
```

在更新过程中，由于存在current树，所以workInProgress节点也就有对应的current节点。那么自然也会有两条hooks链表，分别存在于current和workInProgress节点的memorizedState属性上。鉴于此，更新过程的hooks链表构建需要另一个指针的参与：currentHook。它作为组件的workInProgressHook在上一次更新时对应的hook对象，新的hook对象可以基于它创建。另外，也可以获取到上次hook对象的一些数据，例如useEffect的前后依赖项比较，前一次的依赖项就可以通过它获得

```txt
                currentTree

       current.memoizedState = hookA -> hookB -> hookC
                                          ^             
                                      currentHook
                                          |
         workInProgress Tree              |
                                          |                                
workInProgress.memoizedState = hookA -> hookB
                                          ^          
                                 workInProgressHook
```

所以更新过程的hooks链表构建过程除了更新workInProgressHook指针的指向，还要更新`currentHook`的指向，以及尽可能复用`currentHook`来创建新的hook对象。
这个过程调用的是`updateWorkInProgressHook`函数：

```js
function updateWorkInProgressHook(): Hook {
    let nextCurrentHook: null | Hook;// 确定nextCurrentHook的指向
    if (currentHook === null) {
        // currentHook在函数组件调用完成时会被设置为null，
        // 这说明组件是刚刚开始重新渲染，刚刚开始调用第一个hook函数。
        // hooks链表为空
        const current = currentlyRenderingFiber.alternate;
        if (current !== null) {
            // current树上的老节点存在，那么将nextCurrentHook指向current.memoizedState
            nextCurrentHook = current.memoizedState;
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }
    // 确定nextWorkInProgressHook的指向
    let nextWorkInProgressHook: null | Hook;
    if (workInProgressHook === null) {
        // workInProgress.memoizedState在函数组件每次渲染时都会被设置成null，
        // workInProgressHook在函数组件调用完成时会被设置为null，
        // 所以当前的判断分支说明现在正调用第一个hook函数，hooks链表为空
        // 将nextWorkInProgressHook指向workInProgress.memoizedState，为null
        nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
    } else {
        nextWorkInProgressHook = workInProgressHook.next;
    }

    if (nextWorkInProgressHook !== null) {
        // 依据上面的推导，nextWorkInProgressHook不为空说明hooks链表不为空
        // 更新workInProgressHook、nextWorkInProgressHook、currentHook
        workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = workInProgressHook.next;

        currentHook = nextCurrentHook;
    } 
    else {// hooks链表为空
        //current树上没有该Hook链表,更新时如果这样，那么就意味着一个错误发生
        if (nextCurrentHook === null) {
            throw new Error('Rendered more hooks than during the previous render.');
        }
        currentHook = nextCurrentHook;
        //创建一个新的Hook(复用)
        const newHook: Hook = {
            memoizedState: currentHook.memoizedState,

            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,

            next: null,
        };

        if (workInProgressHook === null) {
            //  刚刚开始调用第一个hook函数。
            currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
        } else {
            // 更多
            workInProgressHook = workInProgressHook.next = newHook;
        }
    }
    return workInProgressHook;//将当前的Hook返回
}
```

### updateReducer

-   当再次执行useState的时候，会触发更新hooks逻辑，本质上调用的就是 updateReducer，如上会把待更新的队列 pendingQueue 拿出来，合并到 `baseQueue`，循环进行更新。
-   循环更新的流程，说白了就是执行每一个 `Dispatch` ，得到最新的 state 。接下来就可以从 useState 中得到最新的值。

```jsx
function updateReducer<S, I, A>(reducer: (S, A) => S,initialArg: I,init?: I => S,): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();//获取当前的hook
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  const current: Hook = (currentHook: any);
  let baseQueue = current.baseQueue;//由于之前某些高优先级任务导致更新中断，baseQueue 记录的就是尚未处理的最后一个 update
  const pendingQueue = queue.pending;

  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      //如果还有未处理的任务，先合并
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
        // 判断渲染优先级和更新优先级,如果该更新不在本次更新车道内
   // 则本次update放入baseQueue中.并跳过本次更新
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: (null: any),
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
       // 将本次更新优先级合并
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
        markSkippedUpdateLanes(updateLane);
      } else {
        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: (null: any),
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        if (update.hasEagerState) {//如果存在上次render时使用的reducer hasEagerState为true
          newState = ((update.eagerState: any): S);
        } else {
          const action = update.action;
            /* 得到新的 state */
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);


    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;

 

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

## 处理副作用

在render给fiber打上effectTag,在commit阶段统一处理这些副作用，对于useEffect和useLayoutEffect来说：

### 初始化

#### mountEffect

```js
function mountEffect(create: () => (() => void) | void,deps: Array<mixed> | void | null,): void {
    return mountEffectImpl(PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,);
}
```

#### mountEffectImpl

-   通过 pushEffect 创建一个 effect，并保存到当前 hooks 的 memoizedState 属性下。
-   pushEffect 除了创建一个 effect ， 还有一个重要作用，就是如果存在多个 effect 或者 layoutEffect 会形成一个副作用链表，绑定在函数组件 fiber 的 updateQueue 上。还会绑定在对应hook元素的memoizewdState中

```ts
function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy = undefined;
    if (currentHook !== null) {
        // 从currentHook中获取上一次的effect
        const prevEffect = currentHook.memoizedState;
        // 获取上一次effect的destory函数，也就是useEffect回调中return的函数
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            const prevDeps = prevEffect.deps;
            // 比较前后依赖，push一个不带HookHasEffect的effect
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                pushEffect(hookFlags, create, destroy, nextDeps);
                return;
            }
        }
    }
    currentlyRenderingFiber.flags |= fiberFlags;
    // 如果前后依赖有变，在effect的tag中加入HookHasEffect
    // 并将新的effect更新到hook.memoizedState上
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,// useEffect 第一次参数，就是副作用函数
        undefined,
        nextDeps,// useEffect 第二次参数，deps
    );
}
```
#### mountWorkInProgressHook

-   mountWorkInProgressHook 产生一个 hooks ，并和 fiber 建立起关系。

```js
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    //原理和useState一样，这是首次
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    //后续
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

#### pushEffect

-   pushEffect 除了创建一个 effect ， 还有一个重要作用，就是如果存在多个 effect 或者 layoutEffect 会形成一个副作用链表，绑定在函数组件 fiber 的 updateQueue 上。
-   effect对象创建出来最终会以两种形式放到两个地方：单个的effect，放到hook.memorizedState上；环状的effect链表，放到fiber节点的updateQueue中。两者各有用途，前者的effect会作为上次更新的effect，为本次创建effect对象提供参照（对比依赖项数组），后者的effect链表会作为最终被执行的主体，带到commit阶段处理。

```js
function pushEffect(tag, create, destroy, deps) {
  // 创建effect对象
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };

  // 从workInProgress节点上获取到updateQueue，为构建链表做准备
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    // 如果updateQueue为空，把effect放到链表中，和它自己形成闭环
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    // 将updateQueue赋值给WIP节点的updateQueue，实现effect链表的挂载
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // updateQueue不为空，将effect接到链表的后边
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

### 更新

#### updateEffect

```js
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
```

#### updateEffectImpl

判断 deps 项有没有发生变化，如果没有发生变化，更新副作用链表就可以了；如果发生变化，更新链表同时，打执行副作用的标签：`fiber => fiberEffectTag，hook => HookHasEffect`。在 commit 阶段就会根据这些标签，重新执行副作用。

```js
function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = updateWorkInProgressHook();//获取当前的hook 与useState一样
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {//比较依赖是否改变
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags;//打上标签
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps,
  );
}
```

React 会用不同的 EffectTag 来标记不同的 effect，对于useEffect 会标记 UpdateEffect | PassiveEffect， UpdateEffect 是证明此次更新需要更新 effect ，HookPassive 是 useEffect 的标识符，对于 useLayoutEffect 第一次更新会打上 HookLayout 的标识符。**React 就是在 commit 阶段，通过标识符，证明是 useEffect 还是 useLayoutEffect ，接下来 React 会同步处理 useLayoutEffect ，异步处理 useEffect** 。

如果函数组件需要更新副作用，会标记 UpdateEffect，至于哪个effect 需要更新，那就看 hooks 上有没有 HookHasEffect 标记，所以初始化或者 deps 不想等，就会给当前 hooks 标记上 HookHasEffect ，所以会执行组件的副作用钩子。

####  对于 ref 处理

创建：

```js
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = {current: initialValue};
  hook.memoizedState = ref; // 创建ref对象。
  return ref;
}
```

更新：

```js
function updateRef(initialValue){
  const hook = updateWorkInProgressHook()
  return hook.memoizedState // 取出复用ref对象。
}
```

#### 对于useMemo的处理

创建：

```js
function mountMemo(nextCreate,deps){
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

-   useMemo 初始化会执行第一个函数得到想要缓存的值，将值缓存到 hook 的 memoizedState 上。

更新：

```js
function updateMemo(nextCreate,nextDeps){
    const hook = updateWorkInProgressHook();
    const prevState = hook.memoizedState; 
    const prevDeps = prevState[1]; // 之前保存的 deps 值
    if (areHookInputsEqual(nextDeps, prevDeps)) { //判断两次 deps 值
        return prevState[0];
    }
    const nextValue = nextCreate(); // 如果deps，发生改变，重新执行
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}
```

-   useMemo 更新流程就是对比两次的 dep 是否发生变化，如果没有发生变化，直接返回缓存值，如果发生变化，执行第一个参数函数，重新生成缓存值，缓存下来，供开发者使用。

## commit

seEffect和useLayoutEffect，对它们的处理最终都落在处理fiber.updateQueue上，对前者来说，循环updateQueue时只处理包含useEffect这类tag的effect，对后者来说，只处理包含useLayoutEffect这类tag的effect，它们的处理过程都是先执行前一次更新时effect的销毁函数（destroy），再执行新effect的创建函数（create）。

以上是它们的处理过程在微观上的共性，宏观上的区别主要体现在执行时机上。useEffect是在beforeMutation或layout阶段异步调度，然后在本次的更新应用到屏幕上之后再执行，而useLayoutEffect是在layout阶段同步执行的。

在实现上利用scheduler的异步调度函数：`scheduleCallback`，将执行useEffect的动作作为一个任务去调度，这个任务会异步调用。

commit阶段和useEffect真正扯上关系的有三个地方：commit阶段的开始、beforeMutation、layout，涉及到异步调度的是后面两个。

```js
function commitRootImpl(root, renderPriorityLevel) {
  // 进入commit阶段，先执行一次之前未执行的useEffect
  do {
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  ...

  do {
    try {
      // beforeMutation阶段的处理函数：commitBeforeMutationEffects内部，
      // 异步调度useEffect
      commitBeforeMutationEffects();
    } catch (error) {
      ...
    }
  } while (nextEffect !== null);

  ...

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

  if (rootDoesHavePassiveEffects) {
    // 重点，记录有副作用的effect
    rootWithPendingPassiveEffects = root;
  }
}
```

这三个地方去执行或者调度useEffect有什么用意呢？

-   commit开始，先执行一下useEffect：这和useEffect异步调度的特点有关，它以一般的优先级被调度，这就意味着一旦有更高优先级的任务进入到commit阶段，上一次任务的useEffect还没得到执行。所以在本次更新开始前，需要先将之前的useEffect都执行掉，以保证本次调度的useEffect都是本次更新产生的。
-   beforeMutation阶段异步调度useEffect：这个是实打实地针对effectList上有副作用的节点，去异步调度useEffect。

```js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {

    ...

    if ((flags & Passive) !== NoFlags) {
      // 如果fiber节点上的flags存在Passive调度useEffect
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

因为`rootDoesHavePassiveEffects`的限制，只会发起一次useEffect调度，相当于用一把锁锁住调度状态，避免发起多次调度。

-   layout阶段填充effect执行数组：真正useEffect执行的时候，实际上是先执行上一次effect的销毁，再执行本次effect的创建。React用两个数组来分别存储销毁函数和

在调用`schedulePassiveEffects`填充effect执行数组时，有一个重要的地方就是只在包含HasEffect的effectTag的时候，才将effect放到数组内，这一点保证了依赖项有变化再去处理effect。也就是：**如果前后依赖未变，则effect的tag就赋值为传入的hookFlags，否则，在tag中加入HookHasEffect标志位。正是因为这样，在处理effect链表时才可以只处理依赖变化的effect，use(Layout)Effect才可以根据它的依赖变化情况来决定是否执行回调。**

在调用`enqueuePendingPassiveHookEffectUnmount`和`enqueuePendingPassiveHookEffectMount`填充数组的时候，还会再异步调度一次useEffect，但这与beforeMutation的调度是互斥的，一旦之前调度过，就不会再调度了，同样是`rootDoesHavePassiveEffects`起的作用。

#### 执行effect

此时我们已经知道，effect得以被处理是因为之前的调度以及effect数组的填充。现在到了最后的步骤，执行effect的destroy和create。过程就是先循环待销毁的effect数组，再循环待创建的effect数组，这一过程发生在`flushPassiveEffectsImpl`函数中。循环的时候每个两项去effect是由于奇数项存储的是当前的fiber。

```javascript
function flushPassiveEffectsImpl() {
  // 先校验，如果root上没有 Passive efectTag的节点，则直接return
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }

  ...

  // 执行effect的销毁
  const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i < unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect);
    const fiber = ((unmountEffects[i + 1]: any): Fiber);
    const destroy = effect.destroy;
    effect.destroy = undefined;

    if (typeof destroy === 'function') {
      try {
        destroy();
      } catch (error) {
        captureCommitPhaseError(fiber, error);
      }
    }
  }

  // 再执行effect的创建
  const mountEffects = pendingPassiveHookEffectsMount;
  pendingPassiveHookEffectsMount = [];
  for (let i = 0; i < mountEffects.length; i += 2) {
    const effect = ((mountEffects[i]: any): HookEffect);
    const fiber = ((mountEffects[i + 1]: any): Fiber);
    try {
      const create = effect.create;
      effect.destroy = create();
    } catch (error) {

      captureCommitPhaseError(fiber, error);
    }
  }

  ...

  return true;
}
```

#### useLayoutEffect的同步执行

useLayoutEffect在执行的时候，也是先销毁，再创建。和useEffect不同的是这两者都是同步执行的，前者在mutation阶段执行，后者在layout阶段执行。
与useEffect不同的是，它不用数组去存储销毁和创建函数，而是直接操作fiber.updateQueue。

卸载上一次的effect，发生在mutation阶段

```javascript
// 调用卸载layout effect的函数，传入layout有关的effectTag和说明effect有变化的effectTag：HookLayout | HookHasEffect
commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);

function commitHookEffectListUnmount(tag: number, finishedWork: Fiber) {
  // 获取updateQueue
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

  // 循环updateQueue上的effect链表
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // 执行销毁
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

执行本次的effect创建，发生在layout阶段

```javascript
// 调用创建layout effect的函数
commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);

function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // 创建
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

## 总结

对于hook，每次调用都会得到一个新的Hook对象，一个fiber节点产生的所有hook对象都会有序地形成一条hook**单链表**，保存在对应fiber（函数式组件）的`memoizedState`中，同时在work树上还存在着一个全局指针去记录当前的hook位置。而对于更新的时候，由于current树，还存在一个currentHook指针，指向current树上的hook，新的hook对象可以基于它来进行创建，同时一些数据和老信息也可以通过它去获取

特别的我们应该避免去以判断条件的方式去执行Hook,因为这样会导致一些复用逻辑出现错误。

对于每一个hook来说，该对象身上的`memoizedState`存在着一些状态或函数,`baseQueue`上存在着一些未执行完的任务，`queue`记录着更新任务是一个**环形链表**

当再次执行useState的时候本质上调用的就是 updateReducer

在更新过程中，由于存在current树，所以workInProgress节点也就有对应的current节点。那么自然也会有两条hooks链表，分别存在于current和workInProgress节点的memorizedState属性上。鉴于此，更新过程的hooks链表构建需要另一个指针的参与：currentHook。它作为组件的workInProgressHook在上一次更新时对应的hook对象，新的hook对象可以基于它创建(复用)。另外，也可以获取到上次hook对象的一些数据，例如useEffect的前后依赖项比较，前一次的依赖项就可以通过它获得

而对于副作用(effect)产生的hook也会放到fiber.memorizedState，还会与其他的effect连接形成一个**环形链表**，绑定在函数组件 fiber 的 updateQueue 上。还会绑定在对应hook元素的memoizewdState中

在render创建出对应的hook链表挂载到workInProgress的memoizedState上，给fiber打上effectTag,在commit阶段统一处理这些副作用，异步调度useEffect，layout阶段同步处理useLayoutEffect的effect。等到commit阶段完成，更新应用到页面上之后，开始处理useEffect产生的effect。useEffect和useLayoutEffect的执行时机不一样，前者被异步调度，当页面渲染完成后再去执行，不会阻塞页面渲染。
后者是在commit阶段新的DOM准备完成，但还未渲染到屏幕之前，同步执行。

当依赖项被改变时，相应的effect和fiber都会被打上tag，以便于后续更新和重新执行

在commit阶段 useEffect在beforeMutation或layout阶段被异步调度，在beforeMutation调度之前需要执行一遍上一次的useEffect以确保本次调度的Effect都是本次更新产生的。同时在layout阶段采用两个数组分别存储create和destroy，在页面被渲染完成之后再去执行，执行是先执行上一次的销毁，再执行这一次的创建。

useLayoutEffect在执行的时候，也是先销毁，再创建。和useEffect不同的是这两者都是同步执行的，前者在mutation阶段执行，后者在layout阶段执行。
与useEffect不同的是，它不用数组去存储销毁和创建函数，而是直接操作fiber.updateQueue。

useEffect不会阻塞渲染，而useLayoutEffect会阻塞渲染。



## 参考链接

[掘金小册](https://juejin.cn/book/6945998773818490884/section/6959872072906440743)

[React hooks 的基础概念：hooks链表](https://segmentfault.com/a/1190000039076330)

[梳理useEffect和useLayoutEffect的原理与区别](https://segmentfault.com/a/1190000039087645)

[React Hooks 原理](https://zhuanlan.zhihu.com/p/540415887)

[面试官所不知道的《React源码v18》](https://www.ai2news.com/blog/1580947/)
