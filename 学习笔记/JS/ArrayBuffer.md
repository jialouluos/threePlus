# ArrayBuffer

`ArrayBuffer`表示一种通用的、固定长度的原始二进制数据缓冲区，他一般用于充当一个构造函数，通常我们不会直接使用他，而是使用他的视图:TypeArray和DataView

> TypeArray包括:Int8Array、Uint8Array、Int16Array、Float32Array等(下面将详细记录)，它提供一个数组式的接口来读写二进制数据

> DataView提供更灵活的读写二进制数据的方法、可以自定义复合格式的数据、字节序

> ArrayBuffer是一个可转移对象

## TypeArray

| 类型              | 值范围                                             | 字节大小 | 描述                                                        | Web IDL 类型        | 等价的 C 类型                 |
| ----------------- | -------------------------------------------------- | -------- | ----------------------------------------------------------- | ------------------- | ----------------------------- |
| Int8Array         | -128 到 127                                        | 1        | 8 位有符号整型（补码）                                      | byte                | int8_t                        |
| Uint8Array        | 0 到 255                                           | 1        | 8 位无符号整型                                              | octet               | uint8_t                       |
| Uint8ClampedArray | 0 到 255                                           | 1        | 8 位无符号整型（一定在 0 到 255 之间）                      | octet               | uint8_t                       |
| Int16Array        | -32768 到 32767                                    | 2        | 16 位有符号整型（补码）                                     | short               | int16_t                       |
| Uint16Array       | 0 到 65535                                         | 2        | 16 位无符号整型                                             | unsigned short      | uint16_t                      |
| Int32Array        | -2147483648 到 2147483647                          | 4        | 32 位有符号整型（补码）                                     | long                | int32_t                       |
| Uint32Array       | 0 到 4294967295                                    | 4        | 32 位无符号整型                                             | unsigned long       | uint32_t                      |
| Float32Array      | `-3.4E38` 到 `3.4E38` 并且 `1.2E-38` 是最小的正数  | 4        | 32 位 IEEE 浮点数（7 位有效数字，例如 `1.234567`）          | unrestricted float  | float                         |
| Float64Array      | `-1.8E308` 到 `1.8E308` 并且 `5E-324` 是最小的正数 | 8        | 64 位 IEEE 浮点数（16 位有效数字，例如 `1.23456789012345`） | unrestricted double | double                        |
| BigInt64Array     | -2^63 到 2^63 - 1                                  | 8        | 64 位有符号整型（补码）                                     | bigint              | int64_t (signed long long)    |
| BigUint64Array    | 0 到 2^64 - 1                                      | 8        | 64 位无符号整型                                             | bigint              | uint64_t (unsigned long long) |

> Uint8Array和Uint8ClampedArray都是JavaScript中的类型化数组，用于操作8位无符号整数的数组。他们的主要区别在于如何处理超出8位无符号整数范围（0-255）的值。
>
> 1. Uint8Array：如果试图在Uint8Array中存储超出范围的值，它会使用模（modulo）运算将这个值转换到有效范围。例如，如果你试图存储256，它会被存储为0，因为256对256取模的结果是0。
> 2. Uint8ClampedArray：如果试图在Uint8ClampedArray中存储超出范围的值，它会将这个值截断（clamp）到有效范围。也就是说，小于0的值会被存储为0，大于255的值会被存储为255。
>
> 因此，Uint8ClampedArray在处理图像数据时特别有用，因为像素的颜色值通常需要被截断到0-255的范围，而不是使用模运算。

> ArrayBuffer和SharedArrayBuffer都是JavaScript中用于处理二进制数据的对象，但它们之间有一些关键的区别。
>
> 1. ArrayBuffer：这是一个通用的、固定长度的原始二进制数据缓冲区。你不能直接操作ArrayBuffer的内容，而是需要通过类型数组对象或DataView对象来操作。
> 2. SharedArrayBuffer：这是ES2017引入的一个新特性，它类似于ArrayBuffer，但它主要用于在Web Workers之间共享二进制数据。SharedArrayBuffer的内容可以由多个Workers同时读写，这使得在多线程环境中共享数据成为可能。如果只需要在单个线程中处理二进制数据，那么ArrayBuffer就足够了。但如果你需要在多个Web Workers之间共享数据，那么应该使用SharedArrayBuffer。

### 构造函数

不能被直接实例化，例如： `new TypeArray()`(通过`Object.getPrototypeOf(Float32Array)可以取得原型TypeArray`)，会抛出错误

可以通过一个子类的构造函数来实例化，例如:`new Float32Array()`

所有子类的构造函数是通用的

```ts
//这里的TypeArray指代具体的子类构造函数
new TypedArray()
new TypedArray(length)
new TypedArray(typedArray)
new TypedArray(object)
new TypedArray(buffer)
new TypedArray(buffer, byteOffset)
new TypedArray(buffer, byteOffset, length)
```

值得注意的是：

+ 当使用 `TypedArray` 子类的实例调用时，`typedArray` 会被拷贝到一个新的类型数组中。对于非 `bigint TypeedArray` 构造函数，`typedArray` 参数仅可以是非 bigint类型（例如 `Int32Array`）。同样，对于 `bigint TypedArray` 构造函数（`BigInt64Array`或 `BigUint64Array`），`typedArray` 参数仅可以是 `bigint`类型

+ `typedArray` 中的每个值在拷贝到新数组之前都转换或截断为构造函数的相应类型。

  ```ts
  const floatArray = new Float32Array([1.1, 2.2, 3.3]);
  const uintArray = new Uint8Array(floatArray);
  console.log(uintArray);  // Uint8Array [1, 2, 3]
  ```

  

