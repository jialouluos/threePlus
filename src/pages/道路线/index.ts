import Main from '@Main';
import * as THREE from 'three';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Object3D } from 'three';
export default class extends Main {
    lineArray: Line2[];
    cacheLine: Object3D | null;
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
        this.lineArray = [];
        this.cacheLine = null;
    }
    init() {
        this.initNormal(new THREE.Vector3(0, 80, 10));
        this.createMesh();
        this.initGui();
    }
    onSceneCreated(): void {
        this.createLineGeometry(this.curvePass(this.initPoints(-10)[0]), 1, true, new THREE.Vector3(0, 0, 0));
        this.createLineGeometry(this.curvePass(this.initPoints(-5)[0]), 1, true, new THREE.Vector3(0, 0, 0));
        this.createLineGeometry(this.curvePass(this.initPoints(0)[0]), 1, true, new THREE.Vector3(0, 0, 0));
        this.createLineGeometry(this.curvePass(this.initPoints(5)[0]), 1, true, new THREE.Vector3(0, 0, 0));
        this.createLineGeometry(this.curvePass(this.initPoints(10)[0]), 3.0, true, new THREE.Vector3(0, 0, 0));
        this.createLineGeometry(this.curvePass(this.initPoints(15)[0]), 3.0, true, new THREE.Vector3(0, 0, 0));
        this.addEvent();
    }
    initPoints(x): [THREE.Vector3[], number[]] {
        const V3Points: THREE.Vector3[] = [];
        const NumberPoints: number[] = [];
        for (let i = 0; i < 100; i++) {
            V3Points.push(new THREE.Vector3(x, -i * 2, 0));
            NumberPoints.push(x, -i * 2, 0);

        }

        return [V3Points, NumberPoints];
    }
    initColors(): number[] {
        const colors: number[] = [];
        for (let i = 0; i < 100; i++) {
            colors.push(i / 100, 0.5, 0);
        }

        return colors;
    }
    createLineGeometry(points: [number[], THREE.CatmullRomCurve3], linewidth: number, worldUnits: boolean, position: THREE.Vector3) {
        const matLine = new LineMaterial({
            color: 0xffffff,
            linewidth, // in world units with size attenuation, pixels otherwise
            worldUnits,
            vertexColors: true,
            resolution: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            //resolution:  // to be set by renderer, eventually
            alphaToCoverage: true,

            dashed: true
        });
        const geometry = new LineGeometry();
        geometry.setPositions(points[0]);
        geometry.setColors(this.initColors());
        const line = new Line2(geometry, matLine);
        line.computeLineDistances();
        line.scale.set(1, 1, 1);

        this.scene.add(line);
        line.position.copy(position);
        line.catmu = points[1];
        const ee = [1, 2, 34, 5, 6];
        for (const value of ee) {
            console.log('value', value);
        }
        this.lineArray.push(line);

    }
    addEvent() {
        window.addEventListener('click', this.onPointUp);
    }
    onPointUp = (e: MouseEvent) => {
        this.mesh.position.x += 0.1;
        this.intersectObject(this.mesh);
        const result = this.useRayCaster(new THREE.Vector2(e.offsetX, e.offsetY), true);
        result[0] && console.log("当前点击的对象的Type是", result[0].object.type);
    };
    intersectObject(object: THREE.Object3D) {
        const origin = new THREE.Vector3();
        const v = new THREE.Vector3();
        const traslate = new THREE.Vector3(0, 0, 0);
        object.getWorldPosition(origin);
        object.getWorldDirection(v);
        const rayCaster = new THREE.Raycaster(origin.add(traslate), v);
        const result = rayCaster.intersectObjects(this.lineArray, false).filter(item => {
            return item.distance < 0.1;
        });

        result[0] && !this.cacheLine && this.mesh.position.copy(result[0].pointOnLine);
        this.cacheLine = result[0] ? result[0].object : null;

        console.log(result);
    }
    createMesh() {
        this.geometry = new THREE.BoxGeometry(3, 3, 3);
        this.material = new THREE.MeshStandardMaterial({
            color: "#ff0000"
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }
    getCarAxis() {
        //TODO 车道坐标系

    }
    getIndexFromPosition(position: THREE.Vector3) {

    }

    curvePass(points: THREE.Vector3[]) {
        const divisions = Math.round(3 * points.length);
        const spline = new THREE.CatmullRomCurve3(new THREE.CatmullRomCurve3(points).getSpacedPoints(divisions * Math.random()));
        console.log(spline.points.length);
        const point = new THREE.Vector3();
        const positions: number[] = [];
        console.log('divisions', divisions);
        for (let i = 0; i < spline.points.length; i++) {
            const t = i / spline.points.length;
            spline.getPoint(t, point);
            positions.push(point.x, point.y, point.z);
        }
        const res = spline.getLength();
        // console.log(spline.getLengths());
        console.log('res', res);
        return [positions, spline];
    }
    initGui() {
        const params = {
            s: 0
        };

        const obj = {
            isPerspective: true
        };
        this.$gui.add(obj, 'isPerspective').onChange(e => {
            this.changeCamera();
        });
        this.$gui.add(params, 's', 0, 300, 1).onChange(e => {
            if (this.cacheLine) {
                this.cacheLine.catmu.getPoint(e / 300, this.mesh.position);
            }
        });
    }
    onSceneBeforeUpdate(): void {
    }
}