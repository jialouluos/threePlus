import * as THREE from 'three';
export default abstract  class {
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial | THREE.RawShaderMaterial;
    isMeshMain: boolean;
    value: unknown;
    shader: {
        uniforms: { [uniform: string]: THREE.IUniform; };
        vertexShader: string;
        fragmentShader: string;
        defines?: any;
    };
    constructor() {
        this.isMeshMain = true;
    }
}