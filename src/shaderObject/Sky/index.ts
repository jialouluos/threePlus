import MeshMain from '../MeshMain';
import * as THREE from 'three';
import Main from '@Main';
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.glsl';
export class Sky extends MeshMain {
        value: THREE.Mesh;
        sun: THREE.Vector3;
        renderTarget: THREE.WebGLRenderTarget;
        pmremGenerator: THREE.PMREMGenerator;
        params: {
                skyRadius: number;
                sunRadius: number;
                elevation: number;
                azimuth: number;
        };
        constructor(renderer: THREE.WebGLRenderer, texture: THREE.Texture, skyRadius = 10000, sunRadius = 1000) {
                super();
                this.params = {
                        skyRadius,
                        sunRadius,
                        elevation: 0,
                        azimuth: 180
                };
                this.shader = {
                        uniforms: {
                                'turbidity': { value: 2 },
                                'rayleigh': { value: 1 },
                                'mieCoefficient': { value: 0.005 },
                                'mieDirectionalG': { value: 0.8 },
                                'sunPosition': { value: new THREE.Vector3() },
                                'up': { value: new THREE.Vector3(0, 1, 0) },
                                'u_SkyBg': { value: null },
                                'u_Time': { value: null },
                        },
                        vertexShader,
                        fragmentShader
                };
                this.sun = new THREE.Vector3();
                this.geometry = new THREE.SphereGeometry(this.params.skyRadius, 32, 32);
                this.material = new THREE.ShaderMaterial({
                        uniforms: this.shader.uniforms,
                        vertexShader: this.shader.vertexShader,
                        fragmentShader: this.shader.fragmentShader,
                        side: THREE.BackSide,
                        depthWrite: false
                });
                this.value = new THREE.Mesh(this.geometry, this.material);
                const skyUniforms = (this.value.material as THREE.ShaderMaterial).uniforms;
                skyUniforms['turbidity'].value = 10;
                skyUniforms['rayleigh'].value = 2;
                skyUniforms['mieCoefficient'].value = 0.005;
                skyUniforms['mieDirectionalG'].value = 0.8;
                skyUniforms['u_SkyBg'].value = texture;
                this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        }
        /*@overwrite*/
        update(scene: THREE.Scene) {
                const phi = THREE.MathUtils.degToRad(90 - this.params.elevation);
                const theta = THREE.MathUtils.degToRad(this.params.azimuth);
                this.sun.setFromSphericalCoords(this.params.sunRadius, phi, theta);
                this.material.uniforms['sunPosition'].value.copy(this.sun);
                this.renderTarget && this.renderTarget.dispose();
                this.renderTarget = this.pmremGenerator.fromScene(this.value as unknown as THREE.Scene);
                scene.environment = this.renderTarget.texture;
        }
        initGui(cb: (material: THREE.ShaderMaterial) => void) {
                cb && cb(this.material);
        }
        dispose() {
                const group = new THREE.Group();
                group.add(this.value);
                Main.track.track(group);
                Main.track.disTrackByGroup(group);
                this.value = null;
        }
}
