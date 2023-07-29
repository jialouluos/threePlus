# 组件基础

## 1.React事件机制

在`React`中，事件绑定并非绑定在真实`DOM`上，而是绑定在`root`上，而且也并不是事件被绑定在`root`上，而是将事件监听器绑定在root上，在事件被触发时，会冒泡(该冒泡指的是原生冒泡，也解释了为什么原生事件先执行，执行完了再处理React事件)到`root`对象，绑定在`root`上的监听器就被触发了，然后通过监听器去安排后续的合成事件源，收集事件执行路径去找到真正的事件并执行。

### 为什么需要拥有自己的事件系统

创造一个多兼容的事件系统，以此来抹平不同游览器之间的差异

### fiber 和原生 DOM 之间是如何建立起联系的呢？

React 在初始化真实 DOM 的时候，用一个随机的 key internalInstanceKey 指针指向了当前 DOM 对应的 fiber 对象，fiber 对象用 stateNode 指向了当前的 DOM 元素。

## 2. React的事件和普通的HTML事件有什么不同？

+   对于命名：React事件采用小驼峰命名法，原生事件采用小写
+   对于事件函数处理语法：React事件为函数，原生事件为字符串
+   React事件不能用 return false 去阻止浏览器默认行为，必须要准确的调用`preventDefault`
+   React事件优点：跨平台；把所有事件放入一个数组，避免频繁的删除，新增；采用在根节点绑定事件监听器去管理React事件，方便统一管理

## 3. React 组件中怎么做事件代理？它的原理是什么

React基于虚拟DOM实现了一个事件层，事件层在最外层上绑定了事件监听器，当事件被触发并冒泡到最外层时，会被监听器所捕获，然后进行合成事件源，以及收集事件执行路径然后分发执行

在React底层，主要对合成事件做了两件事：

-   **事件委派：** React会把所有的事件绑定到结构的最外层，使用统一的事件监听器，这个事件监听器上维持了一个映射来保存所有组件内部事件监听和处理函数。
-   **自动绑定：** React组件中，每个方法的上下文都会指向该组件的实例，即自动绑定this为当前组件。

## 4.高阶组件、Render props、Hooks有什么区别

高阶组件是一种纯函数，没有副作用，他的原理是通过传入的组件去生成一个新的组件并返回，去提高复用性。适用一些需要代码复用、增强porps的场景中，同时也可以做渲染劫持、State抽象和更改、Props更改。但是也有一定缺点hoc传递给被包裹组件的props容易和被包裹后的组件重名，进而被覆盖，HOC主要用于类式组件，因为函数组件没有实例所以有一些场景不能够通过同样的方法去实现

Render props 是一种将render函数作为一个值的porp的简单技术，提高代码复用性

Hooks是ReactV16.8新增的特性，让我们得以在不编写class的情况下使用state以及其他的特性，拥抱函数思想，不允许写在块级作用域里，必须写在组件顶层中

## 5.对React-Fiber的理解

fiber可以看作是一种数据结构，在React中一个虚拟DOM就是一个Fiber，React采用链表的方式去链接每一个Fiber，每一个Fiber又具有父节点、子节点、兄弟节点。也可以理解为是一个执行单元。在React中Fiber是最小的执行单元，在浏览器完成每一帧的事件处理、js执行、请求动画帧、布局、绘制之后处于空闲阶段的时候，React就会采用时间分片的方式去执行它的任务，React每执行完一个执行单元就会去判断是否还存在时间，如果超时就会把控制权交给浏览器，如果还有剩余时间就会继续执行下一个执行单元，分批次的去处理任务这样做不仅合理的运用的浏览器的cpu资源，也会减少像之前版本那样同时操作大量的DOM节点而导致浏览器的卡顿。同时还可以让整个执行的过程变得可以被中断。

## 6.React.Component 和 React.PureComponent 的区别

Component： 组件更新时，他会去比较前后数据是否发生了变化，如果发生了变化那就重新render，这个比较是深比较，与地址是否改变无关

pureComponent：它是一个纯组件，当组件更新时，通过shouldComponentUpdate去进行浅比较组件的props或者state，如果都没有改变，render函数就不会触发。省去虚拟DOM的生成和对比过程，达到提升性能的目的。

## 7.Component, Element, Instance 之间有什么区别和联系？

Component是一个组件，是一个带有Render方法的类或者也可以是一个函数，他没有对应的真实DOM，把props作为输入，把返回一个元素树作为输出

