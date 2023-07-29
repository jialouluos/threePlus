# WebGLInfo

## 函数作用

具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试

## 入口函数

```ts
/**
*@gl webgl上下文环境
**/
function WebGLInfo(gl) {
    
    const memory = {//记录内存
        geometries: 0,
        textures: 0
    };
    const render = {//记录渲染信息
        frame: 0,
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0
    };
	//update(){...}
    //reset(){...}
    //返回统计信息以及操作方法
}
```

## 核心函数-update(count, mode, instanceCount)

```ts
function update( count, mode, instanceCount ) {
    render.calls ++;
    switch ( mode ) {//webgl绘制模式
        case gl.TRIANGLES:
            render.triangles += instanceCount * ( count / 3 );//实例数 * (顶点个数/3)
            break;
        case gl.LINES:
            render.lines += instanceCount * ( count / 2 );
            break;
        case gl.LINE_STRIP:
            render.lines += instanceCount * ( count - 1 );
            break;
        case gl.LINE_LOOP:
            render.lines += instanceCount * count;
            break;
        case gl.POINTS:
            render.points += instanceCount * count;
            break;
        default:
            console.error( 'THREE.WebGLInfo: Unknown draw mode:', mode );
            break;
    }
}
```

## 返回值

```ts
return {
        memory: memory,//记录内存
        render: render,//记录渲染
        programs: null,//记录程序
        autoReset: true,//?自动更新 or 自动重设
        reset: reset,//重设函数
        update: update//更新函数
    };