+ 新的类型化数组的长度与 `typedArray` 参数的长度相同。

+ byteOffset和length是用于创建一个新的TypedArray视图，该视图引用同一ArrayBuffer，但可能有不同的开始位置和长度。

+ byteOffset：这是一个可选参数，表示新的视图开始的字节偏移量。如果未指定，新的视图将从ArrayBuffer的开始位置开始。byteOffset必须是ArrayBuffer里每个元素的字节长度的倍数，否则会抛出一个异常。

+ length：这是一个可选参数，表示新的视图的长度（以元素个数，而非字节为单位）。如果未指定，新的视图将延续到ArrayBuffer的末尾。

  ```ts
  const buffer = new ArrayBuffer(16);
  const fullView = new Uint32Array(buffer);
  //这将会设置ArrayBuffer的内容为[0, 1, 2, 3]（因为Uint32Array的每个元素占用4字节，所以16字节的ArrayBuffer可以存储4个Uint32Array元素）。
  for (var i = 0; i < fullView.length; i++) {
      fullView[i] = i;
  }
  // 创建一个从第4字节开始，长度为2的新视图
  const partialView = new Uint32Array(buffer, 4, 2);//然后partialView的值将是[1, 2]。
  
  ```

## DateView

**`DataView`** 视图是一个可以从二进制 `ArrayBuffer`对象中读写多种数值类型的底层接口，使用它时，不用考虑不同平台的字节序问题。默认情况下，DataView使用大端字节序来读取和写入数据，但你也可以选择使用小端字节序。这使得DataView成为处理跨平台二进制数据的理想选择。DataView不要求数据必须对齐，这意味着你可以从任意字节开始读取任意类型的数据。

这是一个使用DateBuffer的示例

```ts
// 创建一个包含两个32位浮点数的ArrayBuffer
let buffer = new ArrayBuffer(8);

// 创建一个DataView，用于操作这个ArrayBuffer
let view = new DataView(buffer);

// 使用DataView向ArrayBuffer写入两个浮点数
view.setFloat32(0, 1.2, true); // 小端字节序
view.setFloat32(4, 3.4, true); // 小端字节序

// 使用DataView从ArrayBuffer读取这两个浮点数
let num1 = view.getFloat32(0, true); // 小端字节序
let num2 = view.getFloat32(4, true); // 小端字节序

console.log(num1); // 输出：1.2
console.log(num2); // 输出：3.4

```

在这个例子中，我们使用的是32位浮点数，也就是说每个浮点数占用4个字节。当我们使用DataView的setFloat32方法写入第一个浮点数时，我们从ArrayBuffer的起始位置（即索引0）开始写入，写入4个字节。

当我们准备写入第二个浮点数时，我们需要跳过已经写入的4个字节，所以我们从索引4的位置开始写入。这就是为什么我们在setFloat32方法中给出的索引是4。也即是写入数据的索引是**浮点数对应的字节索引起始下标**

如果我们给出的索引是5，那么我们将从ArrayBuffer的第5个字节开始写入浮点数，这将覆盖部分第一个浮点数的数据，并且由于我们没有足够的空间来存储完整的第二个浮点数，所以也会导致数据错误。

所以，当我们使用DataView来操作ArrayBuffer时，我们需要确保我们正确地计算了每个数据的位置和大小，以避免数据覆盖和错误。

### 字节序

字节序，也被称为端序或者字节对齐方式，是计算机科学中用于表示多字节数据类型如整数、浮点数等在内存中如何存储的方式。

字节序主要有两种类型：大端字节序（Big-Endian）和小端字节序（Little-Endian）。

1. 大端字节序：最高有效字节（Most Significant Byte，MSB）存储在最低的内存地址，最低有效字节（Least Significant Byte，LSB）存储在最高的内存地址。这种方式类似我们阅读英文的方式，从左到右，从高位到低位。
2. 小端字节序：最低有效字节（LSB）存储在最低的内存地址，最高有效字节（MSB）存储在最高的内存地址。这种方式类似我们阅读中文的方式，从右到左，从低位到高位。

不同的计算机架构可能会使用不同的字节序，在处理跨平台的二进制数据时，需要特别注意字节序的问题，因为不同的字节序解析出的数据可能会有很大的差异。

举个例子，用不同字节序存储数字 `0x12345678`（即十进制中的 305 419 896）：

- *little-endian*：`0x78 0x56 0x34 0x12`
- *big-endian*：`0x12 0x34 0x56 0x78`
- *mixed-endian*（文物，非常罕见）：`0x34 0x12 0x78 0x56`

### 构造函数

我想你可能是指DataView的构造函数。DataView的构造函数可以接受三个参数：

1. buffer：必需，一个ArrayBuffer对象，DataView将在这个ArrayBuffer对象上进行读写操作。

2. byteOffset：可选，一个整数，表示DataView开始读写的起始位置。默认值为0。

3. byteLength：可选，一个整数，表示DataView的长度，即从byteOffset开始，包含多少个字节。如果省略，那么DataView将包含从byteOffset开始到buffer末尾的所有字节。

示例：

```javascript
// 创建一个ArrayBuffer
const buffer = new ArrayBuffer(16);

// 创建一个DataView，包含buffer的所有字节
const view1 = new DataView(buffer);

// 创建一个DataView，从buffer的第8个字节开始，包含8个字节
const view2 = new DataView(buffer, 8);

// 创建一个DataView，从buffer的第4个字节开始，包含4个字节
const view3 = new DataView(buffer, 4, 4);
```
