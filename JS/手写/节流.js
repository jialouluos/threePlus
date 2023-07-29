//在n秒内，不管触发几次，只执行一次
//@ 简易版，首次必执行
function throttle(fn, time) {
    let old = 0;
    return (...args) => {
        let now = + new Date();
        if (now - old > time) {
            old = now
            fn.apply(null, args)
        }
    }
}
