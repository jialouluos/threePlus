# React事件机制

## 前言

由于`React Fiber`的特性，`dom`节点在render时可能还未挂载，所以像`onClick`这样的事件处理函数作为`fiber`的`prop`，也不能直接挂载在真实`dom`节点之上，因此`React`自己封装了一种具有“顶层注册”，“事件收集”，“统一触发”的事件处理机制。

在React中事件不是绑定在真实DOM元素上，而是绑定在`document`(React17是`root`，这主要为了渐进升级，避免多版本的React共存的场景中事件系统发生冲突，即页面上可以共存多个 `react` 版本)上，该事件也并非原生事件，而是由React进行处理了的合成事件。当事件触发之后冒泡到document时，合成事件便会被执行。下面记录一下从事件注册到事件被执行的生命周期。

## 事件注册

在React17，事件被修改为注册到`root`上，这里选择React17来进行记录
当我们在React中使用JSX创建一个div并给他绑定事件`<div onClick={()=>{/*to do*/}}></div>`,该虚拟DOM会在render阶段转化为一个fiber节点，onClick作为他的prop，*当这个fiber节点进入render阶段的complete阶段时，名称为onClick的prop会被识别为事件进行事件绑定*。

绑定过程主要分为：

+   *根据React的事件名称寻找该事件依赖，例如onMouseEnter事件依赖了mouseout和mouseover两个原生事件，onClick只依赖了click一个原生事件，最终会循环这些依赖，在root上绑定对应的事件。例如组件中为onClick，那么就会在root上绑定一个click事件监听(多个onClick也只绑定一个click，后面由监听器在其管理的一个映射中去找到具体的事件并调用)。*
+   *依据组件中写的事件名识别其属于哪个阶段的事件（冒泡或捕获），例如`onClickCapture`这样的React事件名称就代表是需要事件在捕获阶段触发，而`onClick`代表事件需要在冒泡阶段触发。*
+   *根据React事件名，找出对应的原生事件名，例如`click`，并根据上一步来判断是否需要在捕获阶段触发，调用`addEventListener`，将事件绑定到root元素上。*
+   *若事件需要更新，那么先移除事件监听，再重新绑定，绑定过程重复以上三步。*

经过上述过程，事件监听器就被绑定在`root`元素身上了

## 事件监听器

*事件监听器上维持了一个映射来保存所有组件内部的事件监听和处理函数。当组件挂载或卸载时，只是在这个统一的事件监听器上插入或删除一些对象；当事件发生时，首先被这个统一的事件监听器处理，然后在映射里找到真正的事件处理函数并调用。这样做简化了事件处理和回收机制，效率也有很大提升。*

负责**传递优先级**，触发**事件对象的合成**、**将事件处理函数收集到执行路径**、 **事件执行**这三个过程

事件监听器(事件监听包装器)有三种：

+   dispatchDiscreteEvent: 处理离散事件
+   dispatchUserBlockingUpdate：处理用户阻塞事件
+   dispatchEvent：处理连续事件

*这些包装器就是真正绑定在root身上的监听器listener，他们拥有不同的优先级，当对应的事件触发时，回调中调用的就是这个包含优先级的事件监听*

## 小结

1.  事件处理函数不是绑定到组件的元素上的，而是绑定到root上，这和fiber树的结构特点有关，即事件处理函数只能作为fiber的prop。
2.  绑定到root上的事件监听不是我们在组件里写的事件处理函数，而是一个持有事件优先级，并能传递事件执行阶段标志的监听器。
3.  由监听器负责去它自身维持的映射中寻找真正的事件处理函数。

## 事件触发

当事件被触发时，绑定在root上监听器被触发，监听器依照优先级(优先级本篇不详细记录)将事件进行合成，收集事件处理函数(相关节点绑定的React事件)到执行路径，事件执行,root上的事件监听最终触发的是`dispatchEventsForPlugins`。

### 事件对象的合成

在组件中的事件处理函数中拿到的事件对象并不是原生的事件对象，而是经过React合成的`SyntheticEvent`对象。它解决了不同浏览器之间的兼容性差异。抽象成统一的事件对象，解除开发者的心智负担。

```jsx
function dispatchEventsForPlugins(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  targetContainer: EventTarget,
): void {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue: DispatchQueue = [];

  // 事件对象的合成，收集事件到执行路径上
  extractEvents(
    dispatchQueue,//包括了事件对象(onClick)以及事件执行路径[触发者，触发者父亲(如果有onClick)，触发者爷爷(如果有onClick)]
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );

  // 执行收集到的组件中真正的事件
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}
```

root上的事件监听被触发会引发事件对象的合成和事件的收集过程，这是为真正的事件触发做准备

### 事件执行路径

当事件对象合成完毕，会将事件收集到事件执行路径上。什么是事件执行路径呢？

在浏览器的环境中，若父子元素绑定了相同类型的事件，除非手动干预，那么这些事件都会按照冒泡或者捕获的顺序触发。

在React中也是如此，从触发事件的元素开始，依据fiber树的层级结构向上查找，累加上级元素中所有相同类型的事件，最终形成一个具有所有相同类型事件的数组，这个数组就是事件执行路径。通过这个路径，React自己模拟了一套事件捕获与冒泡的机制(因为是一个数组，所以如果从左到右执行和弹出，则结果看起来就和冒泡一样，反之，如果从右往左执行和弹出，结果看起来就和捕获一样) 

