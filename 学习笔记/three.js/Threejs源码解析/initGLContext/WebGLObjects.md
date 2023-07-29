# WebGLObjects

## WebGLObjects( gl, geometries, attributes, info )

```js
let updateMap = new WeakMap();
//对一个Object的几何体进行更新,实现每帧调用一次更新,对WebGLGeometries.js的再次封装
//geometries 是由调用WebGLGeometries模块返回的一个工厂函数 geometry和wireframe的更新以及销毁
//attributes 是由调用WebGlCapabilities模块返回的一个工厂函数 其控制顶点缓冲区对象数据的管理调用了gl.createBuffer()、gl.bindBuffer()、gl.bufferData()
//info 具有一系列关于显卡内存和渲染过程的统计信息的对象。
```

## update( object )

```js
const frame = info.render.frame;//render帧数
const geometry = object.geometry;
const buffergeometry = geometries.get( object, geometry );
if ( updateMap.get( buffergeometry ) !== frame ) {
    geometries.update( buffergeometry );
    updateMap.set( buffergeometry, frame );
}
```

## dispose()

```js
updateMap = new WeakMap();
```

## onInstancedMeshDispose( event )

```js
const instancedMesh = event.target;
instancedMesh.removeEventListener( 'dispose', onInstancedMeshDispose );
attributes.remove( instancedMesh.instanceMatrix );
if ( instancedMesh.instanceColor !== null ) attributes.remove( instancedMesh.instanceColor );
```

## 返回一个工厂函数对象

```js
return {
   update: update,
   dispose: dispose
};
```