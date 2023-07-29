# WebGLProperties

## WebGLProperties()

```js
//由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式
let properties = new WeakMap();
```

## get(object)

```js
let map = properties.get( object );
if ( map === undefined ) {
    map = {};
    properties.set( object, map );
}
return map;
```

## remove(object)

```js
properties.delete( object );
```

## update(object,key,value)

```js
properties.get( object )[ key ] = value;
```

## dispose()

```js
properties = new WeakMap();
```

## 返回一个工厂函数

```js
return {
    get: get,
    remove: remove,
    update: update,
    dispose: dispose,
};
```