Element是一个元素，他就是一个普通的对象，它可以在props中储存着其他的element，同时他也对应着一个React.Element和fiber，是元素树的基本单位

Instance是一个实例，组件类Class中this指向的东西，它用来储存生命周期和组件状态，函数式组件没有实例。

## 8.React.createClass和extends Component的区别有哪些？

+   语法上存在区别，一个是工厂函数式一个是类式

+   createClass是通过proTypes对象和getDefaultProps()方法来设置和获取props.而React.Component通过设置两个属性propTypes和defaultProps

+   一个是通过构造函数去设置初始状态，一个是通过getInitialState去设置初始状态

+   React.createClass会正确的绑定this，而React.Component需要通过bind或者箭头函数的方式去绑定正确的this

+   React.createClass可以使用Mixins，而React.Component不能使用

## 9.对componentWillReceiveProps 的理解

这个API在最新的React中已经不推荐用了，现在用`getDerivedStateFromProps`作为他的替代,在React底层会先进行判断是否存在`getDerivedStateFromProps`,如果不存在，才会执行他。

该方法当`props`发生变化时执行，初始化`render`时不执行，该函数第一个参数是新的props，第二个参数是content，它可以在组件render之前获取最新的props，从而去更新state，或者发起一些网络请求，减少父组件的请求压力(该请求只会在该组件渲染时才会发出),一般用于父组件状态更新时子组件的重新渲染。

## 10.哪些方法会触发 React 重新渲染？

+   state被改变，执行setState去改变state(如果传入null，并不会触发render)

+   props改变

+   只要父组件重新渲染了，即使传入子组件的 props 未发生变化，那么子组件也会重新渲染，进而触发 render，除非使用memo等措施缓存一下

+   `forceUpdate()` 调用forceUpdate()会导致组件跳过shouldComponentUpdate(),直接调用render()，forceUpdate就是重新render。有些变量不在state上，当时你又想达到这个变量更新的时候，刷新render；或者state里的某个变量层次太深，更新的时候没有自动触发render。这些时候都可以手动调用forceUpdate自动触发render

## 11.React重新渲染一次会做些什么（重新渲染 render 会做些什么？）

React渲染(render)一次会从调用render开始，然后生成新的React.Element，通过深度优先遍历去进行新的React.Element与旧Fiber对比，如果存在差异就会给节点打上Tag，这个过程就是diff，在diff过程中，React会进行3次遍历分别去处理 更新、新增、移动，在这其中穿插着一些无用节点删除操作，3次遍历并非3次都是从头遍历，只有更新是从头开始，后面两次都是基于上轮结束的断点继续。在遍历完之后，还会从Fiber池里找出可以复用的节点，最后进行无用节点删除(清空existingChildren)。这些Tag在completeWork阶段被收集起来，形成EffectList链在commit阶段被循环处理(V17之前)

## 12.React如何判断什么时候重新渲染组件？

当组件的props发生改变的时候，通过调用setState改变state的时候，只要组件的state发生变化，React就会对组件进行重新渲染。这是因为React中的`shouldComponentUpdate`方法默认返回`true`，这就是导致每次更新都重新渲染的原因。

## 13.React声明组件有哪几种方法，有什么不同？

-   函数式定义，组件不会被实例化，整体渲染性能得到提升，不能访问this对象，不能访问生命周期的方法，其他两种都有实例，并且可以访问组件的生命周期方法。
-   ES5原生方式`React.createClass`定义的组件 
-   ES6形式的`extends React.Component`定义的组件 

## 14.对有状态组件和无状态组件的理解及使用场景

有状态组件是类式组件，可以被继承，可以使用this，有自己的状态state，可以使用生命周期，一般在需要使用到状态或者操作状态的场景中被使用

无状态组件没有自身的状态state，可以是类式组件或者函数组件，组件内部一般通过props进行渲染，一般在不需要使用生命周期或者纯展示不需要管理state的场景中使用

## 15.对React中Fragment的理解，它的使用场景是什么？

在React中，组件返回的元素只能有一个根元素，为了不添加多余的DOM节点，这时候就会使用Fragment

## 16.React如何获取组件对应的DOM元素？

### 两种创建方式

+   类式：`ClassRef = React.createRef();`
+   函数式：`const FuncRef = React.useRef()`

### 三种获取Ref方法

