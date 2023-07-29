# Diff

## 前言

当我们state保存的状态发生改变时，会促使render执行，去得到持有最新状态的ReactElement,但是得到的ReactElement之中若只有少量需要更新，那么显然不能全部去更新它们，此时就需要有一个diff过程来决定哪些节点是真正需要更新的。

以类组件为例，state的计算发生在类组件对应的fiber节点beginWork中的`updateClassInstance`函数中，在状态计算完毕之后，紧跟着就是去调用`finishClassComponent`执行diff、 打上effectTag（即新版本的flag）。

>   打上effectTag可以标识这个fiber发生了怎样的变化，例如：新增（Placement）、更新（Update）、删除（Deletion），这些被打上flag的fiber会在complete阶段被收集起来，形成一个effectList链表，只包含这些需要操作的fiber，最后在commit阶段被更新掉。

```jsx
function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  ...
  // 计算状态
  shouldUpdate = updateClassInstance(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes,
  );
  ...
  // 执行render，进入diff，为fiber打上effectTag
  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderLanes,
  );
  return nextUnitOfWork;
}
```

>   在`finishClassComponent`函数中，调用`reconcileChildFibers`去做diff，而`reconcileChildFibers`实际上就是`ChildReconciler`，这是diff的核心函数， 该函数针对组件render生成的新节点的类型，调用不同的函数进行处理。

```jsx
function ChildReconciler(shouldTrackSideEffects) {
  ...
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    // 单节点diff
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<*>,
    lanes: Lanes,
  ): Fiber | null {
    // 多节点diff
  }

  ...

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    const isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      // 处理单节点
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
        case REACT_PORTAL_TYPE:
          ...
        case REACT_LAZY_TYPE:
          ...
      }
    }

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // 处理文本节点
    }

    if (isArray(newChild)) {
      // 处理多节点
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
      );
    }

    ...

  }
  return reconcileChildFibers;
}
```

## Diff主体

```tsx
function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null{
        ...
    }
```

+   retrunFiber ：currentFirstChild的父级fiber节点
+   currentFirstChild ： 当前执行更新任务的fiber节点(儿子)
+   newChild ：组件的render方法渲染出的新的ReactElement节点
+   lanes：优先级相关

可以看出最重要的两个主体是currentFirstChild(Fiber) 和 newChild(新的ReactElement),这是两个不一样的数据结构进行对比，即经render之手得到的ReactElement与老Fiber进行对比

## 对比原则

对于两个元素(旧和新)，即使他们的子树相同，但他们自己不相同，React会舍弃掉该元素的复用，直接销毁该元素及其子树，重新创建一个

```jsx
//旧
<div>
  <span>a</span>
  <span>b</span>
</div>
//新
<p>
  <span>a</span>
  <span>b</span>
</p>
```

使用tag（标签名）和 key识别节点，区分出前后的节点是否变化，以达到尽量复用无变化的节点。
因为tag 和 key的存在，所以React可以知道这两个节点只是位置发生了变化。

```jsx
//旧
<p key="a">aa</p>
<h1 key="b">bb</h1>
//新
<h1 key="b">bb</h1>
<p key="a">aa</p>
```

## 场景

根据一个fiber的子元素不同情况，可以分为单节点以及多节点

对于单节点来说，需要考虑他的更新，新增，删除

对于多节点来说，需要考虑他的更新，新增，删除，移动

### 单节点

```jsx
<div key="a">aa</div>
//render结果↓
{
  $$typeof: Symbol(react.element),
  type: "div",
  key: "a"
  ...
}
```

单节点指的是渲染的newChildren为单一节点，并不代表着oldFiber的数量也是单一的。

```text
有可能原本有1个节点，最新也是1个节点
旧：A  新：A
有可能原本有3个旧节点，最新只有1个新节点
旧：A B C 新：A
有可能原本没有节点，最新有1个节点
旧：--  新：A
```

单节点更新会调用`reconcileSingleElement`进行处理

```jsx
function reconcileSingleElement(returnFiber,currentFirstChild,newChild,lanes){...}
```

单节点其实对于React来说就只分为oldFiber链是否为空

+   如果为空，则表示新增，直接新建一个节点就行

```jsx
function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
    lanes: Lanes
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      // oldFiber链非空的处理
      ...
    }
    if (element.type === REACT_FRAGMENT_TYPE) {
      // 处理Fragment类型的节点
      ...
    } else {
      // 用产生的ReactElement新建一个fiber节点
      const created = createFiberFromElement(element, returnFiber.mode, lanes);
      created.ref = coerceRef(returnFiber, currentFirstChild, element);
      created.return = returnFiber;
      return created;
    }

  }
```

