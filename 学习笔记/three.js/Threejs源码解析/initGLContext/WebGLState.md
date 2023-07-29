# WebGLState

## WebGLState(gl, extensions, capabilities)

```js
//返回一个工厂函数，用来控制缓冲区以及纹理以及绘制面状态
//extensions是由调用WebGLExtensions模块返回的一个工厂函数 选用一些WebGL扩展，同时用于检查是否支持各种 WebGL 扩展。
//capabilities是由调用WebGlCapabilities模块返回的一个对象 其为一堆gl环境中的最大值
//ColorBuffer(){...}
//DepthBuffer(){...}
//StencilBuffer(){...}
const colorBuffer = new ColorBuffer();//创建用于控制颜色缓冲区的工厂函数实例
const depthBuffer = new DepthBuffer();//创建用于控制深度缓冲区的工厂函数实例
const stencilBuffer = new StencilBuffer();//创建用于控制模板缓冲区的工厂函数实例
let enabledCapabilities = {};//启用的功能
let xrFramebuffer = null;//xr帧缓冲
let currentBoundFramebuffers = {};//当前绑定的帧缓冲区
let currentProgram = null;//当前着色器程序
let currentBlendingEnabled = false;
let currentBlending = null;
let currentBlendEquation = null;//当前绑定的方程
let currentBlendSrc = null;//当前绑定的链接
let currentBlendDst = null;
let currentBlendEquationAlpha = null;
let currentBlendSrcAlpha = null;
let currentBlendDstAlpha = null;
let currentPremultipledAlpha = false;
let currentFlipSided = null;
let currentCullFace = null;
let currentLineWidth = null;//当前线宽
let currentPolygonOffsetFactor = null;
let currentPolygonOffsetUnits = null;
const maxTextures = gl.getParameter(35661);//MAX_COMBINED_TEXTURE_IMAGE_UNITS==> 单个片段着色器能访问的纹理单元数，最低16，一般16或32
let lineWidthAvailable = false;
let version = 0;
const glVersion = gl.getParameter(7938);//gl.VERSION
if ( glVersion.indexOf( 'WebGL' ) !== - 1 ) {//获取WebGL版本
    version = parseFloat( /^WebGL (\d)/.exec( glVersion )[ 1 ] );
    lineWidthAvailable = ( version >= 1.0 );
} else if ( glVersion.indexOf( 'OpenGL ES' ) !== - 1 ) {//获取OpenGL ES版本
    version = parseFloat( /^OpenGL ES (\d)/.exec( glVersion )[ 1 ] );
    lineWidthAvailable = ( version >= 2.0 );
}
let currentTextureSlot = null;
let currentBoundTextures = {};
const scissorParam = gl.getParameter( gl.SCISSOR_BOX );//目前来看似乎和viewportParam的值一样
const viewportParam = gl.getParameter( gl.VIEWPORT );//如果要获取当前的视口，则可以查询VIEWPORT特征。e.g. Int32Array[0, 0, 640, 480]
const emptyTextures = {};//储存着两个初始化的纹理对象
emptyTextures[ gl.TEXTURE_2D ] = createTexture( gl.TEXTURE_2D, gl.TEXTURE_2D, 1 );//生成2D纹理
emptyTextures[ gl.TEXTURE_CUBE_MAP ] = createTexture( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6 );//生成立方体纹理
colorBuffer.setClear( 0, 0, 0, 1 );//该方法用于设置绘图区的背景颜色
depthBuffer.setClear( 1 );//深度缓冲清除
stencilBuffer.setClear( 0 );//模板缓冲清除
enable( gl.DEPTH_TEST );//开启深度测试
depthBuffer.setFunc( LessEqualDepth );//gl.LEQUAL（如果传入值小于或等于深度缓冲区值，则通过）
setFlipSided( false );//是否开启正反面转换
setCullFace( CullFaceBack );//设置剪裁面
enable( gl.CULL_FACE );//开启背面剪裁
setBlending( NoBlending );//设置混合方式
//bindFramebuffer( target, framebuffer ){...}
//useProgram( program ){...}
const equationToGL = {
    [ AddEquation ]: gl.FUNC_ADD,
    [ SubtractEquation ]: gl.FUNC_SUBTRACT,
    [ ReverseSubtractEquation ]: gl.FUNC_REVERSE_SUBTRACT
};
const extension = extensions.get( 'EXT_blend_minmax' );
if ( extension !== null ) {
    equationToGL[ MinEquation ] = extension.MIN_EXT;
    equationToGL[ MaxEquation ] = extension.MAX_EXT;
}
const factorToGL = {
    [ ZeroFactor ]: gl.ZERO,
    [ OneFactor ]: gl.ONE,
    [ SrcColorFactor ]: gl.SRC_COLOR,
    [ SrcAlphaFactor ]: gl.SRC_ALPHA,
    [ SrcAlphaSaturateFactor ]: gl.SRC_ALPHA_SATURATE,
    [ DstColorFactor ]: gl.DST_COLOR,
    [ DstAlphaFactor ]: gl.DST_ALPHA,
    [ OneMinusSrcColorFactor ]: gl.ONE_MINUS_SRC_COLOR,
    [ OneMinusSrcAlphaFactor ]: gl.ONE_MINUS_SRC_ALPHA,
    [ OneMinusDstColorFactor ]: gl.ONE_MINUS_DST_COLOR,
    [ OneMinusDstAlphaFactor ]: gl.ONE_MINUS_DST_ALPHA
};
//setLineWidth( width ){...}//设置线的宽度，没什么用，现在的webgl版本，包括OpenGL ES 2/3  最大最小宽度都是1；总的来说设置不了
```

