# 渲染控制

将记录以下相关内容：

+   cloneElement(缓存React.Element对象)
+   useMemo(函数组件使用)
+   PureConponent(纯函数 props、state浅比较)
+   shouldComponentUpdate(生命钩子，自定义控制是否渲染)
+   memo(props浅比较)
+   打破渲染限制(跳过控制阀门)

## 前言

从调度更新到调和fiber再到浏览器渲染真实DOM，每一个环节都是render的一部分。对于每个环节的性能优化，React 在底层已经处理了大部分优化细节，包括设立任务优先级、异步调度、diff算法、时间分片都是 React 为了提高性能，提升用户体验采取的手段。

## cloneElement

有时候父组件render，子组件没有必要跟着一起render，这时候可以在父组件里缓存一下子组件的Element,再加以逻辑，达到阻断一些不必要的渲染的功能。

```jsx
function Son(props) {
    const { count, count2 } = props;
    const [Value, setValue] = useState(0)
    console.log("子组件被渲染了");
    return (
        <div className="tail">
            <div>count:{count}</div>
            <div>count2:{count2}</div>
            <div>Value:{Value}</div>
            <button onClick={() => { setValue(Value + 1) }}>Value++</button>
        </div >
    )
}
export default class App extends React.Component {
    state = {
        count: 0,
        count2: 0,
        count3: 0
    }
    update(name, value) {
        if (name === "count") this.setState({ count: value })
        if (name === "count2") this.setState({ count2: value })
        if (name === "count3") this.setState({ count3: value })
    }
    render() {
        return (
            <div>
                <Son count2={this.state.count2} count={this.state.count}></Son>
                <button onClick={() => { this.update("count", this.state.count + 1) }}>count++</button>
                <button onClick={() => { this.update("count2", this.state.count2 + 1) }}>count2++</button>
                <button onClick={() => { this.update("count3", this.state.count3 + 1) }}>count3++</button>
            </div >
        )
    }

}
```

比如在父组件更新count3的时候，子组件数据没有依赖count3，这时候我们不想更新子组件，但是由于没有阻断更新，子组件还是被更新了
所以我们需要将子组件进行缓存，在需要更新的时候才进行更新

```jsx
function Son(props) {
    const { count, count2 } = props;
    const [Value, setValue] = useState(0)
    console.log("子组件被渲染了");
    return (
        <div className="tail">
            <div>count:{count}</div>
            <div>count2:{count2}</div>
            <div>Value:{Value}</div>
            <button onClick={() => { setValue(Value + 1) }}>Value++</button>
        </div >
    )
}
export default class App extends React.Component {
    state = {
        count: 0,
        count2: 0,
        count3: 0
    }
    component = <Son count2={this.state.count2} count={this.state.count}></Son>
    update(name, value) {
        if (name === "count") this.setState({ count: value })
        if (name === "count2") this.setState({ count2: value })
        if (name === "count3") this.setState({ count3: value })
    }
    controllComponentRender = () => {
        const { props } = this.component;
        if (this.state.count !== props.count) {//如果我们希望改变之后重新渲染的值被改变，则cloneElement一下并赋给component
            return this.component = React.cloneElement(this.component, { count: this.state.count, count2: this.state.count2 })
        }//如果不是我们所希望重新渲染的值被改变，则返回缓存的Element
        return this.component;
    }
    render() {
        return (
            <div>
                {this.controllComponentRender()}//这里执行函数拿到他的返回结果
                <button onClick={() => { this.update("count", this.state.count + 1) }}>count++</button>
                <button onClick={() => { this.update("count2", this.state.count2 + 1) }}>count2++</button>
                <button onClick={() => { this.update("count3", this.state.count3 + 1) }}>count3++</button>
            </div >
        )
    }
}
```

## useMemo

在函数组件中可以很轻松就实现上述同样的效果

**useMemo 用法：**

```js
const cacheSomething = useMemo(create,deps)
```

-   `create`：第一个参数为一个函数，函数的返回值作为缓存值，如上 demo 中把 Children 对应的 element 对象，缓存起来。
-   `deps`： 第二个参数为一个数组，存放当前 useMemo 的依赖项，在函数组件下一次执行的时候，会对比 deps 依赖项里面的状态，是否有改变，如果有改变重新执行 create ，得到新的缓存值。
-   `cacheSomething`：返回值，执行 create 的返回值。如果 deps 中有依赖项改变，返回的重新执行 create 产生的值，否则取上一次缓存值。

**useMemo原理：**

