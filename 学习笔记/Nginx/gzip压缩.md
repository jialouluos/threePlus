# gzip压缩

gzip 是一种常用的网页压缩技术，传输的网页经过 gzip 压缩之后大小通常可以变为原来的一半甚至更小，但是小于1k字节数的资源可能会越压越大。

## nginx 配置gzip

如果需要生效不仅需要nginx配置，还得浏览器端也要配置，需要在请求消息头中包含 `Accept-Encoding: gzip`(目前是现代浏览器的默认设置)，Nginx 在拿到这个请求的时候，如果有相应配置，就会返回经过 gzip 压缩过的文件给浏览器，并在 response 相应的时候加上 `content-encoding: gzip` 来告诉浏览器自己采用的压缩方式（因为浏览器在传给服务器的时候一般还告诉服务器自己支持好几种压缩方式），浏览器拿到压缩的文件后，根据自己的解压方式进行解析

```nginx
gzip on; # 默认off，是否开启gzip
gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript; # 要采用 gzip 压缩的 MIME 文件类型，其中 text/html 被系统强制启用

gzip_static on; # 默认 off，该模块启用后，Nginx 首先检查是否存在请求静态文件的 gz 结尾的文件，如果有则直接返回该 .gz 文件内容
gzip_proxied any; # 默认 off，nginx做为反向代理时启用，用于设置启用或禁用从代理服务器上收到相应内容 gzip 压缩
gzip_vary on; # 用于在响应消息头中添加 Vary：Accept-Encoding，使代理服务器根据请求头中的 Accept-Encoding 识别是否启用 gzip 压缩
gzip_comp_level 6; # gzip 压缩比，压缩级别是 1-9，1 压缩级别最低，9 最高，级别越高压缩率越大，压缩时间越长，建议 4-6
gzip_buffers 16 8k; # 获取多少内存用于缓存压缩结果，16 8k 表示以 8k*16 为单位获得
gzip_min_length 1k; # 允许压缩的页面最小字节数，页面字节数从header头中的 Content-Length 中进行获取。默认值是 0，不管页面多大都压缩。小于 1k 可能会越压越大
gzip_http_version 1.1; # 默认 1.1，启用 gzip 所需的 HTTP 最低版本
```

## 打包时配置gzip

以webpack为例，项目打包时，也可以开启gzip压缩，这样服务器上就不用通过nginx压缩gzip了(需要开启`gzip_static`),因为使用 Nginx 来压缩文件，会耗费服务器的计算资源，增加服务器的开销，相应增加客户端的请求时间，而将打包之后的高压缩等级文件作为静态资源放在服务器上，Nginx 会优先查找这些压缩之后的文件返回给客户端

```js
// vue-cli3 的 vue.config.js 文件
const CompressionWebpackPlugin = require('compression-webpack-plugin')

module.exports = {
  // gzip 配置
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境
      return {
        plugins: [new CompressionWebpackPlugin({
          test: /\.js$|\.html$|\.css/,    // 匹配文件名
          threshold: 10240,               // 文件压缩阈值，对超过10k的进行压缩
          deleteOriginalAssets: false// 是否删除源文件
        })]
      }
    }
  },
  ...
}
```

