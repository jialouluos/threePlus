/*
 * @Author: haowen.li1
 * @Date: 2023-09-29 16:26:18
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-09-29 16:41:55
 * @Description:
 */
import Main from '@/components/Main';
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
			position: new THREE.Vector3(0, 20, 40),
		});
		this.createLight(1);
		this.createControls();
		this.addSelfListenEvent();
		this.createDebug({ stats: true });
		this.onSceneCreated();
		this.render();
	}
	onSceneCreated() {
		this.initMesh();
	}
	initMesh() {
		const geometry = new THREE.BoxGeometry(10, 10, 10, 10, 10);
		const material = new THREE.MeshStandardMaterial({ color: '#ffffff' });
		this.mesh = new THREE.Mesh(geometry, material);
		this.scene.add(this.mesh);
	}
	onSceneBeforeUpdate() {
        this.mesh.geometry.dispose();
		this.mesh.geometry = new THREE.BoxGeometry(10 * Math.random(), 10, 10, 100, 100);
		// console.log(this.mesh);
	}
}
