function addNameParams(target: any) {
    console.log(target === Button);//true
    target['name2'] = '张三·静态';
    target.prototype.name3 = "张三·原型·原生";
    return target;
}

@addNameParams
class Button {
    size: number;
    constructor() {
        this.size = 1;
    }
}
const instance = new Button();
// console.log(Button.name2);//'张三·静态'
// console.log(instance.name3);//"张三·原型·原生"

@AddProperty('奥特曼', '戴卡')
class C_test_1 {
    static a = 1;
    b = 2;
}
function AddProperty(key: string, value: string): ClassDecorator {
    return (target: any) => {
        target[key] = value;
        target.prototype.print = () => { console.log(target); };
    };
}
const test = new C_test_1();
// test.print();//C_test_1 { a: 1, 奥特曼: '戴卡' }
// console.log(C_test_1['奥特曼']);//'戴卡'