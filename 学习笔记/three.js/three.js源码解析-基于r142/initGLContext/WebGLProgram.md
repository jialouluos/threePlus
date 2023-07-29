# WebGLProgram

## 函数作用

three.js对webgl的program进行的一层封装,用于生成着色器代码和创建program

## 入口函数

```ts
/**
*@renderer WebGLRenderer渲染器实例
*@cacheKey 由WebGLPrograms的getProgramCacheKey函数处理得到的一个描述由WebGLPrograms.getParameters处理得到的对象中各个参数信息的字符串
*@parameters 由WebGLPrograms.getParameters处理得到的对象
*@bindingStates 创建顶点缓冲区状态与几何以及几何与Program的映射，将attribute缓存，并采用一些webgl缓存措施实现性能优化，通过对比新旧attribute去决定是否更新缓冲以及缓存的绑定。同时控制顶点缓冲区对象与WebGL中attribute变量间的数据传输以及更新
**/
function WebGLProgram(renderer, cacheKey, parameters, bindingStates) {
    ...
    return this;
}
```

## 核心逻辑-拼接着色器代码，并创建着色器与程序绑定

```ts
const gl = renderer.getContext();
const defines = parameters.defines;//获取defined
let vertexShader = parameters.vertexShader;//获取vertexShader片段
let fragmentShader = parameters.fragmentShader;//获取fragmentShader片段
const shadowMapTypeDefine = generateShadowMapTypeDefine(parameters);//获取阴影类型
const envMapTypeDefine = generateEnvMapTypeDefine(parameters);//获取环境贴图类型
const envMapModeDefine = generateEnvMapModeDefine(parameters);//?获取环境反射模型
const envMapBlendingDefine = generateEnvMapBlendingDefine(parameters);//获取融合方式
const envMapCubeUVSize = generateCubeUVSize(parameters);
const customExtensions = parameters.isWebGL2 ? '' : generateExtensions(parameters);//获取某些功能额外需要的扩展
const customDefines = generateDefines(defines);//将我们传入的defined拼接为着色器可识别的宏定义
const program = gl.createProgram();//webgl原生方法，创建一个着色器程序
let prefixVertex, prefixFragment;
//下面主要为拼接着色器代码
let versionString = parameters.glslVersion ? '#version ' + parameters.glslVersion + '\n' : '';//版本
if(parameters.isRawShaderMaterial) {//原生着色器
    //...
}
else{
    prefixVertex=[
        //...,
        'uniform mat4 modelMatrix;',//矩阵相关
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'uniform mat4 viewMatrix;',
        'uniform mat3 normalMatrix;',
        'uniform vec3 cameraPosition;',
        'uniform bool isOrthographic;',
        //...
    ],
        prefixFragment=[
        //...,
        'uniform mat4 viewMatrix;',
        'uniform vec3 cameraPosition;',
        'uniform bool isOrthographic;',
        //...
    ]
}
vertexShader = resolveIncludes(vertexShader);//将#include替换为真实的着色器代码块
vertexShader = replaceLightNums(vertexShader, parameters);//替换表示灯光数量的常量
vertexShader = replaceClippingPlaneNums(vertexShader, parameters);//替换裁剪平面数

fragmentShader = resolveIncludes(fragmentShader);//将#include替换为真实的着色器代码块
fragmentShader = replaceLightNums(fragmentShader, parameters);//替换表示灯光数量的常量
fragmentShader = replaceClippingPlaneNums(fragmentShader, parameters);//替换裁剪平面数

vertexShader = unrollLoops(vertexShader);//替换for，加快gup运算
fragmentShader = unrollLoops(fragmentShader);//替换for，加快gup运算
const vertexGlsl = versionString + prefixVertex + vertexShader;//整合
const fragmentGlsl = versionString + prefixFragment + fragmentShader;//整合
//createProgram()，attachShader() ,linkProgram()等等
```

## 返回值

```ts
this.name = parameters.shaderName;
this.id = programIdCount++;
this.cacheKey = cacheKey;
this.usedTimes = 1;
this.program = program;
this.vertexShader = glVertexShader;
this.fragmentShader = glFragmentShader;
return this;//返回实例本身