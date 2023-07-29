# 基础篇-认识JSX

## JSX模板一(下面的案例将参考这个模板)

```jsx
import React, { Component } from 'react'
const learnList = [ 'JS' , 'WebGL' , 'Vue' , 'React'  ]
const FuncComponent = ()=> <div> 我是一个函数组件</div> 
export default class App extends Component {
    status = false /* 状态 */
    renderFoot=()=> <div>我是执行App中方法返回的结果</div>
    render(){
        /* 以下都是常用的jsx元素节 */
        return <div style={{ marginTop:'100px' }}   >
            { /* element 元素类型 */ }
            <div>你好,React</div>
            { /* fragment 类型 */ }
            <React.Fragment>
                <div>我是Fragment中的div</div>
            </React.Fragment>
            { /* text 文本类型 */ }
            我是一个纯文本 
            { /* 数组节点类型 */ }
            { learnList.map((item,idnex)=> <div key={item} >我是数组中的第{idnex+1}个元素，我叫 { item } </div> ) }
            { /* 组件类型 */ }
            <FuncComponent/>
            { /* 三元运算 */  }
            { this.status ? <FuncComponent /> : <div>这里是三元运算</div> }
            { /* 函数执行 */ } 
            { this.renderFoot() }
            <button onClick={ ()=> console.log( this.render() ) } >打印render后的内容</button>
        </div>
    }
}
```

![image-20220506153549839](C:\Users\86157\AppData\Roaming\Typora\typora-user-images\image-20220506153549839.png)

## JSX编译(babel)

