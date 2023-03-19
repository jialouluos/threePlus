import Chart from '@/shaderObject/Chart';
import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
    obj: THREE.Object3D;
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.initNormal(new THREE.Vector3(0, 8, 10));
    }
    onSceneCreated() {
        this.createAxis(10, 10);
        this.createBar();
    }
    createAxis(size: number, division: number) {
        const chart = new Chart();
        const xGrid = chart.createAxis(size, division, { enableDynamicColor: true }).value;
        xGrid.translateX(size / 2);
        xGrid.translateZ(size / 2);
        const yGrid = chart.createAxis(size, division, { enableDynamicColor: true }).value;
        yGrid.rotateZ(Math.PI / 2);
        yGrid.translateX(size / 2);
        yGrid.translateZ(size / 2);
        const zGrid = chart.createAxis(size, division, { enableDynamicColor: true }).value;
        zGrid.rotateX(-Math.PI / 2);
        zGrid.translateX(size / 2);
        zGrid.translateZ(size / 2);
        this.scene.add(xGrid);
        this.scene.add(yGrid);
        this.scene.add(zGrid);
    }
    createBar() {
        const dieData = [{
            name: "GGB",
            value: 186,
            radius: 0.5,
            color: "#fff000"
        },
        {
            name: "夕阳狼",
            value: 120,
            radius: 0.5,
            color: "#ff0000"
        }, {
            name: "踏浪",
            value: 160,
            radius: 0.5,
            color: "#00ff00"
        }, {
            name: "我不叫喂",
            value: 86,
            color: "#0000ff"
        }];
        const chart = new Chart();

        const obj = {
            left: false,
            up: false,
            face: true
        };
        this.$gui.add(obj, 'left').listen().onChange(e => {
            if (e) {
                this.getOrbitControls().rotate.rotateToLateralLook();
            }
            obj.face = false;
            obj.up = false;
        });
        this.$gui.add(obj, 'up').listen().onChange(e => {
            if (e) {
                this.getOrbitControls().rotate.rotateToOverLook();
            }
            obj.face = false;
            obj.left = false;
        });
        this.$gui.add(obj, 'face').listen().onChange(e => {
            if (e) {
                this.getOrbitControls().rotate.rotateToFaceUp();
            }
            obj.left = false;
            obj.up = false;
        });
        const model = chart.createFan(dieData, this);
        this.scene.add(model.value);
    }
}