useMemo 会记录上一次执行 create 的返回值，并把它绑定在函数组件对应的 fiber 对象上，只要组件不销毁，缓存值就一直存在，但是 deps 中如果有一项改变，就会重新执行 create ，返回值作为新的值记录到 fiber 对象上。

**useMemo应用场景：**

-   可以缓存 element 对象，从而达到按条件渲染组件，优化性能的作用。
-   如果组件中不期望每次 render 都重新计算一些值,可以利用 useMemo 把它缓存起来。
-   可以把函数和属性缓存起来，作为 PureComponent 的绑定方法，或者配合其他Hooks一起使用。

```jsx
function Son(props) {
    const { count } = props;
    const [Value, setValue] = useState(0)
    console.log("更新了");
    return (
        <div>
            <div>{count}</div>
            <button onClick={() => { setValue(Value + 1) }}>Value++</button>
        </div >
    )
}
export default function App() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    // const func = () => 1;
    return (
        <div>
            {/* {React.useMemo(() => <Son count={count} func={func}></Son>, [count])} */}
            {React.useMemo(() => <Son count={count} ></Son>, [count])}
            {/* <Son count={count}></Son> */}
            <button onClick={() => { setcount(count + 1) }}>count++</button>
            <button onClick={() => { setcount2(count2 + 1) }}>count2++</button>
        </div>
    )
}
```

## PureConponent

浅比较 state 和 props 是否相等
浅比较流程：

-   第一步，首先会直接比较新老 props 或者新老 state 是否相等。如果相等那么不更新组件。
-   第二步，判断新老 state 或者 props ，有不是对象或者为 null 的，那么直接返回 false ，更新组件。
-   第三步，通过 Object.keys 将新老 props 或者新老 state 的属性名 key 变成数组，判断数组的长度是否相等，如果不相等，证明有属性增加或者减少，那么更新组件。
-   第四步，遍历老 props 或者老 state ，判断对应的新 props 或新 state ，有没有与之对应并且相等的（这个相等是浅比较），如果有一个不对应或者不相等，那么直接返回 false ，更新组件。 到此为止，浅比较流程结束， PureComponent 就是这么做渲染节流优化的。

```jsx
class Son extends React.PureComponent {
    state = {
        value: 2,
        obj: {
            age: 18
        }
    }
    render() {
        const { count } = this.props;
        console.log("重新渲染");
        return (
            <div>
                <div>{count}</div>
                <button onClick={() => { this.setState({ value: this.state.value + 1 }) }}>value加一 | {this.state.value} </button>
                <button onClick={() => { const { obj } = this.state; obj.age++; this.setState({ obj }) }}>setSonObject change | {this.state.obj.age} </button>
            </div>
        )
    }
}
export default function App() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    // const func = () => 1;
    // const funcMemo = React.useCallback(func, []);
    return (
        <div>
            {/* <Son count={count} func={func}></Son> */}
            {/* <Son count={count} func={funcMemo}></Son> */}
            <Son count={count} ></Son>
            <button onClick={() => { setcount(count + 1) }}>count++</button>
            <button onClick={() => { setcount2(count2 + 1) }}>count2++</button>
        </div>
    )
}
```



**PureComponent注意事项**

PureComponent 可以让组件自发的做一层性能上的调优，但是，父组件给是 PureComponent 的子组件绑定事件要格外小心，避免两种情况发生：

1 避免使用箭头函数。因为父组件每一次 render ，如果是箭头函数绑定的话，都会重新生成一个新的箭头函数， PureComponent 对比新老 props 时候，因为是新的函数，所以会判断不想等，而让组件直接渲染，PureComponent 作用终会失效。

```jsx
class Index extends React.PureComponent{}
export default class Father extends React.Component{
    render=()=> <Index callback={()=>{}}   />
}
```

2 PureComponent 的父组件是函数组件的情况，绑定函数要用 useCallback 或者 useMemo 处理。

```jsx
class Index extends React.PureComponent{}
export default function (){
    const callback = function handerCallback(){} /* 每一次函数组件执行重新声明一个新的callback，PureComponent浅比较会认为不想等，促使组件更新  */
    return <Index callback={callback}  />
}
```

综上可以用 useCallback 或者 useMemo 解决这个问题，useCallback 首选，这个 hooks 初衷就是为了解决这种情况的。

```jsx
export default function (){
    const callback = React.useCallback(function handerCallback(){},[])
    return <Index callback={callback}  />
}
```

useCallback 接受二个参数，第一个参数就是需要缓存的函数，第二个参数为deps, deps 中依赖项改变返回新的函数。如上处理之后，就能从根本上解决 PureComponent 失效问题。 useCallback 第一个参数就是缓存的内容，useMemo 需要执行第一个函数，返回值为缓存的内容，比起 useCallback ， useMemo 更像是缓存了一段逻辑，或者说执行这段逻辑获取的结果

