import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.createRenderer();
        this.createScene();
        this.createCamera({
            type: "PerspectiveCamera",
        });
        this.createLight(2);
        this.createControls();
        this.addListenEvent();
        this.createDebug({ stats: true });
        this.onSceneCreated();
        this.render();
    }
    onSceneCreated() {
        this.initModel();
    }
    createSphere(R: number, isTriangle: boolean): THREE.Vector3[] {
        const r = R / 2;
        const part = 32;
        const angle_part = 36;
        const pos: THREE.Vector3[][] = [];
        for (let i = 0; i <= part; i++) {
            const parcent = (2 * r * i) / part - r;
            const per_r = Math.sqrt(r * r - parcent * parcent);
            const pos2: THREE.Vector3[] = [];
            for (let j = 0; j <= angle_part; j++) {
                const rad = Main.math.deg2Rad(j * 360 / angle_part);
                const pos_x = per_r * Math.cos(rad);
                const pos_y = per_r * Math.sin(rad);
                const pos_z = parcent;
                pos2.push(new THREE.Vector3(pos_x, pos_y, pos_z));
            }
            pos.push(pos2);
        }
        //triangle pass
        if (!isTriangle) return pos.flat();
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= part; i++) {
            for (let j = 0; j <= angle_part; j++) {
                if (i > 1 && i !== part && j) {
                    points.push(pos[i][j - 1]);
                    points.push(pos[i - 1][j - 1]);
                    points.push(pos[i][j]);
                    points.push(pos[i][j]);
                    points.push(pos[i - 1][j - 1]);
                    points.push(pos[i - 1][j]);
                }
                if (i === 1 && j) {
                    points.push(pos[i][j - 1]);
                    points.push(pos[0][j - 1]);
                    points.push(pos[i][j]);
                }
                if (i === part && j) {
                    points.push(pos[i][j - 1]);
                    points.push(pos[i - 1][j - 1]);
                    points.push(pos[i - 1][j]);
                }
            }
        }
        return points;
    }
    initModel() {
        this.geometry = new THREE.BufferGeometry();
        const R = 100;
        const points = this.createSphere(R, false);
        const len = points.length;
        //一个字节8bit，4个字节32bit，我们采用Float32Buffer，则需要12个字节去储存坐标，颜色我们采用Uint8Buffer去存储，所以4个字节来储存顶点颜色的rgba值
        const arrayBuffer = new ArrayBuffer(len * 16);//创建原始原始二进制数据缓冲区
        const interleavedFloat32Buffer = new Float32Array(arrayBuffer);
        const interleavedUnint8buffer = new Uint8Array(arrayBuffer);
        for (let i = 0; i < len; i++) {
            interleavedFloat32Buffer[i * 4] = points[i].x;
            interleavedFloat32Buffer[i * 4 + 1] = points[i].y;
            interleavedFloat32Buffer[i * 4 + 2] = points[i].z;
            const r = i / len;
            const g = 0;
            const b = (len - i) / len;
            const a = 1.0;
            const j = (i * 4 + 3) * 4;
            interleavedUnint8buffer[j] = r * 255;
            interleavedUnint8buffer[j + 1] = g * 255;
            interleavedUnint8buffer[j + 2] = b * 255;
            interleavedUnint8buffer[j + 3] = a * 255;
        }
        //这里stride表示一个顶点包含几个数组元素，我们是4位一组(xyz + rgba)，8的就包含16位一组(xyz + rgba)
        const interleavedBuffer32 = new THREE.InterleavedBuffer(interleavedFloat32Buffer, 4);
        const interleavedBuffer8 = new THREE.InterleavedBuffer(interleavedUnint8buffer, 16);
        //这里stride表示每一个顶点需要占的位数大小，32的一共4位，他占了前面3位，并且从0字节处开始读取
        this.geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(interleavedBuffer32, 3, 0, false));
        //8的我们是16位，他占了前面最后4位(rgba)，并且从12字节处开始读取
        this.geometry.setAttribute('color', new THREE.InterleavedBufferAttribute(interleavedBuffer8, 4, 12, true));
        const geometry2 = new THREE.BufferGeometry().setFromPoints(points);
        this.material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            // color: "#ff0000"
        });
        console.log(this.geometry)
        this.scene.add(new THREE.Points(this.geometry, this.material));
    }

}