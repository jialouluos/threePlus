# WebGLCapabilities

## 函数作用

维护gl环境中的阈值

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@extensions 由WebGLExtensions返回的一个对象，管理webgl扩展
*@parameters 创建WebGLRenderer对象所传入的配置参数，WebGLRendererParameters
**/
function WebGLCapabilities(gl, extensions, parameters) {
    //获取各种阈值
    //将各种阈值结果包裹为对象返回
}
```

## 核心逻辑

```ts
let maxAnisotropy;
function getMaxAnisotropy()//获取最大各向异性
function getMaxPrecision(precision)//获取能够支持的最大精度
const isWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ||
      (typeof WebGL2ComputeRenderingContext !== 'undefined' && gl instanceof WebGL2ComputeRenderingContext); //是否为webgl2上下文
let precision = parameters.precision !== undefined ? parameters.precision : 'highp';//精度
const maxPrecision = getMaxPrecision(precision);//最大精度
if (maxPrecision !== precision) {
    console.warn('THREE.WebGLRenderer:', precision, 'not supported, using', maxPrecision, 'instead.');
    precision = maxPrecision;
}
const drawBuffers = isWebGL2 || extensions.has('WEBGL_draw_buffers');//webgl2默认开启，如果不是webgl2环境，则手动开启,使片段着色器能够写入多个纹理，这对于延迟着色很有用。一般用于写入所有片段颜色的绘制缓冲区
const logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true;//对数缓冲,减缓z-fighting的影响，但是会让early-z失效
const maxTextures = gl.getParameter(34930);//支持的最大纹理单元数量--gl.MAX_TEXTURE_IMAGE_UNITS
const maxVertexTextures = gl.getParameter(35660);//--gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS 
const maxTextureSize = gl.getParameter(3379);//?纹理最大内存
const maxCubemapSize = gl.getParameter(34076);//?CubeMap纹理最大内存
const maxAttributes = gl.getParameter(34921);//最大atribute修饰符能定义的变量数
const maxVertexUniforms = gl.getParameter(36347);//最大顶点着色器中能定义的uniform数
const maxVaryings = gl.getParameter(36348);//最大插值修饰符定义的变量数
const maxFragmentUniforms = gl.getParameter(36349);//最大片元着色器中能定义的uniform数
const vertexTextures = maxVertexTextures > 0;
const floatFragmentTextures = isWebGL2 || extensions.has('OES_texture_float');//公开纹理的浮点像素类型（gl.FLOAT）。允许渲染到 32 位浮点颜色缓冲区。
const floatVertexTextures = vertexTextures && floatFragmentTextures;
const maxSamples = isWebGL2 ? gl.getParameter(36183) : 0;//?最大取样数量
```

## 返回值

```ts
return {
        isWebGL2: isWebGL2,
        drawBuffers: drawBuffers,
        getMaxAnisotropy: getMaxAnisotropy,
        getMaxPrecision: getMaxPrecision,
        precision: precision,
        logarithmicDepthBuffer: logarithmicDepthBuffer,
        maxTextures: maxTextures,
        maxVertexTextures: maxVertexTextures,
        maxTextureSize: maxTextureSize,
        maxCubemapSize: maxCubemapSize,
        maxAttributes: maxAttributes,
        maxVertexUniforms: maxVertexUniforms,
        maxVaryings: maxVaryings,
        maxFragmentUniforms: maxFragmentUniforms,
        vertexTextures: vertexTextures,
        floatFragmentTextures: floatFragmentTextures,
        floatVertexTextures: floatVertexTextures,
        maxSamples: maxSamples
    };