+   如果不为空，则遍历olbFiber，去找到相同的节点(利用key) ，并将其他oldFiber删除，再用oldFiber与newChildren的props去生成新的Fiber

```jsx
function reconcileSingleElement(
returnFiber: Fiber,
 currentFirstChild: Fiber | null,
 element: ReactElement,
 lanes: Lanes,
): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
        // TODO: If key === null and child.key === null, then this only applies to
        // the first item in the list.
        if (child.key === key) {
            const elementType = element.type;
            if (elementType === REACT_FRAGMENT_TYPE) {
                    // 处理Fragment类型的节点
            } else {
                if (
                    child.elementType === elementType ||
                    // Keep this check inline so it only runs on the false path:
                    (__DEV__
                     ? isCompatibleFamilyForHotReloading(child, element)
                     : false) ||
                    (typeof elementType === 'object' &&
                     elementType !== null &&
                     elementType.$$typeof === REACT_LAZY_TYPE &&
                     resolveLazy(elementType) === child.type)
                ) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    const existing = useFiber(child, element.props);
                    existing.ref = coerceRef(returnFiber, child, element);
                    existing.return = returnFiber;
                    return existing;
                }
            }
            // Didn't match.
            deleteRemainingChildren(returnFiber, child);
            break;
        } else { 
            // 没匹配到说明新的fiber节点无法从oldFiber节点新建
            // 删除掉所有oldFiber节点
            deleteChild(returnFiber, child);
        }
        child = child.sibling;
    }
    //oldFiber链为空
    //...
}
```

### 多节点

*多节点有四种可能 更新 新增 删除 移动，多节点的情况一定是属于这四种情况的任意组合 会调用`reconcileChildrenArray`来进行diff，它会以newChildren为主体进行最多三轮遍历，但这三轮遍历并不是相互独立的，事实上只有第一轮是从头开始的，之后的每一轮都是上轮结束的断点继续。实际上在平时的实践中，节点自身的更新是最多的，所以Diff算法会优先处理更新的节点。因此三轮遍历又可以按照场景分为两部分：*

第一轮是针对节点自身属性更新，剩下的两轮依次处理节点的新增、移动

#### 节点更新

第一轮从头开始遍历newChildren，会逐个与oldFiber链中的节点进行比较，判断节点的key或者tag是否有变化。

-   没变则从oldFiber节点clone一个props被更新的fiber节点，新的props来自newChildren中的新节点，这样就实现了节点更新。
-   有变化说明不满足复用条件，立即中断遍历进入下边的遍历。Diff算法的复杂度也因为这个操作大幅降低。

```jsx
  function reconcileChildrenArray(returnFiber: Fiber,currentFirstChild: Fiber | null,newChildren: Array<*>,lanes: Lanes,): Fiber | null {
    let resultingFirstChild: Fiber | null = null;//第一个子节点
    let previousNewFiber: Fiber | null = null;//节点指针工具
    let oldFiber = currentFirstChild;//oldFiber节点，新的child节点会和它进行比较
    let lastPlacedIndex = 0;//最后的固定节点
    let newIdx = 0;//遍历下标
    let nextOldFiber = null;//指向接下来的Fiber
    //第一遍从头开始遍历
      //!更新遍历
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // newChildren遍历完了，oldFiber链没有遍历完，此时需要中断遍历
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;//newChildren没遍历完
      }
      const newFiber = updateSlot(//进行判断 如果 key 和 tag。任意一个不同，则返回null
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber === null) {//说明不是节点的更新，直接跳出
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        // shouldTrackSideEffects 为true表示是更新过程
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);//记录固定节点位置
      if (previousNewFiber === null) { // 将新fiber连接成以sibling为指针的单向链表
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      // 将oldFiber节点指向下一个，与newChildren的遍历同步移动
      oldFiber = nextOldFiber;
    }
      ...
  }
```

**关于移动节点的参照物**

我们来看一个例子，假设新旧的节点如下：

旧： A - B - `C - D` - E

新： A - B - `D - C`

在本轮遍历中，会遍历`A - B - D - C`。A和B都是key没变的节点，可以直接复用，但当遍历到D时，发现key变化了，跳出当前遍历。

例子中A 和 B是自身发生更新的节点，后面的D 和 C我们看到它的位置相对于oldFiber链发生了变化，会往下走到处理移动节点的循环中。

为了方便说明，把保留在原位的节点称为固定节点。经过这次循环的处理，可以看出固定节点是A 和 B。在newChildren中，最靠右的固定节点的位置至关重要，对于后续的移动节点的处理来说，它的意义是**提供参考位置**。所以，每当处理到最后一个固定节点时，要记住此时它的位置，这个位置就是`lastPlacedIndex`。关键代码如下：

