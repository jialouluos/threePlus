export default class mathPlus {
    private static instance: mathPlus;
    constructor() {
        if (mathPlus.instance) {
            return mathPlus.instance;
        } else {
            mathPlus.instance = this;
        }
    }
    /**获取el的宽高比 */
    getAspect = (el: HTMLElement): number => el.clientWidth / el.clientHeight;
    /**获取鼠标点击的屏幕系坐标 */
    getNormalizedMousePos = (e: MouseEvent | Touch): { x: number, y: number; } => ({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
    });
    /**弧度转角度 */
    rad2Deg = (rad: number): number => rad * 180 / Math.PI;
    /**角度转弧度 */
    deg2Rad = (deg: number): number => deg * Math.PI / 180;
}
// let x = e.clientX;
// let y = e.clientY;
// let rect = e.target.getBoundingClientRect();
// let pointx = ((x - rect.left) - 512) / 512;
// let pointy = (350 - (y - rect.top)) / 350;