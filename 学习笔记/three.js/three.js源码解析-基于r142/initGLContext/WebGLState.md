# WebGLState



## 函数作用

返回维护颜色、测试、模板缓冲区相关以及纹理绑定激活、帧缓冲区绑定、以及一些混合、裁剪、绘制顺序、多边形偏移、视口设置等的方法或对象

## 入口函数

```ts
/**
*@gl webgl上下文环境
*@extensions 由WebGLExtensions返回的一个对象，维护webgl扩展
*@capabilities 由WebGLCapabilities返回的一个对象，表明webgl环境相关阈值
**/
function WebGLState(gl, extensions, capabilities) {
    //缓冲区相关-颜色缓冲区、深度缓冲区、模板缓冲区
    //ColorBuffer、DepthBuffer、StencilBuffer
    //将各种阈值结果包裹为对象返回
}
```

## 缓冲区相关

```ts
function ColorBuffer() {
    let locked = false;//是否加锁，用于控制颜色缓冲区的能否去修改写入状态
    const color = new Vector4();
    let currentColorMask = null;//当前颜色缓冲区写入状态(各分量是否允许被写入)
    const currentColorClear = new Vector4(0, 0, 0, 0);//当前清除颜色，清除后的背景颜色
    //返回一个工厂函数
    return {
        setMask: function (colorMask) {//设置能否写入颜色缓冲区
            if (currentColorMask !== colorMask && !locked) {//如果写入的权限与当前的权限不一致，并且未加锁
                gl.colorMask(colorMask, colorMask, colorMask, colorMask);//指定是否可以将各分量写入帧缓冲区。
                currentColorMask = colorMask;//记录颜色缓冲区的状态
            }
        },
        setLocked: function (lock) {//更新锁的状态
            locked = lock;
        },
        setClear: function (r, g, b, a, premultipliedAlpha) {
            if (premultipliedAlpha === true) {//设置背景颜色，premultipliedAlpha表示是否需要增加透明效果
                r *= a;
                g *= a;
                b *= a;
            }
            color.set(r, g, b, a);
            if (currentColorClear.equals(color) === false) {
                gl.clearColor(r, g, b, a);
                currentColorClear.copy(color);
            }
        },
        //重设相关设置
        reset: function () {
            locked = false;
            currentColorMask = null;
            currentColorClear.set(-1, 0, 0, 0); // set to invalid state
        }
    };
}
function DepthBuffer() {
    let locked = false;
    let currentDepthMask = null;
    let currentDepthFunc = null;
    let currentDepthClear = null;
    return {
        setTest: function (depthTest) {//设置是否开启深度检测
            if ( depthTest ) {
                enable( gl.DEPTH_TEST );
            } else {
                disable( gl.DEPTH_TEST );
            }
        },
        setMask: function (depthMask) {//设置是否可以对深度缓冲区进行更改
            if (currentDepthMask !== depthMask && !locked) {
                gl.depthMask(depthMask);
                currentDepthMask = depthMask;
            }
        },
        setFunc: function ( depthFunc ) {//深度测试比较的方法
            if ( currentDepthFunc !== depthFunc ) {
                if ( depthFunc ) {
                    switch ( depthFunc ) {
                        case NeverDepth:
                            gl.depthFunc( gl.NEVER );
                            break;
                        case AlwaysDepth:
                            gl.depthFunc( gl.ALWAYS );
                            break;
                        case LessDepth:
                            gl.depthFunc( gl.LESS );
                            break;
                        case LessEqualDepth:
                            gl.depthFunc( gl.LEQUAL );
                            break;
                        case EqualDepth:
                            gl.depthFunc( gl.EQUAL );
                            break;
                        case GreaterEqualDepth:
                            gl.depthFunc( gl.GEQUAL );
                            break;
                        case GreaterDepth:
                            gl.depthFunc( gl.GREATER );
                            break;
                        case NotEqualDepth:
                            gl.depthFunc( gl.NOTEQUAL );
                            break;
                        default:
                            gl.depthFunc( gl.LEQUAL );
                    }
                } else {
                    gl.depthFunc( gl.LEQUAL );
                }
                currentDepthFunc = depthFunc;
            }
        },
        setLocked: function (lock) {//更新锁的状态
            locked = lock;
        },
        setClear: function (depth) {//清除深度缓冲区的值，depth值为要设置的深度缓冲区的值，取值范围为0~1
            if (currentDepthClear !== depth) {
                gl.clearDepth(depth);
                currentDepthClear = depth;
            }
        },
        reset: function () {//重设相关设置
            locked = false;
            currentDepthMask = null;
            currentDepthFunc = null;
            currentDepthClear = null;
        }
    };
}
function StencilBuffer() {
    let locked = false;
    let currentStencilMask = null;
    let currentStencilFunc = null;
    let currentStencilRef = null;
    let currentStencilFuncMask = null;
    let currentStencilFail = null;
    let currentStencilZFail = null;
    let currentStencilZPass = null;
    let currentStencilClear = null;
    return {
        setTest: function (stencilTest) {//是否开启模板测试
            if (!locked) {
                if ( stencilTest ) {
                    enable( gl.STENCIL_TEST );
                } else {
                    disable( gl.STENCIL_TEST );
                }
            }
        },
        setMask: function (stencilMask) {//控制启用和禁用模板平面中各个位的正面和背面写入。
            if (currentStencilMask !== stencilMask && !locked) {
                gl.stencilMask(stencilMask);
                currentStencilMask = stencilMask;
            }
        },
        setFunc: function (stencilFunc, stencilRef, stencilMask) {//设置模板缓冲的比较方式
            if (currentStencilFunc !== stencilFunc ||
                currentStencilRef !== stencilRef ||
                currentStencilFuncMask !== stencilMask) {
                gl.stencilFunc(stencilFunc, stencilRef, stencilMask);
                currentStencilFunc = stencilFunc;
                currentStencilRef = stencilRef;
                currentStencilFuncMask = stencilMask;
            }
        },
        setOp: function (stencilFail, stencilZFail, stencilZPass) {//设置了正面和背面的模板测试操作。
            if (currentStencilFail !== stencilFail ||
                currentStencilZFail !== stencilZFail ||
                currentStencilZPass !== stencilZPass) {
                gl.stencilOp(stencilFail, stencilZFail, stencilZPass);
                currentStencilFail = stencilFail;//模板测试失败时使用的函数。默认值为gl.KEEP。
                currentStencilZFail = stencilZFail;//模板测试通过但深度测试失败时要使用的函数。默认值为gl.KEEP。
                currentStencilZPass = stencilZPass;//模板测试和深度测试都通过时使用的函数，或者当模板测试通过并且没有深度缓冲区或深度测试被禁用时。默认值为gl.KEEP。
            }
        },
        setLocked: function (lock) {//更新锁的状态
            locked = lock;
        },
        setClear: function (stencil) {//清除模板的值，并重新设置
            if (currentStencilClear !== stencil) {
                gl.clearStencil(stencil);
                currentStencilClear = stencil;
            }
        },
        reset: function () {//重设相关设置
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
}
```

