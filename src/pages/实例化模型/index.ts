import Main from '@/components/Main';
import { InstanceModel } from '@/plugin/InstanceModel';
import * as THREE from 'three';
export default class extends Main {
    drawCount: number;
    data: { position: { x: number, y: number, z: number; }; userData: { info: number; index: number; }; }[];
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
        this.drawCount = 10;
    }
    init() {
        this.createRenderer();
        this.createScene();
        this.createCamera({
            type: "PerspectiveCamera",
            position: new THREE.Vector3(0, 0, 10),
        });
        this.createLight(2);
        this.createControls();
        this.addSelfListenEvent();
        this.createDebug({ stats: true });
        this.onSceneCreated();
        this.render();
    }
    onSceneCreated() {
        this.initData();
        this.initInstanceMesh();
        this.initRayCater();
    }
    testInstancedMesh() {
        const geo = new THREE.BoxGeometry(10, 10, 10);
        const mat = new THREE.MeshStandardMaterial({ color: "#ff0000" });
        const mesh = new THREE.InstancedMesh(geo, mat, 10);
        const group = new THREE.Group();
        group.add(mesh);
        group.position.set(10, 0, 0);
        this.scene.add(group);
    }
    initInstanceMesh() {
        this.modelLoadByGLTF.loadAsync("model/草.glb").then(res => {
            const instance = new InstanceModel(res.scene, this.drawCount);
            for (let i = 0; i < this.drawCount; i++) {
                const matrix4 = new THREE.Matrix4();
                const position = this.data[i].position;
                matrix4.setPosition(new THREE.Vector3(position.x, position.y, position.z));
                instance.setMatrixAt(this.data[i].userData.index, matrix4);
            }
            Main.math.getMemory(this.scene, "normal");
            this.scene.add(instance.instance);
        });
    }
    initNormalModel() {
        this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
            res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
            this.scene.add(res.scene);
            this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                this.scene.add(res.scene);
                this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                    this.scene.add(res.scene);
                    res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);

                    this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                        res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                        this.scene.add(res.scene);
                        this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                            res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                            this.scene.add(res.scene);
                            this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                                res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                                this.scene.add(res.scene);
                                this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                                    res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                                    this.scene.add(res.scene);
                                    this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                                        res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                                        this.scene.add(res.scene);
                                        this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                                            res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                                            this.scene.add(res.scene);
                                            this.modelLoadByGLTF.loadAsync("model/car.glb").then(res => {
                                                res.scene.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 10);
                                                this.scene.add(res.scene);
                                                console.log(Main.math.getMemory(this.scene, "normal"));
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });









    }
    initRayCater() {
        this.addListener("pointerUp", (event, mousePos) => {
            const pointerUp = new THREE.Vector2();
            pointerUp.x = event.clientX;
            pointerUp.y = event.clientY;
            if (pointerUp.equals(mousePos)) {
                const objects = this.useRayCaster(pointerUp, true, this.scene.children, true);
                if (!objects[0]) return;
                // objects[0].object.setColorAt(objects[0].instanceId, new THREE.Color().setHex(Math.random() * 0xffffff));
                // objects[0].object.instanceColor.needsUpdate = true;
                console.log(this.data[objects[0].instanceId as number].userData.info, objects[0].instanceId as number);
            }
        });
    }
    initData() {
        this.data = new Array(this.drawCount).fill(0).map((item, index) => {
            return {
                position: { x: index * 60, y: 0, z: (index - 2) * 60 },
                userData: {
                    info: Math.random() * 100001,
                    index
                }
            };
        });

    }
}