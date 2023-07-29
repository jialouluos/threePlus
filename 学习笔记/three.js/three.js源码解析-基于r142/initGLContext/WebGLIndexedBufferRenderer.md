# WebGLIndexedBufferRenderer

## 函数作用

绘制！通过gl.drawElements()，需要使用一个元素数组缓冲(顶点索引)

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@extensions 启用一些WebGl上下文扩展。同时将启用的扩展对象储存下来
*@info 具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试
*@capabilities 维护gl环境中的阈值
**/
function WebGLIndexedBufferRenderer(gl, extensions, info, capabilities) {
     //...
}
```

## 核心函数-设置图元绘制方式和调用绘制方法

```ts
function setMode(value) {
    mode = value;
}
let type, bytesPerElement;
function setIndex(value) {
    type = value.type;
    bytesPerElement = value.bytesPerElement;
}
function render(start, count) {
    gl.drawElements(mode, count, type, start * bytesPerElement);
    info.update(count, mode, 1);
}
```

## 返回值

```ts
this.setMode = setMode;
this.setIndex = setIndex;
this.render = render;
this.renderInstances = renderInstances;
```