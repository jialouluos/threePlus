# WebGLMaterials

## WebGLMaterials( properties )

```js
//roperties 由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式
```

## refreshFogUniforms( uniforms, fog )

```js
uniforms.fogColor.value.copy( fog.color );//提取雾的属性
if ( fog.isFog ) {
    uniforms.fogNear.value = fog.near;
    uniforms.fogFar.value = fog.far;
} else if ( fog.isFogExp2 ) {
    uniforms.fogDensity.value = fog.density;
}
```

## refreshMaterialUniforms( uniforms, material, pixelRatio, height, transmissionRenderTarget )

```js
if ( material.isMeshBasicMaterial ) {
    refreshUniformsCommon( uniforms, material );
} else if ( material.isMeshLambertMaterial ) {
    refreshUniformsCommon( uniforms, material );
    refreshUniformsLambert( uniforms, material );
} else if ( material.isMeshToonMaterial ) {
    ...
}else if {
    ...
} else if ( material.isShadowMaterial ) {
    uniforms.color.value.copy( material.color );
    uniforms.opacity.value = material.opacity;
} else if ( material.isShaderMaterial ) {
    material.uniformsNeedUpdate = false; // #15581
}
```

## refreshUniformsCommon( uniforms, material )

```js
uniforms.opacity.value = material.opacity;
if ( material.color ) {
    uniforms.diffuse.value.copy( material.color );
}
if ( material.emissive ) {
    uniforms.emissive.value.copy( material.emissive ).multiplyScalar( material.emissiveIntensity );
}
if ( material.map ) {
    uniforms.map.value = material.map;
}

```

## 返回一个工厂函数对象

```js
return {
   refreshFogUniforms: refreshFogUniforms,
   refreshMaterialUniforms: refreshMaterialUniforms
};
```
