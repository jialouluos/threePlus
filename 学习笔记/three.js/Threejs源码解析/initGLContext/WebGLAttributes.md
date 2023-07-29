# WebGLAttributes

## WebGLAttributes(gl, capabilities)

```js
//通过WeakMap来实现储存缓冲区对象，并管理缓冲区对象数据的更新以及储存
const buffers = new WeakMap();//创建一个WeakMap
//capabilities是由调用WebGlCapabilities模块返回的一个对象 其为一堆gl环境中的最大值
```

## createBuffer(attribute, bufferType)

bufferType一般有两个值：gl.ARRAY_BUFFER,gl.ELEMENT_ARRAY_BUFFER，表示不同的用处

attribute表示一个基类是BufferAttribute的对象(其中有个属性array是类型化数组)

```js
const array = attribute.array;
const usage = attribute.usage;
const buffer = gl.createBuffer();//创建一个缓冲区对象
gl.bindBuffer(bufferType, buffer);//将创建的缓冲区对象与目标进行绑定
gl.bufferData(bufferType, array, usage);//将顶点数据通过目标向buffer进行传输
//这样 就实现了数据==>缓冲区=/=>顶点的一个过程，随时可以解开缓冲区到顶点的开关进行数据传输
let type = gl.FLOAT;//type表示着传入数据的精度
return {
            buffer: buffer,
            type: type,
            bytesPerElement: array.BYTES_PER_ELEMENT,
            version: attribute.version
        };
//返回一个对象，该对象的buffer属性表示一个缓冲区对象
```

## updateBuffer(buffer, attribute, bufferType)

更新绑定的缓冲区对象

```js
const array = attribute.array;//attribute表示一个Uint16BufferAttribute
const updateRange = attribute.updateRange;
/**
updateRange:{
count: -1
offset: 0
}
**/
gl.bindBuffer(bufferType, buffer);
if (updateRange.count === -1) {
    gl.bufferSubData(bufferType, 0, array);//部分数据更替
}
else{
    gl.bufferSubData(bufferType, updateRange.offset * array.BYTES_PER_ELEMENT,
                     array.subarray(updateRange.offset, updateRange.offset + updateRange.count));
}

```

## get(attribute)

```js
return buffers.get(attribute);
```

## remove(attribute)

```js
const data = buffers.get(attribute);//获取该记录顶点数据对象的WeakMap键对应的值
if (data) {
    gl.deleteBuffer(data.buffer);//调用glAPI删除缓冲区对象
    buffers.delete(attribute);//WeakMap取消键值对绑定
}
```

## update(attribute, bufferType)

```js
const data = buffers.get(attribute);
if (data === undefined) {
    buffers.set(attribute, createBuffer(attribute, bufferType));
} else if (data.version < attribute.version) {
    updateBuffer(data.buffer, attribute, bufferType);
    data.version = attribute.version;
}
```