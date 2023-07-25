import { Matrix4 } from "@/util/_webgl/cuon-matrix";
import { Group, InstancedMesh, Mesh } from "three";
import * as THREE from 'three';
//TODO 同index替换
export class InstanceModel {
    instanceGroup: InstancedMesh[];
    instanceCount: number;
    constructor(model: Group, instanceCount: number) {
        this.instanceGroup = [];
        this.instanceCount = instanceCount;
        this.traverse(model);
        // model.traverse(item => {
        //     if (item instanceof THREE.Mesh) {
        //         const instance = new InstancedMesh(item.geometry, item.material, instanceCount);
        //         this.instanceGroup.attach(instance);
        //     }
        // });
    }
    setMatrixAt(index, matrixArray: THREE.Matrix4[] | THREE.Matrix4) {
        for (let i = 0, len = this.instanceGroup.length; i < len; i++) {
            if (Array.isArray(matrixArray)) {
                const matrix = matrixArray[i];
                (this.instanceGroup[i] as InstancedMesh).setMatrixAt(index, matrix);
            } else {
                (this.instanceGroup[i] as InstancedMesh).setMatrixAt(index, matrixArray);
            }
        }
    }
    getMatrixAt(index: number, matrixArray: THREE.Matrix4[]) {
        for (let i = 0, len = this.instanceGroup.length; i < len; i++) {
            const matrix = new THREE.Matrix4();
            (this.instanceGroup[i] as InstancedMesh).getMatrixAt(index, matrix);
            matrixArray.push(matrix);
        }
    }
    traverse(model: THREE.Object3D) {
        if (!model.children || !model.children.length) return;
        for (let i = 0, len = model.children.length; i < len; i++) {
            const object = model.children[i] as Mesh;
            if (object.geometry) {
                model.children[i] = new InstancedMesh(object.geometry, object.material, this.instanceCount);
                this.instanceGroup.push(model.children[i] as InstancedMesh);
                if (object.children && object.children.length) {
                    model.children[i].children = object.children;
                }
            }
            this.traverse(object);
        }
        model.matrixWorldNeedsUpdate = true;
    }
}