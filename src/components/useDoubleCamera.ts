import * as THREE from 'three';
// import { OrbitControls } from '../util/_controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import gsap from "gsap";
import mathPlus from './mathPlus';
import glslShader from './glslShader';
import Track from './track';
import EventEmitter from 'eventemitter3';
export interface sceneParams {
    name?: string;
}

export interface RendererParams {
    backgroundColor?: THREE.Color;
    outputEncoding?: THREE.TextureEncoding;
}
type RendererEvent = {
    onPointerDown: () => void;
    onPointerUp: () => void;
    cameraMove: () => void;
};
export default class Main extends EventEmitter<RendererEvent>{
    constructor(el: string | HTMLElement, debug?: boolean) {
        super();
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
        if (typeof el === 'string') {
            this.container = document.querySelector(el);
        } else {
            this.container = el;
        }
        this.debug = debug ?? false;
        this.defaultRendererParams = {
            config: {
                alpha: true,
                antialias: true,
            },
            setting: {
                outputEncoding: THREE.sRGBEncoding,
                backgroundColor: new THREE.Color("#000")
            }
        };
        this.mousePos = new THREE.Vector2(-100000, -100000);
        this.$gsap = gsap;
        this.u_Time = {
            value: 0.0,
        };
        this.timeScale = 1.0;
        this.$gui = new GUI();
        this._clock = new THREE.Clock();
        this.modelLoadByDraco = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'));
        this.modelLoadByGLTF = new GLTFLoader();
        this.lightGroups = new THREE.Group();
        this.hdrLoader = new RGBELoader().setPath('hdr/');
        this._rayCaster = new THREE.Raycaster();
        this.isPerspective = true;
        this.isUpdating = false;
    }
    isUpdating: boolean;
    isPerspective: boolean;
    /**挂载DOM */
    container: HTMLElement;
    /**开启debug */
    debug: boolean;
    /**场景 */
    scene: THREE.Scene;
    /**透视相机 */
    perspectiveCamera: THREE.PerspectiveCamera;
    /**正交相机 */
    orthographicCamera: THREE.OrthographicCamera;
    /**灯光组 */
    lightGroups: THREE.Group;
    /**渲染器 */
    renderer: THREE.WebGLRenderer | null;
    /**渲染器参数 */
    defaultRendererParams: { config: THREE.WebGLRendererParameters; setting: RendererParams; };
    /**轨道控制器 */
    private _controls: OrbitControls;
    /**鼠标坐标 */
    mousePos: THREE.Vector2;
    /**射线投射器 */
    private _rayCaster: THREE.Raycaster;
    /**时钟对象 */
    private _clock: THREE.Clock;
    /**模型解码器 */
    modelLoadByDraco: GLTFLoader;
    /**模型加载器 */
    modelLoadByGLTF: GLTFLoader;
    /**HDR加载器 */
    hdrLoader: RGBELoader;
    /**uniform u_Time */
    u_Time: {
        value: number;
    };
    /**时间倍率 */
    timeScale: number;
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
    initNormal(pos?: THREE.Vector3): void {
        this.createRenderer();
        this.createScene();
        this.createCamera2();
        this.createLight(2);
        this.createControls();
        this.addListenEvent();
        this.createDebug({ stats: true });
        this.onSceneCreated();
        this.render();
    }

