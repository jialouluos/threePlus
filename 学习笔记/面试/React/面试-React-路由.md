# 路由

## 1. React-Router的实现原理是什么？

基于hash，通过监听hashchange事件，感知hash变化，改变hash路由可以直接通过`location.hash = xxx` 的方式

基于h5的history路由：改变url可以通过history.pushState和resplaceState等方式，监听 url 的变化可以通过自定义事件触发实现

react-router 实现的思想：基于 `history` 库来实现上述不同的客户端路由实现思想，基于 `history` 库来实现上述不同的客户端路由实现思想，通过维护的列表，在每次 URL 发生变化时，通过配置的 路由路径，匹配到对应的 Component，并且 render

## 2. 如何配置 React-Router 实现路由切换

+   使用`<Route>`组件，通过比较`<Route>`的push属性和当前地址的pathname来实现当一个 `<Route>` 匹配成功时，它将渲染其内容，当它不匹配时就会渲染 null。没有路径的 `<Route>` 将始终被匹配。
+   使用`<Switch>`配合`<Route>`组件，`<Switch>` 用于将 `<Route>` 分组。`<Switch>` 不是分组 `<Route>` 所必须的，但他通常很有用。 一个 `<Switch>` 会遍历其所有的子 `<Route>`元素，并仅渲染与当前地址匹配的第一个元素。在V18中`<Switch>`被更新为`<Routes>`
+   使用`<Link>、 <NavLink>、<Redirect>` 组件
    +   `<Link>`组件同于创建一个路由链接，本质是对`<a>`的封装,V5版本的to属性只支持绝对位置，如`<Lint to="me">`表示`<Lint to="/me">`，如果当时正在Users组件内,想跳转需要`<Lint to="/users/me">`。在V6中，Link默认支持相对位置，也就是`<Lint to="me">` 在Users组件内会等价于`<Lint to="/users/me">`，同时支持'..' 和'.'等相对路径写法。
    +   `<NavLink>`是一种特殊类型的`<Link>`当它的 to属性与当前地址匹配时，可以将其定义为"活跃的"。
    +   `<Redirect>`用于重定向，在Router6之前是采用将`<Redirect>`写在`<Switch>`中，在Router6之后去除Switch中的`<Redirect>`，用react-router-dom中的Redirect 替代，（` <**Route** path="about" render={() => <Redirect to="about-us" />}`）或者用 `<Navigate>` 实现还可以使用hook(useNavigate进行重定向)

## 4. react-router 里的 Link 标签和 a 标签的区别

这两者都是链接，都是 标签，`<Link>`是react-router 里实现路由跳转的链接，一般配合`<Route>` 使用，`<Link>` 的“跳转”行为只会触发相匹配的`<Route>`对应的页面内容更新，而不会刷新整个页面。对于Link来说，有onClick就执行onClick，click时会阻止a标签的默认事件，跳转则通过herf(即to)，通过绑定事件被触发而改变当前history或者hash的值跳转进行跳转

## 5. React-Router如何获取URL的参数和历史对象？

+   params参数
+   
    +   在路由配置时，先将参数进行占位拼接通过`/:`，传参也用字符串拼接一一对应，会显示在URL地址栏
    +   在类组件中使用this.props去获取，在函数组件中使用useParams去获取
+   seatch参数
    +   在路由配置时，不用进行占位拼接，传参也用字符串拼接通过?和&，会显示在URL地址栏
    +   在函数组件中使用useSearchParams去解构获取，或者使用useLocation获取
+   state参数
    +   传参传入的是一个对象，不会显示在URL地址栏
    +   在函数组件中使用useLocation获取
+   history(历史对象)在函数组件可以通过useHistory，在类组件中可以使用this.props.history获取

## 7. React-Router的路由有几种模式？

+   BrowserRouter，基于history，改变url不会让浏览器刷新页面

+   HashRouter，基于hash，改变`hash`值并不会导致浏览器向服务器发送请求，浏览器不发出请求，也就不会刷新页面

    `hash` 值改变，触发全局 `window` 对象上的 `hashchange` 事件。所以 `hash` 模式路由就是利用 `hashchange` 事件监听 `URL` 的变化，从而进行 `DOM` 操作来模拟页面跳转

+   区别：最大的区别就是看有没有#号，有#号的就是hashRouter

## 8. React-Router 4的Switch有什么用？Routes有什么用

用于包裹路由，用来渲染与路径匹配的第一个子Route或者Redirect，只要匹配到了就不会往下再继续匹配了