## ColorBuffer

```js
let locked = false;//是否加锁，用于控制颜色缓冲区的写入状态
const color = new Vector4();
let currentColorMask =null;//当前颜色缓冲区状态
const currentColorClear = new Vector4(0,0,0,0);//当前清除颜色，清除后的背景颜色

//返回一个工厂函数
return {
    setMask: function (colorMask) {//设置能否写入颜色缓冲区
        if (currentColorMask !== colorMask && !locked) {//如果写入的颜色与当前的颜色不一致，并且未加锁
            gl.colorMask(colorMask, colorMask, colorMask, colorMask);//void gl.colorMask(red, green, blue, alpha);设置在绘制或渲染到颜色帧缓冲区
            currentColorMask = colorMask;//记录颜色缓冲区的状态
        }
    },
    setLocked: function (lock) {//更新锁的状态
        locked = lock;
    },
    setClear: function (r, g, b, a, premultipliedAlpha) {//设置背景颜色，premultipliedAlpha表示是否需要增加透明效果
        if (premultipliedAlpha === true) {
            r *= a;
            g *= a;
            b *= a;
        }
        color.set(r, g, b, a);
        if (currentColorClear.equals(color) === false) {//equals 比较每个分量的值是否相同
            gl.clearColor(r, g, b, a);//该方法用于设置绘图区的背景颜色
            currentColorClear.copy(color);//更新当前颜色缓冲区的状态记录
        }
    },
    reset: function () {//初始化
        locked = false;
        currentColorMask = null;
        currentColorClear.set(-1, 0, 0, 0); //设置为无效状态
    }
};

```

## DepthBuffer

