
import MeshMain from "../../MeshMain";
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.glsl';
import * as THREE from 'three';
import Main from '@Main';
export interface Params {
    enableColorGradient?: boolean;//开启颜色渐变
    enableDynamicColor?: boolean;//开启动态颜色
    color1?: THREE.ColorRepresentation;
    color2?: THREE.ColorRepresentation;
}
/**@坐标轴
 * TODO 现在只能绘制一个正方形网格，后续希望能绘制长方形网格
 */
export default class extends MeshMain {
    private _params: Params;
    value: THREE.Line<THREE.BufferGeometry, THREE.ShaderMaterial | THREE.RawShaderMaterial>;
    public constructor(size: number, divisions: number, params?: Params) {
        super();
        this.shader = {
            uniforms: {
                u_Time: Main.math.getTime(),
                u_enableDynamicColor: { value: false }
            },
            vertexShader,
            fragmentShader,

        };
        this._params = {
            enableColorGradient: true,
            enableDynamicColor: false,
            color1: "#fff",
            color2: "#fff",
        };
        this._params = params ? { ...this._params, ...params } : this._params;

        if (this._params.enableDynamicColor) {
            this._params.enableColorGradient = false;
        }
        if (this._params.enableColorGradient) {
            this._params.enableDynamicColor = false;
        }
        this.geometry = new THREE.BufferGeometry();
        this.getData(size, divisions);
        this.material = new THREE.ShaderMaterial({
            vertexColors: true,
            uniforms: this.shader.uniforms,
            vertexShader: this.shader.vertexShader,
            fragmentShader: this.shader.fragmentShader,
        });
        this.material.uniforms['u_enableDynamicColor'].value = this._params.enableDynamicColor;
        this.material.needsUpdate = true;
        this.value = new THREE.LineSegments(this.geometry, this.material);
    }
    getData(size: number, divisions: number) {
        const halfSize = size / 2;
        const step = size / divisions;
        const points = 4 * (divisions + 1);
        const arrayBuffer = new ArrayBuffer(points * 16);
        const interleavedFloat32Buffer = new Float32Array(arrayBuffer);
        const interleavedUint8buffer = new Uint8Array(arrayBuffer);
        const PointArray: number[] = [];
        const colorArray: number[] = [];
        const color1 = this._params.color1 instanceof THREE.Color ? this._params.color1 : new THREE.Color(this._params.color1);
        const color2 = this._params.color2 instanceof THREE.Color ? this._params.color2 : new THREE.Color(this._params.color2);

        for (let i = 0, k = -halfSize; i <= divisions; i++, k += step) {
            PointArray.push(-halfSize, 0, k, halfSize, 0, k);
            PointArray.push(k, 0, -halfSize, k, 0, halfSize);
            if (this._params.enableColorGradient) {
                colorArray.push(color1.r, color1.g, color1.b, color2.r, color2.g, color2.b);
                colorArray.push(color1.r, color1.g, color1.b, color2.r, color2.g, color2.b);
            } else {
                colorArray.push(color1.r, color1.g, color1.b, color1.r, color1.g, color1.b);
                colorArray.push(color1.r, color1.g, color1.b, color1.r, color1.g, color1.b);
            }
        }
        for (let i = 0; i < points; i++) {
            interleavedFloat32Buffer[i * 4] = PointArray[i * 3];
            interleavedFloat32Buffer[i * 4 + 1] = PointArray[i * 3 + 1];
            interleavedFloat32Buffer[i * 4 + 2] = PointArray[i * 3 + 2];
            const j = (i * 4 + 3) * 4;
            interleavedUint8buffer[j] = colorArray[i * 3];
            interleavedUint8buffer[j + 1] = colorArray[i * 3 + 1];
            interleavedUint8buffer[j + 2] = colorArray[i * 3 + 2];
        }
        const interleavedBuffer32 = new THREE.InterleavedBuffer(interleavedFloat32Buffer, 4);//xyz w(rgba)
        const interleavedBuffer8 = new THREE.InterleavedBuffer(interleavedUint8buffer, 16);//xyz + rgba
        this.geometry.setAttribute("position", new THREE.InterleavedBufferAttribute(interleavedBuffer32, 3, 0));
        this.geometry.setAttribute("color", new THREE.InterleavedBufferAttribute(interleavedBuffer8, 3, 12));
    }
}
