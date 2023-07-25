
import Demo from '@/pages/Matcap材质';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;