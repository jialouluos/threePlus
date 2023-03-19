import MeshMain from '@/shaderObject/MeshMain';
import Main from '@Main';
import * as THREE from 'three';
import { LabelPool } from '../../../util/_text/LabelPool';
export default class extends MeshMain {
    data: any;
    dataMap: WeakMap<any, any>;
    division: number;
    radius: number;
    value: THREE.Group;
    renderer: Main;
    public constructor(data: any, renderer: any) {
        super();
        this.dataMap = new WeakMap();
        this.division = 100;
        this.data = data;
        this.renderer = renderer;
        this.radius = 10;
        this.value = new THREE.Group();
        this.value.rotation.x -= Math.PI / 2;
        this.value.position.set(5, 0, 5);
        this.getPercent(this.data);
        this.setAngleFromData(this.data);
        document.addEventListener("click", (e) => {

            const intersects = renderer.useRayCaster(
                new THREE.Vector2(e.offsetX, e.offsetY),
                true,
                [this.value],
                true,
            );

            if (intersects.length > 0) {
                const object = intersects[0].object;
                this.reqTween(object);
            }
        });
    }
    reqTween(object) {
        const data = object.userData;
        console.log('object', object);
        this.renderer.$gsap.to(object.position, {
            x: Math.cos(data.middleAngle) * 2,
            y: Math.sin(data.middleAngle) * 2,
            duration: 1,

            onComplete: () => {
                this.renderer.$gsap.to(object.position, {
                    x: 0,
                    y: 0,
                    duration: 1,


                });
            }
        });
    }
    createChart(data: any) {
        console.log(data);
    }
    getPercent(data: { value: number; }[]) {
        const { value: totalValue } = data.reduce((preValue, value) => ({ value: preValue.value + value.value }));
        console.log(totalValue);
        data.map(item => {
            this.dataMap.set(item, {
                value: item.value,
                percent: item.value / totalValue,
                startAngle: -1,
                middleAngle: -1,
                endAngle: -1,
                color: item.color,
                name: item.name
            });
        });

    }
    setAngleFromData(data: any) {
        let currentAngle = 0;
        data.map(item => {
            const currentItem = this.dataMap.get(item);
            currentItem.startAngle = currentAngle;
            currentAngle += Math.PI * 2 * currentItem.percent;
            currentItem.endAngle = currentAngle;
            currentItem.middleAngle = (currentItem.startAngle + currentAngle) / 2;
        });
        data.map(item => {
            const currentItem = this.dataMap.get(item);
            this.drawSingleData(currentItem);
        });
    }
    drawSingleData(data: any) {
        const x = Math.cos(data.middleAngle) * 5 / 2;
        const y = Math.sin(data.middleAngle) * 5 / 2;
        const pos = new THREE.Vector3(x, y, data.percent * 5 + 1);
        const text = this.createText(data.name);
        text.position.copy(pos);
        const shape = new THREE.Shape().lineTo(0, 0).arc(0, 0, 5, data.startAngle, data.endAngle, false).lineTo(0, 0);
        const extrudeSettings = { depth: data.percent * 5, bevelEnabled: false, bevelSegments: 1, steps: 2, bevelSize: 10, bevelThickness: 1 };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: data.color, transparent: true, opacity: 0.5 }));
        this.value.add(mesh);
        mesh.add(text);
        mesh.userData = data;
    }
    private createText(text: string, fontFamily: string = 'IBM Plex Mono', fontUrl?: string) {
        if (fontUrl) {
            const fontLoader = new FontFace(fontFamily, `url(${fontUrl})`);
            fontLoader.load();
        }
        const labelPool = new LabelPool({ fontFamily });
        const label = labelPool.acquire();
        label.setText(text);
        label.setBillboard(true);
        label.setSizeAttenuation(false);
        label.setLineHeight(20);

        return label;
    }
}