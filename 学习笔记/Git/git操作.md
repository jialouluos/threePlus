# git

## 暂存与本地

```shell
git config --global user.name jialouluos //设置用户签名 --确认本次是谁提交的 必须设置不然提交不了代码
git congif --global user.email 180238813@qq.com //设置用户邮箱 --一般不会验证
git init //初始化git
git status //查看git状态
git add "文件名" //添加暂存区
git rm --cached "文件名" //从暂存区中删除
git commit -m "日志信息" "文件名" // 提交本地库
git log //查看用户日志(详细)
git reflog //查看日志
git reset --hard "版本号"
```

## 分支开发

```shell
git branch -v //查看分支
git branch "分支名" //创建分支
git checkout "分支名" //切换分支
git merge "分支名" //合并分支
```

## 团队合作

```4997shell
git remote -v //查看当前所有远程地址别名
git remote add "别名" "远程地址" 
git push "别名" "分支" //上传文件
git pull "别名" "分支" //拉取文件
git clone "远程地址" //克隆文件
git fetch //将本地分支与远程分支同步
git clone -b '分支名' "远程地址" //克隆指定分支
git checkout -b '分支名' origin/"分支名" //拉取远程分支到本地分支
```
