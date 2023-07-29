# WebGLBindingStates

## 函数作用

创建顶点缓冲区状态与几何以及几何与Program的映射，将attribute缓存，并采用一些webgl缓存措施实现性能优化，通过对比新旧attribute去决定是否更新缓冲以及缓存的绑定。同时控制顶点缓冲区对象与WebGL中attribute变量间的数据传输以及更新

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@extensions 由WebGLExtensions返回的一个对象，维护webgl扩展
*@attributes 创建一系列的缓冲区对象，并管理缓冲区顶点数据，利用weakMap做attribute与由attribute创建的buffer的映射
*@capabilities 由WebGLCapabilities返回的一个对象，表明webgl环境相关阈值
**/
function WebGLBindingStates(gl, extensions, attributes, capabilities) {
    /**
     * 立即渲染物体和普通物体表现在代码上的区别是，没有用到顶点数组对象（Vertex Array Object，简称 VAO），
     * 立即渲染物体直接获取object上的position、normal、uv和color数据丢进buffer，进行绘制。
     *
     * 普通物体会在第一次绘制保存下position、normal、uv和color数据，下一帧绘制，如果没有改变，
     * 直接bindVertexArrayOES，就可以了，不用一个个bindBuffer。采用VAO的方式可以降低数据传输，在大场景绘制时，可以提高性能。
     */
    const maxVertexAttributes = gl.getParameter(34921);//gl.MAX_VERTEX_ATTRIBS,获取一个Progarm支持的最大attribute变量数
    const extension = capabilities.isWebGL2 ? null : extensions.get('OES_vertex_array_object');//VAO,一种优化措施，当数据没发生改变时，可以直接采用VAO的方式保存数据，下一帧直接绘制
    const vaoAvailable = capabilities.isWebGL2 || extension !== null;//是否支持VAO
    const bindingStates = {};//用于记录绑定的状态
    const defaultState = createBindingState(null);//初始化一个状态
    let currentState = defaultState;//将当前状态指向新建的状态
    let forceUpdate = false;//?强制更新
    //返回维护方法
}
```

## 核心逻辑

```ts
function setup(object, material, program, geometry, index) {
        let updateBuffers = false;
        if (vaoAvailable) {
            const state = getBindingState(geometry, program, material);//通过geometry.id和program.id获取对应的缓存状态
            if (currentState !== state) {
                currentState = state;//改变指向
                bindVertexArrayObject(currentState.object);//currentState.object是一个VAO对象,开启记录数据移动的踪迹
            }
            updateBuffers = needsUpdate(object, geometry, program, index);//通过对比新旧attribute去决定是否更新，返回一个更新的标志，标志着本次是否需要更新
            if (updateBuffers) saveCache(object, geometry, program, index);//如果需要更新，则调用saveCache更新缓存
        } else {
           //...
        }
        if (index !== null) {
            attributes.update(index, 34963);//gl.ELEMENT_ARRAY_BUFFER 如果存在顶点索引，则更新一下顶点缓存
        }
        if (updateBuffers || forceUpdate) {//更新
            forceUpdate = false;
            setupVertexAttributes(object, material, program, geometry);//由于之前已经更新了缓存，所以内部直接获取数据即为最新的数据
            if (index !== null) {
                gl.bindBuffer(34963, attributes.get(index).buffer);//顶点索引
            }
        }
    }
