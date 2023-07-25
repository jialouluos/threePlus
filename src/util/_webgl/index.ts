//ANGLE_instanced_arrays 允许在一次绘制调用中渲染多个实例:实例化渲染，它可以大大提高渲染效率，特别是当你需要渲染大量相同的对象时
//OES_vertex_array_object 顶点数组对象 可以将顶点属性状态捆绑到单个对象中，以便在多次渲染之间轻松地保存和恢复状态，而无需重新绑定缓冲区和重新设置顶点属性指针。
import * as THREE from 'three';
import { Matrix4 } from './cuon-matrix';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from "stats-js";
export type T_Extension = "ANGLE_instanced_arrays" | "OES_vertex_array_object";
export class MyWebGL {
    /**挂载DOM */
    container: HTMLElement;
    /**开启debug */
    debug: boolean;
    /**canvas */
    _canvas: HTMLCanvasElement;
    /**扩展 */
    extensions: Map<T_Extension, { ext: any, enable: boolean; }>;
    /**gl */
    _gl: WebGLRenderingContext | WebGL2RenderingContext;
    _program: WebGLProgram;
    /**isWebGL2 */
    isWebGL2: boolean;
    /**vaoMap */
    vaoMap: Map<string, (cb: () => void) => void>;
    /**bufferMap */
    bufferMap: Map<string, WebGLBuffer>;
    /**programMap */
    programMap: Map<string, WebGLProgram>;
    /**pointerPosition */
    pointerPosition: THREE.Vector2;
    featureDictionary: {
        [U in T_Extension]: [boolean, boolean];
    };
    gui: GUI;
    stats: Stats;
    constructor(el: string | HTMLElement, debug?: boolean) {
        if (typeof el === 'string') {
            this.container = document.querySelector(el);
        } else {
            this.container = el;
        }
        if (this.container instanceof HTMLCanvasElement) {
            this._canvas = this.container;
        } else {
            this._canvas = document.createElement("canvas");
            this._canvas.width = this.container.clientWidth;
            this._canvas.height = this.container.clientHeight;
            this.container.appendChild(this._canvas);
            const _gl = this._canvas.getContext("webgl2");
            if (!_gl) {
                this._gl = this._canvas.getContext("webgl");
                this.isWebGL2 = false;
            } else {
                this._gl = _gl;
                this.isWebGL2 = true;
            }
        }
        this.pointerPosition = new THREE.Vector2();
        this.programMap = new Map();
        this.vaoMap = new Map();
        this.extensions = new Map();
        this.bufferMap = new Map();
        this.featureDictionary = {
            "ANGLE_instanced_arrays": [true, false],
            "OES_vertex_array_object": [true, false],
        };
        if (debug) {
            this.gui = new GUI();
            this.stats = new Stats();
            this.container!.appendChild(this.stats.dom);
        }
    }
    get program() {
        return this._program;
    }
    set program(_program: WebGLProgram) {
        this._gl.useProgram(_program);
        this._program = _program;
    }
    get gl() {
        return this._gl as WebGL2RenderingContext;
    }
    enableExtension(extension: T_Extension) {
        if (this.featureDictionary[extension][this.isWebGL2 ? 1 : 0]) {
            if (this.extensions.get(extension)?.enable) return this.extensions.get(extension)?.ext;
            const ext = this._gl.getExtension(extension);
            if (ext) {
                this.extensions.set(extension, { ext, enable: true });
                return ext;
            } else {
                throw new Error(`${extension} extension not supported`);
            }
        }
    }
    initShader = (vertexString: string, fragString: string, name: string) => {
        const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
        const fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        this._gl.shaderSource(vertexShader, vertexString);
        this._gl.shaderSource(fragmentShader, fragString);
        this._gl.compileShader(vertexShader);
        this._gl.compileShader(fragmentShader);
        const shaderProgram = this._gl.createProgram();
        this._gl.attachShader(shaderProgram, vertexShader);
        this._gl.attachShader(shaderProgram, fragmentShader);
        this._gl.linkProgram(shaderProgram);
        this.programMap.set(name, shaderProgram);
        return shaderProgram;
    };
    initArrayBuffer = (vertices: ArrayBuffer, name: string, isStatic: boolean = true) => {
        const shaderBuffer = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, shaderBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, vertices, isStatic ? this._gl.STATIC_DRAW : this._gl.DYNAMIC_DRAW);
        this.bufferMap.set(name, shaderBuffer);
        return shaderBuffer;
    };
    pointerVertexByArrayBuffer = (shaderBuffer: WebGLBuffer, attributeName: string, size: number, type: number, stride: number, offset: number) => {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, shaderBuffer);
        const location = this.gl.getAttribLocation(this.program, attributeName);
        this._gl.vertexAttribPointer(location, size, type, false, stride, offset);
        this._gl.enableVertexAttribArray(location);
    };
    addVertexArrayObject = (cb: () => void, name: string): WebGLVertexArrayObjectOES => {
        if (this.isWebGL2 && this._gl instanceof WebGL2RenderingContext) {
            const vao = this._gl.createVertexArray();
            this._gl.bindVertexArray(vao);
            cb && cb();
            this._gl.bindVertexArray(null);
            this.vaoMap.set(name, (cb: () => void) => {
                if (this._gl instanceof WebGL2RenderingContext) {
                    this._gl.bindVertexArray(vao);
                    cb && cb();
                    this._gl.bindVertexArray(null);
                }
            });
            return vao;
        } else {
            const ext = this.enableExtension("OES_vertex_array_object") as OES_vertex_array_object;
            const vao = ext.createVertexArrayOES();
            ext.bindVertexArrayOES(vao);
            cb && cb();
            ext.bindVertexArrayOES(null);
            this.vaoMap.set(name, (cb: () => void) => {
                ext.bindVertexArrayOES(vao);
                cb && cb();
                ext.bindVertexArrayOES(null);
            });
            return vao;
        }

    };
    initCamera = (position: THREE.Vector3 = new THREE.Vector3(0, 0, 20), target: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) => {
        if (!this.program) return;
        const viewMatrix = this.convertThreeMatrix(new Matrix4().setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, 0, 1, 0));
        const perspectiveMatrix = this.convertThreeMatrix(new Matrix4().setPerspective(45, this._canvas.width / this._canvas.height, 0.1, 1000));
        const _matrix = new Matrix4();
        _matrix.rotate(this.pointerPosition.y, 1, 0, 0);//绕x轴旋转,这里注意顺序,矩阵乘法没有交换律,一般是先X再Y再Z
        _matrix.rotate(this.pointerPosition.x, 0, 1, 0);//绕y轴旋转,这里注意顺序,矩阵乘法没有交换律,一般是先X再Y再Z
        const modelMatrix = this.convertThreeMatrix(_matrix);
        const modelViewMatrix = viewMatrix.clone().multiply(modelMatrix.clone());
        const u_modelViewMatrix = this._gl.getUniformLocation(this.program, "u_modelViewMatrix");
        const u_perspectiveMatrix = this._gl.getUniformLocation(this.program, "u_perspectiveMatrix");
        this._gl.uniformMatrix4fv(u_modelViewMatrix, false, new Float32Array(modelViewMatrix.elements));
        this._gl.uniformMatrix4fv(u_perspectiveMatrix, false, new Float32Array(perspectiveMatrix.elements));
    };
    addOrbitControls = (doc) => {
        let isDrag = false;
        const Pos = [-1, -1];
        doc.addEventListener('mousedown', (e) => {
            const { clientX: x, clientY: y } = e;
            const { left, top, right, bottom } = e.target.getBoundingClientRect();
            if (left <= x && x < right && y <= bottom && y > top) {
                Pos[0] = x;
                Pos[1] = y;
                isDrag = true;
            }
        });
        doc.addEventListener('mouseup', (e) => {
            Pos[0] = -1;
            Pos[1] = -1;
            isDrag = false;
        });
        doc.addEventListener('mouseleave', (e) => {
            Pos[0] = -1;
            Pos[1] = -1;
            isDrag = false;
        });
        doc.addEventListener('mousemove', (e) => {
            const { clientX: x, clientY: y } = e;
            if (isDrag) {
                const factor = 500 / doc.height;
                const v_x = factor * (x - Pos[0]);
                const v_y = factor * (y - Pos[1]);
                this.pointerPosition.x = this.pointerPosition.x + v_x;
                this.pointerPosition.y = this.pointerPosition.y + v_y;
            }
            Pos[0] = x;
            Pos[1] = y;

        });
    };
    draw() {
        this.stats?.update();
        this.update();

        requestAnimationFrame(() => {
            this.draw();
        });
    }
    update() {


    }
    clearScreen = () => {
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.clearColor(0, 0, 0, 1);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    };
    drawArrays = (mode: number, first: number, count: number) => {
        this._gl.drawArrays(mode, first, count);
    };
    convertThreeMatrix = (matrix: Matrix4) => {
        const _matrix4 = new THREE.Matrix4();
        _matrix4.elements = matrix.elements;
        return _matrix4;
    };
    setVertexAttribDivisor = (attributeName: string, divisor: number) => {
        const location = this.gl.getAttribLocation(this.program, attributeName);
        if (this.isWebGL2 && this._gl instanceof WebGL2RenderingContext) {
            this.gl.vertexAttribDivisor(location, divisor);
        } else {
            const ext = this.enableExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;
            ext.vertexAttribDivisorANGLE(location, divisor);
        }
    };
    drawArrayByInstance = (mode: number, first: number, count: number, instanceCount: number) => {
        if (this.isWebGL2 && this._gl instanceof WebGL2RenderingContext) {
            this.gl.drawArraysInstanced(mode, first, count, instanceCount);
        } else {
            const ext = this.enableExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;
            ext.drawArraysInstancedANGLE(mode, first, count, instanceCount);
        }
    };

}