## createTexture

```ts
function createTexture( type, target, count ) {
		const data = new Uint8Array( 4 ); // 4 is required to match default unpack alignment of 4.
		const texture = gl.createTexture();//创建纹理API
		gl.bindTexture( type, texture );//绑定纹理对象，type具有两个参数gl.TEXTURE_2D(二维纹理),gl.TEXTURE_CUBE_MAP(立方体纹理)
		gl.texParameteri( type, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texParameteri( type, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		for ( let i = 0; i < count; i ++ ) {
			gl.texImage2D( target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data );
		}
		return texture;
	}
//对于标准纹理流程来说还差Y轴翻转，激活纹理单元
const emptyTextures = {};
emptyTextures[3553] = createTexture(3553, 3553, 1);//emptyTextures[ gl.TEXTURE_2D ]
emptyTextures[34067] = createTexture(34067, 34069, 6);//emptyTextures[ gl.TEXTURE_CUBE_MAP ]
```

## 一些工具函数

```ts
function enable(id) {//启用功能
    //enabledCapabilities记录开启的webgl功能例如BLEND、CULL_FACE、DEPTH_TEST
    if (enabledCapabilities[id] !== true) {
        gl.enable(id);
        enabledCapabilities[id] = true;
    }
}
function disable(id) {//禁用功能
    if (enabledCapabilities[id] !== false) {
        gl.disable(id);
        enabledCapabilities[id] = false;
    }
}
function bindFramebuffer(target, framebuffer) {
    if (currentBoundFramebuffers[target] !== framebuffer) {
        gl.bindFramebuffer(target, framebuffer);//绑定帧缓冲
        currentBoundFramebuffers[target] = framebuffer;
        return true;
    }
    return false;
}
function drawBuffers( renderTarget, framebuffer ) {
    let drawBuffers = defaultDrawbuffers;
    let needsUpdate = false;
    if ( renderTarget ) {
        drawBuffers = currentDrawbuffers.get( framebuffer );
        if ( drawBuffers === undefined ) {
            drawBuffers = [];
            currentDrawbuffers.set( framebuffer, drawBuffers );
        }
        if ( renderTarget.isWebGLMultipleRenderTargets ) {
            const textures = renderTarget.texture;
            if ( drawBuffers.length !== textures.length || drawBuffers[ 0 ] !== gl.COLOR_ATTACHMENT0 ) {
                for ( let i = 0, il = textures.length; i < il; i ++ ) {
                    drawBuffers[ i ] = gl.COLOR_ATTACHMENT0 + i;
                }
                drawBuffers.length = textures.length;
                needsUpdate = true;
            }
        } else {
            if ( drawBuffers[ 0 ] !== gl.COLOR_ATTACHMENT0 ) {
                drawBuffers[ 0 ] = gl.COLOR_ATTACHMENT0;
                needsUpdate = true;
            }
        }
    } else {
        if ( drawBuffers[ 0 ] !== gl.BACK ) {
            drawBuffers[ 0 ] = gl.BACK;
            needsUpdate = true;
        }
    }
    if ( needsUpdate ) {
        if ( capabilities.isWebGL2 ) {
            gl.drawBuffers( drawBuffers );
        } else {
            extensions.get( 'WEBGL_draw_buffers' ).drawBuffersWEBGL( drawBuffers );
        }
    }
}
function useProgram(program) {//启用程序
    if (currentProgram !== program) {
        gl.useProgram(program);
        currentProgram = program;
        return true;
    }
    return false;
}
function setBlending(blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, premultipliedAlpha) {
    if (blending === NoBlending) {
        if (currentBlendingEnabled === true) {
            disable( gl.BLEND );
            currentBlendingEnabled = false;
        }
        return;
    }
    if (currentBlendingEnabled === false) {
        enable(gl.BLEND);
        currentBlendingEnabled = true;
    }
    if (blending !== CustomBlending) {
        if (blending !== currentBlending || premultipliedAlpha !== currentPremultipledAlpha) {
            if (currentBlendEquation !== AddEquation || currentBlendEquationAlpha !== AddEquation) {
                gl.blendEquation(gl.FUNC_ADD);
                currentBlendEquation = AddEquation;
                currentBlendEquationAlpha = AddEquation;
            }
            if (premultipliedAlpha) {
                switch (blending) {
                    case NormalBlending:
                        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                        break;
                    case AdditiveBlending:
                        gl.blendFunc( gl.ONE, gl.ONE );
                        break;
                    case SubtractiveBlending:
                        gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ZERO, gl.ONE);
                        break;
                    case MultiplyBlending:
                        gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.SRC_ALPHA );
                        break;
                    default:
                        console.error('THREE.WebGLState: Invalid blending: ', blending);
                        break;
                }
            } else {
                switch (blending) {
                    case NormalBlending:
                        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                        break;
                    case AdditiveBlending:
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE );
                        break;
                    case SubtractiveBlending:
                        gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ZERO, gl.ONE);
                        break;
                    case MultiplyBlending:
                        gl.blendFunc(gl.ZERO, gl.SRC_COLOR );
                        break;
                    default:
                        console.error('THREE.WebGLState: Invalid blending: ', blending);
                        break;
                }
            }
            currentBlendSrc = null;
            currentBlendDst = null;
            currentBlendSrcAlpha = null;
            currentBlendDstAlpha = null;
            currentBlending = blending;
            currentPremultipledAlpha = premultipliedAlpha;
        }
        return;
    }
    // custom blending
    blendEquationAlpha = blendEquationAlpha || blendEquation;
    blendSrcAlpha = blendSrcAlpha || blendSrc;
    blendDstAlpha = blendDstAlpha || blendDst;
    if (blendEquation !== currentBlendEquation || blendEquationAlpha !== currentBlendEquationAlpha) {
        gl.blendEquationSeparate(equationToGL[blendEquation], equationToGL[blendEquationAlpha]);
        currentBlendEquation = blendEquation;
        currentBlendEquationAlpha = blendEquationAlpha;
    }
    if (blendSrc !== currentBlendSrc || blendDst !== currentBlendDst || blendSrcAlpha !== currentBlendSrcAlpha || blendDstAlpha !== currentBlendDstAlpha) {
        gl.blendFuncSeparate(factorToGL[blendSrc], factorToGL[blendDst], factorToGL[blendSrcAlpha], factorToGL[blendDstAlpha]);
        currentBlendSrc = blendSrc;
        currentBlendDst = blendDst;
        currentBlendSrcAlpha = blendSrcAlpha;
        currentBlendDstAlpha = blendDstAlpha;
    }
    currentBlending = blending;
    currentPremultipledAlpha = null;
}
function setMaterial(material, frontFaceCW) {
    material.side === DoubleSide
        ? disable( gl.CULL_FACE )
    : enable( gl.CULL_FACE );
    let flipSided = (material.side === BackSide);//判断当前是否为绘制背面
    if (frontFaceCW) flipSided = !flipSided;//如果正面是顺时针，那么将判断结果取反
    setFlipSided(flipSided);//更新绘制方向
    //更新为材质的设置
    (material.blending === NormalBlending && material.transparent === false)
        ? setBlending(NoBlending)
    : setBlending(material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.premultipliedAlpha);
    depthBuffer.setFunc( material.depthFunc );//指定将输入像素深度与当前深度缓冲区值进行比较的函数。
    depthBuffer.setTest( material.depthTest );//设置是否启用深度测试
    depthBuffer.setMask( material.depthWrite );//设置是否启用写入深度缓冲。
    colorBuffer.setMask( material.colorWrite );//方法设置在绘制或渲染到. WebGLFramebuffer,gl.colorMask(red, green, blue, alpha);
    const stencilWrite = material.stencilWrite;//模板缓冲
    stencilBuffer.setTest(stencilWrite);//设置是否启用模板测试
    if (stencilWrite) {
        stencilBuffer.setMask(material.stencilWriteMask);//方法控制启用和禁用模板平面中各个位的正面和背面写入。
        stencilBuffer.setFunc(material.stencilFunc, material.stencilRef, material.stencilFuncMask);//方法设置了模板测试的前后功能和参考值。
        stencilBuffer.setOp(material.stencilFail, material.stencilZFail, material.stencilZPass);//方法设置了正面和背面的模板测试操作。
    }
    setPolygonOffset(material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits);//多边形位移偏移，用于减缓深度冲突
    material.alphaToCoverage === true//启用或禁用多重采样，多重采样是一个抗锯齿的优化
        ? enable( gl.SAMPLE_ALPHA_TO_COVERAGE )
    : disable( gl.SAMPLE_ALPHA_TO_COVERAGE );
}
function setFlipSided(flipSided) {//设置缠绕方向来指定多边形是正面还是背面。CCW表示指定逆时针为正面
    if (currentFlipSided !== flipSided) {
        if (flipSided) {
            gl.frontFace( gl.CW );
        } else {
            gl.frontFace( gl.CCW );
        }
        currentFlipSided = flipSided;
    }
}
function setCullFace(cullFace) {//指定是否可以剔除正面或背面的多边形。
    if (cullFace !== CullFaceNone) {
        enable(gl.CULL_FACE);//激活多边形剔除
        if (cullFace !== currentCullFace) {
            if (cullFace === CullFaceBack) {
                gl.cullFace(gl.BACK);
            } else if (cullFace === CullFaceFront) {
                gl.cullFace(gl.FRONT);
            } else {
                gl.cullFace(gl.FRONT_AND_BACK);
            }
        }
    } else {
        disable(CULL_FACE);
    }
    currentCullFace = cullFace;
}
function setLineWidth(width) {//webgl1默认为1，设置没有用
    if (width !== currentLineWidth) {
        if (lineWidthAvailable) gl.lineWidth(width);
        currentLineWidth = width;
    }
}
function setPolygonOffset(polygonOffset, factor, units) {//通过材质的PolygonOffset属性控制，偏移，减缓z-fighting
    if (polygonOffset) {
        enable(gl.POLYGON_OFFSET_FILL);
        if (currentPolygonOffsetFactor !== factor || currentPolygonOffsetUnits !== units) {
            gl.polygonOffset(factor, units);
            currentPolygonOffsetFactor = factor;
            currentPolygonOffsetUnits = units;
        }
    } else {
        disable(gl.POLYGON_OFFSET_FILL);
    }
}
function setScissorTest(scissorTest) {//激活剪刀测试，丢弃剪刀矩形之外的片段
    if (scissorTest) {
        enable(gl.SCISSOR_TEST);
    } else {
        disable(gl.SCISSOR_TEST);
    }
}
function scissor(scissor) {
    if (currentScissor.equals(scissor) === false) {
        gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
        currentScissor.copy(scissor);
    }
}
function viewport(viewport) {//设定视口的坐标和宽高
    if (currentViewport.equals(viewport) === false) {
        gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
        currentViewport.copy(viewport);
    }
}
```