    /**创建一个渲染器 */
    createRenderer(params: { config?: THREE.WebGLRendererParameters; setting?: RendererParams; } = { config: {}, setting: {} }, cb?: (arg: THREE.WebGLRenderer) => void): void {
        const { config, setting } = this.defaultRendererParams;
        this.renderer = new THREE.WebGLRenderer({ ...config, ...(params.config ? params.config : {}) });
        this.renderer.outputEncoding = setting.outputEncoding;
        this.renderer.setClearColor(setting.backgroundColor);
        if (params.setting) {
            params.setting.backgroundColor && this.renderer.setClearColor(params.setting.backgroundColor);
            params.setting.outputEncoding && (this.renderer.outputEncoding = params.setting.outputEncoding);
        }
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        cb && cb(this.renderer);
        this.container.appendChild(this.renderer.domElement);
        this.rendererDrawResize();
    }
    /**创建一个场景 */
    createScene(params?: sceneParams): void {
        this.scene = new THREE.Scene();
        params && params.name && (this.scene.name = params.name);
        this.scene.add(this.lightGroups);
    }
    createCamera2() {
        const cameraGroup = new THREE.Group();
        const aspect = Main.math.getAspect(this.container);
        this.perspectiveCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 5000);
        this.perspectiveCamera.lookAt(0, 0, 0);
        this.perspectiveCamera.position.set(0, 100, 80);
        const zoom = Math.sqrt(100 * 100 + 80 * 80) / 2;
        this.orthographicCamera = new THREE.OrthographicCamera(-zoom * aspect, zoom * aspect, zoom, -zoom, 0.1, 5000);
        this.orthographicCamera.lookAt(0, 0, 0);
        this.orthographicCamera.position.set(0, 0, 2500);
        cameraGroup.add(this.perspectiveCamera);
        cameraGroup.add(this.orthographicCamera);
        this.scene.add(cameraGroup);
    }
    getCameraState() {
        return {
            distance: this._controls.getDistance(),//获取当前相机距离焦点的距离
            phi: Main.math.deg2Rad(this._controls.getPolarAngle()),//获取垂直极角
            theta: Main.math.deg2Rad(this._controls.getAzimuthalAngle()),//获取水平方位角
            target: this._controls.target.clone(),//获取焦点
            fov: 75,
            near: 0.1,
            far: 5000,
        };
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
    activeCamera() {
        return this.isPerspective ? this.perspectiveCamera : this.orthographicCamera;
    }
    changeCamera() {
        this.isPerspective = !this.isPerspective;
    }
    /**创建一个轨道控制器 */
    createControls(): void {
        this._controls = new OrbitControls(this.perspectiveCamera, this.renderer.domElement);
        this._controls.screenSpacePanning = false;
        this._controls.addEventListener("change", () => {
            if (!this.isUpdating) {
                this.isUpdating = true;
                this.emit("cameraMove");
            }
        });
        this.addListener("cameraMove", () => {
            const state = this.getCameraState();
            const aspect = Main.math.getAspect(this.container);
            this.perspectiveCamera.fov = state.fov;
            this.perspectiveCamera.near = state.near;
            this.perspectiveCamera.far = state.far;
            this.perspectiveCamera.aspect = aspect;
            this.perspectiveCamera.updateProjectionMatrix();
            this._controls.target.copy(state.target);
            if (this.isPerspective) {
                this._controls.minPolarAngle = 0;
                this._controls.maxPolarAngle = Math.PI / 2;
                this._controls.minDistance = 0.1;
                this._controls.maxDistance = 5000;
            } else {
                this._controls.minPolarAngle = this._controls.maxPolarAngle = state.phi;
            }
            this.orthographicCamera.position.set(state.target.x, state.target.y, state.far / 2);
            this.orthographicCamera.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Main.math.rad2Deg(state.theta));
            this.orthographicCamera.left = (-state.distance / 2) * aspect;
            this.orthographicCamera.right = (state.distance / 2) * aspect;
            this.orthographicCamera.top = (state.distance / 2);
            this.orthographicCamera.bottom = (-state.distance / 2);
            this.orthographicCamera.near = state.near;
            this.orthographicCamera.far = state.far;
            this.orthographicCamera.updateProjectionMatrix();
            this.isUpdating = false;
        });
        console.log(this.getCameraState(), Math.sqrt(8 * 8 + 10 * 10));
    }
    getOrbitControls() {
        return this._controls;
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
        this.geometry = new THREE.PlaneGeometry(this.container.clientWidth / 8, this.container.clientHeight / 8, 1, 1);
        this.material = new THREE.ShaderMaterial({
            vertexShader: Main.glslChunk.glslTemplate.vertex_shader_base_template,
            fragmentShader: Main.glslChunk.glslTemplate.fragement_shader_base_template,
            uniforms: {
                u_Time: this.u_Time
            }
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }
    useRayCaster(point: THREE.Vector2, recursive: boolean = false, objects: THREE.Object3D[] = [this.scene], normalize: boolean = true,) {
        const cursorCoords = new THREE.Vector2();
        cursorCoords.x = normalize ? (point.x / this.container.clientWidth) * 2 - 1 : point.x;
        cursorCoords.y = normalize ? -(point.y / this.container.clientHeight) * 2 + 1 : point.y;
        this._rayCaster.setFromCamera(cursorCoords, this.activeCamera());
        return this._rayCaster.intersectObjects(objects, recursive);
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
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
    };
    /**添加事件 */
    addListenEvent(): void {
        window.addEventListener("resize", this.handleSize);
        window.onbeforeunload = () => {
            this.dispose();
        };
    }
    /**在场景渲染完成之后 */
    async onSceneCreatedAsync(): Promise<any> {
    }
    /**在场景渲染完成之后 */
    onSceneCreated(): void {
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
            this.renderer.setAnimationLoop(null);
            this.scene.clear();
            Main.track && Main.track.allDisTrack();
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            const gl = this.renderer.domElement.getContext('webgl');
            gl && gl.getExtension("WEBGL_lose_context");
            this.container!.removeChild(this.renderer.domElement);
            this.info();
            this.renderer = null;
            this.$stats && this.container!.removeChild(this.$stats.domElement);
            this.$gui && document.querySelector(".main")!.remove();
        } catch (e) {
            console.log(e);
        }
    }
    /**场景重渲染 */
    render(): void {
        this.renderer.setAnimationLoop(() => {
            this.rendererDrawResize();
            if (this._clock) {
                this.u_Time.value = this._clock.getElapsedTime() * this.timeScale;
                Main.math.update(this.u_Time.value);
            }
            if (this.$stats) {
                this.$stats.update();
            }
            this.onSceneBeforeUpdate();
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.activeCamera());
            }
        });
    }
    /**日志 */
    public info() {
        console.log(this.renderer.info);
        Main.track.info();
    }
    private rendererDrawResize(): void {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const { clientWidth, clientHeight } = canvas;
        const width = (clientWidth * pixelRatio) | 0;
        const height = (clientHeight * pixelRatio) | 0;
        const isNeedResetCanvasDrawSize = (canvas.width !== width || canvas.height !== height);
        if (isNeedResetCanvasDrawSize) {
            this.renderer.setSize(width, height, false);
        }
    }

}