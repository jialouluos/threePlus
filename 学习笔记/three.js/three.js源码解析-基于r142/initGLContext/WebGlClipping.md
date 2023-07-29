# WebGlClipping

## 函数作用

管理平面裁剪，通过object3D.material传入裁剪平面信息，该对象负责整理裁剪平面信息，便于后续传入着色器

## 入口函数

```ts
/**
*@properties 由渲染器内部使用，以跟踪各种子对象属性。采用WeakMap即键（Object弱引用）值（any）的方式
**/
function WebGLClipping(properties) {
    
   this.uniform = uniform;//向顶点传递裁剪平面信息
    //返回统计信息以及操作方法
}
```

## 核心函数-projectPlanes(planes, camera, dstOffset, skipTransform)

```ts
function projectPlanes(planes, camera, dstOffset, skipTransform) {
    const nPlanes = planes !== null ? planes.length : 0;//剪裁面集合
    let dstArray = null;
    if (nPlanes !== 0) {
        dstArray = uniform.value;
        if (skipTransform !== true || dstArray === null) {
            const flatSize = dstOffset + nPlanes * 4,
                  viewMatrix = camera.matrixWorldInverse;//视图矩阵
            	/**
                 *  getNormalMatrix(matrix4) {return this.setFromMatrix4(matrix4).invert().transpose();}
                 */
            viewNormalMatrix.getNormalMatrix(viewMatrix);//得到视图矩阵的左上3x3矩阵的逆转置矩阵
            if (dstArray === null || dstArray.length < flatSize) {
                dstArray = new Float32Array(flatSize);
            }
            for (let i = 0, i4 = dstOffset; i !== nPlanes; ++i, i4 += 4) {
                plane.copy(planes[i]).applyMatrix4(viewMatrix, viewNormalMatrix);//转换到视图空间
                //一个平面的表示可以通过平面朝向以及一个常量来确定
                plane.normal.toArray(dstArray, i4);//提取平面的法向量
                dstArray[i4 + 3] = plane.constant;//提取constant，平面朝法向量方向的偏移量
            }
        }
        uniform.value = dstArray;
        uniform.needsUpdate = true;
    }
    scope.numPlanes = nPlanes;
    scope.numIntersection = 0;
    return dstArray;
}
```

## 返回值

以类的形式存在，不存在返回值