# 基础篇-多功能Ref

将记录以下相关内容：

+   明白了 Ref 对象的二种创建方式，以及三种获取 ref 方法。
+   详细介绍 forwardRef 用法。
+   ref 组件通信-函数组件和类组件两种方式。
+   useRef 缓存数据。
+   Ref 的处理逻辑原理。

## Ref对象的两种创建方式以及三种获取Ref方法

### 两种创建方式

+   类式：`ClassRef = React.createRef();`
+   函数式：`const FuncRef = React.useRef()`

### 三种获取Ref方法

+   `<div ref={selfRef}></div>`
+   `<div ref="selfRef"></div>`
+   `<div ref={(node)=>this.selfRef=node}></div>`

## forwardRef

forwardRef 接受了父级元素标记的 ref 信息，并把它转发下去，使得子组件可以通过 props 来接受到上一层级或者是更上层级的ref，forward强化了ref。
### 跨层级获取

比如想要通过标记子组件 ref ，来获取孙组件的某一 DOM 元素，或者是组件实例。

```jsx
function Son (props){
    const {GrandRef} = props;
    return (
        <div>
            <div ref={GrandRef}>我是一个div</div>
        	<span>我是一个span</span>
        </div>
    )
}
function Father(props){
    const {GrandRef} = props;
    return (
        <Son GrandRef={GrandRef}/>
    )
}
const ForwarComponent = React.forwardRef((props,ref)=><Father GrandRef={ref} {...props}/>)
function GrandFather(){
    const GrandRef = React.useRef(null);
    return <ForwarComponent ref={GrandRef}/>
}
```

个人感觉`forwardRef `就相当于把给予他的ref属性整合到了实际要传入的子组件的props上去，即`forwardRef `把 ref 变成了可以通过 props 传递和转发

```jsx
function Son (props){
    const {GrandRef} = props;
    return (
        <div>
            <div ref={GrandRef}>我是一个div</div>
        	<span>我是一个span</span>
        </div>
    )
}
function Father(props){
    const {GrandRef} = props;
    return (
        <Son GrandRef={GrandRef}/>
    )
}
function GrandFather(){
    const GrandRef = React.useRef(null);
    return <Father GrandRef={GrandRef}/>
}
```

### 合并转发

传递合并之后的自定义的 ref

```jsx
function Son (props){
    const {GrandRef} = props;
    return (
        <div>
            <div ref={GrandRef}>我是一个div</div>
        	<span>我是一个span</span>
        </div>
    )
}
function Father(props){
    const {GrandRef} = props;
    const FatherRef = React.useRef(null);
    const SonRef = React.useRef(null);
    GrandRef.current={
        son:SonRef,
        father:FatherRef
    }
    return (
        <div>
            <Son ref={SonRef}/>
            <span ref={FatherRef}></span>
        </div>
        
    )
}
const ForwarComponent = React.forwardRef((props,ref)=><Father GrandRef={ref} {...props}/>)
function GrandFather(){
    const GrandRef = React.useRef(null);
    return <ForwarComponent ref={GrandRef}/>
}
```

### 高阶组件转发

*如果通过高阶组件包裹一个原始类组件，就会产生一个问题，如果高阶组件 HOC 没有处理 ref ，那么由于高阶组件本身会返回一个新组件，所以当使用 HOC 包装后组件的时候，标记的 ref 会指向 HOC 返回的组件，而并不是 HOC 包裹的原始类组件，为了解决这个问题，forwardRef 可以对 HOC 做一层处理。*

```jsx
function HOC(Component){
  class Wrap extends React.Component{
     render(){
        const { forwardedRef ,...otherprops  } = this.props
        return <Component ref={forwardedRef}  {...otherprops}  />
     }
  }
  return  React.forwardRef((props,ref)=> <Wrap forwardedRef={ref} {...props} /> ) 
}
class Index extends React.Component{
  render(){
    return <div>hello,world</div>
  }
}
const HocIndex =  HOC(Index)
export default ()=>{
  const node = useRef(null)
  useEffect(()=>{
    console.log(node.current)  /* Index 组件实例  */ 
  },[])
  return <div><HocIndex ref={node}  /></div>
}
```

