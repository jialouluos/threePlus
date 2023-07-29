# WebGlCapabilities

## WebGLCapabilities(gl, extensions, parameters)

```js
let maxAnisotropy;//最大
//extensions是由调用WebGLExtensions模块返回的一个工厂函数
//parameters是调用WebGLRenderer({})传入的参数，即{}
//返回了一堆gl环境中的最大值
//getMaxAnisotropy(){...}
//getMaxPrecision(precision){...}
//判断是否为WebGL2
//判断精度是否无误
const drawBuffers = isWebGL2 || extensions.has('WEBGL_draw_buffers');//使片段着色器能够写入多个纹理，例如，这对于延迟着色很有用。
//extensions.has(xxx),如果xxx已被开启则直接返回，如果未被开启，则开启并将其信息储存进extensions
const logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true;//undefined
//下面是获取一系列最大值
const maxTextures = gl.getParameter(34930);
const maxVertexTextures = gl.getParameter(35660);//16
const maxTextureSize = gl.getParameter(3379);
const maxCubemapSize = gl.getParameter(34076);
const maxAttributes = gl.getParameter(34921);
const maxVertexUniforms = gl.getParameter(36347);
const maxVaryings = gl.getParameter(36348);
const maxFragmentUniforms = gl.getParameter(36349);
const vertexTextures = maxVertexTextures > 0;
const floatFragmentTextures = isWebGL2 || extensions.has('OES_texture_float');//true
const floatVertexTextures = vertexTextures && floatFragmentTextures;//true
const maxSamples = isWebGL2 ? gl.getParameter(36183) : 0;

```

## getMaxAnisotropy

```js
function getMaxAnisotropy() {//获取最大各向异性
    if (maxAnisotropy !== undefined) return maxAnisotropy;
    if (extensions.has('EXT_texture_filter_anisotropic') === true) {
        const extension = extensions.get('EXT_texture_filter_anisotropic');
        maxAnisotropy = gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    } else {
        maxAnisotropy = 0;
    }
    return maxAnisotropy;
}
```

## getMaxPrecision(precision)

```js
//获取最大精度precision
```

## 返回一个工厂函数对象

```js
return {//返回一系列的最大值，以及WebGL2p
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

```



