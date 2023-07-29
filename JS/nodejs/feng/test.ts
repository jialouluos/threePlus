import * as api from './index';
api.getScrver2({ name: "消防" }).then(res => {
    console.log(12, res);
}).catch(err => {
    console.log('最外层');
    // console.log(4, err);
});
// api.getScrver({ name: "消防" }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(4, err);
// });
// api.getScrver({ name: "消防" }).then(res => {
//     console.log(res);
// }).catch(err => {
//     // console.log(4, err);
// });
// api.getScrver({ name: "消防" }).then(res => {
//     console.log(res);
// }).catch(err => {
//     // console.log(4, err);
// });
// api.getScrver({ name: "消防" }).then(res => {
//     console.log(res);
// }).catch(err => {
//     // console.log(4, err);
// });
