# WebGLTextures

## WebGLTextures( _gl, extensions, state, properties, capabilities, utils, info )

```js
//用于读取设置纹理的一些属性
//extensions是由调用WebGLExtensions模块返回的一个工厂函数 选用一些WebGL扩展，同时用于检查是否支持各种 WebGL 扩展。
//capabilities是由调用WebGlCapabilities模块返回的一个对象 其为一堆gl环境中的最大值
//state是由调用WebGLState模块返回的一个工厂函数，用来控制缓冲区以及纹理以及绘制面状态
//properties是由调用WebGLProperties模块返回的一个工厂函数 由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式
//utils是由调用WebGLUtils模块返回的一个工厂函数 其中的方法用来给出gl常量
//info是由调用WebGLInfo模块返回的一个工厂函数 具有一系列关于显卡内存和渲染过程的统计信息的对象。
const isWebGL2 = capabilities.isWebGL2;
const maxTextures = capabilities.maxTextures;//获取最大纹理数
const maxCubemapSize = capabilities.maxCubemapSize;
const maxTextureSize = capabilities.maxTextureSize;
const maxSamples = capabilities.maxSamples;//获取最大取样器
const _videoTextures = new WeakMap();
let _canvas;
let useOffscreenCanvas = false;
try {//useOffscreenCanvas = true;
    useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'
    && (new OffscreenCanvas(1, 1).getContext('2d')) !== null;
} catch (err) {
    // Ignore any errors
}
const wrappingToGL = {
    [ RepeatWrapping ]: _gl.REPEAT,
    [ ClampToEdgeWrapping ]: _gl.CLAMP_TO_EDGE,
    [ MirroredRepeatWrapping ]: _gl.MIRRORED_REPEAT
};
const filterToGL = {
    [ NearestFilter ]: _gl.NEAREST,
    [ NearestMipmapNearestFilter ]: _gl.NEAREST_MIPMAP_NEAREST,
    [ NearestMipmapLinearFilter ]: _gl.NEAREST_MIPMAP_LINEAR,

    [ LinearFilter ]: _gl.LINEAR,
    [ LinearMipmapNearestFilter ]: _gl.LINEAR_MIPMAP_NEAREST,
    [ LinearMipmapLinearFilter ]: _gl.LINEAR_MIPMAP_LINEAR
};
```

## resizeImage(image, needsPowerOfTwo, needsNewCanvas, maxSize)

```js
//对超出范围的image进行处理
let scale = 1;
// handle case if texture exceeds max size
if ( image.width > maxSize || image.height > maxSize ) {
    scale = maxSize / Math.max( image.width, image.height );
}
if ( scale < 1 || needsPowerOfTwo === true ) {
    // only perform resize for certain image types
    if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
        ( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
        ( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ) {
        const floor = needsPowerOfTwo ? MathUtils.floorPowerOfTwo : Math.floor;
        const width = floor( scale * image.width );
        const height = floor( scale * image.height );
        if ( _canvas === undefined ) _canvas = createCanvas( width, height );
        // cube textures can't reuse the same canvas
        const canvas = needsNewCanvas ? createCanvas( width, height ) : _canvas;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext( '2d' );
        context.drawImage( image, 0, 0, width, height );
        console.warn( 'THREE.WebGLRenderer: Texture has been resized from (' + image.width + 'x' + image.height + ') to (' + width + 'x' + height + ').' );
        return canvas;
    } else {
        if ( 'data' in image ) {
            console.warn( 'THREE.WebGLRenderer: Image in DataTexture is too big (' + image.width + 'x' + image.height + ').' );
        }
        return image;
    }
}
return image;
```

## setTexture2D(texture, slot)

```js
const textureProperties = properties.get( texture );
if ( texture.isVideoTexture ) updateVideoTexture( texture );
if ( texture.version > 0 && textureProperties.__version !== texture.version ) {
    const image = texture.image;
    if ( image === undefined ) {
        console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is undefined' );
    } else if ( image.complete === false ) {
        console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is incomplete' );
    } else {
        uploadTexture( textureProperties, texture, slot );
        return;
    }
}
state.activeTexture( _gl.TEXTURE0 + slot );//开启纹理单元
state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture );//绑定纹理单元
```

## updateVideoTexture(texture)

```js
const frame = info.render.frame;//帧
// 检查我们更新视频纹理的最后一帧
//_videoTextures是一个WeakMap 
if ( _videoTextures.get( texture ) !== frame ) {
    _videoTextures.set( texture, frame );
    texture.update();//这里还不知道方法源
}
```

## uploadTexture( textureProperties, texture, slot )

