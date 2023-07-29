// async function testSometing() {
//   console.log("执行testSometing");
//   return "testSometing";
// }
// async function testAsync() {
//   console.log("执行testAsync");
//   return Promise.resolve("hello async");
// }

// async function test() {
//   console.log("test start...");
//   const v1 = await testSometing();
//   console.log(v1);
//   const v2 = await testAsync();
//   console.log(v2);
//   console.log(v1, v2);
// }

// test();

// var promise = new Promise(resolve => {
//   console.log("promise start..");
//   resolve("promise");
// }); //3
// promise.then(val => console.log(val));

// console.log("test end...");

// const test = () => {
//   test2();
// };
const test2 = async () => {
  const res = await new Promise((_res, _rej) => {
    setTimeout(() => {
      _rej(1);
    }, 200);
  }).catch(res => {
    console.log(res);
  });
  // res.then(res => {
  //   console.log(res);
  // });
};
test2();
