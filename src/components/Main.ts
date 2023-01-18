import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import gsap from "gsap";
import mathPlus from './mathPlus';
import glslShader from './glslShader';
import Track from './track';

export interface sceneParams {
    name?: string;
}
export interface CameraParams {
    fov?: number;
    near?: number;
    far?: number;
    aspect?: number;
    zoom?: number;
    name?: string;
    autoFov?: boolean;
    position: THREE.Vector3;
    target: THREE.Vector3;
    type: 'PerspectiveCamera' | 'OrthographicCamera';
}
export interface RendererParams extends THREE.WebGLRendererParameters {
    name?: string;
    backgroundColor: THREE.Color;
}
export default class Main {
    constructor(el: string | HTMLElement, debug?: boolean) {

    }
    /**开启debug */
    debug: boolean;
    /**场景 */
    scene: THREE.Scene;
    /**相机 */
    camera: (THREE.PerspectiveCamera | THREE.OrthographicCamera) & { autoFov?: boolean; };
    /**灯光组 */
    lightGroups: THREE.Group;
    /**渲染器 */
    private _renderer: THREE.WebGLRenderer | null;
    /**渲染器参数 */
    rendererParams: THREE.WebGLRendererParameters;
    /**透视相机参数 */
    PerspectiveCameraParams: Record<"fov" | "near" | "far" | "aspect", number>;
    /**正交相机参数 */
    OrthographicCameraParams: Record<"zoom" | "near" | "far", number>;
    /**轨道控制器 */
    private _controls: OrbitControls;
    /**鼠标坐标 */
    mousePos: THREE.Vector2;
    /**射线投射器 */
    private _rayCaster: THREE.Raycaster;
    /**时钟对象 */
    private _clock: THREE.Clock;
    /**模型解码器 */
    private _modelLoadByDraco: GLTFLoader;
    /**uniform u_Time */
    u_Time: {
        value: number;
    };
    /**时间倍率 */
    timeScale: number;
    /**材质 */
    material: THREE.Material;
    /**网格 */
    geometry: THREE.BufferGeometry;
    /**后处理通道 */
    composer: EffectComposer;
    /**三方动画库 */
    $gsap: GSAP;
    /**三方调试库 */
    $gui: GUI;
    /**三方性能探测器 */
    private $stats: Stats;
    /**数学 */
    static math = new mathPlus();
    /**shader片段 */
    static glslChunk = glslShader;
    /**销毁 */
    static track = new Track();
    /**创建一个标准的渲染场景 */
    initNormal(): void {

    }
    /**创建一个用于绘制shader的场景 */
    initShader(): void {

    }
    /**创建一个渲染器 */
    createRenderer(params: RendererParams): void {

    }
    /**创建一个场景 */
    createScene(params: sceneParams): void {

    }
    /**创建一个相机 */
    createCamera(params: CameraParams): void {

    }
    /**创建一个灯光 */
    createLight(count?: 0 | 1 | 2): void {

    }
    /**创建一个轨道控制器 */
    createControls(): void {

    }
    /**创建一个标准网格 */
    createBaseMesh(): void {

    }
    /**在场景渲染完成之后 */
    onSceneCeated(): void {

    }
    /**在场景重新渲染之前 */
    onSceneBeforeUpdate(): void {

    }
    /**在场景销毁之前 */
    onSceneBeforeDispose(): void {

    }
    /**销毁场景,释放内存 */
    dispose(): void {

    }
    /**场景重渲染 */
    render(): void {

    }
    /**创建一个透视相机 */
    private _createPerspectiveCamera(params: CameraParams): void {

    }
    /**创建一个正交相机 */
    private _createOrthographicCamera(params: CameraParams): void {

    }
    /**更新透视相机 */
    private _updatePerspectiveCamera(): void {

    }
    /**更新正交相机 */
    private _updateOrthographicCamera(): void {

    }

}