```js
let locked = false;//是否加锁，用于控制深度缓冲区的写入状态
let currentDepthMask = null;//记录当前深度测试写入状态
let currentDepthFunc = null;//记录当前深度值的比较方式
let currentDepthClear = null;//记录清除深度缓冲时所使用的值

//返回一个工厂函数
return {
    setTest: function (depthTest) {//是否开启深度测试
        if (depthTest) {
            enable(2929);//2929==>gl.DEPTH_TEST
        } else {
            disable(2929);
        }
    },
    setMask: function (depthMask) {
        if (currentDepthMask !== depthMask && !locked) {//在读写状态下改变
            gl.depthMask(depthMask);//方法设置是启用还是禁用写入深度缓冲区
            currentDepthMask = depthMask;//记录当前深度测试写入状态
        }
    },
    /**
      * 此函数的作用是确定深度值的比较方式。
      每画一个物体，设备中将存储每个像素点的深度值，如果需要新绘制一个物体A，则对应像素处的深度值需要
      和深度缓冲区的值进行比较，默认情况下，gl.depthFunc( GL_LESS)，也就是在对于某个像素处，A的深度值小于
      帧缓冲区中对应的深度值才会取A的颜色，否则不会发生改变
      * @param depthFunc
     */
    //是一个指定深度比较函数的 GLenum (en-US)，它设置像素将被绘制的条件。默认值是 gl.LESS。可能的值是：
	//gl.NEVER（永不通过）
	//gl.LESS（如果传入值小于深度缓冲值，则通过）
	//gl.EQUAL（如果传入值等于深度缓冲区值，则通过）
	//gl.LEQUAL（如果传入值小于或等于深度缓冲区值，则通过）
	//gl.GREATER（如果传入值大于深度缓冲区值，则通过）
	//gl.NOTEQUAL（如果传入的值不等于深度缓冲区值，则通过）
	//gl.GEQUAL（如果传入值大于或等于深度缓冲区值，则通过）
	//gl.ALWAYS（总是通过）
    setFunc: function (depthFunc) {
        if (currentDepthFunc !== depthFunc) {
            if (depthFunc) {
                switch (depthFunc) {
                    case NeverDepth:
                        gl.depthFunc(512);//gl.NEVER
                        break;
                    case AlwaysDepth:
                        gl.depthFunc(519);//gl.ALWAYS
                        break;
                    case LessDepth:
                        gl.depthFunc(513);//gl.LESS
                        break;
                    case LessEqualDepth:
                        gl.depthFunc(515);//gl.LEQUAL
                        break;
                    case EqualDepth:
                        gl.depthFunc(514);//gl.EQUAL
                        break;
                    case GreaterEqualDepth:
                        gl.depthFunc(518);//gl.GEQUAL
                        break;
                    case GreaterDepth:
                        gl.depthFunc(516);//gl.GREATER
                        break;
                    case NotEqualDepth:
                        gl.depthFunc(517);//gl.NOTEQUAL
                        break;
                    default:
                        gl.depthFunc(515);//gl.LEQUAL
                }
            } else {
                gl.depthFunc(515);//gl.LEQUAL
            }
            currentDepthFunc = depthFunc;//记录当前深度值的比较方式
        }
    },
    setLocked: function (lock) {//更新锁的状态
        locked = lock;
    },
    setClear: function (depth) {
        if (currentDepthClear !== depth) {
            gl.clearDepth(depth);//清除深度缓冲区
            currentDepthClear = depth;//depth在 0 和 1 之间
        }
    },
    reset: function () {//初始化
        locked = false;
        currentDepthMask = null;
        currentDepthFunc = null;
        currentDepthClear = null;
    }
};
```

## StencilBuffer

