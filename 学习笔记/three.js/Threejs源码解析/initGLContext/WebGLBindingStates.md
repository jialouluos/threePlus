# WebGLBindingStates

## WebGLBindingStates( gl, extensions, attributes, capabilities )

```js
const maxVertexAttributes = gl.getParameter( gl.MAX_VERTEX_ATTRIBS );
//控制顶点缓冲区对象与WebGL中attribute变量间的数据传输，以及更新，同时用VAO记录
//extensions是由调用WebGLExtensions模块返回的一个工厂函数 选用一些WebGL扩展，同时用于检查是否支持各种 WebGL 扩展。
//capabilities是由调用WebGlCapabilities模块返回的一个对象 其为一堆gl环境中的最大值
//attributes 是由调用WebGlCapabilities模块返回的一个工厂函数 其控制顶点缓冲区对象数据的管理调用了gl.createBuffer()、gl.bindBuffer()、gl.bufferData()
```

立即渲染物体和普通物体表现在代码上的区别是，没有用到顶点数组对象（Vertex Array Object，简称 VAO），
立即渲染物体直接获取object上的position、normal、uv和color数据丢进buffer，进行绘制。
普通物体会在第一次绘制保存下position、normal、uv和color数据，下一帧绘制，如果没有改变，直接bindVertexArrayOES，就可以了，不用一个个bindBuffer。采用VAO的方式可以降低数据传输，在大场景绘制时，可以提高性能。

```js
const bindingStates = {};
```

## createBindingState( vao )

初始化一个绑定状态对象

```js
const newAttributes = [];
const enabledAttributes = [];
const attributeDivisors = [];
for ( let i = 0; i < maxVertexAttributes; i ++ ) {
    newAttributes[ i ] = 0;
    enabledAttributes[ i ] = 0;
    attributeDivisors[ i ] = 0;
}
return {
    geometry: null,//ji'g
    program: null,//着色器程序
    wireframe: false,//线框
    newAttributes: newAttributes,//全为0
    enabledAttributes: enabledAttributes,//全为0
    attributeDivisors: attributeDivisors,//全为0
    object: vao,//VAO对象
    attributes: {},//顶点数据
    index: null//顶点索引
};
```

## initAttributes

将currentState.newAttributes格式化为一个全0的数组

## createVertexArrayObject

用于创建一个顶点数组对象 (VAOs) 可以用来封装顶点数组的状态。 VAO 的作用：负责记录 bindBuffer 和 vertexAttribPointer 的调用状态。

```js
return extension.createVertexArrayOES();
```

## bindVertexArrayObject( vao )

绑定VAOs数组对象

```js
return extension.bindVertexArrayOES( vao );
```

## deleteVertexArrayObject( vao )

删除VAOs数组对象

```js
return extension.deleteVertexArrayOES( vao );
```

## getBindingState( geometry, program, material )

```js
const wireframe = ( material.wireframe === true );
let programMap = bindingStates[ geometry.id ];
if ( programMap === undefined ) {
    programMap = {};
    bindingStates[ geometry.id ] = programMap;
}
let stateMap = programMap[ program.id ];
if ( stateMap === undefined ) {
    stateMap = {};
    programMap[ program.id ] = stateMap;
}
let state = stateMap[ wireframe ];
if ( state === undefined ) {
    state = createBindingState( createVertexArrayObject() );
    stateMap[ wireframe ] = state;
}
return state;
//返回一个由createBindingState方法创建的一个工厂对象
/*
bindingStates:{
	geometry.id:{
		programMap:{
			program.id:{
				stateMap:{//其属性
					wireframe:{
						geometry: null,//ji'g
    					program: null,//着色器程序
    					wireframe: false,//线框
    					newAttributes: newAttributes,//全为0
    					enabledAttributes: enabledAttributes,//全为0
    					attributeDivisors: attributeDivisors,//全为0
    					object: vao,//VAO对象
   						attributes: {},//顶点数据
    					index: null//顶点索引
					}
				}
			}
		}
	}
}
*/
```

## needsUpdate( geometry, index )