```js
let textureType = _gl.TEXTURE_2D;
if ( texture.isDataTexture2DArray ) textureType = _gl.TEXTURE_2D_ARRAY;
if ( texture.isDataTexture3D ) textureType = _gl.TEXTURE_3D;
initTexture( textureProperties, texture );//textureProperties.__webglTexture会得到一个纹理对象
state.activeTexture( _gl.TEXTURE0 + slot );//实质是调用gl.activeTexture
state.bindTexture( textureType, textureProperties.__webglTexture );//初次进行储存对象的创建，二次调用进行gl.bindTexture
_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );//进行Y轴翻转
_gl.pixelStorei( _gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha );//将每一个分量乘A
_gl.pixelStorei( _gl.UNPACK_ALIGNMENT, texture.unpackAlignment );//未知
_gl.pixelStorei( _gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, _gl.NONE );//未知
const needsPowerOfTwo = textureNeedsPowerOfTwo( texture ) && isPowerOfTwo( texture.image ) === false;
const image = resizeImage( texture.image, needsPowerOfTwo, false, maxTextureSize );//修正尺寸
const supportsMips = isPowerOfTwo( image ) || isWebGL2,
      glFormat = utils.convert( texture.format );//获取format对应常量
/* format(格式)这些定义了 2d 纹理或texels的元素如何被着色器读取。
THREE.AlphaFormat 丢弃红色、绿色和蓝色分量，只读取 alpha 分量。
THREE.RedFormat 丢弃绿色和蓝色分量，只读取红色分量。
THREE.RedIntegerFormat 丢弃绿色和蓝色分量，只读取红色分量。纹素被读取为整数而不是浮点数。（只能与 WebGL 2 渲染上下文一起使用）。
THREE.RGFormat 丢弃 alpha 和蓝色分量并读取红色和绿色分量。（只能与 WebGL 2 渲染上下文一起使用）
THREE.RGIntegerFormat 丢弃 alpha 和蓝色分量并读取红色和绿色分量。纹素被读取为整数而不是浮点数。（只能与 WebGL 2 渲染上下文一起使用）。
THREE.RGBAFormat 默认值，读取红色、绿色、蓝色和 alpha 分量。
THREE.RGBAIntegerFormat 默认格式，它读取红色、绿色、蓝色和 alpha 分量。纹素被读取为整数而不是浮点数。（只能与 WebGL 2 渲染上下文一起使用）。
THREE.LuminanceFormat 将每个元素读取为单个亮度分量。然后将其转换为浮点，限制在 [0,1] 范围内，然后通过将亮度值放在红色、绿色和蓝色通道中并将 1.0 附加到 alpha 通道来组装成 RGBA 元素。
THREE.LuminanceAlphaFormat 将每个元素读取为亮度/alpha 双精度值。与LuminanceFormat发生相同的过程，除了 alpha 通道可能具有1.0以外的值。
THREE.DepthFormat 将每个元素读取为单个深度值，将其转换为浮点数，并钳制在 [0,1] 范围内。这是DepthTexture的默认值。
THREE.DepthStencilFormat 读取每个元素是一对深度和模板值。该对的深度分量被解释为DepthFormat。模板组件根据深度 + 模板内部格式进行解释。
*/
let glType = utils.convert( texture.type ),//获取type对应的常量，一般为gl.TEXTURE_2D或gl.TEXTURE_CUBE_MAP
    glInternalFormat = getInternalFormat( texture.internalFormat, glFormat, glType );//非WebGL2 返回值直接为glFormat
setTextureParameters( textureType, texture, supportsMips );//设置 warpS warpT 以及 minFilter magFilter anisotropy
let mipmap;
const mipmaps = texture.mipmaps;//用户指定的 mipmap 数组（可选）。
if ( texture.isDepthTexture ) {
    // 用虚拟数据填充深度纹理
    glInternalFormat = _gl.DEPTH_COMPONENT;
    ...

    if ( texture.format === DepthFormat && glInternalFormat === _gl.DEPTH_COMPONENT ) {
        if ( texture.type !== UnsignedShortType && texture.type !== UnsignedIntType ) {
            console.warn( 'THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.' );
            texture.type = UnsignedShortType;
            glType = utils.convert( texture.type );
        }
    }
    if ( texture.format === DepthStencilFormat && glInternalFormat === _gl.DEPTH_COMPONENT ) {
        glInternalFormat = _gl.DEPTH_STENCIL;
        if ( texture.type !== UnsignedInt248Type ) {
            console.warn( 'THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture.' );
            texture.type = UnsignedInt248Type;
            glType = utils.convert( texture.type );
        }
    }
    state.texImage2D( _gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, null );
} else if ( texture.isDataTexture ) {//数据纹理
    if ( mipmaps.length > 0 && supportsMips ) {
        for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {
            mipmap = mipmaps[ i ];
            state.texImage2D( _gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );
        }
        texture.generateMipmaps = false;
        textureProperties.__maxMipLevel = mipmaps.length - 1;
    } else {
        state.texImage2D( _gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, image.data );
        textureProperties.__maxMipLevel = 0;
    }
} else if ( texture.isCompressedTexture ) {
    for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {
        mipmap = mipmaps[ i ];
        if ( texture.format !== RGBAFormat && texture.format !== RGBFormat ) {
            if ( glFormat !== null ) {
                state.compressedTexImage2D( _gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, mipmap.data );
            } else {
                console.warn( 'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()' );
            }
        } else {
            state.texImage2D( _gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );
        }
    }
    textureProperties.__maxMipLevel = mipmaps.length - 1;
} else if ( texture.isDataTexture2DArray ) {
    state.texImage3D( _gl.TEXTURE_2D_ARRAY, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data );
    textureProperties.__maxMipLevel = 0;
} else if ( texture.isDataTexture3D ) {
    state.texImage3D( _gl.TEXTURE_3D, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data );
    textureProperties.__maxMipLevel = 0;
} else {
    //常规纹理（图像、视频、画布）
    //如果可用，请使用手动创建的mipmap
    //如果没有手动地图
    //设置0级mipmap，然后使用GL生成其他mipmap级别
    if ( mipmaps.length > 0 && supportsMips ) {
        for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {
            mipmap = mipmaps[ i ];
            state.texImage2D( _gl.TEXTURE_2D, i, glInternalFormat, glFormat, glType, mipmap );
        }
        texture.generateMipmaps = false;
        textureProperties.__maxMipLevel = mipmaps.length - 1;
    } else {
        state.texImage2D( _gl.TEXTURE_2D, 0, glInternalFormat, glFormat, glType, image );//配置纹理图像
        textureProperties.__maxMipLevel = 0;
    }
}
if ( textureNeedsGenerateMipmaps( texture, supportsMips ) ) {
    generateMipmap( textureType, texture, image.width, image.height );
}
textureProperties.__version = texture.version;
if ( texture.onUpdate ) texture.onUpdate( texture );
```

