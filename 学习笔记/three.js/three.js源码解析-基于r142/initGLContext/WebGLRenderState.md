# WebGLRenderState



## 函数作用

主要用于灯光和阴影的收集

## 入口函数

```ts
/**
*@extensions 由WebGLExtensions返回的一个对象，维护webgl扩展
*@capabilities 由WebGLCapabilities返回的一个对象，表明webgl环境相关阈值
**/
function WebGLRenderState(extensions, capabilities) {
    const lights = new WebGLLights(extensions, capabilities);//获取场景中的光照信息和阴影，内部会对光照和阴影进行类别鉴定以及信息处理
    const lightsArray = [];//灯光组
    const shadowsArray = [];//阴影组
    //将各种阈值结果包裹为对象返回
}
```

## 核心逻辑

```ts
function pushLight(light) {
    lightsArray.push(light);
}
function pushShadow(shadowLight) {
    shadowsArray.push(shadowLight);
}
function setupLights(physicallyCorrectLights) {
    lights.setup(lightsArray, physicallyCorrectLights);//参数携带场景中光照信息
}
function setupLightsView(camera) {
    lights.setupView(lightsArray, camera);
}
```

## 返回值

```ts
return {
        init: init,
        state: state,//储存
        setupLights: setupLights,//处理光照阴影以及光照属性
        setupLightsView: setupLightsView,//转变到视图空间
        pushLight: pushLight,
        pushShadow: pushShadow
    };