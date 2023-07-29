# fiber

在浏览器中，页面是一帧一帧绘制出来的，一般情况下，设备的刷新率为1秒60次,低于60会出现一定程度的卡顿。
在一帧中，浏览器做了以下事情:

+   处理输入事件，保证用户得到及时的反馈
+   处理定时器，如果有到达时间的定时器，则执行对应的回调
+   处理`Begin Frame`(开始帧),这时候会处理该帧的事件，比如`window.resize、sroll`
+   执行请求动画帧(`requestAnimationFrame(callback)`),在每次绘制之前，会执行callback回调函数
+   进行`Layout`操作，包括计算布局和更新布局，在页面的展示
+   `Paint`(绘制)，得到树中每个节点的尺寸和位置等信息，针对每个元素进行填充
+   完成上诉阶段后，浏览器会处于空闲阶段，这时候可以执行`requestIdleCallback`里注册的任务，他也是`React Fiber`实现的基础

JS引擎和页面渲染引擎处于同一个渲染线程之内，如果某个阶段的执行事件特别长，比如在定时器阶段执行时间很长，那么就会阻塞页面的渲染，表现出卡顿的现象

在React16引入Fiber架构之前，react采用**深度优先遍历**(递归)对比虚拟DOM树，这个过程被称为`reconcilation`(协调),在协调期间，React会一直占用浏览器资源，会让用户触发的事件得不到响应，同时通过遍历的方式，也会使得执行栈越来越深并且不可中断，导致卡顿以及慢响应

**通过引入Fiber架构，让协调过程变得可被中断，同时在合适的时候让出cpu执行权，让用户操作得以响应**

对于Vue与React优化思路:

+   Vue基于`template`和`watcher`的组件级更新，把每个更新任务分割开来，不需要使用Fiber将任务进行更细的拆分
+   React基于`setState`，无论如何都是从根节点开始更新，更新任务大，需要Fiber去将任务拆分为小任务，可以中断和恢复，不阻塞主进程执行优先度更高的任务

## requestAnimationFrame

该函数接收一个回调函数，该回调函数在下次绘制(下一帧的Paint)之前(下一帧的requestAnimationFrame阶段)被执行。

## requestIdleCallback

`requestIdleCallback`能在主事件循环上执行后台和低优先级的工作，而不影响关键事件，一帧之中如果任务完成之后有多的空闲事件，这时就会执行`requestIdleCallback`里注册的任务。
使用方式:window.requestIdleCallback(callback, { timeout: 1000 })，可以传入timeout参数去定义超时时间，如果到了超时时间，浏览器必须执行这个任务。
执行完这个方法之后，如果没有剩余时间或者没有下一个可执行的任务，React归还控制权
`window.requestIdleCallback(callback)`的`callback`中会接收到默认参数 deadline ，其中包含了以下两个属性：

-   timeRamining 返回当前帧还剩多少时间供用户使用
-   didTimeout 返回 callback 任务是否超时

如果callback里的子任务执行时间超过了剩余时间，则会卡在这里执行，直到执行结束，如果存在死循环，则浏览器会卡死
如果callback任务已经超时(timeout)，则会直接执行
如果callback里的子任务执行时间超过了剩余时间，则放弃执行任务的控制权，将任务控制权移交给浏览器(这里有些疑问，移交控制权是在子任务执行结束移交？，还是在子任务执行完某一行代码后超时时，立马移交？)
如果上一个子任务执行完毕，并且还留有剩余时间，则会执行下一个子任务(如果不存在后续子任务，则移交控制权给浏览器)

## 什么是Fiber

Fiber可以理解为是一个执行单元，也可也理解为是一种数据结构

#### 执行单元

浏览器在每一次绘制过程中，都会进行`事件处理、执行js、调用requestAnimationFrame、布局Layout、绘制Paint`。在前面执行完之后，如果还有空闲时间，就可以交给`React`去执行更新任务。React会判断是否存在待执行的任务，如果有则执行，否则将控制权交给浏览器。而`Fiber`可以理解为一个执行单元，每执行完一个执行单元，`React`就会判断是否还存在空闲时间，如果还存在空闲时间则继续判断是否还存在执行任务，如果还存在执行任务则执行任务，执行完毕后会继续进行空闲时间判断，如果没有空闲时间或者没有执行任务，则将控制权交给浏览器。

#### 数据结构

React Fiber采用链表进行实现，每一个Virtual DOM都是一个fiber
每一个fiber包括了child(第一个子节点)、sobling(兄弟节点)、return(父节点)等属性

## Fiber链表结构设计

