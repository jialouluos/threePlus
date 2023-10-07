/*
 * @Author: haowen.li1
 * @Date: 2023-10-03 12:10:05
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-10-04 15:51:17
 * @Description:
 */
import Main from '@Main';
import * as THREE from 'three';
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.glsl';
export default class extends Main {
	constructor(el: string | HTMLElement, debug?: boolean) {
		super(el, debug);
	}
	init() {
		this.initNormal();
	}
	onSceneCreated() {
		this.material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				diffuse: {
					value: new THREE.Color('#ff0000'),
				},
			},
		});

		// this.material = new THREE.MeshBasicMaterial({ color: '#808080' });
		this.geometry = new THREE.BoxGeometry(10, 10, 10);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.add(this.mesh);
	}
}
