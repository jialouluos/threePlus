# 起源Component

## 什么是React组件

```jsx
//类
class MyClass {
  sayHello = () => console.log("我在类实例上")
  seyHello(){
    console.log("我在原型上")
  }
  static param ="我是类本身的属性";
  param_2 = "我是实例身上的属性"
}
//类组件
class App extends React.Component{
    state ={message:"我是类组件"}
    sayHello = () => console.log("我在类实例上")
    seyHello(){
        console.log("我在原型上")
    }
    return(){
        return <div onClikc={this.sayHello}>{this.state.message}</div>
    }
}
//函数
function MyFunc(){
    return "我是函数"
}
//函数组件
function App_Func(){
    const [message,setMessage] = useState("我是一个函数组件，我是初始值！")
    return <div onClick={()=> setMessage("我是一个函数组件，我是更新值！")}>{message}</div>
}
```

+   组件的本质是类/函数，只不过组件还承载着渲染视图的UI和更新视图的setState、useState等方法。
+   在React调和渲染`fiber`节点时，如果发现`fiberTag`为0，则按照函数组件的逻辑处理，如果发现`fiberTag`为1，则按照类组建的逻辑处理

## 类组件



### 定义

在class组件中，除了继承`React.Component`外，底层还加入了`updater`对象,**组件中调用的`setState`、`forceUpdate`本质上是调用了`updater`对象上的`enqueueSetState`和`enqueueForceUpdate`方法**

```jsx
function Component(props, context, updater) {
  this.props = props;      //绑定props
  this.context = context;  //绑定context
  this.refs = emptyObject; //绑定ref
  this.updater = updater || ReactNoopUpdateQueue; //上面所属的updater 对象
}
/* 绑定setState 方法 */
Component.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
}
/* 绑定forceupdate 方法 */
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
}
```

+   React在实例化类组件之后会单独绑定updater对象

### 问与答

1.  如果没有在 constructor 的 super 函数中传递 props，那么接下来 constructor 执行上下文中就获取不到 props ，这是为什么呢？

    ```jsx
    /* 假设我们在 constructor 中这么写 */
    constructor(){
        super()
        console.log(this.props) // 打印 undefined 为什么?
    }
    ```

    +   绑定 props 是在父类 Component 构造函数中，执行 super 等于执行 Component 函数，此时 props 没有作为第一个参数传给 super() ，在 Component 中就会找不到 props 参数，从而变成 undefined

2.  下面绑定了2个handleClick,点击div之后会打印什么呢

    ```jsx
    class Index extends React.Component{
        constructor(...arg){
           super(...arg)                        /* 执行 react 底层 Component 函数 */
        }
        state = {}                              /* state */
        static number = 1                       /* 内置静态属性 */
        handleClick= () => console.log(111)     /* 方法： 箭头函数方法直接绑定在this实例上 */
        componentDidMount(){                    /* 生命周期 */
            console.log(Index.number,Index.number1) // 打印 1 , 2 
        }
        render(){                               /* 渲染函数 */
            return <div style={{ marginTop:'50px' }} onClick={ this.handerClick }  >hello,React!</div>
        }
    }
    Index.number1 = 2                           /* 外置静态属性 */
    Index.prototype.handleClick = ()=> console.log(222) /* 方法: 绑定在 Index 原型链的 方法*/
    ```

    +   111，在class内部，箭头函数是直接绑定在实例对象上的，而第二个handleClick是绑定在prototype原型链上的，他们的优先级是:实例对象上方法属性>原型链对象上方法属性

## 函数组件

+   不要尝试给函数组件 prototype 绑定属性或方法，即使绑定了也没有任何作用，因为通过上面源码中 React 对函数组件的调用，是采用直接执行函数的方式，而不是通过new的方式。

### 问与答

1.  函数组件和类组件本质的区别是什么呢？
    +   **对于类组件来说，底层只需要实例化一次，实例中保存了组件的 state 等状态。对于每一次更新只需要调用 render 方法以及对应的生命周期就可以了。但是在函数组件中，每一次更新都是一次新的函数执行，一次函数组件的更新，里面的变量会重新声明。**
    +   为了能让函数组件可以保存一些状态，执行一些副作用钩子，React Hooks 应运而生，它可以帮助记录 React 中组件的状态，处理一些额外的副作用。

