# WebGLExtensions

## 函数作用

启用一些WebGl上下文扩展。同时将启用的扩展对象储存下来

## 入口函数

```ts
/**
*@gl webgl上下文环境
**/
function WebGLExtensions(gl) {
    
    const extensions = {};//储存上下文扩展
	//核心函数
    //将管理扩展的对象的操作方法包裹为对象返回
}
```

## 核心函数-getExtension(name)

```ts
function getExtension(name) {//启用WebGL扩展名，启用 WebGL 扩展后，您就可以使用此扩展对象提供的方法、属性或常量。
    if (extensions[name] !== undefined) {
        return extensions[name];
    }
    let extension;
    switch (name) {
        case 'WEBGL_depth_texture':
            extension = gl.getExtension('WEBGL_depth_texture') || gl.getExtension('MOZ_WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture');
            break;
        case 'EXT_texture_filter_anisotropic':
            extension = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            break;
        case 'WEBGL_compressed_texture_s3tc':
            extension = gl.getExtension('WEBGL_compressed_texture_s3tc') || gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
            break;
        case 'WEBGL_compressed_texture_pvrtc':
            extension = gl.getExtension('WEBGL_compressed_texture_pvrtc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
            break;
        default:
            extension = gl.getExtension(name);
    }
    extensions[name] = extension;
    return extension;
}
```

## 返回值

```ts
return {
    /**是否存在该扩展，如果未启用则会启用 */
    has: function (name) {
        return getExtension(name) !== null;
    },
    /**启用初始化扩展 */
    init: function (capabilities) {
        if (capabilities.isWebGL2) {
            getExtension('EXT_color_buffer_float');
        } else {
            getExtension('WEBGL_depth_texture');
            getExtension('OES_texture_float');
            getExtension('OES_texture_half_float');
            getExtension('OES_texture_half_float_linear');
            getExtension('OES_standard_derivatives');
            getExtension('OES_element_index_uint');
            getExtension('OES_vertex_array_object');
            getExtension('ANGLE_instanced_arrays');
        }
        getExtension('OES_texture_float_linear');
        getExtension('EXT_color_buffer_half_float');
        getExtension('WEBGL_multisampled_render_to_texture');
    },
    /**获取扩展对象，如果未启用则会启用 */
    get: function (name) {
        const extension = getExtension(name);
        if (extension === null) {
            console.warn('THREE.WebGLRenderer: ' + name + ' extension not supported.');
        }
        return extension;
    }
};