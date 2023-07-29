# API

## gl.clearColor(red,green,blue,alpha)

+   该方法用于设置绘图区的背景颜色

    ```js
    gl.clearColor(red,green,blue,alpha){
        //red==>指定红色值(0.0~1.0)
        //green==>指定绿色值(0.0~1.0)
    	//blue==>指定蓝色值(0.0~1.0)
        //alpha==>指定透明度值(0.0~1.0)
        /**
        *@如果任何值小于0.0或者大于1.0，那么就会分别截断为0.0或1.0
        **/
    }
    ```

## gl.clear(buffer)

+   该方法用于清除指定缓冲区的数据

    ```js
    gl.clear(buffer){
        //buffer==>指定待清空的缓冲区，位操作符OR(|)可用来指定多个缓冲区
        //gl.COLOR_BUFFER_BIT==>指定颜色缓存
        //gl.DEPTH_BUFFER_BIT==>指定深度缓冲区
        //gl.STENCIL_BUFFER_BIT==>指定模板缓冲区
        /**
        *@如果传入参数不是上面三种，那么就会报错INVALID_VALUE
        **/
        //情况缓冲区的默认颜色及其相关函数
        //颜色:默认值:(0.0,0.0,0.0),相关函数：gl.clearColor(red,green,blue,alpha)
        //深度:默认值:1.0,相关函数:gl.clearDepth(depth)
        //模板:0,相关函数:gl.clearStencil(s)
    }
    ```

## gl.drawArrays(mode,frist,count)

+   该方法用来绘制各种图形

    ```js
    gl.drawArrays(mode,frist,count){
        /**mode==>指定绘制的方式，可以接收以下常量符号:
        * gl.POINTS:画单独的点
        * gl.LINES:在一对顶点之间画一条线
        * gl.LINE_STRIP:画一条直线到下一个顶点
        * gl.LINE_LOOP:绘制一条直线到下一个顶点，并将最后一个顶点返回到第一个顶点
        * gl.TRIANGLES:为一组三个顶点绘制一个三角形
        * gl.TRIANGLE_STRIP:绘制一条三角带，第一个三角形是v1,v2,v3,第二个三角形是v2,v3,v4,第三个是v3,v4,v5，依次画下去
        * gl.TRIANGLE_FAN:绘制三角扇，v1为顶点，后面所有点都包含这个点，联想扇子
        **/
    }
    ```

    ## gl.vertexAttrib3f(location,v0,v1,v2)

+   该方法用来向attribute传入数据

    ```js
    gl.vertexAttrib3f(location,v0,v1,v2){
        //location==>attribute变量所在的地址,指定将要修改的attribute变量的存储位置
        //v0==>指定填充attribute变量第一个分量的值
        //v1==>指定填充attribute变量第二个分量的值
        //v2==>指定填充attribute变量第三个分量的值
        /**
        *@如果没有当前的program对象则会报错INVALID_OPERATION
        *@如果location大于等于attribute变量的最大数目(默认为8)，则会报错INVALID_VALUE
        **/
        //同族函数
        //gl.vertexAttrib1f(localtion,v0)，该方法仅将v0传入给attribute变量，其余的分量自动被设为0.0
        //gl.vertexAttrib2f(localtion,v0,v1)
        //gl.vertexAttrib3f(localtion,v0,v1,v2)
        //gl.vertexAttrib4f(localtion,v0,v1,v2,v3)
        //传入数组
        //gl.vertexAttrib1fv(localtion,[v0])
        //gl.vertexAttrib2fv(localtion,[v0,v1])
        //gl.vertexAttrib3fv(localtion,[v0,v1,v2])
        //gl.vertexAttrib4fv(localtion,[v0,v1,v2,v3])
        /**
        *@有一个好记的方法，vertexAttrib是基础函数名，后面的数据参数个数是几个就写几，如果传入的只是浮点型，直接加f如果是数组，在f的后面再加一个v
        **/
    }
    ```

    