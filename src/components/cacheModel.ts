import * as THREE from 'three';
interface SinglePreview {
    h: number;
    id: number;
    model_id: number;
    name: string;
    obj_category: InstanceType;
    obj_type: Object3DType;
    speed: number;
    x: number;
    y: number;
}
enum Object3DType {
    TYPE_NONE = 0,
    VEHICLE = 1,
    PEDESTRIAN = 2,
    MISC_OBJECT = 3,
    N_OBJECT_TYPES = 5
}
enum InstanceType {
    CAR = 0,
    VAM = 1,
    TRUCK = 2,
    SEMITRAILER = 3,
    TRAILER = 4,
    BUS = 5,
    MOTORBIKE = 6,
    BICYCLE = 7,
    TRAIN = 8,
    TRAM = 9
}
interface I_geometryInfo {
    width: number;
    height: number;
    depth: number;
}
interface I_meshInfo {
    position: THREE.Vector3;
    rotation: THREE.Euler;
}
const createEditorObject = (entity: any) => {
    //TODO 提取其中的drawInfo

    //TODO 调用createObject
};
const createPreviewObject = (data: SinglePreview, entity: any): THREE.Object3D => {
    //TODO use createObject
    return new THREE.Object3D();
};
const createObject = (geometryInfo: I_geometryInfo, materialInfo: THREE.MeshStandardMaterial, meshInfo: I_meshInfo, name: string): THREE.Object3D => {
    const geometry = new THREE.BoxGeometry(geometryInfo.width, geometryInfo.height, geometryInfo.depth);
    const material = new THREE.MeshStandardMaterial({
        ...materialInfo
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(meshInfo.position);
    mesh.rotation.copy(meshInfo.rotation);
    mesh.name = name;
    return mesh;
};
const updateObject = (data: SinglePreview, object: THREE.Object3D): THREE.Object3D => {
    const { h, x, y } = data;
    const euler = new THREE.Euler(0, 0, h - Math.PI / 2);
    const position = new THREE.Vector3(x, y, 0);
    object.position.copy(position);
    object.rotation.copy(euler);
    return object;
};
class CacheModel {
    static instance: CacheModel;
    private _cachePool: Map<string, THREE.Object3D & { userData: SinglePreview; }>;
    constructor() {
        if (CacheModel.instance) {
            return CacheModel.instance;
        } else {
            CacheModel.instance = this;
        }
        this._cachePool = new Map();
    }
    /**
     * @获取一个缓存的key值 通过该key值来判断是否存在缓存
     */
    private _getKey({ name, obj_category, obj_type }: SinglePreview): `${SinglePreview['name']}-${SinglePreview['obj_category']}-${SinglePreview['obj_type']}` {
        return `${name}-${obj_category}-${obj_type}`;
    }
    /**用于同一处理model的创建和更新 */
    public acquire(data: SinglePreview, entity: any): THREE.Object3D {
        //第一步判断是否存在缓存
        const key = this._getKey(data);
        if (this._cachePool.has(key)) {
            //存在该key的缓存
            const cacheObject = this._cachePool.get(key);
            updateObject(data, cacheObject);
            cacheObject.userData = data;
            this._cachePool.set(key, cacheObject);
            return cacheObject;
        } else {
            //不存在该key的缓存
            const cacheObject = createPreviewObject(data, entity);
            cacheObject.userData = data;
            this._cachePool.set(key, cacheObject as THREE.Object3D & { userData: SinglePreview; });
            return cacheObject;
        }
    }
    public recycle(object: THREE.Object3D & { userData: SinglePreview; }) {
        const key = this._getKey(object.userData);
        this._cachePool.delete(key);
        //TODO use Track
    }
}