```

## 更新缓存

```ts
function setupVertexAttributes(object, material, program, geometry) {
    if (capabilities.isWebGL2 === false && (object.isInstancedMesh || geometry.isInstancedBufferGeometry)) {
        if (extensions.get('ANGLE_instanced_arrays') === null) return;
    }
    initAttributes();//初始化更新顶点链接状态，便于后续重新链接记录，0表示为链接，1表示链接
    const geometryAttributes = geometry.attributes;//最新的geometry中的attribute数据
    const programAttributes = program.getAttributes();//着色器程序中的attribute数据
    const materialDefaultAttributeValues = material.defaultAttributeValues;
    for (const name in programAttributes) {
        const programAttribute = programAttributes[name];//得到每个变量的数据(例如 position)
        if (programAttribute.location >= 0) {//地址大于等于0 说明存在
            let geometryAttribute = geometryAttributes[name];//得到geometry中每个变量的数据(例如 position)
            if (geometryAttribute === undefined) {
                if (name === 'instanceMatrix' && object.instanceMatrix) geometryAttribute = object.instanceMatrix;
                if (name === 'instanceColor' && object.instanceColor) geometryAttribute = object.instanceColor;
            }
            if (geometryAttribute !== undefined) {
                const normalized = geometryAttribute.normalized;//是否归一化
                const size = geometryAttribute.itemSize;//每个数据所占的个数
                const attribute = attributes.get(geometryAttribute);//WebGLAttributes.get(),获取缓存中的buffer缓存对象
                if (attribute === undefined) continue;
                const buffer = attribute.buffer;//缓冲区对象 WEBGLBUFFER 里面保存了缓冲区数据
                const type = attribute.type;//数据的类型 FLOAT
                const bytesPerElement = attribute.bytesPerElement;//每个数据的字节大小
                if (geometryAttribute.isInterleavedBufferAttribute) {//是否是交错缓冲类型的数据
                    const data = geometryAttribute.data;//通过data获取数据
                    const stride = data.stride;//移动数
                    const offset = geometryAttribute.offset;//偏移数
                    if (data.isInstancedInterleavedBuffer) {
                        for (let i = 0; i < programAttribute.locationSize; i++) {
                            enableAttributeAndDivisor(programAttribute.location + i, data.meshPerAttribute);//内部会调用gl.enableVertexAttribArray()去链接顶点数据，同时记录链接开启状态
                        }
                        if (object.isInstancedMesh !== true && geometry._maxInstanceCount === undefined) {
                            geometry._maxInstanceCount = data.meshPerAttribute * data.count;
                        }
                    } else {
                        for (let i = 0; i < programAttribute.locationSize; i++) {
                            enableAttribute(programAttribute.location + i);//内部调用enableAttributeAndDivisor()
                        }
                    }
                    gl.bindBuffer(34962, buffer);//webgl原生方法，绑定缓冲区
                    for (let i = 0; i < programAttribute.locationSize; i++) {
                        vertexAttribPointer(
                            programAttribute.location + i,
                            size / programAttribute.locationSize,
                            type,
                            normalized,
                            stride * bytesPerElement,
                            (offset + (size / programAttribute.locationSize) * i) * bytesPerElement
                        );//传输顶点数据
                    }
                } else {
                    if (geometryAttribute.isInstancedBufferAttribute) {
                        for (let i = 0; i < programAttribute.locationSize; i++) {
                            enableAttributeAndDivisor(programAttribute.location + i, geometryAttribute.meshPerAttribute);
                        }
                        if (object.isInstancedMesh !== true && geometry._maxInstanceCount === undefined) {
                            geometry._maxInstanceCount = geometryAttribute.meshPerAttribute * geometryAttribute.count;
                        }
                    } else {
                        for (let i = 0; i < programAttribute.locationSize; i++) {
                            enableAttribute(programAttribute.location + i);
                        }
                    }
                    gl.bindBuffer(34962, buffer);
                    for (let i = 0; i < programAttribute.locationSize; i++) {
                        vertexAttribPointer(
                            programAttribute.location + i,
                            size / programAttribute.locationSize,
                            type,
                            normalized,
                            size * bytesPerElement,
                            (size / programAttribute.locationSize) * i * bytesPerElement
                        );
                    }
                }
            } else if (materialDefaultAttributeValues !== undefined) {
                const value = materialDefaultAttributeValues[name];
                if (value !== undefined) {
                    switch (value.length) {
                        case 2:
                            gl.vertexAttrib2fv(programAttribute.location, value);
                            break;
                        case 3:
                            gl.vertexAttrib3fv(programAttribute.location, value);
                            break;
                        case 4:
                            gl.vertexAttrib4fv(programAttribute.location, value);
                            break;
                        default:
                            gl.vertexAttrib1fv(programAttribute.location, value);
                    }
                }
            }
        }
    }
    disableUnusedAttributes();//传输完了，这里关闭了缓冲区与顶点着色器之间的链接，同时将记录链接状态的值置为0表示未链接
}
```

## 销毁

```ts
function dispose() {
    reset();
    //清空记录的状态
    for (const geometryId in bindingStates) {
        const programMap = bindingStates[geometryId];
        for (const programId in programMap) {
            const stateMap = programMap[programId];
            for (const wireframe in stateMap) {
                deleteVertexArrayObject(stateMap[wireframe].object);
                delete stateMap[wireframe];//
            }
            delete programMap[programId];
        }
        delete bindingStates[geometryId];
    }
}
function releaseStatesOfGeometry(geometry) {//销毁相关
    if (bindingStates[geometry.id] === undefined) return;
    const programMap = bindingStates[geometry.id];
    for (const programId in programMap) {
        const stateMap = programMap[programId];
        for (const wireframe in stateMap) {
            deleteVertexArrayObject(stateMap[wireframe].object);
            delete stateMap[wireframe];
        }
        delete programMap[programId];
    }
    delete bindingStates[geometry.id];
}
function releaseStatesOfProgram(program) {//销毁相关
    for (const geometryId in bindingStates) {
        const programMap = bindingStates[geometryId];
        if (programMap[program.id] === undefined) continue;
        const stateMap = programMap[program.id];
        for (const wireframe in stateMap) {
            deleteVertexArrayObject(stateMap[wireframe].object);
            delete stateMap[wireframe];
        }
        delete programMap[program.id];
    }
}
```





## 返回值

```ts
return {
        setup: setup,//核心
        reset: reset,
        resetDefaultState: resetDefaultState,
        dispose: dispose,
        releaseStatesOfGeometry: releaseStatesOfGeometry,
        releaseStatesOfProgram: releaseStatesOfProgram,
        initAttributes: initAttributes,
        enableAttribute: enableAttribute,
        disableUnusedAttributes: disableUnusedAttributes

    };