## ref组件间通信

### 类组件 ref

父亲可以通过ref绑定去调用儿子的方法，儿子可以调用父亲props传下来的方法

### 函数组件 forwardRef + useImperativeHandle

*对于函数组件，本身是没有实例的，但是 React Hooks 提供了，useImperativeHandle 一方面第一个参数接受父组件传递的 ref 对象，另一方面第二个参数是一个函数，函数返回值，作为 ref 对象获取的内容。一起看一下 useImperativeHandle 的基本使用。*

useImperativeHandle 接受三个参数：

-   *第一个参数 ref : 接受 forWardRef 传递过来的 ref 。*
-   *第二个参数 createHandle ：处理函数，返回值作为暴露给父组件的 ref 对象。*
-   *第三个参数 deps :依赖项 deps，依赖项更改形成新的 ref 对象。*

*forwardRef + useImperativeHandle 可以完全让函数组件也能流畅的使用 Ref 通信。*

```jsx
function SonConponent(props, ref) {
    let SonRef = useRef(null);
    const [Text, setText] = useState('')
    useImperativeHandle(ref, () => {
        const Sonhandler = {
            ChangeText() {
                setText("你好，世界！")
            },
            ChangeTextByRef() {
                SonRef.current.innerText = "你好，世界！--by Ref"
            }
        }
        return Sonhandler;
    }, [])
    return (
        <div ref={SonRef}>
            {Text}
        </div>
    )
}
const ForwardComponent = React.forwardRef(SonConponent)
export default function App() {
    const grandRef = useRef(null);
    const handlerRef = () => {
        const { ChangeTextByRef } = grandRef.current;
        ChangeTextByRef()
    }
    useEffect(() => {
        console.log(grandRef);
    })
    return (
        <div>
            <ForwardComponent ref={grandRef}></ForwardComponent>
            <button onClick={() => { handlerRef() }}>改变</button>
        </div>

    )
}
```

### 函数组件缓存数据

函数组件每一次render，函数上下文都会重新执行一遍，在改变一些不希望引起视图更新的数据的时候，如果数据存放在state里，这样就会导致视图更新，这时可以将数据放入ref中

```jsx
const toLearn = [ { type: 1 , mes:'let us learn React' } , { type:2,mes:'let us learn Vue3.0' }  ]
export default function Index({ id }){
    const typeInfo = React.useRef(toLearn[0])
    const changeType = (info)=>{
        typeInfo.current = info /* typeInfo 的改变，不需要视图变化 */
    }
    useEffect(()=>{
       if(typeInfo.current.type===1){
           /* ... */
       }
    },[ id ]) /* 无须将 typeInfo 添加依赖项  */
    return <div>
        {
            toLearn.map(item=> <button key={item.type}  onClick={ changeType.bind(null,item) } >{ item.mes }</button> )
        }
    </div>
}
```

设计思路：

-   *用一个 useRef 保存 type 的信息，type 改变不需要视图变化。*
-   *按钮切换直接改变 useRef 内容。*
-   *useEffect 里面可以直接访问到改变后的 typeInfo 的内容，不需要添加依赖项。*

## ref原理揭秘

### ref执行时机和处理逻辑

对于ref的执行时机是在commit阶段，因为在这个阶段才会对真实DOM进行操作，ref也才能够获取到真实dom

对于ref处理函数有两个方法进行处理`commitDetachRef `和`commitAttachRef`,一个在dom更新之前，一个在dom更新之后

-   第一阶段：一次更新中，在 commit 的 mutation 阶段, 执行commitDetachRef，commitDetachRef 会清空之前ref值，使其重置为 null。 

>   react-reconciler/src/ReactFiberCommitWork.js

```js
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') { /* function 和 字符串获取方式。 */
      currentRef(null); 
    } else {   /* Ref对象获取方式 */
      currentRef.current = null;
    }
  }
}
```

-   第二阶段：DOM 更新阶段，这个阶段会根据不同的 effect 标签，真实的操作 DOM 。
-   第三阶段：layout 阶段，在更新真实元素节点之后，此时需要更新 ref 。

