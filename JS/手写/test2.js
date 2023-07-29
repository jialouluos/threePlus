const test2 = () => {
  console.log("我是test2 start");
  throw new Error("你好世界");
  console.log("我是test2 end");
};

exports.modules = { test2 };
