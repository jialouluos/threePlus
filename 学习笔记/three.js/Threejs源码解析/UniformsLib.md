# UniformsLib.js

```js
import { Color } from '../../math/Color.js';
import { Vector2 } from '../../math/Vector2.js';
import { Matrix3 } from '../../math/Matrix3.js';

/**
 * 共享webgl着色器的统一库
 */

const UniformsLib = {

    common: {

        diffuse: { value: new Color( 0xffffff ) },//漫反射光
        opacity: { value: 1.0 },//透明度
        map: { value: null },//贴图
        uvTransform: { value: new Matrix3() },
        uv2Transform: { value: new Matrix3() },

        alphaMap: { value: null },//alpha地图是一种灰度纹理，它控制着表面的不透明度（黑色：完全透明;白:完全不透明)。默认为null。

    },
    specularmap: {//高光贴图

        specularMap: { value: null },

    },

    envmap: {//环境贴图

        envMap: { value: null },
        flipEnvMap: { value: - 1 },//翻转环境贴图
        reflectivity: { value: 1.0 },//反射率
        refractionRatio: { value: 0.98 },//折射率
        maxMipLevel: { value: 0 }

    },

    aomap: {//环境遮挡贴图，就像画眼影，在一些细节支出，增加立体效果

        aoMap: { value: null },
        aoMapIntensity: { value: 1 }

    },

    lightmap: {//光照贴图,物体的不同部分对光有不同反映

        lightMap: { value: null },
        lightMapIntensity: { value: 1 }//强度

    },

    emissivemap: {//自发光贴图

        emissiveMap: { value: null }

    },

    bumpmap: {//凹凸贴图

        bumpMap: { value: null },
        bumpScale: { value: 1 }

    },

    normalmap: {//法线贴图

        normalMap: { value: null },
        normalScale: { value: new Vector2( 1, 1 ) }

    },

    displacementmap: {//置换贴图，也叫移位贴图

        displacementMap: { value: null },
        displacementScale: { value: 1 },
        displacementBias: { value: 0 }

    },

    roughnessmap: {//粗糙度图

        roughnessMap: { value: null }

    },

    metalnessmap: {//金属贴图

        metalnessMap: { value: null }

    },

    gradientmap: {//卡通着色的渐变贴图

        gradientMap: { value: null }

    },

    fog: {//雾化

        fogDensity: { value: 0.00025 },
        fogNear: { value: 1 },
        fogFar: { value: 2000 },
        fogColor: { value: new Color( 0xffffff ) }

    },

    lights: {

        ambientLightColor: { value: [] },、

        lightProbe: { value: [] },

        directionalLights: { value: [], properties: {
            direction: {},
            color: {}
        } },

        directionalLightShadows: { value: [], properties: {
            shadowBias: {},
            shadowNormalBias: {},
            shadowRadius: {},
            shadowMapSize: {}
        } },

        directionalShadowMap: { value: [] },
        directionalShadowMatrix: { value: [] },

        spotLights: { value: [], properties: {
            color: {},
            position: {},
            direction: {},
            distance: {},
            coneCos: {},
            penumbraCos: {},
            decay: {}
        } },

        spotLightShadows: { value: [], properties: {
            shadowBias: {},
            shadowNormalBias: {},
            shadowRadius: {},
            shadowMapSize: {}
        } },

        spotShadowMap: { value: [] },
        spotShadowMatrix: { value: [] },

        pointLights: { value: [], properties: {
            color: {},
            position: {},
            decay: {},
            distance: {}
        } },

        pointLightShadows: { value: [], properties: {
            shadowBias: {},
            shadowNormalBias: {},
            shadowRadius: {},
            shadowMapSize: {},
            shadowCameraNear: {},
            shadowCameraFar: {}
        } },

        pointShadowMap: { value: [] },
        pointShadowMatrix: { value: [] },

        hemisphereLights: { value: [], properties: {
            direction: {},
            skyColor: {},
            groundColor: {}
        } },

        // TODO (abelnation): RectAreaLight BRDF data needs to be moved from example to main src
        rectAreaLights: { value: [], properties: {
            color: {},
            position: {},
            width: {},
            height: {}
        } },

        ltc_1: { value: null },
        ltc_2: { value: null }

    },

    points: {

        diffuse: { value: new Color( 0xffffff ) },
        opacity: { value: 1.0 },
        size: { value: 1.0 },
        scale: { value: 1.0 },
        map: { value: null },
        alphaMap: { value: null },
        uvTransform: { value: new Matrix3() }

    },

    sprite: {

        diffuse: { value: new Color( 0xffffff ) },
        opacity: { value: 1.0 },
        center: { value: new Vector2( 0.5, 0.5 ) },
        rotation: { value: 0.0 },
        map: { value: null },
        alphaMap: { value: null },
        uvTransform: { value: new Matrix3() }

    }

};

export { UniformsLib };

```

