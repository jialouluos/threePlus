class ProtoType {
    name: string;
    age: number;
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
}
function prop() {
    this.name = "张三";
    this.age = 18;
}
const protoType1 = new prop();
const protoType2 = Object.create(protoType1);
const protoType3 = Object.create(protoType1);
console.log(protoType2.name); // 张三
console.log(protoType3.name); // 张三
protoType2.__proto__.name = "李四";
console.log(protoType2.name); // 李四
console.log(protoType3.name); // 李四