Fiber 是使用单链表实现的，但有一些不同

## Fiber节点设计

`Fiber`的拆分单位是`fiber`(`Fiber tree`上的一个节点),按虚拟DOM进行拆分，根据虚拟DOM去生成`Fiber`树上的节点。`Fiber`的节点结构如下:

```tsx
{
    type: any,//对于类组件，它指向构造函数。对于DOM元素，它指定 HTML tag(字符串) ,随着 type 的不同，在 reconciliation 期间使用 key 来确定 fiber 是否可以重新使用。
    key: null | string, //唯一标识符
    stateNode : any,//保存对组件的类实例，DOM节点或于fiber节点关联的其他React元素类型的引用
    child: Fiber | null, // 大儿子
    sibling: Fiber | null, // 下一个兄弟
    return: Fiber | null, // 父节点
    tag: WorkTag, // 定义fiber操作的类型
    nextEffect: Fiber | null, // 指向下一个节点的指针
    updateQueue: mixed, // 用于状态更新，回调函数，DOM更新的队列
    memoizedState: any, // 用于创建输出的fiber状态
    pendingProps: any, // 已从React元素中的新数据更新，并且需要应用于子组件或DOM元素的props
    memoizedProps: any, // 在前一次渲染期间用于创建输出的props
}
```

## Fiber执行原理

### render阶段

该阶段是可以被中断的，会找出所有节点的变更，如果新增、删除、属性的变更等，这些变更被React称为副作用(`effect`),该阶段会创建一颗`React tree`,按虚拟dom节点进行拆分，一个虚拟dom节点对应一个任务，最后产生一个`effectlist`,从中我们就可以知道哪些节点更新，哪些节点增加和删除了
#### 遍历流程

采用后序遍历

1.  从根节点开始，
2.  如果有大儿子，则先遍历大儿子(该大儿子的父节点不会被标注遍历完成)，如果没有大儿子则表示该节点遍历完成(大儿子节点标注遍历完成)
3.  大儿子节点遍历完成之后，如果有兄弟节点就去兄弟节点继续第2步，如果没有兄弟节点，则返回父节点(此时父节点才会被标注遍历完成)，儿子们都完成后自己再完成

#### 收集Effect List

1.  遍历子虚拟DOM元素数组，为每个虚拟DOM元素创建子fiber：

    ```js
    const reconcileChildren = (currentFiber, newChildren) => {
        //newChildren 子虚拟DOM元素数组
        //currentFiber 当前Fiber
      let newChildIndex = 0
      let prevSibling // 上一个子fiber
      // 遍历子虚拟DOM元素数组，为每个虚拟DOM元素创建子fiber
      while (newChildIndex < newChildren.length) {
        let newChild = newChildren[newChildIndex]
        let tag
        // 打tag，定义 fiber类型
        if (newChild.type === ELEMENT_TEXT) { // 这是文本节点
          tag = TAG_TEXT
        } else if (typeof newChild.type === 'string') {  // 如果type是字符串，则是原生DOM节点
          tag = TAG_HOST
        }
        let newFiber = {
          tag,
          type: newChild.type,
          props: newChild.props,
          stateNode: null, // 还未创建DOM元素
          return: currentFiber, // 父亲fiber
          effectTag: INSERT, // 副作用标识，包括新增、删除、更新
          nextEffect: null, // 指向下一个fiber，effect list通过nextEffect指针进行连接
        }
        if (newFiber) {
          if (newChildIndex === 0) {
            currentFiber.child = newFiber // child为大儿子
          } else {
            prevSibling.sibling = newFiber // 让大儿子的sibling指向二儿子
          }
          prevSibling = newFiber
        }
        newChildIndex++
      }
    }
    ```

    

2.  如果当前节点需要更新，则打`tag`更新当前节点状态（props, state, context等）

    ```js
    if (newChild.type === ELEMENT_TEXT) { // 这是文本节点
          tag = TAG_TEXT
        } else if (typeof newChild.type === 'string') {  // 如果type是字符串，则是原生DOM节点
          tag = TAG_HOST
        }
    ```

