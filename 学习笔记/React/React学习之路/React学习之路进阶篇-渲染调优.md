# 渲染调优

将记录以下相关内容：

+   Suspense
+   React.lazy + Suspense
+   错误边界处理
+   key值唯一

## Suspense

Suspense是一个异步渲染组件，他会让组件去等待异步的操作，待异步执行完毕后再去进行组件的渲染

Suspense有一个fallback方法，用来渲染加载状态时所渲染的组件内容

传统模式：挂载组件-> 请求数据 -> 再渲染组件。
异步模式：请求数据-> 渲染组件。

那么异步渲染相比传统数据交互相比好处就是：

-   不再需要 componentDidMount 或 useEffect 配合做数据交互，也不会因为数据交互后，改变 state 而产生的二次更新作用。
-   代码逻辑更简单，清晰。

## React.lazy + Suspense

>   Child.jsx

```jsx
export default function Child() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    return (
        <div>
            Child
            <button onClick={() => { setcount(count + 1) }}>count++</button>
            <button onClick={() => { setcount2(count2 + 1) }}>count2++</button>
            Child
        </div>
    )
}
```

>   App.jsx

```jsx
const LazyComponent = React.lazy(() => import('./Child.jsx'))

export default function App() {
    const [count, setcount] = useState(0);
    const [count2, setcount2] = useState(0);
    return (
        <div>
            <Suspense fallback={<h1>loading...</h1>}>
                <LazyComponent />
            </Suspense>
        </div>
    )
}
```

当LazyComponent组件处于加载中时会显示loading...

### 原理

React对lazy组件有着单独的处理逻辑

>   react\src\ReactLazy.js

```tsx
export function lazy<T>(ctor: () => Thenable<{ default: T, ...}>,): LazyComponent < T, Payload < T >> {
    const payload: Payload<T> = {
        _status: Uninitialized,
        _result: ctor,
    };

    const lazyType: LazyComponent<T, Payload<T>> = {
        $$typeof: REACT_LAZY_TYPE,
        _payload: payload,
        _init: lazyInitializer,
    };
    return lazyType;
}
function lazyInitializer<T>(payload: Payload<T>): T {
  if (payload._status === Uninitialized) {//第一次会走这
    const ctor = payload._result;//()=>import("./MyComponent.jsx")
    const thenable = ctor();//return Promise
    thenable.then(//绑定then
      moduleObject => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          const resolved: ResolvedPayload<T> = (payload: any);
          resolved._status = Resolved;//状态
          resolved._result = moduleObject;//结果
        }
      },
      error => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          const rejected: RejectedPayload = (payload: any);
          rejected._status = Rejected;
          rejected._result = error;
        }
      },
    );
      
    if (payload._status === Uninitialized) {//第一次会走这
      const pending: PendingPayload = (payload: any);
      pending._status = Pending;
      pending._result = thenable;
    }
  }
  if (payload._status === Resolved) {
    const moduleObject = payload._result;
    return moduleObject.default;
  } else {//第一次会抛出Promise异常给Suspense
    throw payload._result;
  }
}
```

这里第一次执行会抛出一个Promise，Suspense会将其捕获，然后执行其成功回调拿到结果，并发起二次渲染，lazy的第二次init方法已经是Resolved 成功状态，那么直接返回 result 也就是真正渲染的组件。这时候就可以正常渲染组件了。

## 错误边界

在react中如果组件出现问题，那么组件不会被渲染出来，当发生这个问题的组件越接近根组件，所造成的影响也越严重，这时候需要对渲染失败的组件进行错误边界处理， React 增加了 `componentDidCatch` 和 `static getDerivedStateFromError()` 两个额外的生命周期，去挽救由于渲染阶段出现问题造成 UI 界面无法显示的情况。

### componentDidCatch

componentDidCatch 可以捕获异常，它接受两个参数：

-   1 error —— 抛出的错误。
-   2 info —— 带有 componentStack key 的对象，其中包含有关组件引发错误的栈信息。

componentDidCatch 中可以再次触发 setState，来降级UI渲染，componentDidCatch() 会在commit阶段被调用，因此允许执行副作用。

```js
 class Index extends React.Component{
   state= {
       hasError:false
   }
   componentDidCatch(...arg){
       uploadErrorLog(arg)  /* 上传错误日志 */
       this.setState({  /* 降级UI */
           hasError:true
       })
   }
   render(){  
      const { hasError } =this.state
      return <div>
          {  hasError ? <div>组件出现错误</div> : <ErrorTest />  }
          <div> hello, my name is alien! </div>
          <Test />
      </div>
   }
}
```

componentDidCatch 作用：

-   可以调用 setState 促使组件渲染，并做一些错误拦截功能。
-   监控组件，发生错误，上报错误日志。

### static getDerivedStateFromError

React更期望用 getDerivedStateFromError 代替 componentDidCatch 用于处理渲染异常的情况。getDerivedStateFromError 是静态方法，内部不能调用 setState。getDerivedStateFromError 返回的值可以合并到 state，作为渲染使用。用 getDerivedStateFromError 解决如上的情况。

```js
 class Index extends React.Component{
   state={
       hasError:false
   }  
   static getDerivedStateFromError(){
       return { hasError:true }
   }
   render(){  
      /* 如上 */
   }
}
```

如上完美解决了 ErrorTest 错误的问题。注意事项： 如果存在 getDerivedStateFromError 生命周期钩子，那么将不需要 componentDidCatch 生命周期再降级 ui。

### key值唯一

在diff算法中 其依靠节点的tag以及key去决定组件的复用，如果key值随意重复，就会造成很多意想不到的错误。关于diff，记录在我另一篇diff文章中

## 总结

懒加载的实现是React.lazy在第一次渲染时通过执行第一个参数(函数)得到一个Promise，通过绑定Promise的then回调再抛出Promise以便于Suspense捕获，在Suspense中执行成功回调，然后发起二次渲染请求，第二次执行时才会得到真正想要的组件，然后正常渲染组件，再细致一点就是第一次执行的逻辑状态为Pending，第二次执行时Promise变为Resolved,这时就可以拿到真正想要的组件了