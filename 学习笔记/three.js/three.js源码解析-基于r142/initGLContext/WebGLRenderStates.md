# WebGLRenderStates



## 函数作用

内部维护一个WeakMap(scene对WebGLRenderState数组的映射)，用于记录渲染的光照列表，并提供给全局变量renderStateStack

## 入口函数

```ts
/**
*@extensions 由WebGLExtensions返回的一个对象，维护webgl扩展
*@capabilities 由WebGLCapabilities返回的一个对象，表明webgl环境相关阈值
**/
function WebGLRenderState(extensions, capabilities) {
    let renderStates = new WeakMap();
    //将各种阈值结果包裹为对象返回
}
```

## 核心逻辑

```ts
function get(scene, renderCallDepth = 0) {
    let renderState;
    if (renderStates.has(scene) === false) {
        renderState = new WebGLRenderState(extensions, capabilities);
        renderStates.set(scene, [renderState]);
    } else {
        if (renderCallDepth >= renderStates.get(scene).length) {
            renderState = new WebGLRenderState(extensions, capabilities);
            renderStates.get(scene).push(renderState);
        } else {
            renderState = renderStates.get(scene)[renderCallDepth];
        }
    }
    return renderState;//返回值会被renderStateStack数组push
}
```

## 返回值

```ts
return {
    get: get,
    dispose: dispose
};
```