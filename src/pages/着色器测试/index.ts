import Main from '@Main';
import * as THREE from 'three';
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.fs';
import Chart from '@/shaderObject/Chart';
import { LabelPool } from '../../util/_text/LabelPool';
import MyCanvas from '../../util/_canvas/index';
export default class extends Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.initNormal();
    }
    onSceneCreated(): void {
        this.createBaseMesh();
        this.createBar("hahaha哈哈");
    }
    createBaseMesh() {
        const texture = new THREE.TextureLoader();
        const text = texture.load('image/outdoor.jpg');
        const geo = new THREE.PlaneGeometry(10, 10);
       
        const mate = new THREE.MeshBasicMaterial({
            map: text
        });
        const mesh = new THREE.Mesh(geo, mate);
        this.scene.add(mesh);
    }

    createBar(text: string) {
        const atlasTexture = new THREE.DataTexture(
            new Uint8ClampedArray(),
            0,
            0,
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.LinearFilter,
            THREE.LinearFilter,
        );
        const labelPool = new LabelPool({ fontFamily: "'IBM Plex Mono'" });
        console.log('', labelPool.fontManager.atlasData);

        const label = labelPool.acquire();

        label.setText(text);
        this.scene.add(label);

        const data = new Uint8ClampedArray(labelPool.fontManager.atlasData.data.length * 4);
        for (let i = 0; i < labelPool.fontManager.atlasData.data.length; i++) {
            data[i * 4 + 0] = data[i * 4 + 1] = data[i * 4 + 2] = 1;
            data[i * 4 + 3] = labelPool.fontManager.atlasData.data[i]!;
        }
        atlasTexture.image = {
            colorSpace: "srgb",
            data,
            width: labelPool.fontManager.atlasData.width,
            height: labelPool.fontManager.atlasData.height,
        };
        atlasTexture.needsUpdate = true;
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                rotation: { value: 0.0 },
                uMap: { value: atlasTexture }
            }
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), this.material);
        mesh.position.set(10, 2.9, 2.5);
        this.scene.add(mesh);
    }
}