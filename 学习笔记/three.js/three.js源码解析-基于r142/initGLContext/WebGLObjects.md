# WebGLObjects

## 函数作用

对一个Object3D对象进行每帧调用一次更新，内部调用WebGLGeometries的update

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@geometries 维护线框绘制数据，以及维护和更新以及在内存管理对象中注册geometry
*@attributes 创建一系列的缓冲区对象，并管理缓冲区顶点数据，利用weakMap做attribute与由attribute创建的buffer的映射
*@info 具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试
**/
function WebGLObjects(gl, geometries, attributes, info) {
    let updateMap = new WeakMap();
    //返回更新的的方法和销毁
}
```

## 核心函数-update(object)

```ts
 function update(object) {
        const frame = info.render.frame;
        const geometry = object.geometry;
        const buffergeometry = geometries.get(object, geometry);//注册
        if (updateMap.get(buffergeometry) !== frame) {//每帧调用一次
            geometries.update(buffergeometry);
            updateMap.set(buffergeometry, frame);
        }
        if (object.isInstancedMesh) {
            if (object.hasEventListener('dispose', onInstancedMeshDispose) === false) {
                object.addEventListener('dispose', onInstancedMeshDispose);
            }
            attributes.update(object.instanceMatrix, 34962);
            if (object.instanceColor !== null) {
                attributes.update(object.instanceColor, 34962);
            }
        }
        return buffergeometry;
    }
```

## 返回值

```ts
return {
        update: update,//更新对象
        dispose: dispose//重置用于维护的WeakMap
    };
```

