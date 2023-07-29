# Threejs内置变量以及一些中间变量

## 内置变量

`prefixVertex` 储存着three预处理的着色器片段,通过`#define`去指明`ShaderChunk`中的各个代码功能块是否启用,还存在默认传入的几个核心矩阵

```js
function WebGLProgram( renderer, cacheKey, parameters, bindingStates ) {
    //...
    if(paramaeters.isRawShaderMaterial){//是否采用不经Three处理的着色器
        //...
    }else{
        prefixVertex=[
            parameters.map ? '#define USE_MAP' : '',
            parameters.aoMap ? '#define USE_AOMAP' : '',
            //...
            'uniform mat4 modelMatrix;',
            'uniform mat4 modelViewMatrix;',
            'uniform mat4 projectionMatrix;',
            'uniform mat4 viewMatrix;',
            //...
        ]
    }
}
```

这里总结一下(需要满足某些条件才声明的变量将不被纳入)：

+   `uniform mat4 modelMatrix`模型矩阵，**局部空间转化到世界空间**
+   `uniform mat4 viewMatrix` 视图矩阵，相机变换的逆变换，**世界空间转换到观察空间**。
+   `uniform mat4 modelViewMatrix` 模型视图矩阵，`modelViewMatrix `= `viewMatrix `* `modelMatrix`
+   `uniform mat4 projectionMatrix` 透视矩阵,**观察空间转换到裁剪空间**,后续裁剪空间会经`透视除法`以及`视口变换`变换到屏幕空间
+   `uniform mat3 normalMatrix`法向矩阵,这里说明一下，法向矩阵通常使用模型视图矩阵的逆转置矩阵，并取左上3X3，在进行光照计算时，要使用到模型的顶点的法线。可以在观察空间或世界空间中进行光照计算，观察空间中计算的好处是观察者的坐标永远是(0, 0)
+   `uniform vec3 cameraPosition` 相机坐标
+   `uniform bool isOrthographic` 是否正交
+   `attribute vec3 position` 顶点坐标
+   `attribute vec3 normal` 顶点法向
+   `attribute vec2 uv` uv

## 中间变量(用于着色器的一些计算和变量副本)

### `transformed` 该值作为position的副本用于顶点着色器的中间计算--VertexShader

```glsl
vec3 transformed = vec3( position ); //begin_vertex.glsl
transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );//当使用置换贴图时,displacementmap_vertex.glsl
transformed *= morphTargetBaseInfluence;//变形几何，这里不止这一行使用到了transformed，见morphtarget_vertex.glsl
//... skinning_vertex.glsl
```

该变量最后有两个用处

+   作为顶点经过一系列计算后通过模型变换的得到世界坐标，传入给片元着色器和计算阴影

    ````glsl
    vec4 worldPosition = vec4( transformed, 1.0 );
    worldPosition = modelMatrix * worldPosition;
    ````

+   作为最后gl_Position的输出

    ```glsl
    vec4 mvPosition = vec4( transformed, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
    ```

### `diffuseColor` 该值默认为vec3(1.0),该变量作为diffuse的副本去进行一系列的运算--FragmentShader

```glsl
vec4 diffuseColor = vec4( diffuse, opacity ); //在ShaderLib声明，不在Chunk中。diffuse代表你在材质构造器中的color属性
```

特别注意会受顶点着色的影响(`VertexColor`)

```glsl
diffuseColor *= vColor;//vColor表示通过attribute传入的color
```

最后作为reflectedLight的directDiffuse去参与后续运算(这里用的Lambertmaterial进行观察)，`outgoingLight`会接收前面的一系列运算结果，并最为gl_FragColor的rgb值，a值仍是`diffuseColor.a`(会受`transmissionAlpha`和`OPAQUE`影响)
```glsl
#ifdef OPAQUE
diffuseColor.a = 1.0;//a通道->透明度
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );//output_fragment.glsl
```