```
let newIdx = 0;
for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
   ...
   // 跳出逻辑
   ...
   // 如果不跳出，记录最新的固定节点的位置
   lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
   ...
}
```

`placeChild`方法实际上是移动节点的方法，但当节点无需移动的时候，会返回当前节点的位置，对于固定节点来说，因为无需移动，所以返回的就是固定节点的index。

#### 额外节点删除(更新操作不跳出)

```jsx
// 处理节点删除。新子节点遍历完，说明剩下的oldFiber都是没用的了，可以删除.
    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      if (getIsHydrating()) {
        const numberOfForks = newIdx;
        pushTreeFork(returnFiber, numberOfForks);
      }
      return resultingFirstChild;
    }
```

`deleteRemainingChildren`调用了`deleteChild`，值得注意的是，删除不仅仅是标记了effectTag为Deletion，还会将这个被删除的fiber节点添加到父级的effectList中。

```jsx
function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  ...
  const last = returnFiber.lastEffect;
  // 将要删除的child添加到父级fiber的effectList中，并添加上effectTag为删除
  if (last !== null) {
    last.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
  childToDelete.nextEffect = null;
  childToDelete.effectTag = Deletion;
}
```

### 新增

```jsx
 if (oldFiber === null) {//当oldFiber为null 说明oldFiber链已经遍历完
      for (; newIdx < newChildren.length; newIdx++) {//这时接着newIdx继续遍历
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      if (getIsHydrating()) {
        const numberOfForks = newIdx;
        pushTreeFork(returnFiber, numberOfForks);
      }
      return resultingFirstChild;
    }
```

### 移动

这里要用到`lastPlacedIndex`，在newChildren剩余的节点中，都是不确定要不要移动的，直接遍历他们，通过key去获取对应oldFiber所在oldFiber链中的位置（旧位置），还需要newChildren节点所处位置(下标索引)

如果旧位置在lastPlacedIndex的**右边**，说明这个节点位置不变。 原因是旧位置在lastPlacedIndex的**右边**，而新节点的位置也在它的**右边**，所以它的位置没变化。因为位置不变，所以它成了固定节点，把lastPlacedIndex更新成新位置。

如果旧位置在lastPlacedIndex的左边，当前这个节点的位置要往右挪。 原因是旧位置在lastPlacedIndex的**左边**，新位置却在lastPlacedIndex的**右边**，所以它要往右挪，但它不是固定节点。此时无需更新lastPlacedIndex。

```jsx
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
 for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
              //!从映射中删除
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
```

## 源码