*因为不同的事件会有不同的行为和处理机制，所以合成事件对象的构造和收集事件到执行路径需要通过插件实现。一共有5种Plugin：**SimpleEventPlugin，EnterLeaveEventPlugin，ChangeEventPlugin，SelectEventPlugin，BeforeInputEventPlugin**。它们的使命完全一样，只是处理的事件类别不同，所以内部会有一些差异。本文只以`SimpleEventPlugin`为例来讲解这个过程，它处理比较通用的事件类型，比如`click、input、keydown`等。*

*以下是SimpleEventPlugin中构造合成事件对象并收集事件的代码。*

```jsx
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  const reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  let EventInterface;
  switch (domEventName) {
    // 赋值EventInterface（接口）
  }

  // 构造合成事件对象
  const event = new SyntheticEvent(
    reactName,
    null,
    nativeEvent,
    nativeEventTarget,
    EventInterface,
  );

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  if (/*...*/) {
    ...
  } else {
    // scroll事件不冒泡
    const accumulateTargetOnly =
      !inCapturePhase &&
      domEventName === 'scroll';

    // 事件对象分发 & 收集事件
    accumulateSinglePhaseListeners(
      targetInst,
      dispatchQueue,
      event,
      inCapturePhase,
      accumulateTargetOnly,
    );
  }
  return event;
}
```

### 创建合成事件对象

这个统一的事件对象由`SyntheticEvent`函数构造而成，它自己遵循W3C的规范又实现了一遍浏览器的事件对象接口，这样可以抹平差异，而原生的事件对象只不过是它的一个属性（nativeEvent）。

```jsx
  // 构造合成事件对象
  const event = new SyntheticEvent(
    reactName,
    null,
    nativeEvent,
    nativeEventTarget,
    EventInterface,
  );
```

### 收集事件到执行路径

+   将事件以冒泡的顺序收集到执行路径,收集的过程由`accumulateSinglePhaseListeners`完成。
+   这个过程是将组件中真正的事件处理函数收集到数组中，在fiber树中从触发事件的源fiber节点开始，向上一直找到root，形成一条完整的冒泡或者捕获的路径。同时，沿途路过fiber节点时，根据事件名，从props中获取我们真正写在组件中的事件处理函数，push到路径中，等待下一步的批量执行。
+   想法一：无论事件是在冒泡阶段执行，还是捕获阶段执行，都以同样的顺序push到dispatchQueue的listeners中，而冒泡或者捕获事件的执行顺序不同是由于清空listeners数组的顺序不同(正如上面所说只是从左往右和从右往左的区别) 
+   想法二：如果是捕获则shift()进数组，如果是冒泡则push()进数组，从左到右执行顺序不变
+   每次收集只会收集与事件源相同类型的事件，比如子元素绑定了onClick，父元素绑定了onClick和onClickCapture,父元素只会被收集onClick

```jsx
accumulateSinglePhaseListeners(
  targetInst,
  dispatchQueue,
  event,
  inCapturePhase,
  accumulateTargetOnly,
);
```

## 合成事件对象如何参与到事件执行过程

dispatchQueue的结构如下
event就代表着合成事件对象，可以将它认为是这些listeners共享的一个事件对象。当清空listeners数组执行到每一个事件监听函数时，这个事件监听可以改变event上的currentTarget，也可以调用它上面的stopPropagation方法来阻止冒泡。event作为一个共享资源被这些事件监听消费，消费的行为发生在事件执行时。

```jsx
[
  {
    event: SyntheticEvent,//onClick
    listeners: [ listener1, listener2, ... ]//[自身,爸爸,爷爷,...]
  }
]
```

## 事件执行

这一步将消费事件执行路径，遍历该数组，通过event去依次调用每个元素对应的事件回调

```jsx
export function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags,
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {

    // 从dispatchQueue中取出事件对象和事件监听数组
    const {event, listeners} = dispatchQueue[i];

    // 将事件监听交由processDispatchQueueItemsInOrder去触发，同时传入事件对象供事件监听使用
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }
  // 捕获错误
  rethrowCaughtError();
}
```

```jsx
function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean,
): void {
  let previousInstance;

  if (inCapturePhase) {
    // 事件捕获倒序循环
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const {instance, currentTarget, listener} = dispatchListeners[i];
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      // 执行事件，传入event对象，和currentTarget
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  } else {
    // 事件冒泡正序循环
    for (let i = 0; i < dispatchListeners.length; i++) {
      const {instance, currentTarget, listener} = dispatchListeners[i];
      // 如果事件对象阻止了冒泡，则return掉循环过程
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  }
}
```

至此，我们写在组件中的事件处理函数就被执行掉了，合成事件对象在这个过程中充当了一个公共角色，每个事件执行时，都会检查合成事件对象，有没有调用阻止冒泡的方法，另外会将当前挂载事件监听的元素作为currentTarget挂载到事件对象上，最终传入事件处理函数，我们得以获取到这个事件对象。

## 总结

在`React`中，事件绑定并非绑定在真实`DOM`上，而是绑定在`root`上，而且也并不是事件被绑定在`root`上，而是将事件监听器绑定在root上，在事件被触发时，会冒泡(该冒泡指的是原生冒泡，也解释了为什么原生事件先执行，执行完了再处理React事件)到 `root`对象，绑定在`root`上的监听器就被触发了，然后通过监听器去安排后续的合成事件源，收集事件执行路径去找到真正的事件并执行。

## 参考链接

[深入React合成事件机制原理](https://segmentfault.com/a/1190000039108951)
[React讲解 - 事件系统](https://segmentfault.com/a/1190000015725214)
[面试官：说说React的事件机制？](https://github.com/febobo/web-interview/issues/186)
[高频前端面试题汇总之React篇(上) -- 第一二问](https://juejin.cn/post/6941546135827775525#heading-2)