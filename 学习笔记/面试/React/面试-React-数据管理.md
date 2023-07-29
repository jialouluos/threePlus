# 数据管理

## 1.setState调用原理

在一次`setState\useState`后，`dispatchAction`被触发

在老版本中会调用enqueueSetState去将新的state放进组件的状态队列里，并调用enqueueUpdate去处理将要更新的实例对象，在enqueueUpdate里有一个锁，这个锁专门用来管理批量更新的对象，在执行更新动作的时候会将锁置为true，更新完之后又会置为false这样后续的更新操作只能够暂时进入等待队列中等待下一次批量更新。而不能随意插队

而在V17之后则是通过更新优先级去实现批处理，在该函数内会创建一个更新优先级，并调用`enqueueUpdate`将其放入`updateQueue`等待后续更新处理，多次调用`setState`会生成多个`update`对象，在后续处理中会循环该updateQueue，相同优先级的被合并更新，低优先级再次调度，如此重复，直到没有更新任务为止，之后便执行render函数和diff、 打上effectTag，等待completeWork阶段收集，在commit阶段进行DOM处理

值得注意的是在V18版本之前，React不会批处理外部事件，例如包裹在setTimeout、Promise等里面的setState，但是可以手动解决，而在V18之后，所有事件的更新都会进行批处理，无论它来自哪里。

## 2.React setState 调用之后发生了什么？是同步还是异步？

在V17之前，**由React引发的事件处理（比如通过onClick引发的事件处理），调用setState不会同步更新this.state，除此之外的setState调用会同步执行this.state** ，比如绕过React通过addEventListener直接添加的事件处理函数，还有通过setTimeout/setInterval产生的异步调用。在setState实现函数中，会根据一个批量更新锁去决定是否批量更新，如果锁为false，则setState会同步更新，如果为true，则会异步更新，在React事件被处理时会调用一个函数将这个锁置为true，这样由React控制的事件就不会同步的去更新state

在V17之后setState调用之后，会创建更新优先级，并调用`enqueueUpdate`将其放入`updateQueue`等待后续更新处理，多次调用`setState`会生成多个`update`对象，在后续处理中会循环该updateQueue，相同优先级的被合并更新，低优先级再次调度，如此重复，直到没有更新任务为止，之后便执行render函数和diff、 打上effectTag，等待completeWork阶段收集，在commit阶段进行DOM处理

这里的同步和异步都指的是更新，而不是执行，函数的执行过程和代码都是同步的，只是合成时间和钩子调用顺序在更新之前，这样看起来就是异步的。

如果同步的话，调用一次，就会走一遍setState更新流程，性能是不好的，所以setState是异步，这样就可以把多个setState合并为一次组件更新，在V18之前还存在着外部事件会同步处理，而在V18之后，所有事件都会进行异步处理

## 3.React中的setState批量更新的过程是什么？

调用 `setState` 时，组件的 `state` 并不会立即改变， 会创建一个update对象和更新优先级，然后放入队列，在后续会依照更新优先级去进行同优先级合并更新，将多次 `setState` 的状态修改合并成一次状态修改，最终更新只产生一次组件及其子组件的重新渲染。

值得注意的是多次setState合并，对于相同的属性，之后保留最后一次的更新

## 4.React中有使用过getDefaultProps吗？它有什么作用？

是一种ES5写法，属性设置默认值

## 5.React中setState的第二个参数作用是什么？

是一个可选的回调函数，在组件重新渲染后执行，会拿到更新之后的state值，但是建议使用componentDidUpdate代替该方式

## 6.React中的setState和replaceState的区别是什么？

setState 倾向于合并，replaceState倾向于整体替换

## 7.在React中组件的this.state和setState有什么区别？

this.state通常是用来初始化state的，setState是用来修改state值,如果想要改变state的值，使用setState去改变才会使页面同步更新，直接修改state，页面是不会更新的

## 8. React组件的state和props有什么区别？

props是一个从外部传进组件的参数，主要作为就是从父组件向子组件传递数据，它具有可读性和不变性，只能通过外部组件主动传入新的props来重新渲染子组件，否则子组件的props以及展现形式不会改变。

state的主要作用是用于组件保存、控制以及修改自己的状态，它在constructor中初始化，它算是组件的私有属性，不可通过外部访问和修改，只能通过组件内部的this.setState来修改，修改state属性会导致组件的重新渲染。

props 是传递给组件的（类似于函数的形参），而state 是在组件内被组件自己管理的（类似于在一个函数内声明的变量）。

props 是不可修改的，所有 React 组件都必须像纯函数一样保护它们的 props 不被更改。

state 是在组件中创建的，一般在 constructor中初始化 state。state 是多变的、可以修改，每次setState都异步更新的。

## 9. React中的props为什么是只读的？

保证数据单向流动，从父组件流向子组件

## 10.对纯函数的理解

给定相同的输入，总是返回相同的输出。过程没有副作用。不依赖外部状态。

## 11. 在React中组件的props改变时更新组件的有哪些方法？

getDerivedStateFromProps，`getDerivedStateFromProps`是一个静态函数，也就是这个函数不能通过this访问到class的属性，也并不推荐直接访问属性。而是应该通过参数提供的nextProps以及prevState来进行判断，根据新传入的props来映射到state。如果props传入的内容不需要影响到你的state，那么就需要返回一个null，这个返回值是必须的，所以尽量将其写到函数的末尾

## 12. React中怎么检验props？验证props的目的是什么？

**React**为我们提供了**PropTypes**以供验证使用，防止传入的数据与预期不符而导致的各种错误，如果使用了TypeScript则可以直接定义接口来实现验证