## shouldComponentUpdate

```jsx
class Son extends React.Component {
    state = {
        value: 2,
        obj: {
            age: 18
        }
    }
    shouldComponentUpdate(newProp, newState, newContext) {
        console.log(newState);
       
        if (this.state.value !== newState.value) {
            return true
        } else {
            return false;
        }

    }
    render() {
        const { count } = this.props;
        console.log("重新渲染");
        return (
            <div>
                <div>{count}</div>
                <button onClick={() => { this.setState({ value: this.state.value + 1 }) }}>value加一 | {this.state.value} </button>
                <button onClick={() => { const { obj } = this.state; obj.age++; this.setState({ obj }) }}>setSonObject change | {this.state.obj.age} </button>
            </div>
        )
    }

}
export default function App() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    return (
        <div>
            <Son count={count} ></Son>
            <button onClick={() => { setcount(count + 1) }}>count++</button>
            <button onClick={() => { setcount2(count2 + 1) }}>count2++</button>
        </div>
    )
}
```

*但是有一种情况就是如果子组件的 props 是引用数据类型，比如 object ，还是不能直观比较是否相等。那么如果想有对比新老属性相等，怎么对比呢，而且很多情况下，组件中数据可能来源于服务端交互，对于属性结构是未知的。*

*`immutable.js` 可以解决此问题，immutable.js 不可变的状态，对 Immutable 对象的任何修改或添加删除操作都会返回一个新的 Immutable 对象。鉴于这个功能，所以可以把需要对比的 props 或者 state 数据变成 Immutable 对象，通过对比 Immutable 是否相等，来证明状态是否改变，从而确定是否更新组件。*

## React.memo

React.memo 可作为一种容器化的控制渲染方案，可以对比 props 变化，来决定是否渲染组件，首先先来看一下 memo 的基本用法。React.memo 接受两个参数，第一个参数 Component 原始组件本身，第二个参数 compare 是一个函数，可以根据一次更新中 props 是否相同决定原始组件是否重新渲染。

memo的几个特点是：

-   React.memo: 第二个参数 返回 true 组件不渲染 ， 返回 false 组件重新渲染。和 shouldComponentUpdate 相反，shouldComponentUpdate : 返回 true 组件渲染 ， 返回 false 组件不渲染。
-   memo 当二个参数 compare 不存在时，会用**浅比较原则**处理 props ，相当于仅比较 props 版本的 pureComponent 。
-   memo 同样适合类组件和函数组件。

```jsx
function Son(props) {
    const { count, count2 } = props;
    const [Value, setValue] = useState(0)
    console.log("更新了");
    return (
        <div className="tail">
            <div>{count}</div>
            <div>{count2}</div>
            <div>{Value}</div>
            <button onClick={() => { setValue(Value + 1) }}>Value++</button>
        </div >
    )
}
const compare = (preprop, nextprop) => {
    if (preprop.count !== nextprop.count) return false;
    return true;
}
const MemoComponent = React.memo((props) => <Son count={props.count} count2={props.count2}></Son>, compare)
export default function App() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    return (
        <div>
            <MemoComponent count={count} count2={count2}></MemoComponent>
            <button onClick={() => { setcount(count + 1) }}>count++</button>
            <button onClick={() => { setcount2(count2 + 1) }}>count2++</button>
        </div >
    )
}
```

## 打破渲染限制

-   1 forceUpdate。类组件更新如果调用的是 forceUpdate 而不是 setState ，会跳过 PureComponent 的浅比较和 shouldComponentUpdate 自定义比较。其原理是组件中调用 forceUpdate 时候，全局会开启一个 hasForceUpdate 的开关。当组件更新的时候，检查这个开关是否打开，如果打开，就直接跳过 shouldUpdate 。
-   2 context穿透，上述的几种方式，都不能本质上阻断 context 改变，而带来的渲染穿透，所以开发者在使用 Context 要格外小心，既然选择了消费 context ，就要承担 context 改变，带来的更新作用

## 渲染控制流程图

![image-20220506153549839](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3df03000a39549bead3c84750c62576c~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

## 总结

render的作用：根据一次更新中产生的新的状态值，通过React.createElement创建最新的(状态)虚拟DOM，新的状态。
接下来 React会调和由render函数产生的children，如果更新时子代具有alternate(旧状态)，会复用旧状态(props如果更新用新的props替换)，如果没有，则会创建一个。将 props 变成 pendingProps。接着调和下一个fiber 。直至fiber tree 调和完毕，完成render阶段