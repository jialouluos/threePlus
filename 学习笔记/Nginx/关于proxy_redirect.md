# proxy_redirect

`proxy_redirect` 指令是用来控制 Nginx 代理响应中的重定向行为的。该指令通常用于处理HTTP 301和302响应

```nginx
server {
       listen       80;
       server_name  www.test.com;
       location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_redirect off;
       }
 }
```



例如我们curl查看某一个302响应

```sh
curl -I http://www.test.com
```

```http
HTTP/1.1 302 Found
Date: Sat, 27 May 2023 05:48:41 GMT
Content-Type: text/html
Content-Length: 154
Connection: keep-alive
Set-Cookie: path=/;HttpOnly;Max-Age=1800
Location: http://127.0.0.1:8080
Via: HTTP/1.1 SLB.14
```

如果我们不想暴露实际的localtion，则可以用`proxy_redirect`去对响应头的字段进行修改返回给客户端

```nginx
server {
       listen       80;
       server_name  www.test.com;
       location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_redirect  http://127.0.0.1:8080(.*)  http://www.test.com$1
       }
 }
```

> ```nginx
> 将被代理服务器发出的重定向http协议的location改为https协议：
> proxy_redirect ~^http:``//``([^:]+)(:\d+)?(.*)$ https:``//``$1$2$3;
> ```

## 更多

[Nginx反向代理中使用proxy_redirect重定向url - 散尽浮华 - 博客园 (cnblogs.com)](https://www.cnblogs.com/kevingrace/p/8073646.html)
