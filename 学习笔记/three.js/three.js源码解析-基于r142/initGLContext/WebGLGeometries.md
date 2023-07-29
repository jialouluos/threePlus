# WebGLGeometries

## 函数作用

维护线框绘制数据，以及维护和更新以及在内存管理对象中注册geometry

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@attributes 创建一系列的缓冲区对象，并管理缓冲区顶点数据，利用weakMap做attribute与由attribute创建的buffer的映射
*@info 具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试
*@bindingStates 创建顶点缓冲区状态与几何以及几何与Program的映射，将attribute缓存，并采用一些webgl缓存措施实现性能优化，通过对比新旧attribute去决定是否更新缓冲以及缓存的绑定。同时控制顶点缓冲区对象与WebGL中attribute变量间的数据传输以及更新
**/
function WebGLGeometries(gl, attributes, info, bindingStates) {
    const geometries = {};//用来记录geometry是否被注册
    const wireframeAttributes = new WeakMap();//映射线框数据
	// bindingStates->用到了bindingStates.releaseStatesOfGeometry(geometry);
}
```

## 核心逻辑

```ts
/**
* 在内存管理对象中注册geometry，并绑定销毁事件
*/
function get(object, geometry) {
    if (geometries[geometry.id] === true) return geometry;
    geometry.addEventListener('dispose', onGeometryDispose);
    geometries[geometry.id] = true;
    info.memory.geometries++;
    return geometry;
}
function update(geometry) {//顶点数据更新
    const geometryAttributes = geometry.attributes;
    // Updating index buffer in VAO now. See WebGLBindingStates.
    for (const name in geometryAttributes) {
        attributes.update(geometryAttributes[name], 34962);
    }
    // morph targets
    const morphAttributes = geometry.morphAttributes;
    for (const name in morphAttributes) {
        const array = morphAttributes[name];
        for (let i = 0, l = array.length; i < l; i++) {
            attributes.update(array[i], 34962);
        }
    }
}
function updateWireframeAttribute(geometry) {
    const indices = [];
    const geometryIndex = geometry.index;
    const geometryPosition = geometry.attributes.position;
    let version = 0;
    if (geometryIndex !== null) {
        const array = geometryIndex.array;
        version = geometryIndex.version;
        for (let i = 0, l = array.length; i < l; i += 3) {
            const a = array[i + 0];
            const b = array[i + 1];
            const c = array[i + 2];
            indices.push(a, b, b, c, c, a);//整合绘制线的所需数据
        }
    } else {
        const array = geometryPosition.array;
        version = geometryPosition.version;
        for (let i = 0, l = (array.length / 3) - 1; i < l; i += 3) {
            const a = i + 0;
            const b = i + 1;
            const c = i + 2;
            indices.push(a, b, b, c, c, a);
        }
    }
    const attribute = new (arrayNeedsUint32(indices) ? Uint32BufferAttribute : Uint16BufferAttribute)(indices, 1);
    attribute.version = version;
    // Updating index buffer in VAO now. See WebGLBindingStates
    const previousAttribute = wireframeAttributes.get(geometry);
    if (previousAttribute) attributes.remove(previousAttribute);
    wireframeAttributes.set(geometry, attribute);
}
function getWireframeAttribute(geometry) {
    const currentAttribute = wireframeAttributes.get(geometry);
    if (currentAttribute) {
        const geometryIndex = geometry.index;
        if (geometryIndex !== null) {
            // if the attribute is obsolete, create a new one
            if (currentAttribute.version < geometryIndex.version) {
                updateWireframeAttribute(geometry);
            }
        }
    } else {
        updateWireframeAttribute(geometry);
    }
    return wireframeAttributes.get(geometry);
}
```

## 销毁

```ts
function onGeometryDispose(event) {
    const geometry = event.target;
    if (geometry.index !== null) {//如果存在顶点索引，清除顶点索引
        attributes.remove(geometry.index);
    }
    for (const name in geometry.attributes) {
        attributes.remove(geometry.attributes[name]);
    }
    geometry.removeEventListener('dispose', onGeometryDispose);
    delete geometries[geometry.id];
    const attribute = wireframeAttributes.get(geometry);//获取线框数据
    if (attribute) {
        //清除线框数据
        attributes.remove(attribute);
        wireframeAttributes.delete(geometry);
    }
    bindingStates.releaseStatesOfGeometry(geometry);
    if (geometry.isInstancedBufferGeometry === true) {
        delete geometry._maxInstanceCount;
    }
    info.memory.geometries--;
}
```





## 返回值

```ts
return {
    get: get,
    update: update,
    getWireframeAttribute: getWireframeAttribute

};