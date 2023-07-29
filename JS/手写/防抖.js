//在n秒中被再次触发，重新计时
// function debounce(fn, time) {
//   let timer;
//   return (...args) => {
//     if (timer) {
//       clearTimeout(timer);
//     }
//     timer = setTimeout(() => {
//       fn.apply(null, args);
//       timer = null; //有没有无所谓
//     }, time);
//   };
// }
const { test2 } = require("./test2.js");
try {
  Test1();
} catch {
  console.log("错误被捕获了");
}

const Test1 = () => {
  console.log("我是test1 start");

  console.log("我是test1 end");
  test2();
};
