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
    position?: THREE.Vector3;
    target?: THREE.Vector3;
    type: 'PerspectiveCamera' | 'OrthographicCamera';
}
export interface OrthographicCameraParams extends CameraParams {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
export interface RendererParams {
    backgroundColor?: THREE.Color;
    outputEncoding?: THREE.TextureEncoding;
}
export default class Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        if (typeof el === 'string') {
            this.container = document.querySelector(el);
        } else {
            this.container = el;
        }
        this.debug = debug ?? false;
        this.defaultrendererParams = {
            config: {
                alpha: true,
                antialias: true,
            },
            setting: {
                outputEncoding: THREE.sRGBEncoding,
                backgroundColor: new THREE.Color("#000")
            }
        };
        this.defaultPerspectiveCameraParams = {
            fov: 75,
            near: 0.1,
            far: 1000,
            aspect: Main.math.getAspect(this.container),
            position: new THREE.Vector3(0, 0, 100),
            target: new THREE.Vector3(0, 0, 0),
            type: "PerspectiveCamera"
        };
        this.defaultOrthographicCameraParams = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            near: -100,
            far: 1000,
            zoom: 2,
            position: new THREE.Vector3(0, 0, 100),
            target: new THREE.Vector3(0, 0, 0),
            type: "OrthographicCamera"
        };
        this.mousePos = new THREE.Vector2(-100000, -100000);
        this.$gsap = gsap;
        this.u_Time = {
            value: 0.0
        };
        this.timeScale = 1.0;
        this._clock = new THREE.Clock();
        this._modelLoadByDraco = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'));
        this._modelLoadByGLTF = new GLTFLoader();
        this.lightGroups = new THREE.Group();
    }
    /**挂载DOM */
    container: HTMLElement;
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
    defaultrendererParams: { config: THREE.WebGLRendererParameters; setting: RendererParams; };
    /**透视相机参数 */
    defaultPerspectiveCameraParams: CameraParams;
    /**正交相机参数 */
    defaultOrthographicCameraParams: OrthographicCameraParams;
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
    /**模型加载器 */
    private _modelLoadByGLTF: GLTFLoader;
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
        this.createRenderer();
        this.createScene();
        this.createCamera({
            type: "PerspectiveCamera",
        });
        this.createLight(2);
        this.createControls();
        this.addListenEvent();
        this.createDebug({ stats: true });
        this.onSceneCeated();
        this.render();
    }
    /**创建一个用于绘制shader的场景 */
    initShader(): void {

    }
    /**创建一个渲染器 */
    createRenderer(params: { config?: THREE.WebGLRendererParameters; setting?: RendererParams; } = { config: {}, setting: {} }): void {
        const { config, setting } = this.defaultrendererParams;
        this._renderer = new THREE.WebGLRenderer({ ...config, ...(params.config ? params.config : {}) });
        this._renderer.outputEncoding = setting.outputEncoding;
        this._renderer.setClearColor(setting.backgroundColor);
        if (params.setting) {
            params.setting.backgroundColor && this._renderer.setClearColor(params.setting.backgroundColor);
            params.setting.outputEncoding && (this._renderer.outputEncoding = params.setting.outputEncoding);
        }
        this._renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.container.appendChild(this._renderer.domElement);
        this._rendererDrawResize();
    }
    /**创建一个场景 */
    createScene(params?: sceneParams): void {
        this.scene = new THREE.Scene();
        params && params.name && (this.scene.name = params.name);
        this.scene.add(this.lightGroups);
    }
    /**创建一个相机 */
    createCamera(params: CameraParams): void {
        if (params.type === "PerspectiveCamera") {
            this.camera = this._createPerspectiveCamera(params);
        } else {
            this.camera = this._createOrthographicCamera(params);
        }
    }
    /**创建一个灯光 */
    createLight(count?: 1 | 2): void {
        this.lightGroups.add(new THREE.AmbientLight('#fff'));
        if (count) {
            if (count) {
                const dirLight = new THREE.DirectionalLight('#fff', 0.5);
                dirLight.position.set(200, 300, 400);
                this.scene.add(dirLight);
                this.lightGroups.add(dirLight);
                count--;
            }
            if (count) {
                const dirLight2 = new THREE.DirectionalLight('#fff', 0.5);
                dirLight2.position.set(-200, 300, 400);
                this.lightGroups.add(dirLight2);
            }
        }
    }
    /**创建一个轨道控制器 */
    createControls(): void {
        this._controls = new OrbitControls(this.camera, this._renderer.domElement);
        if (this.camera instanceof THREE.PerspectiveCamera)
            this._controls.target.copy(this.defaultPerspectiveCameraParams.target);
        else {
            this._controls.target.copy(this.defaultOrthographicCameraParams.target);
        }
        this._controls.update();
    }
    /**创建一个debug环境 */
    createDebug(params?: { helper?: boolean, stats?: boolean, gui?: boolean; }) {
        if (!this.debug) return;
        if (params) {
            if (params.helper) {
                this.scene.add(new THREE.AxesHelper(100));
            }
            if (params.stats) {
                this.$stats = Stats();
                this.container!.appendChild(this.$stats.domElement);
            }
            if (params.gui) {
                this.$gui = new GUI();
            }
        }
    }
    /**创建一个标准网格 */
    createBaseMesh(): void {
        this.geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
        this.material = new THREE.ShaderMaterial({
            vertexShader: Main.glslChunk.glslTemplate.vertex_shader_base_template,
            fragmentShader: Main.glslChunk.glslTemplate.fragement_shader_base_template,
            uniforms: {
                u_Time: this.u_Time
            }
        });
        const mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(mesh);
    }
    handleSize = () => {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this._updatePerspectiveCamera(this.defaultPerspectiveCameraParams);
        } else if (this.camera instanceof THREE.OrthographicCamera) {
            const camera = this.camera;
            this._updateOrthographicCamera(this.defaultOrthographicCameraParams);
            const { left, right, top, bottom, near, far } = this.defaultOrthographicCameraParams;
            camera.left = left;
            camera.right = right;
            camera.top = top;
            camera.bottom = bottom;
            camera.near = near;
            camera.far = far;
            camera.updateProjectionMatrix();
        }
        this._renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
    };
    /**添加事件 */
    addListenEvent(): void {
        window.addEventListener("resize", this.handleSize);
    }
    /**在场景渲染完成之后 */
    onSceneCeated(): void {
        this.createBaseMesh();
    }
    /**在场景重新渲染之前 */
    onSceneBeforeUpdate(): void {

    }
    /**在场景销毁之前 */
    onSceneBeforeDispose(): void {

    }
    /**销毁场景,释放内存 */
    dispose(): void {
        this.onSceneBeforeDispose();
        window.removeEventListener("resize", this.handleSize);
        Main.track.track(this.scene);
        try {
            this._renderer.setAnimationLoop(null);
            this.scene.clear();
            Main.track && Main.track.allDisTrack();
            this._renderer.dispose();
            this._renderer.forceContextLoss();
            const gl = this._renderer.domElement.getContext('webgl');
            gl && gl.getExtension("WEBGL_lose_context");
            this.container!.removeChild(this._renderer.domElement);
            this._renderer = null;
            this.$stats && this.container!.removeChild(this.$stats.domElement);
            this.$gui && document.querySelector(".main")!.remove();
        } catch (e) {
            console.log(e);
        }
    }
    /**场景重渲染 */
    render(): void {
        this._renderer.setAnimationLoop(() => {
            this._rendererDrawResize();
            if (this._clock) {
                this.u_Time.value = this._clock.getElapsedTime() * this.timeScale;
            }
            if (this._controls) {
                this._controls.update();
            }
            if (this.$stats) {
                this.$stats.update();
            }
            this.onSceneBeforeUpdate();
            if (this.composer) {
                this.composer.render();
            } else {
                this._renderer.render(this.scene, this.camera);
            }
        });
    }
    /**日志 */
    info() {
        console.log(this._renderer.info);
        Main.track.info();
    }
    /**创建一个透视相机 */
    private _createPerspectiveCamera(params: CameraParams): THREE.PerspectiveCamera {
        this.defaultPerspectiveCameraParams = { ...this.defaultPerspectiveCameraParams, ...params };
        this._updatePerspectiveCamera(this.defaultPerspectiveCameraParams);
        const config = this.defaultPerspectiveCameraParams;
        const camera = new THREE.PerspectiveCamera(config.fov, config.aspect, config.near, config.far);
        camera.position.copy(config.position);
        camera.lookAt(config.target);
        params.name && (camera.name = params.name);
        return camera;
    }
    /**创建一个正交相机 */
    private _createOrthographicCamera(params: CameraParams): THREE.OrthographicCamera {
        this.defaultOrthographicCameraParams = { ...this.defaultOrthographicCameraParams, ...params };
        this._updateOrthographicCamera(this.defaultOrthographicCameraParams);
        const config = this.defaultOrthographicCameraParams;
        const camera = new THREE.OrthographicCamera(config.fov, config.aspect, config.near, config.far);
        camera.position.copy(config.position);
        camera.lookAt(config.target);
        params.name && (camera.name = params.name);
        return camera;
    }
    /**更新透视相机 */
    private _updatePerspectiveCamera(params: CameraParams): void {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.defaultPerspectiveCameraParams.aspect = Main.math.getAspect(this.container!);
            this.camera && (this.camera.aspect = this.defaultPerspectiveCameraParams.aspect);
            this.camera && this.camera.updateProjectionMatrix();
            // this.camera && this.camera.autoFov && (this.camera.fov = Main.math.rad2Deg(2 * Math.atan(window.innerHeight / 2 / this.camera.position.z)));
        }
    }
    /**更新正交相机 */
    private _updateOrthographicCamera(params: OrthographicCameraParams): void {
        if (this.camera instanceof THREE.OrthographicCamera) {
            const { zoom, near, far } = params;
            const aspect = Main.math.getAspect(this.container);
            this.defaultOrthographicCameraParams = {
                ...params,
                left: -zoom * aspect,
                right: zoom * aspect,
                top: zoom,
                bottom: -zoom,
                near,
                far,
                zoom
            };
        }
    }
    private _rendererDrawResize(): void {
        if (!this._renderer) return;

        const canvas = this._renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const { clientWidth, clientHeight } = canvas;
        const width = (clientWidth * pixelRatio) | 0;
        const height = (clientHeight * pixelRatio) | 0;
        const isNeedResetCanvasDrawSize = (canvas.width !== width || canvas.height !== height);
        if (isNeedResetCanvasDrawSize) {
            this._renderer.setSize(width, height, false);
        }
    }

}