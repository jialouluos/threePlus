
import MeshMain from "../../MeshMain";
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.glsl';
import * as THREE from 'three';
import Main from '@Main';
import { Label, LabelPool } from '@foxglove/three-text';
import { type PickByType } from "@type/tool";
import { Triangle } from "three";
export interface I_BarData {
    value: number;
    name: string;
    color?: THREE.ColorRepresentation;
    /**@透明度 */
    opacity?: number;
    /**@柱半径 */
    radius: number;
    /**@柱高度 */
    height?: number;
}
export interface BarParams {
    /**@从底向上渐变 */
    enableUpGradient?: boolean;
    /**@自动计算高度百分比 */
    enableAutoHeight?: boolean;
    /**@自动计算高度时的最大高度 */
    autoMaxHeight?: number;
    /**@自动计算高度时依赖的数据属性 */
    depValue?: PickByType<I_BarData, number>;
    /**@柱体间间距 */
    space?: number;
    /**@柱状 */
    type?: "box" | "cylinder";
    /**@动态上升 */
    enableDynamicUp?: boolean;
}
/**@柱状图
 * @data {}
 */
export default class extends MeshMain {
    value: THREE.Group;
    private _params: BarParams;
    private _heightMap: Map<I_BarData, number>;

    public constructor(data: I_BarData[], params?: BarParams) {
        super();

        this._heightMap = new Map<I_BarData, number>();
        this._params = {
            enableUpGradient: true,
            enableAutoHeight: true,
            autoMaxHeight: 10,
            depValue: "value",
            space: 1,
            type: "box",
            enableDynamicUp: true,
        };
        this._params = params ? { ...this._params, ...params } : this._params;
        this.shader = {
            uniforms: {
                u_Time: Main.math.getTime(),
                u_Opacity: {
                    value: NaN
                },
                diffuse: {
                    value: new THREE.Color("#ff0000")
                },
                u_MaxHeight: {
                    value: NaN
                },
                u_Height: {
                    value: NaN
                },
            },
            vertexShader,
            fragmentShader,
            defines: {
                USE_UP_GRADIENT: this._params.enableUpGradient,
                USE_DYNAMIC_UP: this._params.enableDynamicUp
            }
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.shader.uniforms,
            vertexShader: this.shader.vertexShader,
            fragmentShader: this.shader.fragmentShader,
            defines: this.shader.defines,
            transparent: true
        });
        this.value = new THREE.Group();
        this.enableAutoHeight(data, 'value', this._params.autoMaxHeight);
        this.createChart(data);
      
    }

    private async createChart(data: I_BarData[]) {
        let cacheX = 0;
        for (const item of data) {
            const itemGroup = new THREE.Group();
            const height = this._params.enableAutoHeight ? this._heightMap.get(item) : item.height ?? this._params.autoMaxHeight;
            const geometry = this._params.type === "box" ? new THREE.CylinderGeometry(item.radius, item.radius, height, 4, 1, true) : new THREE.CylinderGeometry(item.radius, item.radius, height, 32, 1, true);
            let mesh = null;


            if (this._params.enableUpGradient || this._params.enableDynamicUp || item.color) {
                //开启向上渐变，则不公用同一个material
                const material = this.material.clone();
                item.color && (material.uniforms.diffuse.value = new THREE.Color(item.color));
                material.uniforms.u_Opacity.value = item.opacity ?? 0.7;
                material.uniforms.u_MaxHeight.value = height / 2.0;
                material.uniforms.u_Height.value = height;
                material.uniforms.u_Time = Main.math.getTime();
                material.uniforms.u_Time2 = Main.math.getTime();

                // material.blending = THREE.NormalBlending;
                mesh = new THREE.Mesh(geometry, material);
            } else {
                mesh = new THREE.Mesh(geometry, this.material);
            }
            const label = await this.createText(item.name, 'ZhuZiAWan', 'fonts/ZhuZiAWan/ZhuZiAWan.ttc');
            itemGroup.position.x = cacheX + item.radius;
            itemGroup.position.y = height / 2;
            itemGroup.position.z = item.radius;
            label.position.y = height / 2 + 0.5;
            cacheX += this._params.space + 2 * item.radius;
            itemGroup.add(mesh);
            itemGroup.add(label);
            this.value.add(itemGroup);
        }

    }
    private async createText(text: string, fontFamily: string = 'IBM Plex Mono', fontUrl?: string) {
        if (fontUrl) {
            const fontLoader = new FontFace(fontFamily, `url(${fontUrl})`);
            await fontLoader.load();
        }

        const labelPool = new LabelPool({ fontFamily });
        const label = labelPool.acquire();
        label.setText(text);
        label.setBillboard(true);
        label.setSizeAttenuation(false);
        label.setLineHeight(20);
        return label;
    }
    private enableAutoHeight(data: I_BarData[], value: PickByType<I_BarData, number>, preHeight: number) {
        const maxValue = Math.max(...data.map((item) => (item[value])));
        this._heightMap.clear();
        for (const item of Object.values(data)) {
            this._heightMap.set(item, item[value] / maxValue * preHeight);
        }
    }


}

