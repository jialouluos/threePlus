import Demo from '@/pages/normal';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;
