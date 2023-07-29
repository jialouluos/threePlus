# image

## 前言

+ **Docker 把应用程序及其依赖，打包在 image 文件里面。**只有通过这个文件，才能生成 Docker 容器。image 文件可以看作是容器的模板。Docker 根据 image 文件生成容器的实例。同一个 image 文件，可以生成多个同时运行的容器实例。

+ image 是二进制文件。实际开发中，一个 image 文件往往通过继承另一个 image 文件，加上一些个性化设置而生成。举例来说，你可以在 Ubuntu 的 image 基础上，往里面加入 Apache 服务器，形成你的 image。

+ image 可以理解为一个app store 上的app(模板)，提供下载，但只有下载到手机上(容器实例)才能使用

## 查看和删除imgae

```shell
docker image ls # 查看image
docker image rm [imageName] # 删除image
```

## 拉取一个image

`docker image pull`是抓取 image 文件的命令，我们可以用该命令拉取一个[Docker Hub](https://link.juejin.cn/?target=https%3A%2F%2Fhub.docker.com%2F) 的image

```sh
 docker image pull library/hello-world 
 # library/hello-world是 image 文件在仓库里面的位置，其中library是 image 文件所在的组，hello-world是 image 文件的名字。
 # 由于 Docker 官方提供的 image 文件，都放在library组里面，所以它的是默认组，可以省略。
 # docker image pull hello-world
```

拉取完成之后可以执行`docker image ls`查看拉取的image

## 运行image

```sh
docker container run hello-world
```

> `docker container run`命令会从 image 文件，生成一个正在运行的容器实例。
>
> `docker container run`命令具有自动抓取 image 文件的功能。如果发现本地没有指定的 image 文件，就会从仓库自动抓取。因此，前面的`docker image pull`命令并不是必需的步骤。

> 有些image会在执行完之后停止运行，容器自动终止，有些容器不会自动终止，因为提供的是服务，比如node或者安装运行 Ubuntu 的 image，就可以在命令行体验 Ubuntu 系统。

> 对于那些不会自动终止的容器，必须使用[`docker container kill`](https://link.juejin.cn/?target=https%3A%2F%2Fdocs.docker.com%2Fengine%2Freference%2Fcommandline%2Fcontainer_kill%2F) 命令手动终止。
>
> ```shell
> docker container kill [containID]
> ```

