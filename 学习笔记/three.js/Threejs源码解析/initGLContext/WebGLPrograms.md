# WebGLPrograms

## WebGLPrograms(renderer, cubemaps, cubeuvmaps, extensions, capabilities, bindingStates, clipping)

```js
const programs = [];
const isWebGL2 = capabilities.isWebGL2;
const logarithmicDepthBuffer = capabilities.logarithmicDepthBuffer;//对数深度缓冲区
//如果logarithmicDepthBuffer在构造函数中设置为 true 并且上下文支持EXT_frag_depth扩展，则为true。
//logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true; //对数深度缓冲区
const floatVertexTextures = capabilities.floatVertexTextures;//浮动顶点纹理
/**    const vertexTextures = maxVertexTextures > 0;
 //    const floatFragmentTextures = isWebGL2 || extensions.has( 'OES_texture_float' );,这三句代码表明了这些参数的来源
 //上下文是否支持OES_texture_float扩展。
 //    const floatVertexTextures = vertexTextures && floatFragmentTextures;
 **/
const maxVertexUniforms = capabilities.maxVertexUniforms;// gl.MAX_VERTEX_UNIFORM_VECTORS 的值。可以在顶点着色器中使用的最大制服数//maxVertexUniforms = gl.getParameter( gl.MAX_VERTEX_UNIFORM_VECTORS );
const vertexTextures = capabilities.vertexTextures;//顶点纹理,vertexTextures = maxVertexTextures > 0;
// maxVertexTextures = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
//如果maxVertexTextures ：整数大于0（即可以使用顶点纹理）。
let precision = capabilities.precision;//精度
const shaderIDs = {...};//shaderIDs中每个字符串属性对应的字符串都对一种类型的fragment_shader
const parameterNames={...};//预制字符串名
```

## getMaxBones(object)

```js
const skeleton = object.skeleton;//骨骼
const bones = skeleton.bones;//骨骼点
if (floatVertexTextures) {
    return 1024;
} else {
    const maxBones = Math.min(nVertexMatrices, bones.length);
    return maxBones;
}
```

## getTextureEncodingFromMap(map)

```js
let encoding;
if (map && map.isTexture) {
    encoding = map.encoding;
} else if (map && map.isWebGLRenderTarget) {
    console.warn('THREE.WebGLPrograms.getTextureEncodingFromMap: don\'t use render targets as textures. Use their .texture property instead.');
    encoding = map.texture.encoding;
} else {
    encoding = LinearEncoding;
}
return encoding;
```

## getParameters(material, lights, shadows, scene, object)

提取参数的部分属性

```js
const fog = scene.fog;//提取雾化属性
const environment = material.isMeshStandardMaterial ? scene.environment : null;//提取environment
const envMap = (material.isMeshStandardMaterial ? cubeuvmaps : cubemaps).get(material.envMap || environment);//这里说明了environment充当环境贴图，即如果材质自身不带有环境贴图，则会采用environment作为自身的环境贴图
const shaderID = shaderIDs[material.type];//获取材质名称
const maxBones = object.isSkinnedMesh ? getMaxBones(object) : 0;//SkinnedMesh==>骨骼蒙皮动画
if (material.precision !== null) {
    precision = capabilities.getMaxPrecision(material.precision);
}
let vertexShader, fragmentShader;
if (shaderID) {//如果存在ID则直接使用预制着色器
    const shader = ShaderLib[shaderID];
    vertexShader = shader.vertexShader;
    fragmentShader = shader.fragmentShader;
} else {//否则使用自定义着色器
    vertexShader = material.vertexShader;
    fragmentShader = material.fragmentShader;
}
const currentRenderTarget = renderer.getRenderTarget();
const parameters={//这里保存着一堆属性
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    precision: precision,
    isWebGL2: isWebGL2,
    shaderID: shaderID,
    shaderName: material.type
    ...
}
return parameters;
```

## getProgramCacheKey(parameters)

将一些信息转换为字符串 获取程序代码

```js
const array = [];
if (parameters.shaderID) {
    array.push(parameters.shaderID);
} else {
    array.push(parameters.fragmentShader);
    array.push(parameters.vertexShader);
}
...
array.push(parameters.customProgramCacheKey);
return array.join()
```

## getUniforms(material)

获取材质中的uniform

```js
const shaderID = shaderIDs[material.type];
let uniforms;
if (shaderID) {
    const shader = ShaderLib[shaderID];
    uniforms = UniformsUtils.clone(shader.uniforms);
} else {
    uniforms = material.uniforms;
}
return uniforms;
```

## acquireProgram(parameters, cacheKey)

```js
let program;
// Check if code has been already compiled
for (let p = 0, pl = programs.length; p < pl; p++) {
    const preexistingProgram = programs[p];
    if (preexistingProgram.cacheKey === cacheKey) {
        program = preexistingProgram;
        ++program.usedTimes;
        break;
    }
}
if (program === undefined) {
    program = new WebGLProgram(renderer, cacheKey, parameters, bindingStates);
    programs.push(program);
}
return program;
```

## releaseProgram(program)

```js
if (--program.usedTimes === 0) {
    // Remove from unordered set
    const i = programs.indexOf(program);
    programs[i] = programs[programs.length - 1];
    programs.pop();
    // Free WebGL resources
    program.destroy();
}
```

## 返回一个工厂函数

```js
return {
    getParameters: getParameters,
    getProgramCacheKey: getProgramCacheKey,
    getUniforms: getUniforms,
    acquireProgram: acquireProgram,
    releaseProgram: releaseProgram,

    programs: programs
};
```