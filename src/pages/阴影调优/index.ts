/*
 * @Author: haowen.li1
 * @Date: 2023-09-29 11:16:36
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-09-29 16:07:56
 * @Description:
 */
import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
	constructor(el: string | HTMLElement, debug?: boolean) {
		super(el, debug);
	}
	init() {
		this.createRenderer({
			setting: {
				shadowMap: {
					enabled: true,
				},
			},
		});
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
		this.lightGroups.children.forEach((light: THREE.AmbientLight | THREE.DirectionalLight) => {
			if (light instanceof THREE.DirectionalLight) {
				light.castShadow = true;
				//相机用于表示在光源的位置看场景，如果物体在其他物体的背后(即遮挡)，则表示其处于阴影中，参数表示相机的可视范围
				//这里可视范围并不是越大越好，因为投射产生的阴影也是有纹理的，这些阴影的纹理也是有单位大小的。如果阴影相机的可视范围越大，就意味着它能投射的区域也变得很大，就意味着投射的阴影会越来越块状。(单位大小内取样越少)
				light.shadow.camera.top = 20;
				light.shadow.camera.bottom = -20;
				light.shadow.camera.left = -20;
				light.shadow.camera.right = 20;
				light.shadow.camera.near = 500;
				light.shadow.camera.far = 600;
				light.shadow.bias = 0.0001; //阴影贴图偏差，在确定曲面是否在阴影中时，从标准化深度添加或减去多少。默认值为0.此处非常小的调整（大约0.0001）可能有助于减少阴影中的伪影
				light.shadow.mapSize.width = Math.pow(2, 15); //阴影贴图大小，为2的幂次，越大的值会以计算时间为代价提供更好的阴影质量
				light.shadow.mapSize.height = Math.pow(2, 15); //阴影贴图大小，为2的幂次，越大的值会以计算时间为代价提供更好的阴影质量
				const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
				const helper = new THREE.DirectionalLightHelper(light);
				this.scene.add(cameraHelper);
				this.scene.add(helper);
			}
		});
		this.initMesh();
		this.initPlane();
		this.initModel();

		console.log(this);
	}
	initPlane() {
		const geometry = new THREE.PlaneGeometry(100, 100);
		const material = new THREE.MeshStandardMaterial({
			color: '#808080',
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.rotation.x -= Math.PI / 2;
		mesh.receiveShadow = true;
		this.scene.add(mesh);
	}
	initModel() {
		this.modelLoadByGLTF.loadAsync('model/EC7.glb').then(({ scene }) => {
			this.scene.add(scene);
			scene.traverse(item => {
				if (item instanceof THREE.Mesh) {
					item.castShadow = true;
					item.receiveShadow = true;
				}
			});
		});
	}
	initMesh() {
		const geometry = new THREE.BoxGeometry(1, 20, 5);
		const material = new THREE.MeshPhysicalMaterial({ color: '#ff00f0' });

		const mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.set(0, 0, 20);
		this.scene.add(mesh);
	}
}
