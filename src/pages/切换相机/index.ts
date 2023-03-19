// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable */
// @ts-nocheck

import * as THREE from "three";
import { BaseRenderer } from "../../BaseRenderer";
import { useCreateObject } from "../../threeHooks/useCreateObject";
import { useStore } from "@foxglove/studio-base/store";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { toJS } from 'mobx';
import { I_EntityParams } from '../../types';
type EntityType = "Vehicle" | "Pedestrian" | "MiscObjects";
/**
 * 负责管理场景中的Entity 生成 销毁 收集 并与store同步
 */
export class EntityManage {
    objectArray: THREE.Object3D[];
    objectGroup: THREE.Group;
    cacheObject: THREE.Object3D | null;
    cache_click: THREE.Object3D | null;
    constructor(store, renderer: BaseRenderer) {
        this.store = store;//全局总store
        this.renderer = renderer;//全局总render(BaseRenderer)
        this.assetsStore = store.assetsStore;//静态资产树
        this.entityObjects = this.store.sceneEditorStore.Entities ?? [];//用于储存加入场景中的object3D资产
        this.namespaceMap = new Map<EntityTyp, number>();
        this.cache_click = null;
        this.cacheObject = null;
        this.objectArray = [];
        this.objectGroup = new THREE.Group();
        this.cache_position = new THREE.Vector3();
        this.renderer.scene.add(this.objectGroup);
        this.addEgo();
    }
    //TODO 吸附似乎失效了！！！！
    isEmpty() {
        return this.entityObjects.children.length === 0;
    }
    isHaveAssets() {
        return !!this.assetsStore.assets;
    }
    getLength() {
        return this.entityObjects.children.length;
    }
    addEgo() {
        if (!this.isHaveAssets()) {
            //这里目的是为了等待静态资源树被加载完成
            setTimeout(() => {
                this.addEgo();
            }, 20);
            return;
        }
        /**创建一个entities的 type -> number */
        for (const value of this.assetsStore.assets[0].children) {
            this.namespaceMap.set(value.key, 0);
        }
        if (this.isEmpty() && this.isHaveAssets()) {
            //表明现在需要一辆EGO
            const ego = this.findEgo();
            if (!ego) return;
            this.createObject3DFromEntity(toJS(ego), "Ego");
        } else {
            this.createObject3DFromEntities();//从已有的Entities中读取数据生成场景Object3D
        }
    }
    /**用于从静态资产树中找到car*/
    findEgo() {
        if (!this.isHaveAssets()) return null;
        return this.assetsStore.assets[0].children.filter(item => {
            return item.key === "Vehicle";
        })[0].children.filter(item => {
            return item.title === "car";
        })[0].data;
    }
    /*通过拖拽来创建物体**/
    createObjectFromDrop(entity: I_EntityParams, point: { x: number; y: number; }) {
        var rect = this.renderer.renderer.domElement.getBoundingClientRect();
        const intersects = this.renderer.useRayCaster(
            new THREE.Vector2(point.x - rect.left, point.y - rect.top),
            [this.renderer.plane],
            true,
            false,
        );
        if (!intersects || intersects.length === 0) {
            return;
        }
        this.createObject3DFromEntity(entity, this.namespaceMap.get(entity.category), intersects[0].point);
    }
    /**创建单个entity */
    createObject3DFromEntity(entity: I_EntityParams, name?: string, pos: THREE.Vector3) {
        const children = entity.component.init.children;
        const { x, y, z } = children;
        const position = pos ?? new THREE.Vector3(x.default_value, y.default_value, z.default_value);
        const traControls = this.renderer.hookMap.get("traControls");
        useCreateObject(entity, position, name ?? this.objectArray.length, (instance) => {
            this.objectGroup.add(instance);//添加到场景中
            this.objectArray.push(instance);//添加到can Pick 集中
            traControls.attachObject(instance);//链接控制器
            this.setCacheObject(instance);//记录当前链接对象
            this.namespaceMap.set(entity.category as EntityType, this.namespaceMap.get(entity.category as EntityType) + 1);//计数++
        });
    }
    /**创建多个entity */
    createObject3DFromEntities(entities: I_EntityParams[]) {
        for (const value of toJS(this.store.sceneEditorStore.Entities.children)) {
            this.createObject3DFromEntity(value, value.name);
        }
    }
    setCacheObject(object: THREE.Object3D | null) {
        this.cacheObject = object;
        this.updateStore();
    }
    findObjectByName(uuid: string) {
        const object = this.objectArray.filter((item) => {
            return item.name === uuid;
        })[0];
        const traControls = this.renderer.hookMap.get("traControls");
        traControls.attachObject(object);//链接控制器
        this.setCacheObject(object);//记录当前链接对象
    }
    deleteObject3D(uuid: string) {
        //找到delete target
        const traControls = this.renderer.hookMap.get("traControls");
        const deleteObject = this.objectArray.filter((item) => {
            return item.name === uuid;
        })[0];
        //控制器解绑
        traControls.detachObject();
        //从场景中移除并释放其内存
        const trackGroup = new THREE.Group();
        trackGroup.add(deleteObject);
        BaseRenderer.track.track(trackGroup); //捕获
        BaseRenderer.track.disTrackByGroup(trackGroup); //释放
        //从objectArray集中移除
        this.objectArray = this.objectArray.filter((item) => {
            return item.name !== deleteObject.name;
        });
        //记录的连接对象置null
        this.setCacheObject(null);
    }
    /**从3d场景获取数据并更新到store上 */
    updateStore() {
        this.updateUserData();
        this.store.sceneStore.setUserData(this.cacheObject ? this.cacheObject.userData : null);
        this.store.sceneStore.setSelectObjectName(this.cacheObject ? this.cacheObject.userData.name : "");
        this.store.sceneEditorStore.setEntitiesObject(
            this.objectArray.map((item) => item.userData),
        );
    }
    /**从store上获取数据更新到3d场景中 */
    update3DScene(object) {
        const userData = object.userData;
        const { name: objectName, component: objectDrawInfo } = userData;
        if (objectDrawInfo.init && objectDrawInfo.init["children"]) {
            const { heading, pitch, roll, x, y, z } = objectDrawInfo.init["children"];
            object.position.copy(new THREE.Vector3(x.default_value, y.default_value, z.default_value));
            object.rotation.copy(
                new THREE.Euler(pitch.default_value, roll.default_value, heading.default_value),
            );
        }
        object.name = objectName; //更新name

        this.dealAttachLine(object);
        this.findObjectByName(object.name);
    }
    getCenterLine = () => {
        this.centerLine = this.renderer.hookMap.get("hdMap") && this.renderer.hookMap.get("hdMap")?.value?.children.filter((item) => {
            return item.properties.type === "lane";
        });
    };
    getRayCaster(object: THREE.Object3D) {
        const centerCoord = object.position.clone();//获取当前物体位置
        const dir = centerCoord.clone().sub(this.cache_position).clone();  //创建一个向量
        const raycaster = new THREE.Raycaster(centerCoord, dir.normalize());
        const intersects = raycaster.intersectObjects(this.centerLine);
        if (intersects.length > 0) { // 判断参数[boxMesh]中模型对象是否与射线相交
            console.log('当前检测🍌', intersects[0]?.object);
            object.position.copy(intersects[0].pointOnLine);//吸附
            const s = intersects[0].faceIndex;
            const preUserData = object.userData;
            const prePoint = s ? new THREE.Vector3(intersects[0]?.object.points[s].x, intersects[0]?.object.points[s].y, 0) : new THREE.Vector3(intersects[0]?.object.points[1].x, intersects[0]?.object.points[1].y, 0);
            const nextPoint = s ? new THREE.Vector3(intersects[0]?.object.points[s - 1].x, intersects[0]?.object.points[s - 1].y, 0) : new THREE.Vector3(intersects[0]?.object.points[0].x, intersects[0]?.object.points[0].y, 0);
            const tangent = s ? prePoint.sub(nextPoint) : intersects[0]?.object.points[1].sub(intersects[0]?.object.points[0]).normalize();//计算出当前切线向量
            let angle = tangent.angleTo(new THREE.Vector3(0, 1, 0));
            if (Math.cos(angle) > 0) {
                angle = Math.PI - angle;
            }
            object.rotation.z = angle;
            if (preUserData["component"]["init"]) {
                const initInfo = preUserData["component"]["init"]["children"];;
                initInfo["lane"].default_value = intersects[0]?.object.properties.id;//通信传值
                if (s) {
                    initInfo["s"].default_value = s;//通信传值
                }
                initInfo["t"].default_value = 0;
            }
            intersects[0].object.material.color = { r: 0, g: 0, b: 1 };
            if (this.cache_click) {
                this.cache_click.material.color = new THREE.Color(this.cache_click.cache_color);
            }//颜色复原
            this.cache_click = intersects[0].object;
        }

        console.log("当前缓存坐标", this.cache_position);
    }
    /**用于处理pick line */
    dealAttachLine = (object) => {
        const userData = object.userData;
        const initInfo = userData.component?.init?.children;
        const lane_id = initInfo?.lane?.default_value ?? "";
        const t = initInfo?.t?.default_value ?? 0;//车道坐标系下的垂直于z与s平面的t方向的偏移量
        const s = Math.floor(initInfo?.s?.default_value ?? 0);//车道坐标系下的s方向(0~points.length)
        if (!!lane_id) {
            //  此处继续计算offset
            const pickLine = this.renderer.hookMap.get("hdMap").value.children.filter(item => {
                return lane_id == item.properties.id;
            })[0];
            if (pickLine) {
                pickLine.material.color = { r: 0, g: 0, b: 1 };
                if (this.cache_click) {
                    if (this.cache_click.object) {
                        this.cache_click.material.color = new THREE.Color(this.cache_click.cache_color);
                    }
                    this.cache_click = pickLine;
                    object.position.copy(pickLine.points[s]);
                    if (t !== 0) { //加上offset偏移量
                        //TODO 二期加上插值计算点坐标
                        const tangent = s ? pickLine.points[s].sub(pickLine.points[s - 1]) : pickLine.points[1].sub(pickLine.points[0]);//计算出当前切线向量
                        // 声明一个向量对象，用来保存.crossVectors()方法结果
                        const z_offset = new Vector3(0, 0, 1).cross(tangent).normalize().multiplyScalar(t);//t * 当前点基于z轴上的法向偏移量的各方向分量
                        object.position.add(z_offset);
                    }
                }

            }
        }
    };
    /**用于处理外部表单传入进来的数据--同步到3D场景 */
    handlerEntity = (data: any) => {
        if (!this.cacheObject || !data) return;
        const { selectObjectName, userData, currentObjectNeedDelete, traMode } = data;
        if (!selectObjectName || !userData) return;
        if (currentObjectNeedDelete) {
            this.store.sceneStore.setCurrentObjectNeedDelete(false); //删除完记得将这个值重新置为false
            this.deleteObject3D(selectObjectName);
            return;
        }
        const object = this.objectArray.filter((item) => {
            return item.name === selectObjectName;
        })[0];
        object.userData = userData;
        this.update3DScene(object);
        if (traMode) {
            this.value.setMode(traMode);
            this.store.sceneStore.setMode(""); //更改完记得将这个值重新置为""
        }
    };
    /**更新当前链接对象的userData */
    updateUserData() {
        if (!this.cacheObject) return;
        const userData = this.cacheObject.userData;
        const euler = this.cacheObject.rotation;
        if (userData["component"]["init"]) {
            const initInfo = userData["component"]["init"]["children"];
            initInfo["pitch"].default_value = euler.x;
            initInfo["roll"].default_value = euler.y;
            initInfo["heading"].default_value = euler.z;
            initInfo["x"].default_value = this.cacheObject.position.x;
            initInfo["y"].default_value = this.cacheObject.position.y;
            initInfo["z"].default_value = this.cacheObject.position.z;
        }
        if (userData["component"]["basic"]) {
            const initInfo = userData["component"]["basic"]["children"];
            initInfo["name"].default_value = this.cacheObject.name;
        }
        userData.name = this.cacheObject.name;
    }
    dispose() {
        this.namespaceMap = new Map<EntityTyp, number>();
        this.cacheObject = null;
        this.objectArray = [];
        this.objectGroup = new THREE.Group();
        this.store.sceneEditorStore.setEntitiesObject([]);
    }
}

