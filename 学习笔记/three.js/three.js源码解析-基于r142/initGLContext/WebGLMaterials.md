# WebGLMaterials

## 函数作用

用于提取对应材质所需的一些uniform

## 入口函数

```ts
/**
*@renderer WebGLRenderer渲染器实例
*@properties 由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式
**/
function WebGLMaterials(renderer, properties) {
	//refreshFogUniforms(){...}
    //refreshMaterialUniforms(){...}
    //返回提取uniform属性的方法
}
```

## 核心函数-refreshMaterialUniforms(uniforms, material, pixelRatio, height, transmissionRenderTarget)

```ts
function refreshFogUniforms(uniforms, fog) {//提取雾属性
    uniforms.fogColor.value.copy(fog.color);
    if (fog.isFog) {
        uniforms.fogNear.value = fog.near;
        uniforms.fogFar.value = fog.far;
    } else if (fog.isFogExp2) {
        uniforms.fogDensity.value = fog.density;
    }
}
function refreshMaterialUniforms(uniforms, material, pixelRatio, height, transmissionRenderTarget) {
    if (material.isMeshBasicMaterial) {
        refreshUniformsCommon(uniforms, material);
    } else if (material.isMeshLambertMaterial) {
        refreshUniformsCommon(uniforms, material);
    } else if (material.isMeshToonMaterial) {
        refreshUniformsCommon(uniforms, material);
        refreshUniformsToon(uniforms, material);
    } else if (material.isMeshPhongMaterial) {
        refreshUniformsCommon(uniforms, material);
        refreshUniformsPhong(uniforms, material);
    } else if (material.isMeshStandardMaterial) {
        refreshUniformsCommon(uniforms, material);
        refreshUniformsStandard(uniforms, material);
        if (material.isMeshPhysicalMaterial) {
            refreshUniformsPhysical(uniforms, material, transmissionRenderTarget);
        }
    } else if (material.isMeshMatcapMaterial) {
        refreshUniformsCommon(uniforms, material);
        refreshUniformsMatcap(uniforms, material);
    } else if (material.isMeshDepthMaterial) {
        refreshUniformsCommon(uniforms, material);
    } else if (material.isMeshDistanceMaterial) {
        refreshUniformsCommon(uniforms, material);
        refreshUniformsDistance(uniforms, material);
    } else if (material.isMeshNormalMaterial) {
        refreshUniformsCommon(uniforms, material);
    } else if (material.isLineBasicMaterial) {
        refreshUniformsLine(uniforms, material);
        if (material.isLineDashedMaterial) {
            refreshUniformsDash(uniforms, material);
        }
    } else if (material.isPointsMaterial) {
        refreshUniformsPoints(uniforms, material, pixelRatio, height);
    } else if (material.isSpriteMaterial) {
        refreshUniformsSprites(uniforms, material);
    } else if (material.isShadowMaterial) {
        uniforms.color.value.copy(material.color);
        uniforms.opacity.value = material.opacity;
    } else if (material.isShaderMaterial) {
        material.uniformsNeedUpdate = false; //自定义着色器three.js不会帮助我们去提取uniform
    }
}
```

## 返回值

```ts
return {
        refreshFogUniforms: refreshFogUniforms,
        refreshMaterialUniforms: refreshMaterialUniforms
    };