>   react-reconciler/src/ReactFiberCommitWork.js

```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent: //元素节点 获取元素
        instanceToUse = getPublicInstance(instance);
        break;
      default:  // 类组件直接使用实例
        instanceToUse = instance;
    }
    if (typeof ref === 'function') {
      ref(instanceToUse);  //* function 和 字符串获取方式。 */
    } else {
      ref.current = instanceToUse; /* ref对象方式 */
    }
  }
}
```

这一阶段，主要判断 ref 获取的是组件还是 DOM 元素标签，如果 DOM 元素，就会获取更新之后最新的 DOM 元素。上面流程中讲了三种获取 ref 的方式。 如果是字符串 ref="node" 或是 函数式 `ref={(node)=> this.node = node }` 会执行 ref 函数，重置新的 ref 。

如果是 ref 对象方式。会更新 ref 对象的 current 属性。达到更新 ref 对象的目的。

```jsx
node = React.createRef()
<div ref={ node }></div>
```

如果是字符串方式。React 会自动绑定一个函数，用来处理 ref 逻辑。

>   react-reconciler/src/ReactChildFiber.js

```js
const ref = function(value) {
    let refs = inst.refs;
    if (refs === emptyRefsObject) {
        refs = inst.refs = {};
    }
    if (value === null) {
        delete refs[stringRef];
    } else {
        refs[stringRef] = value;
    }
};
```

所以当这样绑定ref="node"，会被绑定在组件实例的refs属性下面。比如

```jsx
<div ref="node" ></div>
```

ref 函数 在 commitAttachRef 中最终会这么处理：

```jsx
ref(<div>) 
等于 inst.refs.node = <div>
```

### Ref 的处理特性

只有在ref更新时才会调用上述方法进行更新ref

**`commitDetachRef` 调用时机**

>   react-reconciler/src/ReactFiberWorkLoop.js

```js
function commitMutationEffects(){
     if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }
}
```

**`commitAttachRef` 调用时机**

```js
function commitLayoutEffects(){
     if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }
}
```

-   从上可以清晰的看到只有含有 `Ref` tag 的时候，才会执行更新 ref，那么是每一次更新都会打 `Ref` tag 吗？ 跟着我的思路往下看，什么时候标记的 Ref 。

>   react-reconciler/src/ReactFiberBeginWork.js

```js
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||      // 初始化的时候
    (current !== null && current.ref !== ref)  // ref 指向发生改变
  ) {
    workInProgress.effectTag |= Ref;
  }
}
```

首先 `markRef` 方法执行在两种情况下：

-   第一种就是类组件的更新过程中。
-   第二种就是更新 `HostComponent` 的时候，比如 `<div />` 等元素。

`markRef` 会在以下两种情况下给 effectTag 标记 Ref，只有标记了 Ref tag 才会有后续的 `commitAttachRef` 和 `commitDetachRef` 流程。（ current 为当前调和的 fiber 节点 ）

-   第一种` current === null && ref !== null`：就是在 fiber 初始化的时候，第一次 ref 处理的时候，是一定要标记 Ref 的。
-   第二种` current !== null && current.ref !== ref`：就是 fiber 更新的时候，但是 ref 对象的指向变了。

只有在 Ref tag 存在的时候才会更新 ref ，如下demo，每一次按钮，都会打印 ref ，那么也就是 ref 的回调函数执行了，ref 更新了。

```jsx
<div ref={(node)=>{
               this.node = node
               console.log('此时的参数是什么：', this.node )
}}  >ref元素节点</div>
```

-   如上很简单，每一次更新的时候，都给 ref 赋值了新的函数，那么 `markRef` 中就会判断成 `current.ref !== ref`，所以就会重新打 Ref 标签，那么在 commit 阶段，就会更新 ref 执行 ref 回调函数了。

如果做如下修改：

