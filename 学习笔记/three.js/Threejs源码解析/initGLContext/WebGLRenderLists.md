# WebGLRenderList

## WebGLRenderList( properties )

```js
const renderItems = [];//渲染队列
let renderItemsIndex = 0;//渲染次序

const opaque = [];//不透明
const transmissive = [];//穿透
const transparent = [];//透明

const defaultProgram = { id: - 1 };

function init() {

    renderItemsIndex = 0;//初始化

    opaque.length = 0;
    transmissive.length = 0;
    transparent.length = 0;

}
```

## getNextRenderItem( object, geometry, material, groupOrder, z, group )

```js
let renderItem = renderItems[ renderItemsIndex ];//得到当前的渲染对象
const materialProperties = properties.get( material );//得到材质属性
if ( renderItem === undefined ) {//对象为空
    renderItem = {
        id: object.id,
        object: object,
        geometry: geometry,
        material: material,
        program: materialProperties.program || defaultProgram,
        groupOrder: groupOrder,
        renderOrder: object.renderOrder,
        z: z,
        group: group
    };
    renderItems[ renderItemsIndex ] = renderItem;
}
else {
    renderItem.id = object.id;
    renderItem.object = object;
    renderItem.geometry = geometry;
    renderItem.material = material;
    renderItem.program = materialProperties.program || defaultProgram;
    renderItem.groupOrder = groupOrder;
    renderItem.renderOrder = object.renderOrder;
    renderItem.z = z;
    renderItem.group = group;
}
renderItemsIndex ++;
return renderItem;
```

## push unshift sort

```js
function push( object, geometry, material, groupOrder, z, group ) {
    const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );
    if ( material.transmission > 0.0 ) {//分类插入
        transmissive.push( renderItem );
    } else if ( material.transparent === true ) {
        transparent.push( renderItem );
    } else {
        opaque.push( renderItem );
    }
}
function unshift( object, geometry, material, groupOrder, z, group ) {//分类弹出
    const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );
    if ( material.transmission > 0.0 ) {
        transmissive.unshift( renderItem );
    } else if ( material.transparent === true ) {
        transparent.unshift( renderItem );
    } else {
        opaque.unshift( renderItem );
    }
}
function sort( customOpaqueSort, customTransparentSort ) {//进行排序
    //非透明使用 从近到远
    //透明的使用 从远到近
    //透明材质不考虑 program 和 materialid
    if ( opaque.length > 1 ) opaque.sort( customOpaqueSort || painterSortStable );
    if ( transmissive.length > 1 ) transmissive.sort( customTransparentSort || reversePainterSortStable );
    if ( transparent.length > 1 ) transparent.sort( customTransparentSort || reversePainterSortStable );
}
```

## sort

```js
function painterSortStable( a, b ) {
    if ( a.groupOrder !== b.groupOrder ) {
        return a.groupOrder - b.groupOrder;
    } else if ( a.renderOrder !== b.renderOrder ) {
        return a.renderOrder - b.renderOrder;
    } else if ( a.program !== b.program ) {
        return a.program.id - b.program.id;
    } else if ( a.material.id !== b.material.id ) {
        return a.material.id - b.material.id;
    } else if ( a.z !== b.z ) {
        return a.z - b.z;
    } else {
        return a.id - b.id;
    }
}
function reversePainterSortStable( a, b ) {
    if ( a.groupOrder !== b.groupOrder ) {
        return a.groupOrder - b.groupOrder;
    } else if ( a.renderOrder !== b.renderOrder ) {
        return a.renderOrder - b.renderOrder;
    } else if ( a.z !== b.z ) {
        return b.z - a.z;
    } else {
        return a.id - b.id;
    }
}
```

# WebGLRenderLists

```
let lists = new WeakMap();
```

## get( scene, renderCallDepth )

```js
let list;
if ( lists.has( scene ) === false ) {//是否已经初始化绑定
    list = new WebGLRenderList( properties );
    lists.set( scene, [ list ] );
} else {
    if ( renderCallDepth >= lists.get( scene ).length ) {
        list = new WebGLRenderList( properties );
        lists.get( scene ).push( list );
    } else {
        list = lists.get( scene )[ renderCallDepth ];
    }
}
return list;
```

## dispose

```
lists = new WeakMap();
```

## 返回一个工厂函数

```js
return {
   get: get,
   dispose: dispose
};
```