+   JSX会被babel编译转换为供浏览器识别的JS，其中的JSX元素节会被编译成React.Element的形式

    ### React.createElement

    +   用法

    ```jsx
    React.createElement(
        type,//如果是组件类型，会传入组件相对应的类或者函数，如果是dom元素，则会传入标签类型的字符串
        [props],//一个对象，如果是dom则为标签属性，如果是组件则为props
        [...childen]//其他参数，依次为children,根据顺序排序
    )
    ```

    +   用例

    ```jsx
    <div>
        <FuncComponent name={"func"}/>
        <div style={{ marginTop:'100px' }}>你好,Div</div>
        这是Text!
    </div>
    //上面这段代码会被babel编译成
    React.createElement("div",null,
                        React.createElement(FuncComponent,{name:"func"}),
                        React.createElement("div",{style:{ marginTop:'100px' }},
                                            你好,Div),
                        这是Text!)
    ```

    ### React.createElement处理之后的案例对象结构(JSX模板一)

    ![image-20220506153434120](C:\Users\86157\AppData\Roaming\Typora\typora-user-images\image-20220506153434120.png)

    +   转换规则

        | `JSX`元素类型     | `React.createElement`转换后                                  | `type`                           |
        | ----------------- | ------------------------------------------------------------ | -------------------------------- |
        | `element`元素类型 | `react.element`                                              | 标签类型的字符串                 |
        | `fragment`        | `react.element`                                              | `Symbol(react.fragment)`         |
        | 文本              | 字符串                                                       | 无                               |
        | 数组              | 一个数组结构，每个元素都被React.createElement转换并匹配相应转换规则 | 无                               |
        | 组件              | `react.element`                                              | 组件类或者组件函数本身           |
        | 三元/表达式       | `react.element`                                              | 返回结果/计算结果                |
        | 函数              | 执行函数，按返回结构匹配相应规则                             | 执行函数，按返回结构匹配相应规则 |

    ### React底层调和处理后，最终变成什么

    +   Fiber

        +   含义

            1.  `React 15` 的Reconciler(协调器)采用的是不可中断的递归，被称为`Stack Reconciler`,而`React 16`的Reconciler是基于`Fiber`实现的，是一种可中断的循环，被称为`Fiber Reconciler`
            2.  作为静态的数据结构来说，每一个element节点都有一个对应的Fiber对象,保存该组件的类型以及DOM节点的信息
            3.  作为动态的工作单元来说,每一个Fiber节点保存了本次更新中组件改变的状态和要执行的操作

        +   不同的fiber Tag

            ```js
            export const FunctionComponent = 0;       // 函数组件
            export const ClassComponent = 1;          // 类组件
            export const IndeterminateComponent = 2;  // 初始化的时候不知道是函数组件还是类组件 
            export const HostRoot = 3;                // Root Fiber 可以理解为根元素 ， 通过reactDom.render()产生的根元素
            export const HostPortal = 4;              // 对应  ReactDOM.createPortal 产生的 Portal 
            export const HostComponent = 5;           // dom 元素 比如 <div>
            export const HostText = 6;                // 文本节点
            export const Fragment = 7;                // 对应 <React.Fragment> 
            export const Mode = 8;                    // 对应 <React.StrictMode>   
            export const ContextConsumer = 9;         // 对应 <Context.Consumer>
            export const ContextProvider = 10;        // 对应 <Context.Provider>
            export const ForwardRef = 11;             // 对应 React.ForwardRef
            export const Profiler = 12;               // 对应 <Profiler/ >
            export const SuspenseComponent = 13;      // 对应 <Suspense>
            export const MemoComponent = 14;          // 对应 React.memo 返回的组件
            ```

    +   JSX最终形成的Fiber结构图

       ![fiber](C:\Users\86157\Desktop\fiber.png)

       1.  child:一个由父级fiber指向子级fiber的指针
       2.  return:一个子级fiber指向父级fiber的指针
       3.  sibling:一个fiber指向下一个兄弟fiber的指针

    +   注意

        1.  对于map数组结构的子节点，外层会被加上Fragment
        2.  map返回数组结构，作为Fragment的子节点
    ### 问与答
    1.  为什么老版本的React，要在jsx文件里面默认引入React
    
        ```jsx
        import React from 'react'
        function Index(){
            return <div>hello,world</div>
        }
        ```
    
        +   因为 jsx 在被 babel 编译后，写的 jsx 会变成上述 React.createElement 形式，所以需要引入 React，防止找不到 React 引起报错。
    
    ## 进阶实践
    
    上面的 demo 暴露出了如下问题：
    
    1.  返回的 `children` 虽然是一个数组，但是数组里面的数据类型却是不确定的，有对象类型( 如`ReactElement` ) ，有数组类型(如 `map` 遍历返回的子节点)，还有字符串类型(如文本)；
    2.  无法对 render 后的 React element 元素进行可控性操作。
    
    针对上述问题，我们需要对demo项目进行改造处理，具体过程可以分为4步：
    
    1.  将上述children扁平化处理，将数组类型的子节点打开 ；
    2.  干掉children中文本类型节点；
    3.  向children最后插入`say goodbye`元素；
    4.  克隆新的元素节点并渲染。
    
    ### 扁平化处理
    
    +   使用`React.Children.toArray`来实现扁平化,`React.Children.toArray`可以扁平化、规范化React.element的children组成的数组,只要`children`中的数组元素被打开，对遍历children很有帮助，`React.Children.toArray`可以深层次flat
    
        ```jsx
        const handledChildren = React.Children.toArray(children);
        ```
    
    +   使用`React.Children.forEach`也可以实现扁平化，`React.Children.forEach` = `React.Children.toArray` + `Array.prototype.forEach`。
    
        ```jsx
        const newChildren = [];
        React.Children.forEach(children,(item)=>newChildren.push(item))
        ```
    
    +   两种方法得到的数组结果中key值不同，直接使用`React.Children.forEach`不会给非数组结构赋予`key`值(key:null),而`React.Children.toArray`会完整的给每一个`react.element`赋予`key`值
    
    ### 除去文本节点
    
    +   使用`React.isValidElement`,该方法用来检测元素是否为`React.element`，返回布尔值
    
        ```jsx
        const newChildren = [];
        React.Children.forEach(children,(item)=>React.isValidElement(item) && newChildren.push(item))
        ```
    
    +   除了用`React.Children.forEach`,也可以用`filter`
    
    ### 使用React.createElement
    
    +   插入一个`div`到`children`最后
    
        ```jsx
        const NewElementNode = React.createElement("div", {key:'.8'}, "我是创建出来的div");
        newChildren.push(NewElementNode);
        ```
    
    ### 使用React.cloneElement
    
    +   `cloneElement`的作用是以`element`元素为样板克隆并返回新的`React.element`元素，新返回的元素的`props`是将新的`props`与原始元素的`props`浅层合并后的结果
    
        ```jsx
        return React.cloneElement(OrginElement,{},...newChildren);
        ```
    
    ### 问与答
    
    1.  `React.createElement` 和 `React.cloneElement` 有什么区别
        +   可以理解为一个是创建`element`，一个是修改(`props`浅层合并)，并返回一个新的`React.element`对象
    
    ## 总结
    
    +   JSX 会先转换成 React.element，再转化成 React.fiber 
    +   了解element 类型与转化成 fiber 的 tag 类型的对应关系
    +   如何控制经过 render 之后的 React element 对象。
    
    ## 课代表
    
    +   讲了5个React API
        +   React.createElement（创建ReactElement）
        +   React.cloneElement （复用ReactElement）
        +   React.Children.toArray
        +   React.Children.forEach
        +   React.isValidElement（操作校验ReactElement)
    +   讲述了JSX和ReactElement的转换逻辑、ReactElement 转化成fiber对应的tag类型、fiber节点如何建立联系，以及React内部提供的便于手动加工处理ReactElement的工具函数
    +   三者关系：JSX --- babel编译 ---> ReactElement --- reconciler ---> fiber
    
    ## 更正
    
    +   [React17之后就不需要引入React](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
    
        +   **新的 JSX 转换**不是将 JSX 转换为`React.createElement`，而是自动从 React 包中的这些新入口点导入特殊函数并调用它们。
    
            ```jsx
            function App() {
              return <h1>Hello World</h1>;
            }
            //这是新的 JSX 转换将其编译为：
            import {jsx as _jsx} from 'react/jsx-runtime';
            function App() {
              return _jsx('h1', { children: 'Hello world' });
            }
            ```
    
        +   我们的原始代码如何**不再需要导入 React**来使用 JSX！（但我们仍然需要导入 React 才能使用 Hook 或 React 提供的其他导出。
    
    ## 参考链接
    
    [[React 进阶实践指南](https://juejin.cn/book/6945998773818490884)]
    
    [React 源码讲解第 4 节- Fiber 对象](https://blog.csdn.net/weixin_44135121/article/details/108723829)
