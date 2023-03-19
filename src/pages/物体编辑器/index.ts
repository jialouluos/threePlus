import Main from '@Main';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Chart from '@/shaderObject/Chart';
export default class extends Main {
    raycaster: THREE.Raycaster;
    transformControl: TransformControls;
    onDownPosition: THREE.Vector2;
    onUpPosition: THREE.Vector2;
    objects: THREE.Object3D[];
    plane: THREE.Line;
    objectCache: THREE.Object3D;
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
        this.raycaster = new THREE.Raycaster();
        this.onDownPosition = new THREE.Vector2();
        this.onUpPosition = new THREE.Vector2();
        this.objects = [];
    }
    init() {
        this.initNormal(new THREE.Vector3(0, 8, 10));
    }
    onSceneCreated(): void {
        this.initTransformControls();
        this.createDebugPanel();
        this.createBasePlane();
    }
    createBasePlane() {
        const chart = new Chart();
        this.plane = chart.createAxis(100, 100, {}).value as THREE.Line;
        // plane.rotation.x -= Math.PI / 2;
        this.scene.add(this.plane);
        const t_v = new THREE.Vector3(0, 0, 1).length();//计算出当前切线向量
        // this.objects.push(this.plane);
    }
    initTransformControls() {
        this.transformControl = new TransformControls(this.camera, this.renderer.domElement);

        // this.transformControl.setMode("rotate");
        // this.transformControl.setSpace("world");
        this.scene.add(this.transformControl as unknown as THREE.Object3D);
        this.transformControl.addEventListener('dragging-changed', (event) => {
            this.objectCache && console.log('objectCache.position', this.objectCache.position);
            this.getOrbitControls().enabled = !event.value;
        });
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    }
    onPointerDown = (event) => {
        // console.log("onPointerDown");

        this.onDownPosition.x = event.clientX;
        this.onDownPosition.y = event.clientY;
    };
    onPointerUp = (event) => {
        console.log("onPointerUp");
        this.onUpPosition.x = event.clientX;
        this.onUpPosition.y = event.clientY;
        const pointer = new THREE.Vector2();
        pointer.x = (event.offsetX / this.container.clientWidth) * 2 - 1;
        pointer.y = - (event.offsetY / this.container.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, false);
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object !== this.transformControl.object) {
                this.transformControl.attach(object);
                this.objectCache = object;
            }
        } else {
            if (this.onDownPosition.distanceTo(this.onUpPosition) === 0) {
                this.transformControl.detach();
            }
        }
    };
    addObjectEvent = (event: DragEvent) => {
        event.preventDefault();
        console.log(event);
        const type = event.dataTransfer.getData('3dData');
        const pointer = new THREE.Vector2();
        const rect = this.container.getBoundingClientRect();
        console.log('rect', rect);
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        console.log('x,y', x, y);
        console.log('offsetX,offsetY', event.offsetX, event.offsetY);
        pointer.x = (x / this.container.clientWidth) * 2 - 1;
        pointer.y = - (y / this.container.clientHeight) * 2 + 1;
        console.log('pointer', pointer);
        this.raycaster.setFromCamera(pointer, this.camera);
        const intersects = this.raycaster.intersectObjects([this.plane], false);
        const select = intersects[0].point;
        let instance: any = null;
        if (type === "Box") {
            //网格盒
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: "#ff0000"
            });
            instance = new THREE.Mesh(geometry, material);
        }
        else if (type === "Sphere") {
            //网格盒
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: "#ffff00"
            });
            instance = new THREE.Mesh(geometry, material);
        } else {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: "#ff00ff"
            });
            instance = new THREE.Mesh(geometry, material);
        }
        instance.position.copy(select);
        this.scene.add(instance);
        this.objects.push(instance);
    };
    handlerDrag = (e: DragEvent) => {
        console.log('e', e);
        e.dataTransfer.setData('3dData', (e.target as HTMLElement).textContent);
    };
    createDebugPanel() {
        this.renderer.domElement.addEventListener('dragenter', (e) => e.preventDefault());
        this.renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());
        this.renderer.domElement.addEventListener('drop', this.addObjectEvent);
        const dom = document.createElement("div");
        dom.style.width = "300px";
        dom.style.height = "200px";
        dom.style.background = "#ffffff";
        dom.style.position = "absolute";
        dom.style.bottom = "0px";
        const rootNode = document.getElementById("root");
        const childrenStr = /*html */`
        <ul style="text-align:center;list-style:none;margin:0px;padding:0;">
            <li style="background-color:#ff0ff0;margin:10px 0px;padding:0;cursor: pointer; user-select: none;" draggable="true">Box</li>
            <li style="background-color:#fffff0;margin:10px 0px;padding:0;cursor: pointer; user-select: none;" draggable="true">Plane</li>
            <li style="background-color:#000ff0;margin:10px 0px;padding:0;cursor: pointer; user-select: none;" draggable="true">Group</li>
            <li style="background-color:#00f0ff;margin:10px 0px;padding:0;cursor: pointer; user-select: none;" draggable="true">Sphere</li>
            <li style="background-color:#f00000;margin:10px 0px;padding:0;cursor: pointer; user-select: none;" draggable="true">NULL</li>
        </ul>
        `;
        dom.innerHTML = childrenStr;
        rootNode.style.position = "relative";
        rootNode.appendChild(dom);

        /**
         *  "drag": DragEvent;
            "dragend": DragEvent;
            "dragenter": DragEvent;
            "dragleave": DragEvent;
            "dragover": DragEvent;
            "dragstart": DragEvent;
            "drop": DragEvent;
            "durationchange": Event;
         */
        console.dir(dom.children[0]);
        for (const item of [...dom.children[0].children as any]) {
            item.addEventListener('dragstart', this.handlerDrag);
        }


    }
}