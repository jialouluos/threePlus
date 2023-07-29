# location

`localtion`是nginx中的块级指令，`location`指令的功能是用来匹配不同的uri请求，进而对请求做不同的处理和响应

server 块可以包含多个 location 块，location 指令用于匹配 uri，语法：

```nginx
location [ = | ~ | ~* | ^~] uri {
	...
}
```

指令后面：

1. `=` 精确匹配路径，用于不含正则表达式的 uri 前，内容要同表达式完全一致才匹配成功，如果匹配成功，不再进行后续的查找；

   ```nginx
   location = /abc/ {
       ...
   }
   # 只匹配http://abc.com/abc
   #http://abc.com/abc [匹配成功]
   #http://abc.com/abc/index [匹配失败]
   ```

2. `^~` 用于不含正则表达式的 uri 前，表示如果该符号后面的字符是最佳匹配，采用该规则，不再进行后续的查找；

   ```nginx
   location ^~ /index/ {
     .....
   }
   #以 /index/ 开头的请求，都会匹配上
   #http://abc.com/index/index.page  [匹配成功]
   #http://abc.com/error/error.page [匹配失败]
   ```

3. `~` 表示用该符号后面的正则去匹配路径，区分大小写；

4. `~*` 表示用该符号后面的正则去匹配路径，不区分大小写。跟 `~` 优先级都比较低，

   ```nginx
   location ~ ^/(blog) {
   	root xxx;
   }
   # 对于这个规则来说，`~`表示以正则表达式来进行匹配，`^/(blog)`中的/表示的是根路径，比如
   # `www.jialouluo.top/blog/article`,这里的根路径就是www.jialouluo.top，所以
   # `^/(blog)`表示匹配以`www.jialouluo.top/blog`开头的uri
   ```

5. 不加任何规则时，默认是大小写敏感，前缀匹配，相当于加了 \~ 与 \^~

6. 命名location，用@标识，类似于定于goto语句块。
   ```nginx
   location /index/ {
     error_page 404 @index_error;
   }
   location @index_error {
     .....
   }
   #以 /index/ 开头的请求，如果链接的状态为 404。则会匹配到 @index_error 这条规则上。
   ```

7. 如有多个location的正则能匹配的话，则使用正则表达式最长的那个；

8. 如果 uri 包含正则表达式，则必须要有 `~` 或 `~*` 标志。

## 优先级

> `=` > `^~` > `~ | ~*` > `最长前缀匹配` > `/`

## location URI结尾带不带 /

牢记URL 尾部的 `/` 表示目录，没有 `/` 表示文件

如果URI的结构是`domain.com/`的形式，尾部没有`/`都不会导致重定向，因为游览器在发起请求的时候,默认加上了`/`

如果URI的结构是`domain.com/dir/`的形式，尾部如果缺少`/`将导致重定向，由于尾部没有`/`,表示文件，所以会去找dir文件，如果没有找到的话会将dir当成目录，重定向到`/dir/`去该目录下找默认文件

### 配合proxy_pass使用

如果proxy_pass转发的只有IP和端口，例如`127.0.0.1:8080`，没有包含目录，会按照**代理地址+访问URL目录的规则**

```nginx

location /test1/ {
    proxy_pass http://127.0.0.1:8080;
}
#或者
location /test1 {
    proxy_pass http://127.0.0.1:8080;
}
#如果请求uri为www.test1.com/test1/test2，由于会匹配到/test1/或/test，将会转发到http://127.0.0.1:8080/test1/test2。
```

如果proxy_pass转发包含IP和端口以及目录(/)，例如`127.0.0.1:8080/`,会按照**代理地址+访问URL目录部分去除location匹配目录**

```nginx
#1.proxy_pass变化
location /test1/ {
    proxy_pass http://127.0.0.1:8080/;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test11

#或者
location /test1/ {
    proxy_pass http://127.0.0.1:8080/test2/;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2/test11
 
#2.location匹配变化
location /test1/ {
    proxy_pass http://127.0.0.1:8080/test2;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2test11(截取了/test1/,少个‘/’)

#或者
location /test1 {
    proxy_pass http://127.0.0.1:8080/test2;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2/test11
```

