# Raycast

```js
class Raycaster {
    constructor(origin, direction, near = 0, far = Infinity) {
        this.ray = new Ray(origin, direction);
        // 假设方向是标准化的（用于精确的距离计算）
        this.near = near;
        this.far = far;
        this.camera = null;
        this.layers = new Layers();//层次
        this.params = {
            Mesh: {},
            Line: {threshold: 1},
            LOD: {},
            Points: {threshold: 1},
            Sprite: {}
        };
    }
    set(origin, direction) {
        this.ray.set(origin, direction);
    }
    setFromCamera(coords, camera) {
        if (camera && camera.isPerspectiveCamera) {//透视矩阵
            this.ray.origin.setFromMatrixPosition(camera.matrixWorld);//提取坐标数据作为自身射线的起点
            //将自身射线的方向设置为图像坐标系下的坐标值，并将这个值从相机坐标系转换到世界坐标系(具体方法为右乘透视矩阵逆矩阵，并右乘相机的模型矩阵，再求该点与起点的方向方向，最后归一化)
            this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
            this.camera = camera;
        } else if (camera && camera.isOrthographicCamera) {
            this.ray.origin.set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far)).unproject(camera); // set origin in plane of camera
            this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
            this.camera = camera;
        } else {
            console.error('THREE.Raycaster: Unsupported camera type: ' + camera.type);
        }
    }
    intersectObject(object, recursive = false, intersects = []) {
        intersectObject(object, this, intersects, recursive);、//该函数不是该类中方法，调用的是下面拓展的函数
        intersects.sort(ascSort);
        return intersects;
    }
    intersectObjects(objects, recursive = false, intersects = []) {
        for (let i = 0, l = objects.length; i < l; i++) {
            intersectObject(objects[i], this, intersects, recursive);
        }
        intersects.sort(ascSort);
        return intersects;
    }
}
//拓展
function intersectObject(object, raycaster, intersects, recursive) {
    if (object.layers.test(raycaster.layers)) {
        object.raycast(raycaster, intersects);//各类中分别重写了该方法
    }
    if (recursive === true) {//递归遍历
        const children = object.children;
        for (let i = 0, l = children.length; i < l; i++) {
            intersectObject(children[i], raycaster, intersects, true);
        }
    }
}
//Mesh.raycast()
raycast(raycaster, intersects) {
        const geometry = this.geometry;
        const material = this.material;
        const matrixWorld = this.matrixWorld;
        if (material === undefined) return;
        // 检查边界球到光线的距离,进行初次的判断
        if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
        _sphere$3.copy(geometry.boundingSphere);
        _sphere$3.applyMatrix4(matrixWorld);
        if (raycaster.ray.intersectsSphere(_sphere$3) === false) return;
        _inverseMatrix$2.copy(matrixWorld).invert();
        _ray$2.copy(raycaster.ray).applyMatrix4(_inverseMatrix$2);
        // 再继续之前，先检查boundingBox
        if (geometry.boundingBox !== null) {
            if (_ray$2.intersectsBox(geometry.boundingBox) === false) return;
        }
        let intersection;
        if (geometry.isBufferGeometry) {
            const index = geometry.index;
            const position = geometry.attributes.position;
            const morphPosition = geometry.morphAttributes.position;
            const morphTargetsRelative = geometry.morphTargetsRelative;
            const uv = geometry.attributes.uv;
            const uv2 = geometry.attributes.uv2;
            const groups = geometry.groups;
            const drawRange = geometry.drawRange;
            if (index !== null) {

                // indexed buffer geometry

                if (Array.isArray(material)) {

                    for (let i = 0, il = groups.length; i < il; i++) {

                        const group = groups[i];
                        const groupMaterial = material[group.materialIndex];

                        const start = Math.max(group.start, drawRange.start);
                        const end = Math.min((group.start + group.count), (drawRange.start + drawRange.count));

                        for (let j = start, jl = end; j < jl; j += 3) {

                            const a = index.getX(j);
                            const b = index.getX(j + 1);
                            const c = index.getX(j + 2);

                            intersection = checkBufferGeometryIntersection(this, groupMaterial, raycaster, _ray$2, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);

                            if (intersection) {

                                intersection.faceIndex = Math.floor(j / 3); // triangle number in indexed buffer semantics
                                intersection.face.materialIndex = group.materialIndex;
                                intersects.push(intersection);

                            }

                        }

                    }

                } else {

                    const start = Math.max(0, drawRange.start);
                    const end = Math.min(index.count, (drawRange.start + drawRange.count));

                    for (let i = start, il = end; i < il; i += 3) {

                        const a = index.getX(i);
                        const b = index.getX(i + 1);
                        const c = index.getX(i + 2);

                        intersection = checkBufferGeometryIntersection(this, material, raycaster, _ray$2, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);

                        if (intersection) {

                            intersection.faceIndex = Math.floor(i / 3); // triangle number in indexed buffer semantics
                            intersects.push(intersection);

                        }

                    }

                }

            } else if (position !== undefined) {

                // non-indexed buffer geometry

                if (Array.isArray(material)) {

                    for (let i = 0, il = groups.length; i < il; i++) {

                        const group = groups[i];
                        const groupMaterial = material[group.materialIndex];

                        const start = Math.max(group.start, drawRange.start);
                        const end = Math.min((group.start + group.count), (drawRange.start + drawRange.count));

                        for (let j = start, jl = end; j < jl; j += 3) {

                            const a = j;
                            const b = j + 1;
                            const c = j + 2;

                            intersection = checkBufferGeometryIntersection(this, groupMaterial, raycaster, _ray$2, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);

                            if (intersection) {

                                intersection.faceIndex = Math.floor(j / 3); // triangle number in non-indexed buffer semantics
                                intersection.face.materialIndex = group.materialIndex;
                                intersects.push(intersection);

                            }

                        }

                    }

                } else {

                    const start = Math.max(0, drawRange.start);
                    const end = Math.min(position.count, (drawRange.start + drawRange.count));

                    for (let i = start, il = end; i < il; i += 3) {

                        const a = i;
                        const b = i + 1;
                        const c = i + 2;

                        intersection = checkBufferGeometryIntersection(this, material, raycaster, _ray$2, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);

                        if (intersection) {

                            intersection.faceIndex = Math.floor(i / 3); // triangle number in non-indexed buffer semantics
                            intersects.push(intersection);

                        }

                    }

                }

            }

        } else if (geometry.isGeometry) {

            console.error('THREE.Mesh.raycast() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.');

        }

    }

```

