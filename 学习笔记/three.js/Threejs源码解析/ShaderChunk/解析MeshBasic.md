# MeshBasic

## VertexShader

```glsl
export const vertex = /* glsl */`
#include <common> //该模块声明了一些常用的变量和方法例如PI，EPSILON，pow2()等等,还有一些结构体例如ReflectedLight，GeometricContext等等，和一些矩阵变换相关函数例如inverseTransformDirection、transposeMat3等等
#include <uv_pars_vertex> //vUv声明
#include <uv2_pars_vertex> //vUv2声明
#include <envmap_pars_vertex> //反射变量以及反射强度相关声明
#include <color_pars_vertex> //vColor声明
#include <fog_pars_vertex> //vFogDepth 雾声明
#include <morphtarget_pars_vertex> //变形几何相关声明
#include <skinning_pars_vertex> //皮肤相关声明
#include <logdepthbuf_pars_vertex> //对数缓冲相关声明，解决z-fighting问题 使 early-z 的测试失效
#include <clipping_planes_pars_vertex> //裁剪平面相关声明 vClipPosition

void main() {
	//#include <uv_vertex>
	#ifdef USE_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;//!这里uv就是bufferGeometry储存的uv
	#endif

	//#include <uv2_vertex>
	#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
		vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
	#endif

	//#include <color_vertex>
	#if defined( USE_COLOR_ALPHA )
		vColor = vec4( 1.0 );
	#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
		vColor = vec3( 1.0 );
	#endif
	#ifdef USE_COLOR
		vColor *= color;//!这里的color就是bufferGeometry储存的color
	#endif
	#ifdef USE_INSTANCING_COLOR
		vColor.xyz *= instanceColor.xyz;
	#endif

	#include <morphcolor_vertex> //?变形几何相关，不做详解

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		//#include <beginnormal_vertex>
		vec3 objectNormal = vec3( normal );//!这里的normal就是bufferGeometry储存的normal
		#ifdef USE_TANGENT
			vec3 objectTangent = vec3( tangent.xyz );
		#endif
		#include <morphnormal_vertex> //?变形几何相关 当使用变形几何时，里面涉及到了objectNormal的改变
		#include <skinbase_vertex> //?皮肤相关
		#include <skinnormal_vertex> //?皮肤相关

		//#include <defaultnormal_vertex>
		vec3 transformedNormal = objectNormal;
		#ifdef USE_INSTANCING
			mat3 m = mat3( instanceMatrix );
			transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
			transformedNormal = m * transformedNormal;
		#endif
		transformedNormal = normalMatrix * transformedNormal;//?这里将初始法向进行变换处理，现在transformedNormal法向变换到了观察空间
		/**
		**objectNormal 是normal顶点数据的备份
		**normalMatrix 是threejs传入的一个矩阵
		**transformedNormal = normalMatrix * transformedNormal;
		**objectNormal表示的是几何体未进行模型矩阵变换之前的法向数据，
		**在顶点进行模型变换之后，该法向数据不再适用
		*@需要用原来的法向量乘以模型矩阵的逆转置矩阵( modelViewMatrix -> 求逆 -> 转置 - > normalMatrix)，这样可以得到经模型变换之后的法向量
		*/
		#ifdef FLIP_SIDED
			transformedNormal = - transformedNormal;
		#endif
		#ifdef USE_TANGENT
			vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
			#ifdef FLIP_SIDED
				transformedTangent = - transformedTangent;
			#endif
		#endif
	#endif

	//#include <begin_vertex>
	vec3 transformed = vec3( position );//!这里position就是bufferGeometry储存的position
	#include <morphtarget_vertex>//变形几何
	#include <skinning_vertex>//皮肤

	//#include <project_vertex>
	 //!输出,这之后顶点变换采用gl_Position
	vec4 mvPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
	#endif
	mvPosition = modelViewMatrix * mvPosition;
	gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex> //?对数缓冲 对Position.z进行计算修改

	//#include <clipping_planes_vertex>
	#if NUM_CLIPPING_PLANES > 0
		vClipPosition = - mvPosition.xyz;
	#endif

	//#include <worldpos_vertex>
	#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION )
		vec4 worldPosition = vec4( transformed, 1.0 );
		#ifdef USE_INSTANCING
			worldPosition = instanceMatrix * worldPosition;
		#endif
			worldPosition = modelMatrix * worldPosition;
	#endif
	#include <envmap_vertex>
	//#include <fog_vertex>
	#ifdef USE_FOG
		vFogDepth = - mvPosition.z;
	#endif


//!内插入片元的变量
/**
*@ #if defined( USE_COLOR_ALPHA ) varying vec4 vColor; #elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) varying vec3 vColor;
*@ #ifdef USE_FOG  varying float vFogDepth;
*@ NUM_CLIPPING_PLANES > 0  varying vec3 vClipPosition;
*@ #ifdef ENV_WORLDPOS varying vec3 vWorldPosition; #else varying vec3 vReflect;
 */
}
`;

export const fragment = /* glsl */`
uniform vec3 diffuse;//!这里diffuse就是material中的color
uniform float opacity;//!这里opacity就是material中的opacity

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common> //该模块声明了一些常用的变量和方法
#include <dithering_pars_fragment> //抖动算法
#include <color_pars_fragment> //声明接收vColor
#include <uv_pars_fragment> //声明接收vUv
#include <uv2_pars_fragment> //声明接收vUv2
#include <map_pars_fragment> //声明colorMap
#include <alphamap_pars_fragment> //声明alphaMap
#include <alphatest_pars_fragment> //透明度测试 声明alphaTest
#include <aomap_pars_fragment> //声明aoMap
#include <lightmap_pars_fragment> //声明lightMap
#include <envmap_common_pars_fragment> //声明环境贴图相关
#include <envmap_pars_fragment> //声明反射，以及接收vWorldPosition或vReflect
#include <cube_uv_reflection_fragment> //cubeUV
#include <fog_pars_fragment> //声明接收vFogDepth
#include <specularmap_pars_fragment> //声明specularMap
#include <logdepthbuf_pars_fragment> //声明对数缓冲相关
#include <clipping_planes_pars_fragment> //声明裁剪平面相关

