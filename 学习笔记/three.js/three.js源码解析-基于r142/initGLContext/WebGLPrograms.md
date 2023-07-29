# WebGLPrograms

## 函数作用

提取和整理材质中的配置属性，并记录WebGLProgram

## 入口函数

```ts
/**
*@renderer WebGLRenderer渲染器实例
*@cubemaps cube贴图
*@cubeuvmaps cubeuv
*@extensions 启用一些WebGl上下文扩展。同时将启用的扩展对象储存下来
*@capabilities 维护gl环境中的阈值
*@bindingStates 创建顶点缓冲区状态与几何以及几何与Program的映射，将attribute缓存，并采用一些webgl缓存措施实现性能优化，通过对比新旧attribute去决定是否更新缓冲以及缓存的绑定。同时控制顶点缓冲区对象与WebGL中attribute变量间的数据传输以及更新
*@clipping 管理平面裁剪，通过object3D.material传入裁剪平面信息，该对象负责整理裁剪平面信息，便于后续传入着色器
**/
function WebGLPrograms(renderer, cubemaps, cubeuvmaps, extensions, capabilities, bindingStates, clipping) {
    const _programLayers = new Layers();//层级
    const _customShaders = new WebGLShaderCache();//自定义着色器缓存，内部维护一个材质与着色器的映射，记录着每个着色器片段被使用的次数
    const programs = [];//记录WebGLProgram
}
```

## 核心函数-getParameters(material, lights, shadows, scene, object)

```ts
//从材质中获取配置参数，并将所有参数整合为一个参数 
function getParameters(material, lights, shadows, scene, object) {
        const fog = scene.fog;//场景雾
        const geometry = object.geometry;//Obejct3D的geometry
        const environment = material.isMeshStandardMaterial ? scene.environment : null;//环境
        const envMap = (material.isMeshStandardMaterial ? cubeuvmaps : cubemaps).get(material.envMap || environment);//环境贴图
        const envMapCubeUVHeight = (!!envMap) && (envMap.mapping === CubeUVReflectionMapping) ? envMap.image.height : null;//立方体贴图
        const shaderID = shaderIDs[material.type];//材质类型对应的shaderID
        if (material.precision !== null) {
          //控制最大精度...
        }
        //变形相关...
        //
        let vertexShader, fragmentShader;
        let customVertexShaderID, customFragmentShaderID;//缓存的着色器
        if (shaderID) {//这里区分了自定义着色器与内置着色器
            const shader = ShaderLib[shaderID];//内置着色器则直接获取shader对应的着色器片段
            vertexShader = shader.vertexShader;
            fragmentShader = shader.fragmentShader;
        } else {
            vertexShader = material.vertexShader;//自定义着色器则从material中获取
            fragmentShader = material.fragmentShader;
            _customShaders.update(material);//更新一下着色器片段记录缓存
            customVertexShaderID = _customShaders.getVertexShaderID(material);//返回自定义顶点着色器缓存下的ID
            customFragmentShaderID = _customShaders.getFragmentShaderID(material);//返回自定义片元着色器缓存下的ID
        }
        const currentRenderTarget = renderer.getRenderTarget();//当前帧缓冲区
        const useAlphaTest = material.alphaTest > 0;//透明度测试
        const useClearcoat = material.clearcoat > 0;//清漆
        const useIridescence = material.iridescence > 0;//彩虹色
        const parameters = {
            isWebGL2: isWebGL2,
            shaderID: shaderID,
            shaderName: material.type,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: material.defines,
            customVertexShaderID: customVertexShaderID,
            customFragmentShaderID: customFragmentShaderID,
            isRawShaderMaterial: material.isRawShaderMaterial === true,
            glslVersion: material.glslVersion,
            precision: precision,
            instancing: object.isInstancedMesh === true,
            instancingColor: object.isInstancedMesh === true && object.instanceColor !== null,
            supportsVertexTextures: vertexTextures,
            outputEncoding: (currentRenderTarget === null) ? renderer.outputEncoding : (currentRenderTarget.isXRRenderTarget === true ? currentRenderTarget.texture.encoding : LinearEncoding),
            map: !!material.map,
            matcap: !!material.matcap,
            envMap: !!envMap,
            //一系列配置参数...
            fog: !!fog,
            useFog: material.fog === true,
            fogExp2: (fog && fog.isFogExp2),
            flatShading: !!material.flatShading,
            sizeAttenuation: material.sizeAttenuation,
            logarithmicDepthBuffer: logarithmicDepthBuffer,
            //一系列配置参数...
            customProgramCacheKey: material.customProgramCacheKey()//在使用 onBeforeCompile 的情况下，此回调可用于识别 onBeforeCompile 中使用的设置值
        };
        return parameters;//返回材质的参数
    }
```

## 核心函数-getProgramCacheKey(parameters)

```ts
function getProgramCacheKey(parameters) {//作为dui'yprogram的key值
    const array = [];
    if (parameters.shaderID) {
        array.push(parameters.shaderID);
    } else {
        array.push(parameters.customVertexShaderID);
        array.push(parameters.customFragmentShaderID);
    }
    if (parameters.defines !== undefined) {//用于着色器中的defined
        for (const name in parameters.defines) {
            array.push(name);
            array.push(parameters.defines[name]);
        }
    }
    if (parameters.isRawShaderMaterial === false) {//是否采用原生着色器
        getProgramCacheKeyParameters(array, parameters);//获取parameters的一些信息
        getProgramCacheKeyBooleans(array, parameters);//获取parameters的一些配置的使用情况
        array.push(renderer.outputEncoding);
    }
    array.push(parameters.customProgramCacheKey);//在使用 onBeforeCompile 的情况下，此回调可用于识别 onBeforeCompile 中使用的设置值,这里是获取回调的函数字符串
    return array.join();
}
```

## 核心函数-acquireProgram(parameters, cacheKey)

```ts
//记录单个的WebGLProgram
function acquireProgram(parameters, cacheKey) {
    let program;
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
}
```

## 销毁

```ts
function releaseProgram(program) {
    if (--program.usedTimes === 0) {
        // Remove from unordered set
        const i = programs.indexOf(program);
        programs[i] = programs[programs.length - 1];
        programs.pop();
        // Free WebGL resources
        program.destroy();
    }
}
function releaseShaderCache(material) {
    _customShaders.remove(material);
}
function dispose() {
    _customShaders.dispose();
/** 
dispose() {
   this.shaderCache.clear();
   this.materialCache.clear();
}*/
}
```

## 返回值

```ts
return {
    getParameters: getParameters,
    getProgramCacheKey: getProgramCacheKey,
    getUniforms: getUniforms,
    acquireProgram: acquireProgram,
    releaseProgram: releaseProgram,
    releaseShaderCache: releaseShaderCache,
    programs: programs,
    dispose: dispose
};