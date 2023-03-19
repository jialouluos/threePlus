import Main from '@Main';
import * as THREE from 'three';
export default class extends Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.initNormal();
    }
}