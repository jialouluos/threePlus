import Demo from './src/components/test1';
const start = () => {
    const demo = new Demo("#root", false);
    demo.init();
};
window.onload = start;
// console.log(111);