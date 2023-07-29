# WebGLExtensions

## WebGLExtensions( gl )

```js
extensions={}用于储存扩展
//选用一些WebGL扩展，同时用于检查是否支持各种 WebGL 扩展。
```

## getExtensions(name)

```js
if (extensions[name] !== undefined) {//如果定义存在，则直接返回
    return extensions[name];
}
switch (name) {
    case 'WEBGL_depth_texture':
        extension = gl.getExtension('WEBGL_depth_texture') || gl.getExtension('MOZ_WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture');
        break;
    case 'EXT_texture_filter_anisotropic':
        //该EXT_texture_filter_anisotropic扩展是WebGL API的一部分，并公开了两个用于各向异性过滤 (AF)的常量。当以倾斜角度查看纹理图元时，AF 提高了 mipmap 纹理访问的质量。仅使用 mipmapping，这些查找倾向于平均为灰色。
        ...
        break;
    case 'WEBGL_compressed_texture_s3tc':
        ...
        break;

    case 'WEBGL_compressed_texture_pvrtc':
        ...
        break;
    default:
        extension = gl.getExtension(name);
}
extensions[name] = extension;
return extension;
```

## 返回一个工厂函数对象

```js
return {
    has: function (name) {
        return getExtension(name) !== null;
    },
    init: function (capabilities) {
        if (capabilities.isWebGL2) {
            getExtension('EXT_color_buffer_float');
        } else {
            getExtension('WEBGL_depth_texture');//定义了 2D 深度和深度模板纹理。
            getExtension('OES_texture_float');//公开了纹理的浮点像素类型
            getExtension('OES_texture_half_float');//添加了具有 16 位（又名半浮点）和 32 位浮点组件的纹理格式。
            getExtension('OES_texture_half_float_linear');//允许对纹理使用半浮点像素类型进行线性过滤。
            getExtension('OES_standard_derivatives');//添加了 GLSL 派生函数dFdx、dFdy和fwidth。
            getExtension('OES_element_index_uint');//此扩展扩展WebGLRenderingContext.drawElements()：该type参数现在接受gl.UNSIGNED_INT
            getExtension('OES_vertex_array_object');//提供VAO
            getExtension('ANGLE_instanced_arrays');//该ANGLE_instanced_arrays扩展是WebGL API的一部分，如果它们共享相同的顶点数据、图元计数和类型，则允许多次绘制相同的对象或相似对象组。
        }
        getExtension('OES_texture_float_linear');//允许对纹理使用浮点像素类型进行线性过滤
        getExtension('EXT_color_buffer_half_float');//增加了渲染到 16 位浮点颜色缓冲区的能力。
    },
    get: function (name) {
        const extension = getExtension(name);
        if (extension === null) {
            console.warn('THREE.WebGLRenderer: ' + name + ' extension not supported.');
        }
        return extension;
    }
};
```