3.  收集fiber时，fiber如果没有`child fiber`，则结束该节点，把`effect list`归并到`return`，把此节点的`sibling`节点作为下一个遍历节点；否则把`child`节点作为下一个遍历节点

    定义一个方法收集此 fiber 节点下所有的副作用，并组成`effect list`。注意每个 fiber 有两个属性：

    -   `firstEffect`：指向第一个有副作用的子`fiber`
    -   `lastEffect`：指向最后一个有副作用的子`fiber`

    中间的使用`nextEffect`做成一个单链表。

    ```js
    // 在完成的时候要收集有副作用的fiber，组成effect list
    const completeUnitOfWork = (currentFiber) => {
      // 后续遍历，儿子们完成之后，自己才能完成。最后会得到以上图中的链条结构。
      let returnFiber = currentFiber.return
      if (returnFiber) {
         //!处理已收集到的副作用链
        // 如果父亲fiber的firstEffect没有值，则将其指向当前fiber的firstEffect
        if (!returnFiber.firstEffect) {
            //如果父节点赞未存在副作用链，则将收集到的现有副作用链数据先传递给父节点
          returnFiber.firstEffect = currentFiber.firstEffect
        }
        // 如果当前fiber的lastEffect有值
        if (currentFiber.lastEffect) {
          if (returnFiber.lastEffect) {
              //子节点所收集到的副作用链，在这里被合并
            returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
          }
          returnFiber.lastEffect = currentFiber.lastEffect//更新末尾指针
        }
        const effectTag = currentFiber.effectTag
        if (effectTag) { // 说明有副作用 effectTag标识用来标识更新的操作类别
            //!处理当前fiber的本身
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = currentFiber
          } else {
            returnFiber.lastEffect = currentFiber
          }
          returnFiber.lastEffect = currentFiber
        }
      }
    }
    ```

    接下来定义一个递归函数，从根节点出发，把全部的 fiber 节点遍历一遍，产出最终全部的`effect list`：

    ```js
    // 把该节点和子节点任务都执行完
    const performUnitOfWork = (currentFiber) => {
      beginWork(currentFiber)
      if (currentFiber.child) {
        return currentFiber.child
      }
      while (currentFiber) {
        completeUnitOfWork(currentFiber) // 让自己完成
        if (currentFiber.sibling) { // 有兄弟则返回兄弟
          return currentFiber.sibling
        }
        currentFiber = currentFiber.return // 没有弟弟，则找到父亲，让父亲完成，父亲会去找他的兄弟
      }
    }
    ```

4.  如果有剩余时间，则开始下一个节点，否则等下一次主线程空闲再开始下一个节点(一帧绘制完成之后的空闲阶段，`requestIdleCallback `)

5.  如果没有下一个节点了，进入`pendingCommit`状态，此时`effect list`收集完毕，结束。

### commit阶段

commit 阶段需要将上阶段计算出来的需要处理的副作用一次性执行，此阶段不能暂停，否则会出现UI更新不连续的现象。此阶段需要根据`effect list`，将所有更新都 commit 到DOM树上。
```js
const commitWork = currentFiber => {
  if (!currentFiber) return
  let returnFiber = currentFiber.return
  let returnDOM = returnFiber.stateNode // 父节点元素
  if (currentFiber.effectTag === INSERT) {  // 如果当前fiber的effectTag标识位INSERT，则代表其是需要插入的节点
    returnDOM.appendChild(currentFiber.stateNode)
  } else if (currentFiber.effectTag === DELETE) {  // 如果当前fiber的effectTag标识位DELETE，则代表其是需要删除的节点
    returnDOM.removeChild(currentFiber.stateNode)
  } else if (currentFiber.effectTag === UPDATE) {  // 如果当前fiber的effectTag标识位UPDATE，则代表其是需要更新的节点
    if (currentFiber.type === ELEMENT_TEXT) {
      if (currentFiber.alternate.props.text !== currentFiber.props.text) {
        currentFiber.stateNode.textContent = currentFiber.props.text
      }
    }
  }
  currentFiber.effectTag = null
}
```

根据全部 fiber 的 effect list 更新视图，写一个递归函数，从根节点出发，根据`effect list`完成全部更新：
```js
const commitRoot = () => {
  let currentFiber = workInProgressRoot.firstEffect
  while (currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  currentRoot = workInProgressRoot // 把当前渲染成功的根fiber赋给currentRoot
  workInProgressRoot = null
}
```

完成视图更新
```js
const workloop = (deadline) => {
  let shouldYield = false // 是否需要让出控制权
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1 // 如果执行完任务后，剩余时间小于1ms，则需要让出控制权给浏览器，这里实现了中断
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log('render阶段结束')
    commitRoot() // 没有下一个任务了，根据effect list结果批量更新视图,这里不能中断
  }
  // 请求浏览器进行再次调度
  requestIdleCallback(workloop, { timeout: 1000 })
}
```

总结：
render中：
1.  先遍历一遍fiber的子虚拟DOM元素数组，去生成子fiber
2.  再遍历fiber tree 获取副作用链

commit中:
1.  去遍历副作用链去更新

