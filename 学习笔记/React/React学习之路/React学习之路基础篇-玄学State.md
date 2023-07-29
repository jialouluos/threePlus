# State

## 类中的State

React项目中的UI改变来源于State改变(数据驱动页面)

+   基本用法`setState(obj,callback)`

    +   第一个参数，如果为一个对象，则为即将合并的state值，如果是一个函数，则参数为当前组件的state和props，返回结果作为新的state，并用于合并。

    +   第二个参数，callback作为一个函数，函数执行上下文中可以获取当前setState更新后的最新的state值，还可以作为依赖state变化的副作用函数，可以用来做一些基于DOM的操作

        ```jsx
        //第一个参数为一个对象时
        this.setState({a:1},()=>{
            console.log(this.state.a)
        })
        //第一个参数为一个函数时
        this.setState(state,props=>{
            console.log(state.a);
            return {a:1};
        })
        ```

+   setState更新，底层的逻辑

    +   首先，setState会产生当前更新的优先级(老版本用expirationTime，新版本用lane)
    +   然后，React会从fiber Root根部fiber向下调和子节点，调和阶段将对比发生更新的地方，更新对比expirationTime，找到发生更新的组件，然后合并state，合并完成会触发render渲染函数，得到新的UI视图，完成render阶段
    +   接下来 进入commit阶段替换真实DOM，完成此次更新流程
    +   此时仍然处于commit阶段，会执行setState的callback函数，到此完成了一次setState全过程
    +   render 阶段 render 函数执行 -> commit 阶段真实 DOM 替换 -> setState 回调函数执行 callback 。

    ![image-20220520210931807](C:\Users\86157\AppData\Roaming\Typora\typora-user-images\image-20220520210931807.png)

+   类组件如何限制state更新视图

    +   pureComponent可以对state和props进行浅比较，如果没有发生变化，那么组件不更新
    +   shouldComponentUpdate 生命周期可以通过判断前后 state 变化来决定组件需不需要更新，需要更新返回true，否则返回false。