## 纹理相关

```ts
//currentBoundTextures 维护纹理
function activeTexture(webglSlot) {//激活纹理单元
    if (webglSlot === undefined) webglSlot = gl.TEXTURE0 + maxTextures - 1;
    if (currentTextureSlot !== webglSlot) {
        gl.activeTexture(webglSlot);//激活
        currentTextureSlot = webglSlot;
    }
}
function bindTexture(webglType, webglTexture) {
    if (currentTextureSlot === null) {
        activeTexture();
    }
    let boundTexture = currentBoundTextures[currentTextureSlot];
    if (boundTexture === undefined) {
        boundTexture = { type: undefined, texture: undefined };
        currentBoundTextures[currentTextureSlot] = boundTexture;
    }
    if (boundTexture.type !== webglType || boundTexture.texture !== webglTexture) {
        gl.bindTexture(webglType, webglTexture || emptyTextures[webglType]);//绑定纹理
        boundTexture.type = webglType;
        boundTexture.texture = webglTexture;
    }
}
function unbindTexture() {
    const boundTexture = currentBoundTextures[currentTextureSlot];
    if (boundTexture !== undefined && boundTexture.type !== undefined) {
        gl.bindTexture(boundTexture.type, null);
        boundTexture.type = undefined;
        boundTexture.texture = undefined;
    }
}
```



