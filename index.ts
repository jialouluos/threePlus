
import Demo from '@/pages/3D坐标轴';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;