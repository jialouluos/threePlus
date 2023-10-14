import Main from '@Main';
import * as THREE from 'three';

export default class extends Main {
	constructor(el: string | HTMLElement, debug?: boolean) {
		super(el, debug);
	}
	init() {
		this.onRenderBefore(
			async () => {
				const env = await this.hdrLoader.loadAsync('env_1.hdr');
				return { env };
			},
			res => {
				this.globalEntity = { refractionRatio: 0.7, reflectivity: 0.9, ...res };
				this.createRenderer();
				this.createScene();
				this.createCamera({
					type: 'PerspectiveCamera',
					position: new THREE.Vector3(0, 20, 40),
				});
				this.createLight(1);
				this.createControls();
				this.addSelfListenEvent();
				this.createDebug({ stats: true });
				this.onSceneCreated();
				this.render();
			}
		);
	}
	override onSceneCreated() {
		this.initMesh();
		this.initGUI();
	}
	initMesh() {
		this.globalEntity.env.mapping = THREE.EquirectangularReflectionMapping; //反射映射
		this.globalEntity.env.mapping = THREE.EquirectangularRefractionMapping; //折射映射
		this.scene.environment = this.scene.background = this.globalEntity.env;
		this.geometry = new THREE.SphereGeometry(10, 32, 32);
		this.material = new THREE.MeshPhongMaterial({
			color: '#ffffff',
			envMap: this.globalEntity.env,
			refractionRatio: this.globalEntity.refractionRatio, //折射比率(mapping = THREE.EquirectangularRefractionMapping生效) 计算公式为：空气折射率(1.0)/物体折射率
			reflectivity: this.globalEntity.reflectivity, //反射系数
		});
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.add(this.mesh);
	}
	initGUI() {
		this.$gui.add(this.globalEntity, 'refractionRatio', 0, 1, 0.01).onChange(e => {
			this.globalEntity.refractionRatio = e;
			(this.material as THREE.MeshPhongMaterial).refractionRatio = this.globalEntity.refractionRatio;
		});
		this.$gui.add(this.globalEntity, 'reflectivity', 0, 1, 0.01).onChange(e => {
			this.globalEntity.reflectivity = e;
			(this.material as THREE.MeshPhongMaterial).reflectivity = this.globalEntity.reflectivity;
		});
		this.$gui
			.add(this.globalEntity.env, 'mapping', [
				THREE.EquirectangularReflectionMapping,
				THREE.EquirectangularRefractionMapping,
			])
			.onChange(e => {
				(this.material as THREE.MeshPhongMaterial).needsUpdate = true;
			});
	}
}