```js
const cachedAttributes = currentState.attributes;
const geometryAttributes = geometry.attributes;
//比较两个数据是否存在差异，如果存在差异则返回true进行后续更新
```

## saveCache( geometry, index )

进行数据更新以及储存

```js
const cache = {};
const attributes = geometry.attributes;
let attributesNum = 0;//记录了一个geometry中顶点数据的种类
for ( const key in attributes ) {//这里遍历geometry中所有的顶点数组对象
    const attribute = attributes[ key ];
    const data = {};
    data.attribute = attribute;//将attribute属性抽离出来,这里将原本的geometry中的attributes[key]变为currentState.attributes[key].attribute
    if ( attribute.data ) {
        data.data = attribute.data;
    }
    cache[ key ] = data;
    attributesNum ++;//数据种类
}
currentState.attributes = cache;//数据集
currentState.attributesNum = attributesNum;
currentState.index = index;//记录顶点的索引
//这里采用浅拷贝，更新的值都为currentState对象上的属性
```

## enableAttribute( attribute )

```js
enableAttributeAndDivisor( attribute, 0 );
```

## enableAttributeAndDivisor( attribute, meshPerAttribute )

```js
const newAttributes = currentState.newAttributes;
const enabledAttributes = currentState.enabledAttributes;
const attributeDivisors = currentState.attributeDivisors;
newAttributes[ attribute ] = 1;
if ( enabledAttributes[ attribute ] === 0 ) {
    gl.enableVertexAttribArray( attribute );//启用attribute，让顶点着色器能够访问缓冲区的数据
    enabledAttributes[ attribute ] = 1;//进行启用标记，便于后续释放数据
}
```

## vertexAttribPointer( index, size, type, normalized, stride, offset )

```js
if ( capabilities.isWebGL2 === true && ( type === gl.INT || type === gl.UNSIGNED_INT ) ) {
    gl.vertexAttribIPointer( index, size, type, stride, offset );
} else {
    gl.vertexAttribPointer( index, size, type, normalized, stride, offset );
}
```

## disableUnusedAttributes()

```js
const newAttributes = currentState.newAttributes;
const enabledAttributes = currentState.enabledAttributes;
for ( let i = 0, il = enabledAttributes.length; i < il; i ++ ) {
    if ( enabledAttributes[ i ] !== newAttributes[ i ] ) {//判断是否为最新数据
        gl.disableVertexAttribArray( i );//如果不是，则释放原来的数据
        enabledAttributes[ i ] = 0;//并将启用标记置为false
    }
}
```

## setupVertexAttributes( object, material, program, geometry )

```js
initAttributes();//初始化state.newAttributes的值
const geometryAttributes = geometry.attributes;//得到几何体的顶点数据
const programAttributes = program.getAttributes();//programAttributes得到一个携带着顶点着色器所有attribute变量的地址的对象
//通过const n = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );
//const attributes = {};
//for ( let i = 0; i < n; i ++ ) {
//    const info = gl.getActiveAttrib( program, i );
//    const name = info.name;
//    attributes[ name ] = gl.getAttribLocation( program, name );
//}
//return attributes;调用了gl.getAttribLocation 获取顶点着色器中所有attribute变量地址
const materialDefaultAttributeValues = material.defaultAttributeValues;//获取材质中默认顶点值
/*this.defaultAttributeValues = {
'color': [ 1, 1, 1 ],
'uv': [ 0, 0 ],
'uv2': [ 0, 0 ]
};*/
//后续对programAttributes每个成员进行遍历，programAttribute代表每个成员
for ( const name in programAttributes ) {
    const programAttribute = programAttributes[ name ];//WebGL程序中获取的每个attribute的地址
    if ( programAttribute >= 0 ) {//地址存在
        const geometryAttribute = geometryAttributes[name];//获取geometry中数据
        if (geometryAttribute !== undefined) {
            const normalized = geometryAttribute.normalized;//是否被归一化
            const size = geometryAttribute.itemSize;//每个顶点的数据维度
            const attribute = attributes.get( geometryAttribute );//获取到该顶点数据对应的buffer数据对象（由gl.createBuffer创建的）
            if ( attribute === undefined ) continue;//不存在就自动忽略
            const buffer = attribute.buffer;//真正的buffer,代表一个WebGL缓冲对象
            const type = attribute.type;//例如gl.FLOAT
            const bytesPerElement = attribute.bytesPerElement;//每个索引的字节大小
            if(geometryAttribute.isInterleavedBufferAttribute) {/*...*/}
            else{
                enableAttribute( programAttribute );//启用attribute，让顶点着色器能够访问缓冲区的数据
            }
            gl.bindBuffer( gl.ARRAY_BUFFER, buffer );//进行缓冲对象与目标绑定，这里的buffer中已经存在数据
            vertexAttribPointer( programAttribute, size, type, normalized, 0, 0 );//进行数据传输
        }
    }
    disableUnusedAttributes();
}
```