```js
//大致上与上面的颜色缓冲区和深度缓冲区相差不大
/**
     * 模板缓冲的相关设置，模板缓冲的值取值范围为[0-2的n次方-1]，其中n代表模板缓冲值在2进制下
     * @returns {{setTest: setTest, setMask: setMask, setFunc: setFunc, setOp: setOp, setLocked: setLocked, setClear: setClear, reset: reset}}
     * @constructor
     * 相关介绍;http://blog.csdn.net/wangdingqiaoit/article/details/52143197
     */
//一般用来把其它场景作为纹理使用时，就会用到模板缓冲区
var locked = false;
var currentStencilMask = null;
var currentStencilFunc = null;
var currentStencilRef = null;
var currentStencilFuncMask = null;
var currentStencilFail = null;
var currentStencilZFail = null;
var currentStencilZPass = null;
var currentStencilClear = null;

//返回一个工厂函数
return {
    //是否开启模板测试
    setTest: function ( stencilTest ) {
        if ( stencilTest ) {
            enable( gl.STENCIL_TEST );
        } else {
            disable( gl.STENCIL_TEST );
        }
    },
    //设置是否可以对模板缓冲区进行写入和修改
    setMask: function ( stencilMask ) {
        if ( currentStencilMask !== stencilMask && ! locked ) {
            gl.stencilMask( stencilMask );
            currentStencilMask = stencilMask;
        }
    },
    //设置模板缓冲的比较方式
    setFunc: function ( stencilFunc, stencilRef, stencilMask ) {
        if ( currentStencilFunc !== stencilFunc ||
            currentStencilRef     !== stencilRef     ||
            currentStencilFuncMask !== stencilMask ) {
            gl.stencilFunc( stencilFunc, stencilRef, stencilMask );
            currentStencilFunc = stencilFunc;
            currentStencilRef = stencilRef;
            currentStencilFuncMask = stencilMask;
        }
    },
    /*stencilFail代表的是模板测试失败，对应模板缓冲区的值应该进行的操作，可选的值有
                GL_KEEP，GL_ZERO，GL_REPLACE，GL_INCR，GL_INCR_WRAP，GL_DECR，GL_DECR_WRAP，GL_INVERT
                stencilZFail代表的是模板测试成功，但是深度检测没有通过后的操作，可选的值和上面的相同
                stencilZPass代表的是模板测试和深度检测都通过时，可选择的值和上面相同*/
    setOp: function ( stencilFail, stencilZFail, stencilZPass ) {
        if ( currentStencilFail !== stencilFail   ||
            currentStencilZFail !== stencilZFail ||
            currentStencilZPass !== stencilZPass ) {
            gl.stencilOp( stencilFail, stencilZFail, stencilZPass );
            currentStencilFail = stencilFail;
            currentStencilZFail = stencilZFail;
            currentStencilZPass = stencilZPass;
        }
    },
    setLocked: function ( lock ) {
        locked = lock;
    },
    setClear: function ( stencil ) {
        if ( currentStencilClear !== stencil ) {
            gl.clearStencil( stencil );
            currentStencilClear = stencil;
        }
    },
    reset: function () {
        locked = false;
        currentStencilMask = null;
        currentStencilFunc = null;
        currentStencilRef = null;
        currentStencilFuncMask = null;
        currentStencilFail = null;
        currentStencilZFail = null;
        currentStencilZPass = null;
        currentStencilClear = null;
    }
};
```

## createTexture(type,target,count)

```js
//用于创建纹理
//count表示为纹理对象绑定几张图片
//主要调用webglAPI gl.createTexture()创建纹理对象，gl.bindTexture()
const data = new Uint8Array(4); // 4必须与默认的4的拆包对齐匹配。，data指代图像数据
const texture = gl.createTexture();//创建纹理对象
gl.bindTexture(type, texture);//绑定纹理对象，type具有两个参数gl.TEXTURE_2D(二维纹理),gl.TEXTURE_CUBE_MAP(立方体纹理)
gl.texParameteri(type, 10241, 9728);//gl.texParameteri( type, gl.TEXTURE_MIN_FILTER, gl.NEAREST );//纹理变小 采用临近取样法
gl.texParameteri(type, 10240, 9728);//gl.texParameteri( type, gl.TEXTURE_MAG_FILTER, gl.NEAREST );//纹理变大 采用临近取样法
for (let i = 0; i < count; i++) {
    gl.texImage2D(target + i, 0, 6408, 1, 1, 0, 6408, 5121, data);//gl.texImage2D( target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data );
}
return texture;
//对于标准纹理流程来说还差Y轴翻转，激活纹理单元
```

## setFlipSided(flipSided)

