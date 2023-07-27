import { EventEmitter } from 'eventemitter3';
import * as THREE from 'three';
import { OrbitControls } from '@/util/_controls';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import gsap from "gsap";
import mathPlus from './mathPlus';
import glslShader from './glslShader';
import Track from './Track';


export interface CameraOption {
    near?: number;
    far?: number;
    name?: string;
    autoFov?: boolean;
    position?: THREE.Vector3;
    target?: THREE.Vector3;
    zoom?: number;
    type: 'PerspectiveCamera' | 'OrthographicCamera';
}
export interface OrthographicOption extends CameraOption {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    type: 'OrthographicCamera';
}
export interface PerspectiveOption extends CameraOption {
    fov?: number;
    aspect?: number;
    type: 'PerspectiveCamera';
}
export interface RendererParams {
    backgroundColor?: THREE.Color;
    outputEncoding?: THREE.TextureEncoding;
}
interface I_Event {
    pointerUp: (e: PointerEvent, mousePos: THREE.Vector2) => void;
}
export default class Main extends EventEmitter<I_Event>{
    constructor(el: string | HTMLElement, debug?: boolean) {
        super();
        if (typeof el === 'string') {
            this.container = document.querySelector(el);
        } else {
            this.container = el;
        }
        this.debug = debug ?? false;
        this.rendererOption = {
            config: {
                alpha: true,
                antialias: true,
                precision: "highp",
                logarithmicDepthBuffer: true
            },
            setting: {
                outputEncoding: THREE.sRGBEncoding,
                backgroundColor: new THREE.Color("#000")
            }
        };
        this.perspectiveOption = {
            fov: 75,
            near: 0.001,
            far: 10000,
            aspect: Main.math.getAspect(this.container),
            position: new THREE.Vector3(0, 0, 100),
            target: new THREE.Vector3(0, 0, 0),
            type: "PerspectiveCamera"
        };
        this.orthographicOption = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            near: -100,
            far: 10000,
            zoom: 2,
            position: new THREE.Vector3(0, 0, 100),
            target: new THREE.Vector3(0, 0, 0),
            type: "OrthographicCamera"
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
        const resizeObserver = new ResizeObserver(this.rendererDrawResize);
        resizeObserver.observe(this.container!);
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
    renderer: THREE.WebGLRenderer | null;
    /**渲染器参数 */
    rendererOption: { config: THREE.WebGLRendererParameters; setting: RendererParams; };
    /**透视相机参数 */
    perspectiveOption: PerspectiveOption;
    /**正交相机参数 */
    orthographicOption: OrthographicOption;
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
    /**材质 */
    material: THREE.ShaderMaterial | THREE.MeshStandardMaterial | THREE.PointsMaterial | THREE.SpriteMaterial;
    /**网格 */
    geometry: THREE.BufferGeometry;
    /**3D网格对象 */
    mesh: THREE.Mesh;
    /**后处理通道 */
    composer: EffectComposer;
    /**三方动画库 */
    $gsap: typeof gsap;
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
        this.createCamera({
            type: "PerspectiveCamera",
            position: pos ?? new THREE.Vector3(0, 8, 10),
        });
        this.createLight(2);
        this.createControls();
        this.addSelfListenEvent();
        this.createDebug({ stats: true });
        this.onSceneCreated();
        this.render();
    }
    /**创建一个用于绘制shader的场景 */
    initShader(): void {
        this.createRenderer();
        this.createScene();
        this.createCamera({
            type: "OrthographicCamera",
            position: new THREE.Vector3(0, 0, 0),
        });
        this.addSelfListenEvent();
        this.createDebug({ stats: true, gui: true, });
        this.onSceneCreated();
        this.render();

    }
    /**创建一个渲染器 */
    createRenderer(params: { config?: THREE.WebGLRendererParameters; setting?: RendererParams; } = { config: {}, setting: {} }): void {
        const { config, setting } = this.rendererOption;
        this.renderer = new THREE.WebGLRenderer({ ...config, ...(params.config ? params.config : {}) });
        this.renderer.outputEncoding = setting.outputEncoding ?? params.setting.outputEncoding;
        this.renderer.setClearColor(setting.backgroundColor ?? params.setting.backgroundColor);
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.container.appendChild(this.renderer.domElement);

    }
    /**创建一个场景 */
    createScene(): void {
        this.scene = new THREE.Scene();
        this.scene.add(this.lightGroups);
    }
    /**创建一个相机 */
    createCamera(params: PerspectiveOption | OrthographicOption): void {
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
    createControls(cb?: (controls: OrbitControls) => void): void {
        this._controls = new OrbitControls(this.camera, this.renderer.domElement);
        if (this.camera instanceof THREE.PerspectiveCamera)
            this._controls.target.copy(this.perspectiveOption.target);
        else {
            this._controls.target.copy(this.orthographicOption.target);
        }
        cb && cb(this._controls);
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
        this._rayCaster.setFromCamera(cursorCoords, this.camera);
        return this._rayCaster.intersectObjects(objects, recursive);
    }
    handleSize = () => {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this._updatePerspectiveCamera(this.perspectiveOption);
        } else if (this.camera instanceof THREE.OrthographicCamera) {
            const camera = this.camera;
            this._updateOrthographicCamera(this.orthographicOption);
            const { left, right, top, bottom, near, far } = this.orthographicOption;
            camera.left = left;
            camera.right = right;
            camera.top = top;
            camera.bottom = bottom;
            camera.near = near;
            camera.far = far;
            camera.updateProjectionMatrix();
        }
    };
    /**添加事件 */
    addSelfListenEvent(): void {
        window.onbeforeunload = () => {
            this.dispose();
        };
        this.container.addEventListener("pointerup", this.onPointerUp);
        this.container.addEventListener("pointerdown", this.onPointerDown);
    }
    onPointerUp = (e) => {
        this.emit('pointerUp', e, this.mousePos);
    };