+   setState原理

    +   调用setState实际上就是调用Updater对象中的enqueueSetState方法

    +   **enqueueSetState** 作用实际很简单，就是创建一个 update ，然后放入当前 fiber 对象的待更新队列中，最后开启调度更新，进入上述讲到的更新流程

        ```jsx
        enqueueSetState(){
             /* 每一次调用`setState`，react 都会创建一个 update 里面保存了 */
             const update = createUpdate(expirationTime, suspenseConfig);
             /* callback 可以理解为 setState 回调函数，第二个参数 */
             callback && (update.callback = callback) 
             /* enqueueUpdate 把当前的update 传入当前fiber，待更新队列中 */
             enqueueUpdate(fiber, update); 
             /* 开始调度更新 */
             scheduleUpdateOnFiber(fiber, expirationTime);
        }
        ```

    +   批量更新(batchUpdate)

        +   正常的state更新、UI交互，都离不开用户的事件，React采用事件合成的形式，每一个事件都是由React事件系统统一调度的，State批量更新正是和事件系统息息相关

            ```jsx
            function dispatchEventForLegacyPluginEventSystem(){
                // handleTopLevel 事件处理函数
                batchedEventUpdates(handleTopLevel, bookKeeping);
            }
            ```

        +   batchedEventUpdates 

            ```jsx
            function batchedEventUpdates(fn,a){
                /* 开启批量更新  */
               isBatchingEventUpdates = true;
              try {
                /* 这里执行了的事件处理函数， 比如在一次点击事件中触发setState,那么它将在这个函数内执行 */
                return batchedEventUpdatesImpl(fn, a, b);
              } finally {
                /* try 里面 return 不会影响 finally 执行  */
                /* 完成一次事件，批量更新  */
                isBatchingEventUpdates = false;
              }
            }
            ```

        +   在 React 事件执行之前通过 `isBatchingEventUpdates=true` 打开开关，开启事件批量更新，当该事件结束，再通过 `isBatchingEventUpdates = false;` 关闭开关，然后在 scheduleUpdateOnFiber 中根据这个开关来确定是否进行批量更新。

            ```jsx
            export default class index extends React.Component{
                state = { number:0 }
                handleClick= () => {
                   
                      this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback1', this.state.number)  })
                      console.log(this.state.number)
                      this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback2', this.state.number)  })
                      console.log(this.state.number)
                      this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback3', this.state.number)  })
                      console.log(this.state.number)
                }
                render(){
                    return <div>
                        { this.state.number }
                        <button onClick={ this.handleClick }  >number++</button>
                    </div>
                }
            } 
            //点击"点击打印"按钮后 会打印 0 0 0 callback1 1 callback2 1 callback3 1
            ```

            ![image-20220520234641204](C:\Users\86157\AppData\Roaming\Typora\typora-user-images\image-20220520234641204.png)

        +   当我们在 `handleClick` 内部执行 `setState` 时，更新状态的这部分代码首先会被丢进一个队列中等待后续的使用。然后继续处理更新的逻辑，毕竟触发 `setState` 肯定会触发一系列组件更新的流程。但是在这个流程中如果 React 发现需要批量更新 `state` 的话，就会立即中断更新流程。

            也就是说，虽然我们在 `handleClick` 中调用了三次 `setState`，但是并不会走完三次的组件更新流程，只是把更新状态的逻辑丢到了一个队列中。当 `handleClick` 执行完毕之后会再执行一次组件更新的流程。

        +   异步操作打破批量更新

            +   可以通过setTimeout或者Promise来实现打破

                ```jsx
                setTimeout(()=>{
                    this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback1', this.state.number)  })
                    console.log(this.state.number)
                    this.setState({ number:this.state.number + 1 },()=>{    console.log( 'callback2', this.state.number)  })
                    console.log(this.state.number)
                    this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback3', this.state.number)  })
                    console.log(this.state.number)
                })
                //callback1 1 , 1, callback2 2 , 2,callback3 3 , 3
                ```

                ![image-20220521000925560](C:\Users\86157\AppData\Roaming\Typora\typora-user-images\image-20220521000925560.png)

                +   在这个流程中如果 React 发现需要批量更新 `state` 的话，就不会中断更新流程。因为已经不处于批量更新流程中了

        +   异步环境下实现批量更新

            +   React-Dom 中提供了批量更新方法 `unstable_batchedUpdates`

                ```jsx
                setTimeout(()=>{
                    unstable_batchedUpdates(()=>{
                        this.setState({ number:this.state.number + 1 })
                        console.log(this.state.number)
                        this.setState({ number:this.state.number + 1})
                        console.log(this.state.number)
                        this.setState({ number:this.state.number + 1 })
                        console.log(this.state.number) 
                    })
                })
                //  0 , 0 , 0 , callback1 1 , callback2 1 ,callback3 1
                ```

    +   提升更新优先级

        +   React-dom 提供了 flushSync ，flushSync 可以将回调函数中的更新任务，放在一个较高的优先级中。React 设定了很多不同优先级的更新任务。如果一次更新任务在 flushSync 回调函数内部，那么将获得一个较高优先级的更新。

            ```jsx
            handerClick=()=>{
                setTimeout(()=>{
                    this.setState({ number: 1  })
                })
                this.setState({ number: 2  })
                ReactDOM.flushSync(()=>{
                    this.setState({ number: 3  })
                })
                this.setState({ number: 4  })
            }
            render(){
               console.log(this.state.number)
               return ...
            }
               //3 4 1 
            ```

            -   首先 `flushSync` `this.setState({ number: 3 })`设定了一个高优先级的更新，所以 2 和 3 被批量更新到 3 ，所以 3 先被打印。
            -   更新为 4。
            -   最后更新 setTimeout 中的 number = 1。

        +   **flushSync补充说明**：flushSync 在同步条件下，会合并之前的 setState | useState，可以理解成，如果发现了 flushSync ，就会先执行更新，如果之前有未更新的 setState ｜ useState ，就会一起合并了，所以就解释了如上，2 和 3 被批量更新到 3 ，所以 3 先被打印。

        +   综上所述， React 同一级别**更新优先级**关系是:flushSync 中的 setState **>** 正常执行上下文中 setState **>** setTimeout ，Promise 中的 setState。

## 函数组件的state