```jsx
export default class Index extends React.Component{
    state={ num:0 }
    node = null
    getDom= (node)=>{
        this.node = node
        console.log('此时的参数是什么：', this.node )
     }
    render(){
        return <div >
            <div ref={this.getDom}>ref元素节点</div>
            <button onClick={()=> this.setState({ num: this.state.num + 1  })} >点击</button>
        </div>
    }
}
```

-   这个时候，在点击按钮更新的时候，由于此时 ref 指向相同的函数 `getDom` ，所以就不会打 Ref 标签，不会更新 ref 逻辑，直观上的体现就是 `getDom` 函数不会再执行。

#### 卸载 ref

上述讲了 ref 更新阶段的特点，接下来分析一下当组件或者元素卸载的时候，ref 的处理逻辑是怎么样的。

>   react-reconciler/src/ReactFiberCommitWork.js

```js
this.state.isShow && <div ref={()=>this.node = node} >元素节点</div>
```

-   如上，在一次更新的时候，改变 `isShow` 属性，使之由 `true` 变成了 `false`， 那么 `div` 元素会被卸载，那么 ref 会怎么处理呢？

被卸载的 fiber 会被打成 `Deletion` effect tag ，然后在 commit 阶段会进行 commitDeletion 流程。对于有 ref 标记的 ClassComponent （类组件） 和 HostComponent （元素），会统一走 `safelyDetachRef` 流程，这个方法就是用来卸载 ref。

>   react-reconciler/src/ReactFiberCommitWork.js

```js
function safelyDetachRef(current) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {  // 函数式 ｜ 字符串
        ref(null)
    } else {
      ref.current = null;  // ref 对象
    }
  }
}
```

-   对于字符串 `ref="dom"` 和函数类型 `ref={(node)=> this.node = node }` 的 ref，会执行传入 null 置空 ref 。
-   对于 ref 对象类型，会清空 ref 对象上的 current 属性。

借此完成卸载 ref 流程。

## 总结

+   ### 两种创建方式
    +   类式：`ClassRef = React.createRef();`
    +   函数式：`const FuncRef = React.useRef()`

+   ### 三种获取Ref方法

    +   `<div ref={selfRef}></div>`
    +   `<div ref="selfRef"></div>`
    +   `<div ref={(node)=>this.selfRef=node}></div>`

+   forwardRef  会强化ref，让 ref 变成了可以通过 props 传递和转发

+   父亲可以通过ref绑定去调用儿子的方法，儿子可以调用父亲props传下来的方法

+   forwardRef + useImperativeHandle：对于函数组件，本身是没有实例的，但是 React Hooks 提供了，useImperativeHandle 一方面第一个参数接受父组件传递的 ref 对象，另一方面第二个参数是一个函数，函数返回值，作为 ref 对象获取的内容。

+   useRef 缓存数据不会引起视图更新，并且useEffect可以直接访问到内部属性，无须将 ref 对象添加成 dep 依赖项。可以随时访问到变化后的值

+   对于ref处理函数有两个方法进行处理`commitDetachRef `和`commitAttachRef`,一个在dom更新之前，一个在dom更新之后

+   流程：

    +   `commitDetachRef `会清空之前ref值，使其重置为 null。

    +   之后DOM 更新阶段，这个阶段会根据不同的 effect 标签，真实的操作 DOM 。

    +   layout 阶段，在更新真实元素节点之后，此时需要更新 ref 。此时调用`commitAttachRef`主要判断 ref 获取的是组件还是 DOM 元素标签,再根据类别进行不同处理

+   只有在 ref 更新的时候即含有 `Ref` tag 的时候，才会调用如上方法更新 ref

+   给予Reftag标记时机：

    +   第一种` current === null && ref !== null`：就是在 fiber 初始化的时候，第一次 ref 处理的时候，是一定要标记 Ref 的。

    +   第二种` current !== null && current.ref !== ref`：就是 fiber 更新的时候，但是 ref 对象的指向变了。

+   被卸载的 fiber 会被打成 `Deletion` effect tag ，然后在 commit 阶段会进行 commitDeletion 流程。对于有 ref 标记的 ClassComponent （类组件） 和 HostComponent （元素），会统一走 `safelyDetachRef` 流程，这个方法就是用来卸载 ref
