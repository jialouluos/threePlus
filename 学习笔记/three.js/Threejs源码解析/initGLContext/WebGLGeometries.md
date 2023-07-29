# WebGLGeometries

## WebGLGeometries( gl, attributes, info, bindingStates ) 

```js
const geometries = {};
const wireframeAttributes = new WeakMap();
//geometry和wireframe的更新以及销毁
//attributes 是由调用WebGLAttributes模块返回的一个工厂函数 通过WeakMap来实现储存缓冲区对象，并管理缓冲区对象数据的更新以及储存
//info 具有一系列关于显卡内存和渲染过程的统计信息的对象。
//bindingStates 是由调用WebGLBindingStates模块返回的一个工厂函数 控制顶点缓冲区对象与WebGL中attribute变量间的数据传输，以及更新，同时用VAO记录
```

## onGeometryDispose( event )

当几何体被销毁时

```js
const geometry = event.target;
if ( geometry.index !== null ) {//删除顶点索引数据
    attributes.remove( geometry.index );
}
for ( const name in geometry.attributes ) {//删除顶点数据
    attributes.remove( geometry.attributes[ name ] );
}
geometry.removeEventListener( 'dispose', onGeometryDispose );//解绑时事件绑定
delete geometries[ geometry.id ];//释放geometry储存集内数据
const attribute = wireframeAttributes.get( geometry );
if ( attribute ) {
    attributes.remove( attribute );
    wireframeAttributes.delete( geometry );
}
bindingStates.releaseStatesOfGeometry( geometry );//释放 数据绑定进程
if ( geometry.isInstancedBufferGeometry === true ) {
    delete geometry._maxInstanceCount;
}
info.memory.geometries --;//统计器更新
```

## get( object, geometry )

```js
if ( geometries[ geometry.id ] === true ) return geometry;//存在即返回
geometry.addEventListener( 'dispose', onGeometryDispose );//绑定销毁事件
geometries[ geometry.id ] = true;//避免多次绑定
info.memory.geometries ++;//统计器更新
return geometry;
```

## update( geometry )

更新顶点数据

```js
const geometryAttributes = geometry.attributes;
for ( const name in geometryAttributes ) {
    attributes.update( geometryAttributes[ name ], gl.ARRAY_BUFFER );
}
const morphAttributes = geometry.morphAttributes;
	...
```

## updateWireframeAttribute( geometry )

```js
const indices = [];
const geometryIndex = geometry.index;
const geometryPosition = geometry.attributes.position;
let version = 0;
if ( geometryIndex !== null ) {
    const array = geometryIndex.array;
    version = geometryIndex.version;
    for ( let i = 0, l = array.length; i < l; i += 3 ) {
        const a = array[ i + 0 ];
        const b = array[ i + 1 ];
        const c = array[ i + 2 ];
        indices.push( a, b, b, c, c, a );
    }
}
const attribute = new ( arrayMax( indices ) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute )( indices, 1 );
attribute.version = version;
const previousAttribute = wireframeAttributes.get( geometry );

if ( previousAttribute ) attributes.remove( previousAttribute );

wireframeAttributes.set( geometry, attribute );
```

## getWireframeAttribute( geometry ) 

```js
const currentAttribute = wireframeAttributes.get( geometry );
if ( currentAttribute ) {
    const geometryIndex = geometry.index;
    if ( geometryIndex !== null ) {
        if ( currentAttribute.version < geometryIndex.version ) {
            updateWireframeAttribute( geometry );
        }
    }
} else {
    updateWireframeAttribute( geometry );
}
return wireframeAttributes.get( geometry );
```

## 返回一个工厂函数对象

```js
return {
    get: get,
    update: update,
    getWireframeAttribute: getWireframeAttribute

};
```