```js
/**
* 是否开启正反面转换，通常情况下，当观察者从正面看三角形时ti，三角形的构造方式是逆时针的。
* 这样程序会将所有顺时针构造的三角形面当作被遮挡的面进行剔除。从而很大程度上避免了无用的系统开销
*/
if ( currentFlipSided !== flipSided ) {
    //设置缠绕方向来指定多边形是正面还是背面
    //gl.CW: 顺时针绕线。
    //gl.CCW: 逆时针上链。
    if ( flipSided ) {
        gl.frontFace( gl.CW );
    } else {
        gl.frontFace( gl.CCW );
    }
    currentFlipSided = flipSided;
}
```

## setCullFace( cullFace )

```js
//方法指定是否可以剔除正面和/或背面的多边形。默认值为gl.BACK
//默认情况下禁用多边形剔除。要启用或禁用剔除，请使用带有参数的 enable()and disable()方法
/**设置剪裁面
* 设置背面剪裁的方式，一共有三种（1.只显示正面，2.只显示背面，3同时显示正面和背面）
*/
if ( cullFace !== CullFaceNone ) {
    enable( gl.CULL_FACE );
    if ( cullFace !== currentCullFace ) {
        if ( cullFace === CullFaceBack ) {
            gl.cullFace( gl.BACK );
        } else if ( cullFace === CullFaceFront ) {
            gl.cullFace( gl.FRONT );
        } else {
            gl.cullFace( gl.FRONT_AND_BACK );
        }
    }
} else {
    disable( gl.CULL_FACE );
}
currentCullFace = cullFace;
```

## enable(id) disable(id)

```js
if ( enabledCapabilities[ id ] !== true ) {
    gl.enable( id );
    enabledCapabilities[ id ] = true;
}
if ( enabledCapabilities[ id ] !== false ) {
    gl.disable( id );
    enabledCapabilities[ id ] = false;
}
```

## setBlending(blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, premultipliedAlpha)

```js
//设置一些有关混合的方法
```

## bindXRFramebuffer(framebuffer)

```js
if ( framebuffer !== xrFramebuffer ) {
   gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );
   xrFramebuffer = framebuffer;
}
```

## bindFramebuffer(target,framebuffer)

```js
if ( framebuffer === null && xrFramebuffer !== null ) framebuffer = xrFramebuffer; //如果可用，请使用活动XR帧缓冲区
if ( currentBoundFramebuffers[ target ] !== framebuffer ) {
    gl.bindFramebuffer( target, framebuffer );
    currentBoundFramebuffers[ target ] = framebuffer;
    if ( isWebGL2 ) {
        // gl.DRAW_FRAMEBUFFER is equivalent to gl.FRAMEBUFFER
        if ( target === gl.DRAW_FRAMEBUFFER ) {
            currentBoundFramebuffers[ gl.FRAMEBUFFER ] = framebuffer;
        }
        if ( target === gl.FRAMEBUFFER ) {
            currentBoundFramebuffers[ gl.DRAW_FRAMEBUFFER ] = framebuffer;
        }
    }
    return true;
}
return false;
```

## useProgram(program)

```js
if ( currentProgram !== program ) {
    gl.useProgram( program );
    currentProgram = program;
    return true;
}
```

## setMaterial(material, frontFaceCW)