## initTexture( textureProperties, texture )

```js
if ( textureProperties.__webglInit === undefined ) {
    textureProperties.__webglInit = true;
    texture.addEventListener( 'dispose', onTextureDispose );//绑定纹理销毁事件
    textureProperties.__webglTexture = _gl.createTexture();//创建一个纹理对象
    info.memory.textures ++;//更新统计
}
```

## getInternalFormat( internalFormatName, glFormat, glType )

```js
if ( isWebGL2 === false ) return glFormat;//直接返回
...
```

## setTextureParameters( textureType, texture, supportsMips )

```js
function setTextureParameters( textureType, texture, supportsMips ) {
    if ( supportsMips ) {
        _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_S, wrappingToGL[ texture.wrapS ] );//纹理中设置的wrapS
        _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_T, wrappingToGL[ texture.wrapT ] );//纹理中设置的wrapT
        if ( textureType === _gl.TEXTURE_3D || textureType === _gl.TEXTURE_2D_ARRAY ) {
            _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_R, wrappingToGL[ texture.wrapR ] );
        }
        _gl.texParameteri( textureType, _gl.TEXTURE_MAG_FILTER, filterToGL[ texture.magFilter ] );//纹理中设置的magFilter
        _gl.texParameteri( textureType, _gl.TEXTURE_MIN_FILTER, filterToGL[ texture.minFilter ] );//纹理中设置的minFilter
    } else {
        _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE );
        _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE );
        if ( textureType === _gl.TEXTURE_3D || textureType === _gl.TEXTURE_2D_ARRAY ) {
            _gl.texParameteri( textureType, _gl.TEXTURE_WRAP_R, _gl.CLAMP_TO_EDGE );
        }
        if ( texture.wrapS !== ClampToEdgeWrapping || texture.wrapT !== ClampToEdgeWrapping ) {
            console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.' );
        }
        _gl.texParameteri( textureType, _gl.TEXTURE_MAG_FILTER, filterFallback( texture.magFilter ) );
        _gl.texParameteri( textureType, _gl.TEXTURE_MIN_FILTER, filterFallback( texture.minFilter ) );
        if ( texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter ) {
            console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.' );
        }
    }
    if ( extensions.has( 'EXT_texture_filter_anisotropic' ) === true ) {
        const extension = extensions.get( 'EXT_texture_filter_anisotropic' );
        if ( texture.type === FloatType && extensions.has( 'OES_texture_float_linear' ) === false ) return; // verify extension for WebGL 1 and WebGL 2
        if ( isWebGL2 === false && ( texture.type === HalfFloatType && extensions.has( 'OES_texture_half_float_linear' ) === false ) ) return; // verify extension for WebGL 1 only
        if ( texture.anisotropy > 1 || properties.get( texture ).__currentAnisotropy ) {//anisotropyge'xiang'yi
            _gl.texParameterf( textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( texture.anisotropy, capabilities.getMaxAnisotropy() ) );
            properties.get( texture ).__currentAnisotropy = texture.anisotropy;//纹理中设置的各向异性
        }
    }
}
```