+   `<div ref={selfRef}></div>`
+   `<div ref="selfRef"></div>`
+   `<div ref={(node)=>this.selfRef=node}></div>`

## 17.React中可以在render访问refs吗？为什么？

render的时候最新的真实DOM还没有生成，可以在Pre-Commit和commit阶段获取DOM

## 18.对React的插槽(Portals)的理解，如何使用，有哪些使用场景

插槽是一种将子节点渲染到父组件以外的DOM节点的方案，当父组件具有`overflow: hidden`或者`z-index`的样式设置时，组件有可能被其他元素遮挡，这时就可以考虑使用插槽使组件的挂载脱离父组件。例如：对话框，模态窗

## 19.在React中如何避免不必要的render？

+   可以利用去缓存React.Element对象，如果有更新则cloneElement一个新的React.Element出去

+   也可以在函数组件中使用useMemo，并添加deps去进行渲染控制

+   另外还可以使用PureConponent去进行浅比较 state 和 props 是否相等

+   还可以通过生命周期`shouldComponentUpdate`去自定义控制是否进行渲染，在类和函数组件中

+   最后还可以通过React.memo，对比 props 变化，来决定是否渲染组件，通过第二个参数传入函数去自定义控制渲染，如果不传入第二个函数，则进行props浅比较

## 20.对 React context 的理解

当不想在组件树中通过逐层传递props或者state的方式来传递数据时，可以使用Context来实现跨层级的组件数据传递。

## 21. 为什么React并不推荐优先考虑使用Context？

Context目前还处于实验阶段，可能会在后面的发行版本中有很大的变化

## 22. React中什么是受控组件和非控组件？

页面中所有输入类的DOM如果是现用现取的称为非受控组件，在非受控组件中，可以使用一个ref来从DOM获得表单值。因为非受控组件将真实数据储存在 DOM 节点中

在使用表单来收集用户输入时，例如`<input><select><textearea>`等元素都要绑定一个change事件，当表单的状态发生变化，就会触发onChange事件，更新组件的state。这种通过setState将输入的值维护到了state中，需要时再从state中取出，数据受到了state的控制的组件在React中被称为受控组件

## 23. React中refs的作用是什么？有哪些应用场景？

用于访问在render方法中创建的DOM节点或者React元素，表单数据验证和收集，动画，以及一些文本选择，媒体控制等

## 24. React组件的构造函数有什么作用？它是必须的吗？

用于通过将对象分配给this.state来初始化组件的本地状态和将事件处理程序方法绑定到实例上，如果使用则需要配上super(),如果要在constructor 内部使用 this.props 就要 传入props , 否则不用。

不是必须写的，但是是必须被调用的，如果子类没有定义constructor方法，这个构造函数会被默认添加并调用super

## 25. React.forwardRef是什么？

主要用于转发Refs到子组件，forwardRef 接受了父级元素标记的 ref 信息，并把它转发下去，使得子组件可以通过 props 来接受到上一层级或者是更上层级的ref，forward强化了ref。

## 26. 类组件与函数组件有什么异同？

相同点：

+   都是组件，无论是函数组件还是类式组件，在最终的能达到的呈现效果上都是一致的，都是React的最小编码单位，函数组件可以重构为类式组件，类式组件也可以重构为函数组件

不同点：

+   一个是基于面向对象编程，一个是基于函数式编程
+   类式组件具有生命周期、可以被实例化、可以拥有继承等特性，函数式组件具有HOOK，可以用useEffect模拟一部分生命周期
+   性能优化上，类式组件主要依靠生命周期`shouldComponentUpdate `去控制渲染，函数组件依靠useMemo、useCallback去控制渲染和缓存
+   类式组件容易复杂，逻辑不清楚，函数式组件轻量简单，逻辑透明
+   函数式组件是一个纯函数，他接受一个props返回一个React元素，类式组件需要去继承，创建render然后返回react元素。
+   类式组件通过state保持状态，函数式组件通过useState保存状态

## 27.super()和super(props)有什么区别？

React中的component基于类，我们创建新的组件的时候是需要继承React.Component的，而类的继承，子类是没有自己的this的，需要继承父类的this，super()就是调用父类的构造函数，并将父类的this指向子类，这样子类就有自己的this了。super和super(props)的区别就是构造函数是否传入函数，如果不传入props，React会帮你把props赋值给实例，但是你在super()到构造函数结束这段时间是没法访问到props的
