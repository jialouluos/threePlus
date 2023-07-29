//方法一
class SingleModel_1 {
    constructor() {
        console.log("一个实例被创建了");
    }
}
function createSingleModel() {
    let instance: SingleModel_1 | null = null;
    return () => instance ? instance : instance = new SingleModel_1();
}
const createSingleInstance = createSingleModel();
const single1 = createSingleInstance();
const single2 = createSingleInstance();
console.log(single1 === single2);// true

//方法二
const createSingleInstance_1 = (() => {
    //定义自由变量
    let instance: SingleModel_1 | null = null;
    return () => instance ? instance : instance = new SingleModel_1();
})();
const single_3 = createSingleInstance_1();
const single_4 = createSingleInstance_1();
console.log(single_3 === single_4); // true

//方法三
class SingleModel_2 {
    private static instance: SingleModel_2;
    constructor() {
        if (SingleModel_2.instance) {
            return SingleModel_2.instance;
        }
        SingleModel_2.instance = this;
    }
}
const instance_1 = new SingleModel_2();
const instance_2 = new SingleModel_2();
console.log(instance_1 === instance_2); // true
export { };