## setup( object, material, program, geometry, index )

setup是用来推入顶点相关的数据，使用了 VAO，几何体顶点的获取和更新，以及向attribute类型变量进行传值

```js
let updateBuffers = false;
if ( vaoAvailable ) {
    const state = getBindingState( geometry, program, material );
    if ( currentState !== state ) {
        currentState = state;
        bindVertexArrayObject( currentState.object );
    }
    updateBuffers = needsUpdate( geometry, index );
    if ( updateBuffers ) saveCache( geometry, index );//将当前绑定的状态值(currentState)更新为最新的几何体顶点数据
}
if ( index !== null ) {//这里index表示一个顶点索引数据数组
	attributes.update( index, gl.ELEMENT_ARRAY_BUFFER );//这里的update是WebGLAttributes的方法
}
if ( updateBuffers ) {
    setupVertexAttributes( object, material, program, geometry );//以及向attribute类型变量进行传值
    if ( index !== null ) {
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, attributes.get( index ).buffer );
    }
}
```

## releaseStatesOfProgram( program )

用于控制state的Program的释放

```js
for ( const geometryId in bindingStates ) {//遍历每一个State对象
    const programMap = bindingStates[ geometryId ];
    if ( programMap[ program.id ] === undefined ) continue;//不存在 跳过
    const stateMap = programMap[ program.id ];
    for ( const wireframe in stateMap ) {
        deleteVertexArrayObject( stateMap[ wireframe ].object );//释放VAOs
        delete stateMap[ wireframe ];
    }
    delete programMap[ program.id ];
}
```

## releaseStatesOfGeometry( geometry )

```js
if ( bindingStates[ geometry.id ] === undefined ) return;
const programMap = bindingStates[ geometry.id ];
for ( const programId in programMap ) {
    const stateMap = programMap[ programId ];
    for ( const wireframe in stateMap ) {
        deleteVertexArrayObject( stateMap[ wireframe ].object );
        delete stateMap[ wireframe ];
    }
    delete programMap[ programId ];
}
delete bindingStates[ geometry.id ];
```

## dispose

```js
reset();
//后面附加一串比releaseStatesOfProgram方法更彻底的释放()
for ( const geometryId in bindingStates ) {
    const programMap = bindingStates[ geometryId ];
    for ( const programId in programMap ) {
        const stateMap = programMap[ programId ];
        for ( const wireframe in stateMap ) {
            deleteVertexArrayObject( stateMap[ wireframe ].object );
            delete stateMap[ wireframe ];
        }
        delete programMap[ programId ];
    }
    delete bindingStates[ geometryId ];
}
```

## reset

```js
resetDefaultState();
if ( currentState === defaultState ) return;
currentState = defaultState;
bindVertexArrayObject( currentState.object );
```

## resetDefaultState

```js
defaultState.geometry = null;
defaultState.program = null;
defaultState.wireframe = false;
```

## 返回一个工厂函数对象

```js
return {
    setup: setup,
    reset: reset,
    resetDefaultState: resetDefaultState,
    dispose: dispose,
    releaseStatesOfGeometry: releaseStatesOfGeometry,
    releaseStatesOfProgram: releaseStatesOfProgram,
    initAttributes: initAttributes,
    enableAttribute: enableAttribute,
    disableUnusedAttributes: disableUnusedAttributes
};
```