# Extension

## EXT_color_buffer_float

>   允许WebGL程序使用浮点数格式来存储颜色值应用于(WebGL2默认支持浮点数纹理和帧缓冲区对象（FBO）)

>   在默认情况下，WebGL只支持标准的8位颜色缓冲区格式。但是，某些应用程序需要更高精度的颜色值，以便进行更精确的计算和渲染，使用EXT_color_buffer_float扩展，WebGL程序可以使用RGBA16F和RGBA32F格式的颜色缓冲区，分别使用16位和32位浮点数来存储每个像素的颜色值。这使得WebGL程序可以进行更精确的颜色计算，从而获得更高质量的渲染结果

```js
var gl = canvas.getContext("webgl");
// 检查扩展是否可用
if (!gl.getExtension("EXT_color_buffer_float")) {
  // 扩展不可用
  console.log("EXT_color_buffer_float extension not available");
}
// 扩展可用，在渲染之前开启颜色缓冲区的浮点数格式
var ext = gl.getExtension("EXT_color_buffer_float");
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
```

>    sampler2D对象u_colorTexture将使用EXT_color_buffer_float扩展创建的浮点数格式纹理对象进行初始化

```glsl
precision highp float;
uniform sampler2D u_colorTexture;
varying vec2 v_texcoord;

void main() {
  vec4 color = texture2D(u_colorTexture, v_texcoord);
  // 使用浮点数格式的颜色值进行计算和渲染
}
```

>   在WebGL中手动设置颜色值为浮点数，但是在默认情况下，WebGL会将这些浮点数转换为标准的8位颜色值，仍然只能获得8位的精度，这可能会导致精度损失和渲染结果的不准确性

>   three.js新版本优先采用webgl2，所以我们只需要传入浮点类型数据并设置`precision`为`highp`即可

>   但是我在测试时并未发现Uint8Array数据渲染出来的结果与Float32Array数据渲染出来的结果有什么差异，转而采用直接编写webgl代码，发现画面绘制不出来。也不知道是什么问题了，这里贴上写的核心代码(我可以保证改为Uint8可以渲染出结果)

```glsl
 //fragmentShader
precision highp float;
uniform sampler2D u_Sampler;
varying vec2 v_Texture;
void main(){
   gl_FragColor =texture2D(u_Sampler,v_Texture);
}
```

```js
gl.Texture = gl.createTexture();//创建纹理对象
gl.Sampler = gl.getUniformLocation(gl.ShaderProgram, "u_Sampler");//获取u_Sampler位置
 const image = new Image();
image.onload = function () {
			//const ctx = gl.getExtension('OES_texture_float');//webgl环境解开注释
			//const cxk2 = gl.getExtension("WEBGL_color_buffer_float");//webgl环境解开注释
     		const floatData = new Float32Array(image.width * image.height * 4);
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, image.width, image.height).data;
            for (let i = 0; i < pixels.length; i++) {
                floatData[i] = pixels[i] / 255;
            }
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);//进行Y轴反转
            gl.activeTexture(gl.TEXTURE0);//开启0号纹理单元
            gl.bindTexture(gl.TEXTURE_2D, gl.Texture);//将本地Texture绑定到纹理对象上
            //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.FLOAT, floatData);//webgl环境解开注释
       	   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, image.width, image.height, 0, gl.RGBA, gl.FLOAT, floatData);//webgl2
            gl.uniform1i(gl.Sampler, 0);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
```

>   待测试: 应用于帧缓冲对象，且webgl2也需要手动开启？

## OES_vertex_array_object

>  顶点数组对象 可以将顶点属性状态捆绑到单个对象中，以便在多次渲染之间轻松地保存和恢复状态，而无需重新绑定缓冲区和重新设置顶点属性指针

`OES_vertex_array_object` 扩展会记录以下 WebGL API 调用期间的状态：

1. `gl.bindVertexArrayOES()`: 绑定顶点数组对象到 WebGL 上下文中。
2. `gl.createVertexArrayOES()`: 创建一个新的顶点数组对象。
3. `gl.deleteVertexArrayOES()`: 删除一个顶点数组对象。
4. `gl.isVertexArrayOES()`: 检查一个对象是否为顶点数组对象。
5. `gl.enableVertexAttribArray()`: 启用一个顶点属性数组。
6. `gl.disableVertexAttribArray()`: 禁用一个顶点属性数组。
7. `gl.vertexAttribPointer()`: 指定一个顶点属性数组的指针。
8. `gl.vertexAttribIPointer()`: 指定一个顶点属性数组的指针 (用于整数类型)。
9. `gl.vertexAttribDivisor()`: 指定一个顶点属性数组的实例分割率。
10. `gl.bindBuffer()`: 绑定缓冲区对象到 WebGL 上下文中。

