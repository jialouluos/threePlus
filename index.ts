import Demo from '@/pages/物体编辑器';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;