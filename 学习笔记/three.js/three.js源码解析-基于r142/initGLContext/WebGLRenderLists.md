# WebGLRenderLists

## 函数作用

内部维护一个WeakMap(scene对WebGLRenderList数组的映射)，用于记录渲染的对象列表，并提供给全局变量renderListStack

## 入口函数

```ts
function WebGLRenderLists() {
   let lists = new WeakMap();
    //返回一个场景对应的渲染物体列表
}
```

## 核心函数-get(scene, renderCallDepth)

```ts
function get(scene, renderCallDepth) {
    let list;
    if (lists.has(scene) === false) {
        list = new WebGLRenderList();
        lists.set(scene, [list]);
    } else {
        if (renderCallDepth >= lists.get(scene).length) {
            list = new WebGLRenderList();
            lists.get(scene).push(list);
        } else {
            list = lists.get(scene)[renderCallDepth];
        }
    }
    return list;//返回值会被renderListStack数组push
}
function dispose() {
    lists = new WeakMap();
}
```

## 返回值

```ts
return {
    get: get,
    dispose: dispose
};
```