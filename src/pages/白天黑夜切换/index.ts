import Main from '@Main';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water2';
import { Sky } from '@/shaderObject/Sky';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
export default class extends Main {
    time: {
        value: number;
    };
    time2: {
        value: number;
    };
    dayTime: number;
    sun: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    dirLight: THREE.DirectionalLight;
    sky: Sky;
    sky2Group: THREE.Group;
    texture: THREE.Texture;
    lensflare: Lensflare;
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
        this.dayTime = 24;
        this.time = Main.math.getSymmetricalTime(0.0, 1, 1 / this.dayTime);
        this.time2 = Main.math.getFractTime(1 / this.dayTime);
    }
    init() {
        this.createRenderer({}, (renderer) => {
            renderer.toneMapping = THREE.ReinhardToneMapping;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
        });
        this.createScene();
        this.createCamera({
            type: "PerspectiveCamera",
            position: new THREE.Vector3(-200, 1000, 2000),
            far: 100000
        });
        this.createLight();
        this.createControls((controls) => {
            controls.enablePan = false;
            controls.enableZoom = false;
            controls.enableDamping = true;
            controls.maxPolarAngle = Math.PI / 2;
            controls.minPolarAngle = - Math.PI / 2;
        });
        this.addListenEvent();
        this.createDebug({ stats: true, gui: true });
        this.onSceneCreatedAsync();
        this.render();
    }
    async onSceneCreatedAsync() {
        this.texture = await this.hdrLoader.loadAsync("hdr-1mb.hdr");
        Main.track.track(this.texture);
        await this.createSky1(this.texture.clone());
        this.initWater();
        this.initBox();

        this.initGui();
    }
    async createSky1(map: THREE.Texture) {
        map.mapping = THREE.EquirectangularRefractionMapping;//设置映射方式
        map.anisotropy = 16;//设置各项异性
        this.sky = new Sky(this.renderer, map);
        this.sky.material.uniforms['u_Time'] = this.time;
        this.scene.background = null;
        this.scene.add(this.sky.value);
    }
    createSky2(map: THREE.Texture) {
        this.sky2Group = new THREE.Group();
        this.scene.add(this.sky2Group);
        map.mapping = THREE.EquirectangularRefractionMapping;//设置映射方式
        map.anisotropy = 16;//设置各项异性
        // map.encoding = THREE.sRGBEncoding;//设置纹理编码格式
        // map.format = THREE.RGBAFormat;//设置纹理格式，定义了shader（着色器）将如何读取的2D纹理或者texels（纹理元素）的元素
        // map.type = THREE.UnsignedByteType;
        const sphereGeometry = new THREE.SphereGeometry(10000, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            side: THREE.BackSide,
            map,
        });
        sphereMaterial.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(`#include <dithering_fragment>`,
                `#include <dithering_fragment>
    gl_FragColor = mix(vec4(0.0,0.0,0.0,1.0),gl_FragColor,fract(u_Time));`);
            shader.fragmentShader = shader.fragmentShader.replace(`uniform vec3 diffuse;`, `uniform vec3 diffuse;
uniform float u_Time;`);
            shader.uniforms.u_Time = this.time;
        };
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sky2Group.add(sphere);
        this.scene.background = map;//设置环境
        this.scene.environment = map;//设置环境
        this.initSun();
        this.addLensflare();
    }
    initSun() {
        const sunGeometry = new THREE.SphereGeometry(100, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: "#ffffcc",
            depthWrite: false,
            depthTest: false
        });
        sunMaterial.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(`#include <dithering_fragment>`,
                `#include <dithering_fragment>
                gl_FragColor = mix(gl_FragColor,vec4(1.0,0.5,0.0,1.0),fract(u_Time));
                `);
            shader.fragmentShader = shader.fragmentShader.replace(`uniform vec3 diffuse;`, `uniform vec3 diffuse;
uniform float u_Time;`);
            shader.uniforms.u_Time = this.time;
        };
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        const sunGroup = new THREE.Group();
        sunGroup.add(this.sun);
        this.sun.renderOrder = 1000;
        sunGroup.rotation.y = Math.PI / 6;
        this.sky2Group.add(sunGroup);
        const dirLight = new THREE.DirectionalLight("#fff", 2.0);
        dirLight.position.set(100, 100, 100);
        dirLight.lookAt(0, 0, 0);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 10000;
        dirLight.shadow.camera.left = -2000;
        dirLight.shadow.camera.right = 2000;
        dirLight.shadow.camera.top = 2000;
        dirLight.shadow.camera.bottom = -2000;
        dirLight.shadow.mapSize.width = 20480;
        dirLight.shadow.mapSize.height = 20480;
        // this.sky2Group.add(dirLight);
        this.dirLight = dirLight;
    }
    initWater = () => {
        const planeGeometry = new THREE.PlaneGeometry(20000, 20000);
        const water = new Water(planeGeometry, {
            color: "#ffffff",
            scale: 1,
            flowDirection: new THREE.Vector2(1, 1),
            textureWidth: 1024,
            textureHeight: 1024
        });
        water.position.y = -1000;
        water.rotation.x = Math.PI * - 0.5;
        this.scene.add(water);
    };
    initGui() {
        const gui = {
            Sky: 'Sky1',
        };
        this.$gui.add(gui, 'Sky', ['Sky1', 'Sky2']).onChange(e => {
            if (e === 'Sky1') {
                console.log('this.sky2Group', this.sky2Group);
                this.sky2Group && Main.track.track(this.sky2Group);
                this.sky2Group && Main.track.disTrackByGroup(this.sky2Group);
                this.sky2Group = null;
                this.lensflare && this.lensflare.dispose();
                this.lensflare = null;
                this.sun = null;
                this.dirLight = null;
                this.createSky1(this.texture.clone());
            } else {
                this.sky && this.sky.dispose();
                this.sky = null;
                this.createSky2(this.texture.clone());
            }
        });
    }
    initBox() {
        const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const material = new THREE.MeshStandardMaterial({
            color: "#3060f0"
        });
        const box = new THREE.Mesh(geometry, material);
        // box.rotation.x += Math.PI / 4;
        // box.rotation.y += Math.PI / 4;
        // box.rotation.x += Math.PI / 4;
        box.rotateOnAxis(new THREE.Vector3(1, 1, 0), 45);
        this.scene.add(box);
        box.position.y -= 900;
    }
    addLensflare() {
        const textureLoader = new THREE.TextureLoader();
        const textureFlare0 = textureLoader.load('textures/lensflare/lensflare0.png');
        const textureFlare3 = textureLoader.load('textures/lensflare/lensflare3.png');
        const light = new THREE.PointLight(0xffffff, 1.5, 2000);
        light.color.setHex(0xffffcc, 'srgb-linear');
        this.sun.add(light);
        this.lensflare = new Lensflare();
        this.lensflare.addElement(new LensflareElement(textureFlare0, 130, 0, light.color));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 90, 0.2,));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 80, 0.4,));
        this.lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.7,));
        light.add(this.lensflare);
    }
    onSceneBeforeUpdate(): void {
        this.sun && this.sun.position.set(Math.cos(this.time2.value * Math.PI) * 10000, Math.sin(this.time2.value * Math.PI) * 10000, 0);
        this.dirLight && this.dirLight.position.copy(this.sun.position);
        this.dirLight && this.dirLight.lookAt(0, 0, 0);
        this.sky && (this.sky.params.elevation = this.time2.value * 180);
        this.sky && this.sky.update(this.scene);
        this.renderer.toneMappingExposure = this.time.value > 0.2 ? this.time.value : 0.2;
    }
}
