# Hooks

## 1.对Hooks的理解

Hooks是一套能够让函数式组件更强大、更灵活的钩子，对于函数组件来说，在没有Hooks之前，他相比于类式组件缺少了很多功能，比如state、生命周期等等，有非常多的局限性。而Hooks的出现就正好帮助函数组件补齐了一些功能。

## 2.为什么 useState 要使用数组而不是对象

使用数组的话，可以直接对数组的元素进行命名，这样更加方便一些，如果使用对象的话，还需要再解构的时候设置别名才行，就相对来说比较麻烦

## 3.React Hooks 解决了哪些问题？

1、没有hooks之前使用 `render props`和 `HOC`进行一些逻辑的复用，这类方案需要重新组织组件结构，就变得很麻烦，使用Hooks可以从组件中提取状态逻辑，解决了在组件之间复用状态逻辑很难的问题；

2、在类组件中，可能一些相关的逻辑，分布在不同的生命周期函数里，而不相关的代码却在同一个方法中组合在一起。如此很容易产生 bug，并且导致逻辑不一致。Hooks将组件中相互关联的部分拆分成更小的函数，而非强制按照生命周期划分，解决了复杂组件的问题；

3、在非class的情况下使用更多的React特性，解决了class组件与函数组件有差异的问题。

## 4. React Hook 的使用限制有哪些？

不要在循环、条件或嵌套函数中调用 Hook，因为 Hooks 的设计是基于数组实现的一个链表。在调用时按顺序加入数组中，如果使用循环、条件或嵌套函数很有可能导致数组取值错位，执行错误的 Hook。所以应当在 React 的函数组件中调用 Hook。

## 5. useEffect 与 useLayoutEffect 的区别

共同点：

+   都是负责处理副作用的函数，比一些DOM的改变，请求数据等等。在函数组件内部操作副作用是不被允许的，所以需要使用这两个函数去处理。
+   使用方式可以直接相互替换

不同点：

+   执行时机不同，useLayoutEffect在浏览器更新完毕，但还未渲染到屏幕之前执行，而useEffect是在浏览器渲染完成之后在去执行
+   effect处理时机不同，useLayoutEffect产生的effect在commit阶段的layout阶段被同步处理(浏览器更新完毕，但还未渲染到屏幕之前执行)，而useEffect产生的effect在渲染完成之后被执行
+   执行时机不同，useLayoutEffect函数在mutation阶段执行得到effect，而useEffect函数在layout阶段执行得到effect
+   useEffect是异步执行的，不会阻塞渲染，而useLayoutEffect是同步执行的，会阻塞渲染。

## 6. React Hooks 和生命周期的关系？

Hooks是一套能够增强函数组件功能的钩子，函数组件没有生命周期，但是由于Hooks的引入，使用了Hooks的函数组件也有了生命周期的概念，比如可以调用useState来初始化state，这和类式组件的构造函数作用相似，useEffect函数相当于ComponentDidMount和componentDidUpdate和componentWillUnmount结合