```js
material.side === DoubleSide
    ? disable( gl.CULL_FACE )
: enable( gl.CULL_FACE );
//这里如果正反面都需要绘制的话，那么就关闭背面裁剪
//反之则开启
let flipSided = ( material.side === BackSide );
if ( frontFaceCW ) flipSided = ! flipSided;
setFlipSided( flipSided );//通过设置缠绕方向来指定多边形是正面还是背
( material.blending === NormalBlending && material.transparent === false )//混合相关
    ? setBlending( NoBlending ): setBlending( material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.premultipliedAlpha );
depthBuffer.setFunc( material.depthFunc );//指定将输入像素深度与当前深度缓冲区值进行比较的函数。
depthBuffer.setTest( material.depthTest );//设置是否启用深度测试
depthBuffer.setMask( material.depthWrite );//设置是否启用写入深度缓冲。
colorBuffer.setMask( material.colorWrite );//方法设置在绘制或渲染到. WebGLFramebuffer,gl.colorMask(red, green, blue, alpha);
const stencilWrite = material.stencilWrite;//写入模板缓冲
stencilBuffer.setTest( stencilWrite );//设置是否启用模板测试
if ( stencilWrite ) {
    stencilBuffer.setMask( material.stencilWriteMask );//方法控制启用和禁用模板平面中各个位的正面和背面写入。
    stencilBuffer.setFunc( material.stencilFunc, material.stencilRef, material.stencilFuncMask );//方法设置了模板测试的前后功能和参考值。
    stencilBuffer.setOp( material.stencilFail, material.stencilZFail, material.stencilZPass );//方法设置了正面和背面的模板测试操作。
}
setPolygonOffset( material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits );//启用或禁用多边形偏移填充
material.alphaToCoverage === true//启用或禁用多重采样
    ? enable( gl.SAMPLE_ALPHA_TO_COVERAGE )
: disable( gl.SAMPLE_ALPHA_TO_COVERAGE );
```

## setPolygonOffset( polygonOffset, factor, units )

```js
if ( polygonOffset ) {//深度偏移
    enable( gl.POLYGON_OFFSET_FILL );
    if ( currentPolygonOffsetFactor !== factor || currentPolygonOffsetUnits !== units ) {
        gl.polygonOffset( factor, units );
        currentPolygonOffsetFactor = factor;
        currentPolygonOffsetUnits = units;
    }
} else {
    disable( gl.POLYGON_OFFSET_FILL );
}
```

## setScissorTest( scissorTest )

```js
//设置模板测试
if ( scissorTest ) {
    enable( gl.SCISSOR_TEST );
} else {
    disable( gl.SCISSOR_TEST );
}
```

## activeTexture(webglSlot)

```js
if ( webglSlot === undefined ) webglSlot = gl.TEXTURE0 + maxTextures - 1;
if ( currentTextureSlot !== webglSlot ) {
    gl.activeTexture( webglSlot );
    currentTextureSlot = webglSlot;
}
```

## bindTexture( webglType, webglTexture ) unbindTexture()

```js
//bindTexture
if ( currentTextureSlot === null ) {
    activeTexture();
}
let boundTexture = currentBoundTextures[ currentTextureSlot ];
if ( boundTexture === undefined ) {
    boundTexture = { type: undefined, texture: undefined };
    currentBoundTextures[ currentTextureSlot ] = boundTexture;
}
if ( boundTexture.type !== webglType || boundTexture.texture !== webglTexture ) {
    gl.bindTexture( webglType, webglTexture || emptyTextures[ webglType ] );
    boundTexture.type = webglType;
    boundTexture.texture = webglTexture;
}

//unbindTexture
const boundTexture = currentBoundTextures[ currentTextureSlot ];
if ( boundTexture !== undefined && boundTexture.type !== undefined ) {
    gl.bindTexture( boundTexture.type, null );
    boundTexture.type = undefined;
    boundTexture.texture = undefined;
}
```

## 返回一个工厂函数

```js
return {
    buffers: {
        color: colorBuffer,
        depth: depthBuffer,
        stencil: stencilBuffer
    },
    enable: enable,
    disable: disable,
    bindFramebuffer: bindFramebuffer,
    bindXRFramebuffer: bindXRFramebuffer,
    useProgram: useProgram,
    setBlending: setBlending,
    setMaterial: setMaterial,
    setFlipSided: setFlipSided,
    setCullFace: setCullFace,
    setLineWidth: setLineWidth,
    setPolygonOffset: setPolygonOffset,
    setScissorTest: setScissorTest,
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    unbindTexture: unbindTexture,
    compressedTexImage2D: compressedTexImage2D,
    texImage2D: texImage2D,
    texImage3D: texImage3D,
    scissor: scissor,
    viewport: viewport,
    reset: reset
};
```