void main() {

	#include <clipping_planes_fragment> //执行裁剪平面相关逻辑,具体逻辑在另一篇文章中额外介绍

	vec4 diffuseColor = vec4( diffuse, opacity );

	//#include <logdepthbuf_fragment>
	//?对数缓冲
	#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
		gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
	#endif

	//#include <map_fragment>
	//?颜色贴图
	#ifdef USE_MAP
		vec4 sampledDiffuseColor = texture2D( map, vUv );
		#ifdef DECODE_VIDEO_TEXTURE
			sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
		#endif
		diffuseColor *= sampledDiffuseColor;
	#endif
	//#include <color_fragment>
	//?vertexColor
	#if defined( USE_COLOR_ALPHA )
		diffuseColor *= vColor;
	#elif defined( USE_COLOR )
		diffuseColor.rgb *= vColor;
	#endif

	//#include <alphamap_fragment>
	//?控制不透明度
	#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
	#endif

	//#include <alphatest_fragment>
	#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
	#endif

	//#include <specularmap_fragment>
	//?高光贴图
	float specularStrength;
	#ifdef USE_SPECULARMAP
		vec4 texelSpecular = texture2D( specularMap, vUv );
		specularStrength = texelSpecular.r;
	#else
		specularStrength = 1.0;
	#endif

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif

	//#include <aomap_fragment>
	//*环境遮蔽贴图，取r通道值
	//!aoMap需要第二组uv
	#ifdef USE_AOMAP
		float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
		reflectedLight.indirectDiffuse *= ambientOcclusion;
		#if defined( USE_ENVMAP ) && defined( STANDARD )
			float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
			reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
		#endif
	#endif

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;//?outgoingLight作为gl_FragColor的rgb值

	#include <envmap_fragment>//?环境相关

	//#include <output_fragment>//?gl_FragColor在这
	#ifdef OPAQUE
	diffuseColor.a = 1.0;//a通道->透明度
	#endif
	#ifdef USE_TRANSMISSION
	diffuseColor.a *= transmissionAlpha + 0.1;
	#endif
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>//?色调映射
	#include <encodings_fragment>//?色彩空间转换
	#include <fog_fragment>//?雾

	//#include <premultiplied_alpha_fragment>//?混合
	#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
	#endif

	#include <dithering_fragment>//?抖动

}
`;
```

