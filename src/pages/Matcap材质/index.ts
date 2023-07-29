import Main from '@Main';
import * as THREE from 'three';
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.fs';
export default class extends Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.initNormal();
    }
    onSceneCreated(): void {
        // this.initModel();
        const material = new THREE.MeshMatcapMaterial({
            matcap: new THREE.TextureLoader().load("textures/matcap/2.png")
        });
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        const sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
    }
    initModel() {
        this.modelLoadByGLTF.load('model/草.glb', (glb) => {
            this.scene.add(glb.scene);
            console.log(this.scene);
            this.scene.traverse((mesh) => {
                if (mesh instanceof THREE.Mesh) {
                    mesh.material = new THREE.MeshMatcapMaterial({
                        matcap: new THREE.TextureLoader().load("textures/matcap/1.png")
                    });
                }
            });
        });
    }
}