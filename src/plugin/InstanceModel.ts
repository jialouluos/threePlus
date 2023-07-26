/*
 * @Author: haowen.li1
 * @Date: 2023-07-25 13:57:41
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-07-26 20:53:21
 * @Description: 
 */

import { Group, InstancedMesh, Mesh } from "three";
import * as THREE from 'three';
//TODO 同index替换
export class InstanceModel {
    instanceGroup: InstancedMesh[];
    instanceCount: number;
    instance: THREE.Object3D;
    constructor(model: Group, instanceCount: number) {
        this.instanceGroup = [];
        this.instanceCount = instanceCount;
        this.traverse(model);
        this.instance = model
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