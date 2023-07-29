# WebGLInfo

## WebGLInfo( gl )

```js
//具有一系列关于显卡内存和渲染过程的统计信息的对象。用于调试或只是出于好奇。
```

```js
const memory = {
   geometries: 0,//几何体
   textures: 0//纹理
};

const render = {
   frame: 0,//框
   calls: 0,//来电
   triangles: 0,//三角
   points: 0,//点
   lines: 0//线
};
```

## update( count, mode, instanceCount )

```js
render.calls ++;//来电
switch ( mode ) {
    case gl.TRIANGLES://绘制三角
        render.triangles += instanceCount * ( count / 3 );
        break;
    case gl.LINES://绘制线
        render.lines += instanceCount * ( count / 2 );
        break;
    case gl.LINE_STRIP://绘制线带
        render.lines += instanceCount * ( count - 1 );
        break;
    case gl.LINE_LOOP://绘制线环
        render.lines += instanceCount * count;
        break;
    case gl.POINTS://绘制点
        render.points += instanceCount * count;
        break;
    default:
        console.error( 'THREE.WebGLInfo: Unknown draw mode:', mode );
        break;
}
```

## reset

```JS
render.frame ++;
render.calls = 0;
render.triangles = 0;
render.points = 0;
render.lines = 0;
```

## 返回一个工厂函数对象

```JS
return {
    memory: memory,
    render: render,
    programs: null,
    autoReset: true,
    reset: reset,
    update: update
};
```

