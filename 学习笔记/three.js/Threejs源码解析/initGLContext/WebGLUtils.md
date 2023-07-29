# WebGLUtils

## WebGLUtils(gl, extensions, capabilities)

```js
//返回一个工厂函数，其中的方法用来给出gl常量
//extensions是由调用WebGLExtensions模块返回的一个工厂函数 选用一些WebGL扩展，同时用于检查是否支持各种 WebGL 扩展。
//capabilities是由调用WebGlCapabilities模块返回的一个对象 其为一堆gl环境中的最大值
```

## 返回一个工厂函数对象

```js
return {convert: convert};
//convert(p) 即可获得g
```

