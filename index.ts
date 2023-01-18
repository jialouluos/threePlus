import Demo from '@/pages/shader_normal';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;