## 返回值

```ts
 return {
        buffers: {//缓冲相关对象
            color: colorBuffer,
            depth: depthBuffer,
            stencil: stencilBuffer
        },
        enable: enable,//启用函数
        disable: disable,//禁用函数
        bindFramebuffer: bindFramebuffer,//绑定帧缓冲区函数
        drawBuffers: drawBuffers,//?新出来的，待后续了解
        useProgram: useProgram,//使用着色器程序函数
        setBlending: setBlending,//设置混合
        setMaterial: setMaterial,//通过material的参数改变状态缺省值
        setFlipSided: setFlipSided,//设置绘制方向(顺时针、逆时针)
        setCullFace: setCullFace,//设置裁剪(BACK，FRONT、FRONT_AND_BACK)
        setLineWidth: setLineWidth,//设置线宽
        setPolygonOffset: setPolygonOffset,//设置多边形偏移
        setScissorTest: setScissorTest,//设置裁剪测试-也是裁剪相关
        activeTexture: activeTexture,//激活纹理
        bindTexture: bindTexture,//绑定纹理
        unbindTexture: unbindTexture,//解绑纹理
        compressedTexImage2D: compressedTexImage2D,//webgl2方法
        texImage2D: texImage2D,//webgl2方法
        texImage3D: texImage3D,//webgl2方法
        texStorage2D: texStorage2D,//webgl2方法
        texStorage3D: texStorage3D,//webgl2方法
        texSubImage2D: texSubImage2D,//webgl2方法
        texSubImage3D: texSubImage3D,//webgl2方法
        compressedTexSubImage2D: compressedTexSubImage2D,//webgl2方法
        scissor: scissor,//裁剪
        viewport: viewport,//视口
        reset: reset//重设
    };
