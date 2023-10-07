import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
	constructor(el: string | HTMLElement, debug?: boolean) {
		super(el, debug);
	}
	init() {
		this.createRenderer();
		this.createScene();
		this.createCamera({
			type: 'PerspectiveCamera',
			position: new THREE.Vector3(0, 0.2, 0.5),
		});
		this.createLight(1);
		this.createControls();
		this.addSelfListenEvent();
		this.createDebug({ stats: true });
		this.onSceneCreated();
		this.render();
	}
	async onSceneCreated() {
		await this.initEnv();
		this.initMesh();
	}
	async initEnv() {
		const envMap = await this.hdrLoader.loadAsync('blouberg_sunrise_2_1k.hdr');
		envMap.mapping = THREE.EquirectangularReflectionMapping;
		this.scene.background = envMap;
		this.scene.environment = envMap;
	}

	initMesh() {
		this.material = new THREE.MeshPhongMaterial({
			map: this.textureLoader.load('PBR/watercover/CityNewYork002_COL_VAR1_1K.png', map => {
				map.colorSpace = THREE.SRGBColorSpace;
			}),
			specularMap: this.textureLoader.load('PBR/watercover/CityNewYork002_GLOSS_1K.jpg'),
			displacementMap: this.textureLoader.load('PBR/watercover/CityNewYork002_DISP_1K.jpg'),
			aoMap: this.textureLoader.load('PBR/watercover/CityNewYork002_AO_1K.jpg'),
			envMap: this.scene.environment,
			bumpMap: this.textureLoader.load('PBR/watercover/CityNewYork002_DISP_1K.jpg'),
			displacementScale: 0.02,
			transparent: true,
			side: THREE.DoubleSide,
		});
		this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.add(this.mesh);
	}
}