```jsx
function reconcileChildrenArray(
returnFiber: Fiber,
 currentFirstChild: Fiber | null,
 newChildren: Array<*>,
 lanes: Lanes,
): Fiber | null {
    /*
    * returnFiber：currentFirstChild的父级fiber节点
    * currentFirstChild：当前执行更新任务的WIP（fiber）节点
    * newChildren：组件的render方法渲染出的新的ReactElement节点
    * lanes：优先级相关
    * */

    // resultingFirstChild是diff之后的新fiber链表的第一个fiber。
    let resultingFirstChild: Fiber | null = null;
    // resultingFirstChild是新链表的第一个fiber。
    // previousNewFiber用来将后续的新fiber接到第一个fiber之后
    let previousNewFiber: Fiber | null = null;

    // oldFiber节点，新的child节点会和它进行比较
    let oldFiber = currentFirstChild;
    // 存储固定节点的位置
    let lastPlacedIndex = 0;
    // 存储遍历到的新节点的索引
    let newIdx = 0;
    // 记录目前遍历到的oldFiber的下一个节点
    let nextOldFiber = null;

    // 该轮遍历来处理节点更新，依据节点是否可复用来决定是否中断遍历
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
        // newChildren遍历完了，oldFiber链没有遍历完，此时需要中断遍历
        if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
        } else {
            // 用nextOldFiber存储当前遍历到的oldFiber的下一个节点
            nextOldFiber = oldFiber.sibling;
        }
        // 生成新的节点，判断key与tag是否相同就在updateSlot中
        // 对DOM类型的元素来说，key 和 tag都相同才会复用oldFiber
        // 并返回出去，否则返回null
        const newFiber = updateSlot(
            returnFiber,
            oldFiber,
            newChildren[newIdx],
            lanes,
        );

        // newFiber为 null说明 key 或 tag 不同，节点不
        // 可复用，中断遍历
        if (newFiber === null) {
            if (oldFiber === null) {
                // oldFiber 为null说明oldFiber此时也遍历完了
                // 是以下场景，D为新增节点
                // 旧 A - B - C
                // 新 A - B - C - D
                oldFiber = nextOldFiber;
            }
            break;
        }
        if (shouldTrackSideEffects) {
            // shouldTrackSideEffects 为true表示是更新过程
            if (oldFiber && newFiber.alternate === null) {
                // newFiber.alternate 等同于 oldFiber.alternate
                // oldFiber为WIP节点，它的alternate 就是 current节点

                // oldFiber存在，并且经过更新后的新fiber节点它还没有current节点,
                // 说明更新后展现在屏幕上不会有current节点，而更新后WIP
                // 节点会称为current节点，所以需要删除已有的WIP节点
                deleteChild(returnFiber, oldFiber);
            }
        }
        // 记录固定节点的位置
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        // 将新fiber连接成以sibling为指针的单向链表
        if (previousNewFiber === null) {
            resultingFirstChild = newFiber;
        } else {
            previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;

        // 将oldFiber节点指向下一个，与newChildren的遍历同步移动
        oldFiber = nextOldFiber;
    }

    // 处理节点删除。新子节点遍历完，说明剩下的oldFiber都是没用的了，可以删除.
    if (newIdx === newChildren.length) {
        // newChildren遍历结束，删除掉oldFiber链中的剩下的节点
        deleteRemainingChildren(returnFiber, oldFiber);
        return resultingFirstChild;
    }

    // 处理新增节点。旧的遍历完了，能复用的都复用了，所以意味着新的都是新插入的了
    if (oldFiber === null) {
        for (; newIdx < newChildren.length; newIdx++) {
            // 基于新生成的ReactElement创建新的Fiber节点
            const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
            if (newFiber === null) {
                continue;
            }
            // 记录固定节点的位置lastPlacedIndex
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
            // 将新生成的fiber节点连接成以sibling为指针的单向链表
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
        }
        return resultingFirstChild;
    }
    // 执行到这是都没遍历完的情况，把剩余的旧子节点放入一个以key为键,值为oldFiber节点的map中
    // 这样在基于oldFiber节点新建新的fiber节点时，可以通过key快速地找出oldFiber
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // 节点移动
    for (; newIdx < newChildren.length; newIdx++) {
        // 基于map中的oldFiber节点来创建新fiber
        const newFiber = updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            newChildren[newIdx],
            lanes,
        );
        if (newFiber !== null) {
            if (shouldTrackSideEffects) {
                if (newFiber.alternate !== null) {
                    // 因为newChildren中剩余的节点有可能和oldFiber节点一样,只是位置换了，
                    // 但也有可能是是新增的.

                    // 如果newFiber的alternate不为空，则说明newFiber不是新增的。
                    // 也就说明着它是基于map中的oldFiber节点新建的,意味着oldFiber已经被使用了,所以需
                    // 要从map中删去oldFiber
                    existingChildren.delete(
                        newFiber.key === null ? newIdx : newFiber.key,
                    );
                }
            }

            // 移动节点，多节点diff的核心，这里真正会实现节点的移动
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
            // 将新fiber连接成以sibling为指针的单向链表
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
        }
    }

    if (shouldTrackSideEffects) {
        // 此时newChildren遍历完了，该移动的都移动了，那么删除剩下的oldFiber
        existingChildren.forEach(child => deleteChild(returnFiber, child));
    }
    return resultingFirstChild;
}

if (shouldTrackSideEffects) {
    //清空existingChildren
    existingChildren.forEach(child => deleteChild(returnFiber, child));
}
```



## 总结

diff 通过key和tag去对render函数的结果与current的fiber进行比较，从而找出真正需要更新的节点。diff对于单节点(newChildren为单一节点)与多节点有着不同的处理方式。对于多节点来说，React会进行3次遍历分别去处理 更新、新增、移动，在这其中穿插着一些无用节点删除操作，最后还有一次无用节点删除(清空existingChildren)。3次遍历并非3次都是从头遍历，只有更新是从头开始，后面两次都是基于上轮结束的断点继续。通过记录固定节点位置的方式去处理节点移动的情况。对oldFiber和新的ReactElement节点的比对，将会生成新的fiber节点，同时标记上effectTag。这些被打上flag的fiber会在completeWork阶段被收集起来，形成一个effectList链表，只包含这些需要操作的fiber，最后在commit阶段被更新掉

## 参考链接

[Diff](https://github.com/neroneroffy/react-source-code-debug/blob/master/docs/render%E9%98%B6%E6%AE%B5/beginWork%E9%98%B6%E6%AE%B5/Diff%E7%AE%97%E6%B3%95.md)