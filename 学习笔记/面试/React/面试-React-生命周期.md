# 生命周期

## 1.React的生命周期有哪些

+   装载过程-组件第一次在DOM树中被渲染的过程
    +   render阶段
        +   constructor 构造函数，如果不写，则会执行默认的构造函数执行，进行组件状态的初始化，给事件处理方法绑定this

        +   getDerivedStateFromProps 这是一个静态方法，不能在他里面调用this,他有两个参数 `nextProps` 和 `prevstate`，分别指接收到的新props参数和当前组件的 `state` 对象，这个函数会返回一个对象用来与当前的 `state` 对象进行合并更新，如果不需要合并可以返回 `null`。

        +   render 会根据状态 `state` 和属性 `props` 渲染组件,生成新的React.Element

    +   commit阶段
        +   componentDidMount，该函数会在组件挂载后(layout阶段)调用，一般在该阶段进行发送网络请求和执行以来DOM的操作，如果在该函数中调用setState，则会触发一次额外的渲染，但是他是在游览器刷新屏幕之前执行的，用户对此是没有感知的

+   更新过程-组件状态发生变化，重新更新渲染的过程

    +   render阶段

        +   getDerivedStateFromProps 

        +   shouldComponentUpdate 该函数用来控制是否渲染，通过比较`props`和`state`的变换去返回`true`或者`false`，当返回 `false` 时，组件的更新过程停止，后续的 `render`、`componentDidUpdate` 也不会被调用。这里可以做一些性能优化

        +   render

    +   commit

        +   getSnapshotBeforeUpdate 获取更新前的快照，这时候还可以获取到更新前的状态，发生在`before mutation`阶段有两个参数 `prevProps` 和 `prevState`，表示更新之前的 `props` 和 `state`。这个函数必须要和 `componentDidUpdate` 一起使用，并且要有一个返回值，默认是 `null`，这个返回值作为第三个参数传给 `componentDidUpdate`。

        +   componentDidUpdate 该函数会在组件更新后(layout阶段)调用，首次渲染不会执行，会得到最新的props和state和snapshot(getSnapshotBeforeUpdate()生命周期的返回值)

+   卸载过程-组件从DOM树中被移除的过程
    +   render阶段
    +   commit阶段
        +   componentWillUnmount 会在组件卸载及销毁之前直接调用

+   错误处理-子组件抛出错误后被调用
    +   componentDidCatch 有两个参数第一个参数是抛出的错误，第二个参数是包含错误的栈信息的对象

## 2. React 废弃了哪些生命周期？为什么？

**componentWillMount**，**componentWillReceiveProps**，**componentWillUpdate**，被废弃的三个函数都是在render之前，因为fber的出现，很可能因为高优先级任务的出现而打断现有任务导致它们会被执行多次。