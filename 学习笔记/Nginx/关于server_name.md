# server_name

server_name 主要用于为虚拟服务器的识别路径。因此不同的域名会通过请求头中的**HOST**字段，匹配到特定的server块，转发到对应的应用服务器中去。

> 如果监听一个端口的server有多个，则取决于请求头的Host与哪个server的域名（server_name）匹配

> 最前面定义的那个是默认server。也可以手动指定

> 如果在listen中设置为ip+端口，则server_name配置不生效

## 匹配优先级

1. 完全匹配
2. 通配符在前的，如*.test.com
3. 在后的，如www.test.*
4. 正则匹配，如~^\.www\.test\.com$

如果都不匹配

1. 优先选择listen配置项后有default或default_server的
2. 找到匹配listen端口的第一个server块

## 如果不设置server_name会怎样

如果不设置server_name 则server_name默认为“”【默认服务器名称值是自 0.8.48 以来的空名称 “”。】

参考链接：[服务器名称 (nginx.org)](http://nginx.org/en/docs/http/server_names.html)

它不会匹配任何域名，Nginx会优先将HTTP请求交给其它server处理。如果其它server不处理，则**还是交给该server处理**

例如有这样一段server：

```nginx
server {
    listen       1141;
    server_name  localho;
    return 200 "This is 1\n";
}
```

```sh
curl ${服务器ip}:1141
# This is 1
curl localhost:1141
# This is 1
```

在这个示例中只存在一个server去listen 1141，所以最后还是由他去处理

现在我们server改成这样

```nginx
server {
    listen       1141;
    server_name  localho;
    return 200 "This is 1\n";
}
server {
    listen       1141 default_server;
  	#  server_name  "";
    return 200 "This is 3\n";
}
```

```sh
curl ${服务器ip}:1141
# This is 3
```

因为我们手动指定了默认的server，所以优先选用了第二个server，然而发现第二个server的server_name不匹配，又去匹配第一个server，发现也不匹配，最后则由第二个默认的server去处理

接着我们再改成这样

```nginx
server {
    listen       1141;
    server_name  localho;
    return 200 "This is 1\n";
}
server {
    listen       1141 ;
  	server_name  127.0.0.1;
    return 200 "This is 3\n";
}
```

```sh
curl ${服务器ip}:1141
# This is 3
```

最后改成这样，可以知道127.0.0.1 与localhost代表的意思不一样

```nginx
server {
    listen       1141;
    server_name  localhost;
    return 200 "This is 1\n";
}
server {
    listen       1141 ;
  	server_name  127.0.0.1;
    return 200 "This is 3\n";
}
```

```sh
curl ${服务器ip}:1141
# This is 3
curl localhost:1141
# This is 1
```

