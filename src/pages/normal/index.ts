import Main from '@/components/Main';
export default class extends Main {
    constructor(el: string | HTMLElement, debug?: boolean) {
        super(el, debug);
    }
    init() {
        this.initNormal();
    }
}