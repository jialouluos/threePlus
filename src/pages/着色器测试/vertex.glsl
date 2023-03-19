uniform float rotation;
#include <common>//该模块声明了一些常用的变量和方法例如PI，EPSILON，pow2()等等,还有一些结构体例如ReflectedLight，GeometricContext等等，和一些矩阵变换相关函数例如inverseTransformDirection、transposeMat3等等
#include <uv_pars_vertex>//vUv声明
varying vec2 v_uv;
#include <fog_pars_vertex>//雾声明
#include <logdepthbuf_pars_vertex>//对数缓冲相关声明，解决z-fighting问题 使 early-z 的测试失效
#include <clipping_planes_pars_vertex>//裁剪平面相关声明 vClipPosition

void main() {

	#include <uv_vertex>

        vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

        vec2 scale;
        vec2 center = vec2(0.5);
        scale.x = length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
        scale.y = length(vec3(modelMatrix[1].x, modelMatrix[1].y, modelMatrix[1].z));

        bool isPerspective = isPerspectiveMatrix(projectionMatrix);

        // if(isPerspective)
        //         scale *= -mvPosition.z;

        vec2 alignedPosition = (position.xy - (center - vec2(0.5))) * scale;

        vec2 rotatedPosition;
        rotatedPosition.x = cos(rotation) * alignedPosition.x - sin(rotation) * alignedPosition.y;
        rotatedPosition.y = sin(rotation) * alignedPosition.x + cos(rotation) * alignedPosition.y;

        mvPosition.xy += rotatedPosition;

        gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
        v_uv = uv;
}