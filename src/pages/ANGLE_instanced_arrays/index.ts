import vertexSource from './vertex.vs';
import fragSource from './fragment.fs';
import { MyWebGL } from '@/util/_webgl';
export default class extends MyWebGL {
    drawCount: number;
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
        this.drawCount = 1000000;
    }
    init() {

        this.program = this.initShader(vertexSource, fragSource, 'baseProgram');
        const vertices = new Float32Array([
            2, 0, 0,
            0, 2, 0,
            0, 0, 2
        ]);
        const panDataOrigin = new Float32Array(new ArrayBuffer(this.drawCount * 12));
        for (let i = 0; i < this.drawCount; i++) {
            panDataOrigin[i * 3] = Math.random() * 100 - 5;
            panDataOrigin[i * 3 + 1] = Math.random() * 10 - 5;
            panDataOrigin[i * 3 + 2] = Math.random() * 10 - 5;
        }
        this.addVertexArrayObject(() => {
            const buffer = this.initArrayBuffer(vertices, "base");
            this.pointerVertexByArrayBuffer(buffer, "a_Position", 3, this.gl.FLOAT, 0, 0);
            const buffer2 = this.initArrayBuffer(panDataOrigin, "base2");
            this.pointerVertexByArrayBuffer(buffer2, "a_Translate", 3, this.gl.FLOAT, 0, 0);
            this.setVertexAttribDivisor("a_Translate", 1);
        }, "baseVao");

        this.initCamera();
        this.addOrbitControls(this._canvas);
        this.draw();
    }
    update() {
        this.initCamera();
        this.clearScreen();
        const vaoCallback = this.vaoMap.get("baseVao");
        vaoCallback(() => {
            this.drawArrayByInstance(this.gl.TRIANGLES, 0, 3, this.drawCount);
        });

    }
}