```ts
// 获取扩展对象
const ext = gl.getExtension('OES_vertex_array_object');

// 创建和设置顶点缓冲区
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  // 立方体顶点数据
]), gl.STATIC_DRAW);

// 创建顶点数组对象
const vao = ext.createVertexArrayOES();

// 绑定顶点数组对象
ext.bindVertexArrayOES(vao);

// 绑定顶点缓冲区对象
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

// 启用顶点属性
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);

// 绑定顶点属性指针
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// 解绑顶点数组对象
ext.bindVertexArrayOES(null);

// 在每个帧中渲染立方体
function render() {
  // 绑定顶点数组对象
  ext.bindVertexArrayOES(vao);

  // 绘制立方体
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  // 解绑顶点数组对象
  ext.bindVertexArrayOES(null);

  requestAnimationFrame(render);
}
```

记录bindBuffer调用状态的原因是：如果存在多个缓冲对象，会通过bindBuffer来切换缓冲对象与顶点缓冲区的绑定，所以我们需要记录缓冲区绑定的状态

## ANGLE_instanced_arrays

> 允许在一次绘制调用中渲染多个实例。这种技术被称为实例化渲染，可以大大提高渲染效率，特别是当需要渲染大量相同的对象时。

> 在标准的WebGL中，如果想渲染多个对象，通常需要为每个对象进行一次绘制调用。这意味着需要为每个对象设置属性，然后调用drawArrays或drawElements方法。这种方式在渲染大量对象时可能会非常慢。
>
> 而使用ANGLE_instanced_arrays扩展，可以在一次绘制调用中渲染多个对象。你只需要设置一次属性，然后调用drawArraysInstancedANGLE或drawElementsInstancedANGLE方法，指定要渲染的实例数量。这样，GPU将自动为每个实例生成一个副本，并使用设置的属性进行渲染。
>
> 此外，ANGLE_instanced_arrays扩展还提供了vertexAttribDivisorANGLE方法，它允许控制属性在实例之间如何变化。例如，你可以设置一个属性在每个实例中都有不同的值，或者在所有实例中都有相同的值。
>
> 总的来说，ANGLE_instanced_arrays扩展提供了一种高效的方式来渲染大量相同的对象。

### vertexAttribDivisorANGLE

该方法用于设置分频器

分频器（Divisor）是实例化渲染中的一个重要概念，它决定了属性值在实例之间如何变化。

分频器的值是一个整数，它表示我们在多少个实例之后改变属性值。例如：

1. 如果分频器为0，那么所有实例将使用相同的属性值。这就像我们没有使用实例化渲染一样。
2. 如果分频器为1，那么每个实例将使用不同的属性值。这是实例化渲染的常见用法，它允许我们为每个实例设置不同的属性，例如位置、旋转等。
3. 如果分频器为2，那么每两个实例将使用相同的属性值，然后再改变。也就是说，第1和第2个实例使用相同的属性值，第3和第4个实例使用另一个属性值，以此类推。
4. 如果分频器为3，那么每三个实例将使用相同的属性值，然后再改变。也就是说，第1、第2和第3个实例使用相同的属性值，第4、第5和第6个实例使用另一个属性值，以此类推。

一般我们设置为1，也即是绘制一个实例改变一次属性值，这里的实例指的是绘制一个mode，如果mode为三角形，则表示绘制三个点才读取下一个属性值

例如

```ts
//存在这样的translation数据
const translation = new Float32Array([
    2, 0, 0,
    0, 2, 0,
    0, 0, 2
]);
const position = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 0
]);
ext.vertexAttribDivisorANGLE(location, 1);//webgl1 设置分频器为1也即是绘制一个实例改变一次属性值
ext.drawArraysInstancedANGLE(this.gl.TRIANGLES, 0, 3, 3);//(model, first, count, 实例的数量)
//在绘制第一个三角形时，由于一个三角形的position是三个attribute，而如果设置了translation的分频器为1，则这三次都是只取第一个translation值(2,0,0);
//第一次执行顶点着色器: position:(1,0,0) translation(2,0,0)
//第二次执行顶点着色器: position:(0,1,0) translation(2,0,0)
//第三次执行顶点着色器: position:(0,0,0) translation(2,0,0)
//第四次执行顶点着色器时，position数据将会回到数组的开始，也就是(1,0,0)，而translation数据将会取数组的下一个值，以此类推

//它的工作原理是让你告诉WebGL你想绘制多少次相同的物体（实例的数量）， 对于每个attribute，你可以让它每次调用顶点着色器时迭代到缓冲区的 下一个值（默认行为），或者是每绘制N（N通常为1）个实例时才迭代到 下一个值。
```



