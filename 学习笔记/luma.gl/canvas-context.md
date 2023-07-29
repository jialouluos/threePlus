# canvas-context

该模块用于适配`html-canvas`、`node`、`offscreen-canvas` 三种环境下的`canvas context`处理

## DEFAULT_CANVAS_CONTEXT_PROPS

DEFAULT_CANVAS_CONTEXT_PROPS 用于设定一些用于创建cavas上下文的预设值，比如画布的宽度`width`、高度`height`、颜色空间`colorSpace`

## CanvasContext

### constructor

```ts
constructor(props?: CanvasContextProps) {
this.props = { ...DEFAULT_CANVAS_CONTEXT_PROPS, ...props };
props = this.props;
if (!isBrowser()) {//判断是否是浏览器环境
    this.id = 'node-canvas-context';
    this.type = 'node';
    this.width = this.props.width;
    this.height = this.props.height;
    this.canvas = null!;
    return;
}
/*如果没有canvas 则创建一个canvas DOM 并将其赋给this.canvas */
...
/*将canvas插入到DOM中去*/
...
/* 走到这里说明现在是浏览器环境，还需要区分是离屏canvas环境还是普通的canvas环境 */
if (this.canvas instanceof HTMLCanvasElement) {
      this.id = this.canvas.id;
      this.type = 'html-canvas';
      this.htmlCanvas = this.canvas;
    } else {
      this.id = 'offscreen-canvas';
      this.type = 'offscreen-canvas';
      this.offscreenCanvas = this.canvas;
    }
/* 如果是html-canvas 则可以给一个ResizeObserve，去监听视口大小的改变并作出处理 */
if (this.canvas instanceof HTMLCanvasElement && props.autoResize) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.canvas) {
            this.update();
          }
        }
      });
      this.resizeObserver.observe(this.canvas);
    }
}
```

>    isPageLoaded 用于判断当前 HTML 页面是否已经完全加载完成

## 获取画布宽高比

对`node` 、`offscreen-canvas`、`html-canvas`不同环境进行适配获取宽高比

```ts
getPixelSize(): [number, number] {
    switch (this.type) {
            //如果type为node or offscreen-canvas
            return [this.width, this.height];
        case 'html-canvas':
            const dpr = this.getDevicePixelRatio();//设备像素比
            const canvas = this.canvas as HTMLCanvasElement;
            return canvas.parentElement
                ? [canvas.clientWidth * dpr, canvas.clientHeight * dpr]
            : [this.canvas.width, this.canvas.height];
    }
}

getAspect(): number {
    const [width, height] = this.getPixelSize();
    return width / height;
}
getDevicePixelRatio(useDevicePixels?: boolean | number): number {
    //当前环境支持 OffscreenCanvas，且当前组件的 canvas 属性是 OffscreenCanvas 类型，则返回 1
if (typeof OffscreenCanvas !== 'undefined' && this.canvas instanceof OffscreenCanvas) {
    return 1;
}
/* 如果useDevicePixels or  this.props.useDevicePixels 是number并且大于0则使用，否则返回1 */
//...
return useDevicePixels || this.props.useDevicePixels
    ? (typeof window !== 'undefined' && window.devicePixelRatio) || 1
: 1;
}
```

## 采用css像素来计算得到设备像素，以此保证元素在不同设备上具有相同的大小

>   函数根据布尔值 `yInvert` 计算像素的上下边界，以保证像素坐标的正确性。如果 `yInvert` 为 true，则需要将 y 坐标翻转，因为在屏幕坐标系中，原点在左上角，而在设备像素坐标系中，原点在左下角。

```ts
const cssToDevicePixels=(
    cssPixel: number[],
    yInvert: boolean = true
)=>: {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    const ratio = this.cssToDeviceRatio();
    const [width, height] = this.getDrawingBufferSize();
    return scalePixels(cssPixel, ratio, width, height, yInvert);//将像素缩放到cssPixel的范围内来
}
const cssToDeviceRatio=()=>: number {
    try {
        const [drawingBufferWidth] = this.getDrawingBufferSize();//return [gl.drawingBufferWidth, gl.drawingBufferHeight];//得到的是一个设备像素下的宽度
        const { clientWidth } = this._canvasSizeInfo; //得到的是一个CSS像素下的宽度
        return clientWidth ? drawingBufferWidth / clientWidth : 1;
    } catch {
        return 1;
    }
}
```

该实例会被继承并在device的继承类的constructor中被调用

```ts
class WebGLCanvasContext extends CanvasContext {
    constructor(device: WebGLDevice, props: CanvasContextProps){
        super(props);
        //...
    }
}
class WebGLDevice extends Device{
    constructor(props: DeviceProps){
        //...
        this.canvasContext = new WebGLCanvasContext(this, props);
        //...
    }
}
```

# WebGLCanvasContext

继承于`CanvasContext`,并为webgl环境服务，会重写CanvasContext中的一些方法

+   对resize进行抽象方法覆盖，对于浏览器环境来说，直接通过`setDevicePixelRatio`来更新画布大小，但是其他环境(没有图形界面的环境)下则需要调用webgl扩展`STACKGL_resize_drawingbuffer`对绘制缓冲区进行大小的更改