// import axios from "axios";
// const request = axios.create({
//     baseURL: "http://jialouluo.top:8081"
// });
// setInterval(() => {
//     request({
//         method: "post",
//         url: "user/login",
//         data: {
//             username: "jialouluo", password: "201326lhw"
//         },
//     }).then(res => {
//         console.log(res);
//     });
// }, 4000)
// request({
//     method: "post",
//     url: "pre",
//     data: {
//         hh:2
//     },
//     headers: {
//         "Content-Type":"application/json"
//     }
// }).then(res => {
//     console.log(res);
// });

// const { resolve } = require("../手写/PromiseA");

// async function async1() {
//     console.log('async1 start');
//     await async2();
//     console.log('async1 end');
// }
// function async2() {
//     console.log('async2 start');
//     return new Promise((res, rej) => {
//         res();
//         console.log('async2 promise');
//     })
// }
// console.log('script start');

// setTimeout(() => {
//     console.log('setTimeout');
// }, 0)
// async1();
// new Promise(function (resolve) {
//     console.log('promise1');
//     resolve();
// }).then(function () {
//     console.log('promise2');
// }).then(function () {
//     console.log('promise3');
// })
// console.log('script end');

/**
 * script start
 * async1 start
 * async2 start
 * async2 promise
 * async1 end
 * promise1
 * script end
 * promise2
 * promise3
 * setTimeout
 *
 */

const res = await axios
  .get("http://localhost:5400/server")
  .catch(res => {
    // console.log(res);
    return new Promise((_res, _rej) => {
      setTimeout(() => {
        axios
          .get("http://localhost:5400/server")
          .then(res => {
            _res(res);
          })
          .catch(res => {
            _rej(res);
          });
      }, 1000);
    });
  })
  .then(
    res => {
      console.log("我是then");
      return null;
    },
    rej => {
      return 123;
    }
  );
console.log("我被执行了", res);
// request({
//   method: "post",
//   url: "pre",
//   data: {
//     hh: 2,
//   },
//   headers: {
//     "Content-Type": "application/json",
//   },
// }).then(res => {
//   console.log(res);
// });
