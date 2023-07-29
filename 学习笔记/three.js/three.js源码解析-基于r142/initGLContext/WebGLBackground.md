# WebGLBackground

## 函数作用

设置渲染的背景颜色、纹理

## 入口函数

```ts
/**
*@renderer WebGLRenderer渲染器实例
*@cubemaps 立方贴图
*@state 返回维护颜色、测试、模板缓冲区相关以及纹理绑定激活、帧缓冲区绑定、以及一些混合、裁剪、绘制顺序、多边形偏移、视口设置等的方法或对象
*@objects 对一个Object3D对象进行每帧调用一次更新，内部调用WebGLGeometries的update
*@_alpha 阿尔法通道
*@_premultipliedAlpha 表明排版引擎将假设绘制缓冲区包含预混合 alpha 通道的boolean值。
**/
function WebGLBackground(renderer, cubemaps, state, objects, alpha, premultipliedAlpha) {
    const clearColor = new Color(0x000000);
    let clearAlpha = alpha === true ? 0 : 1;
    //render(){...}
    //setColor(){...}
    //返回统计信息以及操作方法
}
```

## 核心函数-render(renderList, scene)

```ts
function render(renderList, scene) {//设置渲染的背景
        let forceClear = false;
        let background = scene.isScene === true ? scene.background : null;
        if (background && background.isTexture) {// Texture
            background = cubemaps.get(background);
        }
        // Ignore background in AR
        // TODO: Reconsider this.
        const xr = renderer.xr;
        const session = xr.getSession && xr.getSession();
        if (session && session.environmentBlendMode === 'additive') {
            background = null;
        }
        if (background === null) {
            setClear(clearColor, clearAlpha);
        } else if (background && background.isColor) {
            setClear(background, 1);
            forceClear = true;
        }
        if (renderer.autoClear || forceClear) {
            renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
        }
        if (background && (background.isCubeTexture || background.mapping === CubeUVReflectionMapping)) {
            if (boxMesh === undefined) {
                boxMesh = new Mesh(//天空盒内部调用的是一个Box
                    new BoxGeometry(1, 1, 1),
                    new ShaderMaterial({
                        name: 'BackgroundCubeMaterial',
                        uniforms: cloneUniforms(ShaderLib.cube.uniforms),
                        vertexShader: ShaderLib.cube.vertexShader,
                        fragmentShader: ShaderLib.cube.fragmentShader,
                        side: BackSide,
                        depthTest: false,
                        depthWrite: false,
                        fog: false
                    })
                );
                boxMesh.geometry.deleteAttribute('normal');
                boxMesh.geometry.deleteAttribute('uv');
                boxMesh.onBeforeRender = function (renderer, scene, camera) {
                    this.matrixWorld.copyPosition(camera.matrixWorld);
                };
                // enable code injection for non-built-in material
                Object.defineProperty(boxMesh.material, 'envMap', {
                    get: function () {
                        return this.uniforms.envMap.value;
                    }
                });
                objects.update(boxMesh);
            }
            boxMesh.material.uniforms.envMap.value = background;
            boxMesh.material.uniforms.flipEnvMap.value = (background.isCubeTexture && background.isRenderTargetTexture === false) ? -1 : 1;
            if (currentBackground !== background ||
                currentBackgroundVersion !== background.version ||
                currentTonemapping !== renderer.toneMapping) {
                boxMesh.material.needsUpdate = true;
                currentBackground = background;
                currentBackgroundVersion = background.version;
                currentTonemapping = renderer.toneMapping;
            }
            boxMesh.layers.enableAll();
            // push to the pre-sorted opaque render list
            renderList.unshift(boxMesh, boxMesh.geometry, boxMesh.material, 0, 0, null);
        } else if (background && background.isTexture) {
            if (planeMesh === undefined) {
                planeMesh = new Mesh(
                    new PlaneGeometry(2, 2),
                    new ShaderMaterial({
                        name: 'BackgroundMaterial',
                        uniforms: cloneUniforms(ShaderLib.background.uniforms),
                        vertexShader: ShaderLib.background.vertexShader,
                        fragmentShader: ShaderLib.background.fragmentShader,
                        side: FrontSide,
                        depthTest: false,
                        depthWrite: false,
                        fog: false
                    })
                );
                planeMesh.geometry.deleteAttribute('normal');
                // enable code injection for non-built-in material
                Object.defineProperty(planeMesh.material, 'map', {
                    get: function () {
                        return this.uniforms.t2D.value;
                    }
                });
                objects.update(planeMesh);
            }
            planeMesh.material.uniforms.t2D.value = background;
            if (background.matrixAutoUpdate === true) {
                background.updateMatrix();
            }
            planeMesh.material.uniforms.uvTransform.value.copy(background.matrix);
            if (currentBackground !== background ||
                currentBackgroundVersion !== background.version ||
                currentTonemapping !== renderer.toneMapping) {
                planeMesh.material.needsUpdate = true;
                currentBackground = background;
                currentBackgroundVersion = background.version;
                currentTonemapping = renderer.toneMapping;
            }
            planeMesh.layers.enableAll();
            // push to the pre-sorted opaque render list
            renderList.unshift(planeMesh, planeMesh.geometry, planeMesh.material, 0, 0, null);
        }

    }
```

## 核心函数-setClear(color, alpha) 

```ts
function setClear(color, alpha) {
        state.buffers.color.setClear(color.r, color.g, color.b, alpha, premultipliedAlpha);//内部调用WebGLState的setColor方法
    }
```

## 返回值

```ts
return {
    getClearColor: function () {
        return clearColor;
    },
    setClearColor: function (color, alpha = 1) {
        clearColor.set(color);
        clearAlpha = alpha;
        setClear(clearColor, clearAlpha);
    },
    getClearAlpha: function () {
        return clearAlpha;
    },
    setClearAlpha: function (alpha) {
        clearAlpha = alpha;
        setClear(clearColor, clearAlpha);
    },
    render: render
};
```