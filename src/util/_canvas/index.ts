export default class MyCanvas {
    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;

    public constructor(width?: number, height?: number) {
        this._canvas = document.createElement("canvas");
        this._canvas.width = width ?? 100;
        this._canvas.height = height ?? 100;
        this._canvas.style.width = (width ?? 100) + "px";
        this._canvas.style.height = (height ?? 100) + "px";
        this._ctx = this._canvas.getContext("2d");
    }
    public get dom() {
        return this._canvas;
    }
    public get ctx() {
        return this._ctx;
    }
    public clear() {
        return this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
    public resize(width: number, height: number): void {
        this._canvas.width = width;
        this._canvas.height = height;
    }
    public getData(cb?: (data: ImageData) => ImageData) {
        const data = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        const putData = cb ? cb(data) : null;
        putData && this._ctx.putImageData(putData, 0, 0);
        return data;
    }
    /**
     * @绘制一个矩形
     * ```
     * fillRect(x轴起始位置,y轴起始位置,宽度,高度,是否填充)
     * ```
     */
    public Rect(x: number, y: number, w: number, h: number, isFill: boolean = false) {
        return isFill ? this._ctx.fillRect(x, y, w, h) : this._ctx.strokeRect(x, y, w, h);
    }
    /**
    * @绘制一个圆弧
    * ```
    * arc(圆心x,圆心y,半径,开始角度,结束角度,是否填充,逆顺时针画(默认为顺为false))
    * ```
    */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, isFill: boolean = false, counterclockwise?: boolean) {
        this._ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        return isFill ? this._ctx.fill() : this._ctx.stroke();
    }
    /**
    * @绘制一个由两个点决定圆弧
    * ```
    * arc(点一x,点一y,点二x,点二y,半径,是否填充)
    * ```
    */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number, isFill: boolean = false) {
        this._ctx.arcTo(x1, y1, x2, y2, radius);
        return isFill ? this._ctx.fill() : this._ctx.stroke();
    }
    /**
    * @绘制线段
    * ```
    * line([{ x:90,y:90},{ x:100,y:100}],是否填充)
    * ```
    */
    public line(data: { x: number, y: number; }[], isFill: boolean = false) {
        this._ctx.beginPath();
        for (const [index, item] of data.entries()) {
            if (!index) this._ctx.moveTo(item.x, item.y);
            else this._ctx.lineTo(item.x, item.y);
        }
        return isFill ? this._ctx.fill() : this._ctx.stroke();
    }
    /**
    * @路径封装
    * ```
    * path2D(cb: (path: Path2D) => void,是否填充)
    * ```
    */
    public path2D(cb: (path: Path2D) => void, isFill: boolean = false) {
        const path = new Path2D();
        cb(path);
        isFill ? this._ctx.fill(path) : this._ctx.stroke(path);
        return path;
    }
    /**
    * @二次贝塞尔
    * ```
    * Curve2([{ x: 200, y: 300 }, { x: 150, y: 300 }, { x: 150, y: 200 }],是否填充)
    * ```
    */
    public Curve2(data: { x: number, y: number; }[], isFill: boolean = false) {
        if (data.length < 3) throw Error("data.length < 3");
        this._ctx.beginPath();
        for (let i = 0; i < data.length; i += 2) {
            if (!i) this._ctx.moveTo(data[i].x, data[i].y);
            else this._ctx.quadraticCurveTo(data[i - 1].x, data[i - 1].y, data[i].x, data[i].y);
        }
        return isFill ? this._ctx.fill() : this._ctx.stroke();
    }
    /**
    * @三次贝塞尔
    * ```
    * Curve3([{ x: 200, y: 300 }, { x: 150, y: 300 }, { x: 150, y: 200 },{ x: 200, y: 200 }],是否填充)
    * ```
    */
    public Curve3(data: { x: number, y: number; }[], isFill: boolean = false) {
        if (data.length < 4) throw Error("data.length < 4");
        this._ctx.beginPath();
        for (let i = 0; i < data.length; i += 3) {
            if (!i) this._ctx.moveTo(data[i].x, data[i].y);
            else this._ctx.bezierCurveTo(data[i - 2].x, data[i - 2].y, data[i - 1].x, data[i - 1].y, data[i].x, data[i].y);
        }
        return isFill ? this._ctx.fill() : this._ctx.stroke();
    }
    /**
    * @改变样式
    * ```
    * setStyle(cb: 改变样式 => 执行绘制逻辑 => void)
    * ```
    */
    public setStyle(cb: (ctx: CanvasRenderingContext2D) => () => void) {
        const strokeStyle = this._ctx.strokeStyle;
        const fillStyle = this._ctx.fillStyle;
        const font = this._ctx.font;
        cb(this._ctx)();
        this._ctx.strokeStyle = strokeStyle;
        this._ctx.fillStyle = fillStyle;
        this._ctx.font = font;
    }
    /**
   * @印章
   * ```
   * pattern(资源路径,改变style之后的操作,重复方式)
   * ```
   */
    public pattern(url: string, cb: () => void, repeat: string = "no-repeat") {
        const image = new Image();
        image.src = url;
        image.onload = () => {
            this._ctx.fillStyle = this._ctx.createPattern(image, repeat);
            cb();
        };
    }
    /**
   * @图片
   * ```
   * image(资源路径,绘制之后的操作,重复方式)
   * ```
   */
    public image(url: string, cb?: (image: HTMLImageElement) => void) {
        const image = new Image();
        image.src = url;
        image.onload = () => {
            this._ctx.drawImage(image, 0, 0, this._canvas.width, this._canvas.height);
            cb && cb(image);
        };
    }
    /**
  * @裁剪图片
  * ```
  * clipImage(资源路径,裁剪起始x坐标,裁剪起始y坐标,x绘制范围,y绘制范围,绘制之后的操作,重复方式)
  * ```
  */
    public clipImage(url: string, x: number, y: number, w: number, z: number, cb: () => void) {
        const image = new Image();
        image.src = url;
        image.onload = () => {
            this._ctx.drawImage(image, x, y, w, z, 0, 0, this._canvas.width, this._canvas.height);
            cb();
        };
    }
    /**
  * @创建文字
  * ```
  * createText(文字,起始x坐标,起始y坐标,最大宽度(可选))
  * ```
  */
    public createText(text: string, x: number = 0, y?: number, maxWidth?: number) {
        // this._ctx.font = "10px Microsoft YaHei";
        const measure = this._ctx.measureText(text);
        if (measure.width > this._canvas.width) {
            this._canvas.style.width = (measure.width ?? 100) + "px";
            this._canvas.width = measure.width;
        }
        console.log('measure', measure);
        this._ctx.fillText(text, x ?? measure.actualBoundingBoxDescent, y ?? measure.actualBoundingBoxAscent, maxWidth);
    }
    /**
    * @位移
    * ```
    * translate(x轴偏移,y轴偏移)
    * ```
    */
    public translate(x: number, y: number,) {
        this._ctx.translate(x, y);
    }
    /**
    * @缩放
    * ```
    * scale(x轴拉伸,y轴拉伸)
    * ```
    */
    public scale(x: number, y: number,) {
        this._ctx.scale(x, y);
    }
    /**
   * @缩放
   * ```
   * rotate(角度(弧度制))
   * ```
   */
    public rotate(rotate: number) {
        this._ctx.rotate(rotate);
    }
    /**
  * @图像合成
  * ```
  * globalCompositeOperation(模式)
  * ```
  */
    public globalCompositeOperation(type: GlobalCompositeOperation) {
        this._ctx.globalCompositeOperation = type;
    }
    /**
  * @使用Uint8ClampedArray生成图像
  * ```
  * drawFromUint8Array(数据,宽,高)
  * ```
  */
    public drawFromUint8Array(data: Uint8ClampedArray, width: number, height: number) {
        this._ctx.putImageData(new ImageData(data, width, height), 0, 0);
    }
    /**
    * @获取当前绘制的图像数据
    * ```
    * getDataFromCurrentImage()
    * ```
    */
    public getDataFromCurrentImage() {
        const imageData = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        return imageData.data;
    }
}