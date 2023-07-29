# WebGLRenderList

## 函数作用

主要用于排序一个scene中所有需要被渲染的物体

## 入口函数

```ts
function WebGLRenderList() {
    const renderItems = [];
    let renderItemsIndex = 0;
    const opaque = [];
    const transmissive = [];
    const transparent = [];
    //返回整理之后的不同类型的物体数组和一些操作方法
}
```

## 核心逻辑

```ts
function init() {
    renderItemsIndex = 0;
    opaque.length = 0;//不透明物体
    transmissive.length = 0;//透射物体
    transparent.length = 0;//透明物体
}
function getNextRenderItem(object, geometry, material, groupOrder, z, group) {
    let renderItem = renderItems[renderItemsIndex];
    if (renderItem === undefined) {
        renderItem = {
            id: object.id,
            object: object,
            geometry: geometry,
            material: material,
            groupOrder: groupOrder,
            renderOrder: object.renderOrder,
            z: z,
            group: group
        };
        renderItems[renderItemsIndex] = renderItem;
    } else {
        renderItem.id = object.id;
        renderItem.object = object;
        renderItem.geometry = geometry;
        renderItem.material = material;
        renderItem.groupOrder = groupOrder;
        renderItem.renderOrder = object.renderOrder;
        renderItem.z = z;
        renderItem.group = group;
    }
    renderItemsIndex++;
    return renderItem;
}
function push(object, geometry, material, groupOrder, z, group) {
    const renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);
    if (material.transmission > 0.0) {
        transmissive.push(renderItem);//透射-能看到被物体遮挡的场景的程度
    } else if (material.transparent === true) {
        transparent.push(renderItem);//透明-物体能看到的程度
    } else {
        opaque.push(renderItem);
    }
}
function unshift(object, geometry, material, groupOrder, z, group) {
    const renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);
    if (material.transmission > 0.0) {
        transmissive.unshift(renderItem);
    } else if (material.transparent === true) {
        transparent.unshift(renderItem);
    } else {
        opaque.unshift(renderItem);
    }
}
function sort(customOpaqueSort, customTransparentSort) {//排序
    if (opaque.length > 1) opaque.sort(customOpaqueSort || painterSortStable);
    if (transmissive.length > 1) transmissive.sort(customTransparentSort || reversePainterSortStable);
    if (transparent.length > 1) transparent.sort(customTransparentSort || reversePainterSortStable);
}
function finish() {//完成物体整理后会执行，用于清理renderItems
    for (let i = renderItemsIndex, il = renderItems.length; i < il; i++) {
        const renderItem = renderItems[i];
        if (renderItem.id === null) break;
        renderItem.id = null;
        renderItem.object = null;
        renderItem.geometry = null;
        renderItem.material = null;
        renderItem.group = null;
    }
}
```

## 返回值

```ts
 return {
        opaque: opaque,
        transmissive: transmissive,
        transparent: transparent,
        init: init,
        push: push,
        unshift: unshift,
        finish: finish,
        sort: sort
    };
```