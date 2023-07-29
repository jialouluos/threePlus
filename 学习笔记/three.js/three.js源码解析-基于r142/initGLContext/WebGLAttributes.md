# WebGLAttributes

## 函数作用

创建一系列的缓冲区对象，并管理缓冲区顶点数据，利用weakMap做attribute与由attribute创建的buffer的映射

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@capabilities 由WebGLCapabilities返回的一个对象，表明webgl环境相关阈值
**/
function WebGLAttributes(gl, capabilities) {
    const buffers = new WeakMap();//创建弱映射Map 这里是attribute与由attribute创建的buffer进行映射
    const isWebGL2 = capabilities.isWebGL2;
    //createBuffer(){...}
    //updateBuffer(){...}
    //get(){...}
    //remove(){...}
    //update(){...}
    //将操作buffer对象的方法包裹为对象返回
}
```

## 核心逻辑

```ts
function createBuffer(attribute, bufferType) {
    //attribute:geometry.attribute属性
    //bufferType:ARRAY_BUFFER | ELEMENT_ARRAY_BUFFER
    //usage:gl.STATIC_DRAW | gl.STREAM_DRAW | gl.DYNAMIC_DRAW
    const array = attribute.array;
    const usage = attribute.usage;
    /**
         * 在webgl中创建一个缓冲区并绑定并将数据读取送到顶点着色器的流程一般是
         * const buffer = gl.createBuffer()
         * gl.bindBuffer(gl.ARRAY_BUFFER,buffer)
         * gl.bufferData(gl.ARRAY_BUFFER,vertexArray,STATIC_DRAW)
         * const localPosition = gl.getAttribLocation(aArogram,'position')//这里拿position举例
         * gl.vertexAttribPointer(index(要修改的顶点属性的索引-localPosition),size(顶点属性的顶点个数), type(数据类型-gl.FLOAT), normalized(一般为false), stride(连续顶点属性之间的字节偏移量), offset(第一个顶点属性的字节偏移量));
         * gl.enableVertexAttribArray(localPosition)//开启传输
         */
    const buffer = gl.createBuffer();//webgl原生方法，创建一个缓冲区对象
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, array, usage);
    attribute.onUploadCallback();//回调可以通过geometry.attribute.onUpload(callback)设置
    let type;
    //判断数据类型if (array instanceof Float32Array) {type = 5126;//gl.FLOAT}else{...}
    return {
        buffer: buffer,
        type: type,
        bytesPerElement: array.BYTES_PER_ELEMENT,//每个元素的所占用字节数
        version: attribute.version
    };
}
function updateBuffer(buffer, attribute, bufferType) {
    const array = attribute.array;
    const updateRange = attribute.updateRange;
    gl.bindBuffer(bufferType, buffer);
    if (updateRange.count === -1) {
        // 无需更新
        gl.bufferSubData(bufferType, 0, array);
    } else {
        if (isWebGL2) {
            gl.bufferSubData(bufferType, updateRange.offset * array.BYTES_PER_ELEMENT,
                             array, updateRange.offset, updateRange.count);
        } else {
            gl.bufferSubData(bufferType, updateRange.offset * array.BYTES_PER_ELEMENT,
                             array.subarray(updateRange.offset, updateRange.offset + updateRange.count));
        }
        updateRange.count = -1; // reset range
    }
}
```

## 返回值

```ts
return {
    get: get,
    remove: remove,
    update: update
};