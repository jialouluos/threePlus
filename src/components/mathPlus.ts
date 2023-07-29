import * as THREE from 'three';
export default class mathPlus {
    private static instance: mathPlus;
    private static _time: number;
    constructor() {
        mathPlus._time = 0.0;
        if (mathPlus.instance) {
            return mathPlus.instance;
        } else {
            mathPlus.instance = this;
        }
    }
    update(time: number) {
        mathPlus._time = time;
    }
    /**获取el的宽高比 */
    getAspect = (el: HTMLElement): number => el.clientWidth / el.clientHeight;
    /**获取鼠标点击的屏幕系坐标 */
    getNormalizedMousePos = (e: MouseEvent | Touch): { x: number, y: number; } => ({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
    });
    /**弧度转角度 */
    rad2Deg = (rad: number): number => rad * 180 / Math.PI;
    /**角度转弧度 */
    deg2Rad = (deg: number): number => deg * Math.PI / 180;
    /**获取时间 */
    getTime = (timeScale: number = 1.0) => ({
        get value() {
            return mathPlus._time * timeScale;
        }
    });
    /**获取0~1的时间 */
    getFractTime = (timeScale: number = 1.0) => ({
        get value() {
            return mathPlus._time * timeScale - Math.floor(mathPlus._time * timeScale);
        }
    });
    /**获取lowRange\~highRange\~lowRange的时间 */
    getSymmetricalTime = (lowRange: number, highRange: number, timeScale: number = 1.0) => ({
        get value() {
            return (((0.5 - Math.abs((mathPlus._time * timeScale - Math.floor(mathPlus._time * timeScale) - 0.5))) * 2.0) * (highRange - lowRange) + lowRange);
        }
    });
    /**从矩阵中获取缩放信息-列主序(0,1,2,3为第一列) */
    getScaleInfoFormMatrix(matrix: THREE.Matrix4): THREE.Vector3 {
        // const x = new THREE.Vector3(matrix.elements[0], matrix.elements[4], matrix.elements[8]).length();
        // const y = new THREE.Vector3(matrix.elements[1], matrix.elements[5], matrix.elements[9]).length();
        // const z = new THREE.Vector3(matrix.elements[2], matrix.elements[6], matrix.elements[10]).length();
        return new THREE.Vector3().setFromMatrixScale(matrix);
    }
    /**从矩阵中获取旋转信息-列主序(0,1,2,3为第一列) */
    getRotateInfoFormMatrix(matrix: THREE.Matrix4) {
        const { x, y, z } = this.getScaleInfoFormMatrix(matrix);
        const scaleMatrix = new THREE.Matrix4().makeScale(x, y, z).invert();
        return matrix.clone().multiply(scaleMatrix);
    }
    rotateAxis(v: THREE.Vector3, axis: THREE.Vector3, θ: number) {
        //cos(θ)v + (1 − cos(θ)) (u · v) u + sin(θ)(u × v)
        const u = axis.clone().normalize();
        const v1 = v.clone().multiplyScalar(Math.cos(θ));
        const v2 = (u.clone().multiply(v.clone())).multiply(u.clone()).multiplyScalar((1 - Math.cos(θ)));
        const v3 = u.clone().cross(v.clone()).multiplyScalar(Math.sin(θ));
        return v1.add(v2).add(v3);
    }
    rotateAxis2(self: THREE.Quaternion, axis: THREE.Vector3, θ: number) {
        //𝑣′ = 𝑞𝑣𝑞∗ = 𝑞𝑣𝑞^−1
        const halfAngle = θ / 2;
        const sin = Math.sin(halfAngle);
        const q = new THREE.Quaternion(sin * axis.x, sin * axis.y, sin * axis.z, Math.cos(halfAngle));

    }
    multiplyQuaternions(a: THREE.Quaternion, b: THREE.Quaternion) {
        //对任意四元数 𝑞1 = [𝑠, v], 𝑞2 = [𝑡, u]，𝑞1𝑞2 的结果是
        // 𝑞1𝑞2 = [𝑠𝑡 − v · u, 𝑠u + 𝑡v + v × u];
        const v = new THREE.Vector3(a.x, a.y, a.z);
        const u = new THREE.Vector3(b.x, b.y, b.z);
        const w = a.w * b.w - v.clone().dot(u.clone());
        const v1 = u.clone().multiplyScalar(a.w);
        const v2 = v.clone().multiplyScalar(b.w);
        const v3 = v.clone().cross(u.clone());
        const v4 = v1.add(v2).add(v3);
        return new THREE.Quaternion(v4.x, v4.y, v4.z, w);
    }
    invertQuaternions(a: THREE.Quaternion) {
        //四元数的共轭复数，实部相同，虚部相反，可以利用共轭去求得四元数的逆
        const _a = a.clone();//_a 表示a的共轭复数
        _a.x *= -1;
        _a.y *= -1;
        _a.z *= -1;
        const qq = this.multiplyQuaternions(a.clone(), _a.clone());//𝑞∗𝑞  虚部全为0，实部为平方
        //（𝑞∗𝑞 = ∥𝑞∥^2）
        /**
         * 𝑞^−1 =𝑞∗ / ∥𝑞∥^ 2
         */
        return new THREE.Quaternion(_a.x / qq.w, _a.y / qq.w, _a.z / qq.w, _a.w / qq.w);
    }
    getGeometryByteLength = (geometry: THREE.BufferGeometry) => {

        let total = 0;

        if (geometry.index) total += geometry.index.array.byteLength;

        for (const name in geometry.attributes) {

            total += geometry.attributes[name].array.byteLength;

        }

        return total;

    };
    formatBytes = (bytes: number, decimals: number) => {

        if (bytes === 0) return '0 bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['bytes', 'KB', 'MB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

    };
    getMemory(object: THREE.Object3D, type: "instanced" | "normal"): string;
    getMemory(object: THREE.Object3D, type: "instanced" | "normal", instancedCount: number): string;
    getMemory(object: THREE.Object3D, type: "instanced" | "normal", instancedCount?: number): string {
        let memory = 0;

        object.traverse((obj) => {

            if (obj.geometry) {
                memory += this.getGeometryByteLength(obj.geometry);
            }

        });
        return this.formatBytes(type === "instanced" ? instancedCount * 16 + memory : memory, 2);
    }

}
// let x = e.clientX;
// let y = e.clientY;
// let rect = e.target.getBoundingClientRect();
// let pointx = ((x - rect.left) - 512) / 512;
// let pointy = (350 - (y - rect.top)) / 350;