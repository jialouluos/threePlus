# WebGLBufferRenderer

## 函数作用

绘制！通过gl.drawArrays()，就不需要使用一个元素数组缓冲(顶点索引)

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@extensions 启用一些WebGl上下文扩展。同时将启用的扩展对象储存下来
*@info 具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试
*@capabilities 维护gl环境中的阈值
**/
function WebGLBufferRenderer(gl, extensions, info, capabilities) {
    //...
}
```

## 核心函数-设置绘制模型和调用绘制方法

```ts
function setMode(value) {
    mode = value;
}
function render(start, count) {
    gl.drawArrays(mode, start, count);//webgl原生方法gl.drawArrays
    info.update(count, mode, 1);//更新内存记录
}
function renderInstances(start, count, primcount) {
    if (primcount === 0) return;
    let extension, methodName;
    if (isWebGL2) {
        extension = gl;
        methodName = 'drawElementsInstanced';
    } else {
        extension = extensions.get('ANGLE_instanced_arrays');
        methodName = 'drawElementsInstancedANGLE';
        if (extension === null) {
            console.error('THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.');
            return;
        }
    }
    extension[methodName](mode, count, type, start * bytesPerElement, primcount);
    info.update(count, mode, primcount);
}
```

## 返回值

```ts
this.setMode = setMode;
this.render = render;
this.renderInstances = renderInstances;
```