+   useState用法

    ```jsx
    const [state,dispatch] = useState(initData);
    //state 目的提供给 UI ，作为渲染视图的数据源
    //dispatch 改变 state 的函数，可以理解为推动函数组件渲染的渲染函数
    // 有两种情况，第一种情况是非函数，将作为 state 初始化的值。 第二种情况是函数，函数的返回值作为 useState 初始化的值。
    //eg dispatch 参数是一个非函数值
    const [ number , setNumbsr ] = React.useState(0)
    /* 一个点击事件 */
    const handleClick=()=>{
       setNumber(1)
       setNumber(2)
       setNumber(3)
    }
    //eg dispatch 参数是一个函数
    const [ number , setNumbsr ] = React.useState(0)
    const handleClick=()=>{
       setNumber((state)=> state + 1)  // state - > 0 + 1 = 1
       setNumber(8)  // state - > 8
       setNumber((state)=> state + 1)  // state - > 8 + 1 = 9
    }
    ```

+   监听 state 变化

    +   useEffect 

        ```jsx
        export default function Index(props){
            const [ number , setNumber ] = React.useState(0)
            /* 监听 number 变化 */
            React.useEffect(()=>{
                console.log('监听number变化，此时的number是:  ' + number )
            },[ number ])
            const handerClick = ()=>{
                /** 高优先级更新 **/
                ReactDOM.flushSync(()=>{
                    setNumber(2) 
                })
                /* 批量更新 */
                setNumber(1) 
                /* 滞后更新 ，批量更新规则被打破 */
                setTimeout(()=>{
                    setNumber(3) 
                })
               
            }
            console.log(number)
            return <div>
                <span> { number }</span>
                <button onClick={ handerClick }  >number++</button>
            </div>
        }
        //2
        //监听.....number为2
        //1
        //监听.....number为1
        //3
        //监听.....number为3
        ```

    +   **`dispatch`更新特点**

        +   当调用改变 state 的函数dispatch，在本次函数执行上下文中，是获取不到最新的 state 值的

        ```jsx
        const [ number , setNumber ] = React.useState(0)
        const handleClick = ()=>{
            ReactDOM.flushSync(()=>{
                setNumber(2) 
                console.log(number) 
            })
            setNumber(1) 
            console.log(number)
            setTimeout(()=>{
                setNumber(3) 
                console.log(number)
            })   
        }
        //0 0 0
        ```

        +   函数组件更新就是函数的执行，在函数一次执行过程中，函数内部所有变量重新声明，所以改变的 state ，只有在下一次函数组件执行时才会被更新。所以在如上同一个函数执行上下文中，number 一直为0，无论怎么打印，都拿不到最新的 state 

+   useState注意事项

    +    useState 的 dispatchAction 处理逻辑中，会浅比较两次 state ，发现 state 相同，不会开启更新调度任务； demo 中两次 state 指向了相同的内存空间，所以默认为 state 相等，就不会发生视图更新了

        ```jsx
        export default function Index(){
            const [ state  , dispatchState ] = useState({ name:'alien' })
            const  handleClick = ()=>{ // 点击按钮，视图没有更新。
                state.name = 'Alien'
                dispatchState(state) // 直接改变 `state`，在内存中指向的地址相同。
            }
            return <div>
                 <span> { state.name }</span>
                <button onClick={ handleClick }  >changeName++</button>
            </div>
        }
        ```

        +    把上述的 dispatchState 改成 dispatchState({...state}) 根本解决了问题，浅拷贝了对象，重新申请了一个内存空间。

## 问与答

类组件中的 `setState` 和函数组件中的 `useState` 有什么异同？

 **相同点：**

-   首先从原理角度出发，setState和 useState 更新视图，底层都调用了 scheduleUpdateOnFiber 方法，而且事件驱动情况下都有批量更新规则。

**不同点**

-   在不是 pureComponent 组件模式下， setState 不会浅比较两次 state 的值，只要调用 setState，在没有其他优化手段的前提下，就会执行更新。但是 useState 中的 dispatchAction 会默认比较两次 state 是否相同，然后决定是否更新组件。
-   setState 有专门监听 state 变化的回调函数 callback，可以获取最新state；但是在函数组件中，只能通过 useEffect 来执行 state 变化引起的副作用。
-   setState 在底层处理逻辑上主要是和老 state 进行合并处理，而 useState 更倾向于重新赋值。