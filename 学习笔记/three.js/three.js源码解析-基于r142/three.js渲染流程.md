# three渲染流程

从创建一个WebGLRenderer开始，WebGLRenderer在创建的时候会通过一些配置参数去调用**`getContext`**创建一个webgl上下文环境，然后进行渲染所需相关的初始化，其中会调用initGLContext,initGLContext是一个初始化中起着很重要作用的函数，他进行了一大堆渲染所需要的对象的初始化，包括webgl扩展、绘制状态、内存记录、纹理、灯光、几何相关等等管理对象的初始化。后续render更新也主要是调用这里对象的一些方法，接着会创建一个WebXRManage用于WebXR(VR/AR)环境的渲染。后面便是声明一大堆方法供渲染器调用。创建WebGLRenderer的流程大致就这样.

下面来说下最重要的一个方法：render,render是WebGLRenderer重绘的关键方法，调用它去完成每一帧的绘制：

+   初始化：首先递归更新场景中所有物体和相机的矩阵属性，然后进行XR环境的判断，如果为XR环境则进行XR相关的更新，然后调用生命周期onBeforeRender，之后开启真正的更新流程

    ```ts
    if (scene.autoUpdate === true) scene.updateMatrixWorld();
    if (camera.parent === null) camera.updateMatrixWorld();
    if (xr.enabled === true && xr.isPresenting === true) {
        if (xr.cameraAutoUpdate === true) xr.updateCamera(camera);
        camera = xr.getCamera();
    }
    if (scene.isScene === true) scene.onBeforeRender(_this, scene, camera, _currentRenderTarget);
    ```

+   更新流程：

    +   渲染之前：
        +   向renderStates中注册一个用于收集当前场景的灯光和阴影信息的renderState,为该renderState初始化，主要将两个统计信息置为0,将该renderState推入全局变量renderStateStack
        +   然后进行通过创建和初始化一个裁锥体为后续进行非可视范围裁切，同时创建和初始化平面裁切相关对象
        +   向renderLists中注册一个用于收集当前场景的渲染对象的renderList,renderLists主要用于区分排序透明、透射、非透明物体。为该renderList初始化，主要将统计信息置为0，将该renderList推入全局变量renderListStack
        +   现在光照、场景物体、相机都已经初始化完毕，会进行场景物体收集分类，收集灯光并分组，Object3D收集按照透射、透明、非透明的种类收集好了(内部进行了可见性判断，如果不可见就不收集)，但是只是收集了，这些对象的信息还没处理，然后进行Object3D绘制排序
        +   之后进行裁剪平面信息的提取以及阴影信息的处理
        +   渲染背景-调用gl.clearColor()和gl.clear()方法
        +   进行光照信息的提取并储存在WebGLRenderState的state中的lights的state中
    +   开始渲染：
        +   调用`renderScene`
            +   将光源转换到观察空间便于在着色器中的计算
            +   处理透射物体-`renderTransmissionPass`
            +   处理视口变换
            +   不同类型(非透明、透射、透明)物体分别调用`renderObjects`：
                +   `renderObjects`内部调用`renderObject`，`renderObject`对每一个Object3D开始进行渲染处理：
                    +   调用单个Object3D的`onBeforeRender`生命周期
                    +   将物体的世界空间转换到观察空间(模型矩阵变为模型视图矩阵)
                    +   调用材质的`onBeforeRender`生命周期
                    +   处理材质透明以及双面绘制，双面绘制原理是绘制FrontSide，然后再绘制一遍backSide
                    +   调用`renderBufferDirect`(该函数用于设置绘制方式模型,整理绘制所需数据，并调用进行了封装的绘制函数):
                        +   利用叉乘判断是否顺时针绘制的正面
                        +   调用`setProgram`:
                            +   提取场景中的雾属性和环境(贴图)
                            +   提取顶点着色相关的一些属性(vertexColor)
                            +   注册材质，将材质的属性保存到WebGLProperties的properties属性中,如果已经注册，则变为获取材质属性
                            +   提取变形网格的属性
                            +   提取灯光(在渲染之前已经被处理过的)中的属性
                            +   根据needsProgramChange去获取最新Program(调用getProgram):
                                +   用WebGLProperties对象通过material(key)获取materialProperties(value)根据获取材质的属性(如果不存在会创建一个映射)
                                +   从材质中获取最新的配置参数，并将所有参数整合为一个参数对象(parameters)
                                +   提取材质中的属性信息作为Program的key值(programCacheKey)
                                +   注册销毁事件
                                +   通过programCacheKey获取program(如果不存在会创建一个映射)
                                +   检查program的key值是否有一个program的value，如果有则返回已有的着色器程序，如果不存在就根据parameters创建一个新的WebGLProgram对象，并push到WebGLPrograms中进行缓存
                                +   将上面提取处理得到的属性放入materialProperties
                                +   进行裁剪、光照功能判断
                                +   获取webgl程序中的变量地址并筛选出材质中存在的uniform并将其放入materialProperties
                                +   **返回一个program(WebGLProgram)，到这里一个webgl.Program就创建好了**
                            +   获取webgl程序中的变量地址保存在p_uniforms(program.getUniforms())
                            +   调用WebGLState.useProgram(内部调用gl.useProgram)使用程序
                            +   为p_uniforms中的unifrom进行赋值
                            +   **返回一个program，到这里着色器需要用到的unifrom值都已经准备好的**
                        +   调用WebGLState.setMaterial，根据material去设置绘制的一些状态(到这里已经明确了怎么去绘制)
                        +   获取最新的顶点数据，并进行对比决定是否更新缓存数据(通过WebGLBindingStates对象实现，底层会将数据存放在webgl的数据缓冲区)(**到这里顶点数据就准备好了**)
                        +   根据是否存在顶点索引去觉得是通过`drawArrays`还是`drawElements`绘制
                        +   配置绘制所需要的一些参数，例如drawArrays所需要的offset、drawMode等等
                        +   最后进行InstancedMesh判断(这是一种一次绘制大量几何体，通过索引获取每一个几何体的绘制方法)，如果不是就进行默认的绘制`renderer.render(drawStart, drawCount);`这里的renderer指的是`WebGLBufferRenderer` or `WebGLIndexedBufferRenderer`
                    +   调用Object的`onAfterRender`生命周期
        +   处理离屏渲染的一些东西
    +   渲染之后：
        +   调用`onAfterRender`生命周期
        +   做一些后续销毁，例如renderStateStack和renderListStack弹出首位(即currentRenderList、currentRenderState)