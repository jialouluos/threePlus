/*
 * @Author: haowen.li1
 * @Date: 2023-10-03 12:10:05
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-10-03 18:19:26
 * @Description:
 */
import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
	constructor(el: string | HTMLElement, debug?: boolean) {
		super(el, debug);
	}
	init() {
		this.initNormal();
	}
	onSceneCreated() {
		this.material = new THREE.ShaderMaterial({});
		this.geometry = new THREE.SphereGeometry(10, 32, 32);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.add(this.mesh);
	}
}