    onPointerDown = (e) => {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
    };
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
    /**在一次渲染结束 */
    onSceneRenderCompleted(): void {

    }
    /**销毁场景,释放内存 */
    dispose(): void {
        this.onSceneBeforeDispose();
        Main.track.track(this.scene);
        try {
            this.container.removeEventListener("pointerup", this.onPointerUp);
            this.container.removeEventListener("pointerdown", this.onPointerDown);
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
            if (this._clock) {
                this.u_Time.value = this._clock.getElapsedTime() * this.timeScale;
                Main.math.update(this.u_Time.value);
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
                this.renderer.render(this.scene, this.camera);
            }
            this.onSceneRenderCompleted();
        });
    }
    /**日志 */
    public info() {
        console.log(this.renderer.info);
        Main.track.info();
    }
    /**创建一个透视相机 */
    private _createPerspectiveCamera(params: PerspectiveOption): THREE.PerspectiveCamera {
        this.perspectiveOption = { ...this.perspectiveOption, ...params };
        this._updatePerspectiveCamera(this.perspectiveOption);
        const config = this.perspectiveOption;
        params.autoFov && (config.fov = Main.math.rad2Deg(2 * Math.atan(this.container.clientHeight / 2 / config.position.z)));
        const camera = new THREE.PerspectiveCamera(config.fov, config.aspect, config.near, config.far);
        camera.position.copy(config.position);
        camera.lookAt(config.target);
        params.name && (camera.name = params.name);
        return camera;
    }
    /**创建一个正交相机 */
    private _createOrthographicCamera(params: OrthographicOption): THREE.OrthographicCamera {
        this.orthographicOption = { ...this.orthographicOption, ...params };
        this._updateOrthographicCamera(this.orthographicOption);
        const config = this.orthographicOption;
        const camera = new THREE.OrthographicCamera(config.left, config.right, config.top, config.bottom, config.near, config.far);
        camera.position.copy(config.position);
        camera.lookAt(config.target);
        params.name && (camera.name = params.name);
        return camera;
    }
    /**更新透视相机 */
    private _updatePerspectiveCamera(params: PerspectiveOption): void {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.perspectiveOption.aspect = Main.math.getAspect(this.container!);
            params.autoFov && (this.perspectiveOption.fov = Main.math.rad2Deg(2 * Math.atan(this.container.clientHeight / 2 / this.perspectiveOption.position.z)));
            this.camera.fov = this.perspectiveOption.fov;
            this.camera && (this.camera.aspect = this.perspectiveOption.aspect);
            this.camera && this.camera.updateProjectionMatrix();
        }
    }
    /**更新正交相机 */
    private _updateOrthographicCamera(params: OrthographicOption): void {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            const { zoom, near, far } = params;
            const aspect = Main.math.getAspect(this.container);
            this.orthographicOption = {
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
    private rendererDrawResize = (entries): void => {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = (entries[0].borderBoxSize[0].inlineSize * pixelRatio) | 0;
        const height = (entries[0].borderBoxSize[0].blockSize * pixelRatio) | 0;
        const isNeedResetCanvasDrawSize = (canvas.width !== width || canvas.height !== height);
        if (isNeedResetCanvasDrawSize) {
            console.log(width, height);
            this.renderer.setSize(width, height);
            this.handleSize();
        }
    };

}