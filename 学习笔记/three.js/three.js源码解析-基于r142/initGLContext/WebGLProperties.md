# WebGLProperties

## 函数作用

由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式

## 入口函数

```ts
function WebGLProperties() {
   let properties = new WeakMap();//记录对象映射
	 //get(){...}
     //remove(){...}
     //update(){...}
     //dispose(){...}
     //将操作对象的方法包裹为对象返回
}
```

## 核心逻辑

```ts
function get(object) {
    let map = properties.get(object);//通过map去对对象进行映射
    if (map === undefined) {
        map = {};
        properties.set(object, map);
    }
    return map;
}
function remove(object) {
    properties.delete(object);//删除映射
}
function update(object, key, value) {
    properties.get(object)[key] = value;//更新映射对象的键值对值
}
function dispose() {
    properties = new WeakMap();//销毁
}
```

## 返回值

```ts
return {
        get: get,
        remove: remove,
        update: update,
        dispose: dispose
    };