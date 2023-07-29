# 提供者Content

将记录以下相关内容：

+   `context`使用方式。
+   提供者 `Provider `特性和三种消费者模式。
+   动态context
+   `context `与 `props `和 `react-redux` 的对比
+   `context `的高阶用法。

## context使用方式

```jsx
const SelfContext  = React.createContext(null);//创建一个context对象
const ContextProvider = SelfContext.Provider;//提供者
const ContextConsumer = SelfContext.Consumer;//订阅消费者
```

## 提供者 Provider 特性

### `Provider`用法

provider 作用有两个：

-   `value `属性传递 `context`，供给 `Consumer `使用。
-   `value `属性改变，`ContextProvider`会让消费 `Provider value` 的组件重新渲染。

```jsx
const SelfContext  = React.createContext(null);//创建一个context对象
const ContextProvider = SelfContext.Provider;//提供者
function App(){
    const [Count,setCount] = useState(0);
    return (
        <ContextProvider value={{count:Count}}>
            <Son/> 
        </ContextProvider>
    )
}
```

## 三种消费者模式

### 类组件 `contextType `方式

`React v16.6` 提供了 `contextType `静态属性，用来获取上面 `Provider `提供的 `value `属性
类组件的静态属性上的 `contextType `属性，指向需要获取的 `context`（ demo 中的 `SelfContext`），就可以方便获取到最近一层 `Provider`提供的 `contextValue `值。**这种方式只适用于类组件。**

```jsx
const SelfContext  = React.createContext(null);//创建一个context对象
const ContextProvider = SelfContext.Provider;//提供者
function App(){
    const [Count,setCount] = useState(0);
    return (
        <ContextProvider value={{count:Count}}>
            <Son/> 
        </ContextProvider>
    )
}
class Son extends React.Component{
     render(){
       const { count } = this.context
       return <div  >消费者{count}</div> 
   }
}
Son.contextType  = SelfContext;
```

### 函数组件 `useContext `方式

`useContext `接受一个参数，就是想要获取的 `context `，返回一个 `value `值，就是最近的 `provider`提供 `contextValue` 值。

```jsx
const SelfContext = React.createContext(null);//?创建context对象
const ContextProvider = SelfContext.Provider;
function Son() {
    const ContextValue = React.useContext(SelfContext);
    return (
        <div>{ContextValue.num}</div>
    )

}
export default class App extends React.Component {
    state = { num: 0 }
    node = null
    render() {
        return <div >
            <ContextProvider value={{ num: this.state.num }}>
                <Son></Son>
            </ContextProvider>
            <button onClick={() => this.setState({ num: this.state.num + 1 })} >点击</button>
        </div>
    }
}
```

###  订阅者 `Consumer `方式

`Consumer `订阅者采取 `render props` 方式，接受最近一层 `provider`中`value `属性，作为 `render props` 函数的参数，说白了就是 `context `变成了 `props`。

```jsx
const SelfContext = React.createContext(null);//?创建context对象
const ContextProvider = SelfContext.Provider;
const ContextConsumer = SelfContext.Consumer;
function SonSon(props) {
    const { num } = props;
    return (
        <div>{num}</div>
    )
}
function Son() {
    return (
        <ContextConsumer>
            {(res) => {
                console.log(res);
                return <SonSon {...res} />
            }}
        </ContextConsumer>
    )
}
export default class App extends React.Component {
    state = { num: 0 }
    node = null
    render() {
        return <ContextProvider value={{ num: this.state.num }}>
            <Son></Son>
        </ContextProvider>

    }
}
```

**总结：在 `Provider`里 `value `的改变，会使引用`contextType`,`useContext` 消费该 context 的组件重新 render ，同样会使 `Consumer`的 `children`函数重新执行，与前两种方式不同的是 `Consumer`方式，当 `context `内容改变的时候，不会让引用 `Consumer`的父组件重新更新。**

## 动态context

Provider 模式下 context 有一个显著的特点，就是 **`Provder` 的 `value` 改变，会使所有消费 `value` 的组件重新渲染**。实际的场景下，`context` 可能是动态的，所以就会有一个问题，当`context`依赖于`state`时，如果`state`改变，则所有消费者会更新，这样消费者的`children`也会由于消费者更新而更新，怎样去避免`children`不必要的渲染呢

第一种就是利用 `memo`，`pureComponent`对子组件 `props` 进行浅比较处理。**`memo`只会比较`props`，当然如果`state`、`context`改变还是会执行更新**

```jsx
const SelfContext = React.createContext(null);//?创建context对象
const ContextProvider = SelfContext.Provider;
function Demo2() {
    console.log("Demo2重新渲染");
    return (
        <div>111</div>
    )
}
const Demo3 = React.memo(() => <Demo2 />)//Son中依赖于context，context的value改变会导致视图重新渲染，但是Demo2不会随着再次渲染，如果把Demo3改为Demo2，则Demo2会重新渲染
function Son() {
    const ContextValue = React.useContext(SelfContext);
    return (
        <div>
            <div>{ContextValue.num}</div>
            <Demo3></Demo3>
        </div>

    )
}
export default function App() {
    const [num, setnum] = useState(0)
    return <div >
        <ContextProvider value={{ num }}>
            <Son></Son>
        </ContextProvider>
        <button onClick={() => setnum(num + 1)} >点击</button>
    </div>
}
```

第二种就是 `React `本身对 `React element` 对象的缓存。`React `每次执行 `render `都会调用 `createElement `形成新的 `React element` 对象，如果把 `React element `缓存下来，下一次调和更新时候，就会跳过该 `React element` 对应 `fiber` 的更新。

```jsx
<ThemeProvider value={ contextValue } >
    { React.useMemo(()=>  <Son /> ,[]) }
</ThemeProvider>
```

## context 与 props 和 react-redux 的对比

`context`解决了：

-   解决了 `props `需要每一层都手动添加 `props `的缺陷。
-   解决了改变 `value `，组件全部重新渲染的缺陷。

`react-redux `就是通过 `Provider `模式把 `redux `中的 `store`注入到组件中的。

## context 的高阶用法

### 嵌套 `Provider`

多个 Provider 之间可以相互嵌套，来保存/切换一些全局数据

### 逐层传递`Provider`

Provider 还有一个良好的特性，就是可以逐层传递 context ，也就是一个 `context `可以用多个 `Provder `传递，下一层级的 `Provder `会覆盖上一层级的 `Provder `。React-redux 中 `connect`就是用这个良好特性传递订阅器的。

## 总结

+   context使用：`createContext()`
+   订阅者 `Consumer `方式
+   函数组件 `useContext `方式
+   类组件 `contextType `方式
+   可以用memo解决由`state`改变引起`context`改变进而导致依赖于context的节点的children不必要更新
+   解决了 `props `需要每一层都手动添加 `props `的缺陷。
+   解决了改变 `value `，组件全部重新渲染的缺陷。
+   `react-redux` 就是通过 `Provider `模式把 `redux `中的 `store `注入到组件中的。
+   嵌套 `Provider`和逐层传递`Provider`
