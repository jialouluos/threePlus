//引入
const express = require("express");
//创建实例
const app = express();
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    // res.header('Access-Control-Max-Age', '1728000')
    // res.header("Keep-Alive","timeout=50")
    console.log(req.headers)
    next();
});
//创建路由规则
app.get('/server2', (request, response) => {
    //设置响应头
    response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5501');
    const data = {
        name: "hello"
    }
    let str = JSON.stringify(data);
    response.status(200).send({ data: { name: "哈哈" }, reason: "你是主", status: 200 });

})
//预检请求
app.post('/pre', (request, response) => {
    //设置响应头
    const comment = request.query;//得到数据(只试用于get，post需要安装一个中间件才能获取数据) 
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Max-Age', '1728000')
    response.setHeader("Keep-Alive", "timeout=50")
    const data = {
        name: "hello"
    }
    let str = JSON.stringify(data);
    setTimeout(() => {
        response.send(str);
    }, 3000);
})
app.get('/jquery-server', (request, response) => {
    //设置响应头
    response.setHeader('Access-Control-Allow-Origin', '*');
    const data = {
        name: "jquery数据"
    }
    let str = JSON.stringify(data);
    setTimeout(() => {
        response.send(str);
    }, 3000);
})
app.post('/jquery-server', (request, response) => {
    //设置响应头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.send("hello,jquery");
})
app.post('/server22', (request, response) => {
    //设置响应头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.send("hello,express");
})
app.listen(5400, () => {
    console.log("5400端口已启动")
})
//4.监听端口