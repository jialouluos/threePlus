# Object3D

## 基类

### EventDispathcher

```js
addEventListener( type, listener ) {//添加一个监听事件
    //关键属性 this._listeners用于存放事件集
}
hasEventListener( type, listener ) {//判断是否存在该事件
    return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;
}
removeEventListener( type, listener ) {//移除该事件
}
dispatchEvent( event ) {//
    event.target = this;
    //array是this._listeners的深拷贝
    for ( let i = 0, l = array.length; i < l; i ++ ) {
        array[ i ].call( this, event );//call() 方法使用一个指定的 this 值（这里为event）和单独给出的一个或多个参数来调用一个函数。
    }
}
```

## 对象方法

+   constructor

    ```js
    Object3D.DefaultUp = new Vector3( 0, 1, 0 );
    Object3D.DefaultMatrixAutoUpdate = true;
    Object3D.prototype.isObject3D = true;
    constructor() {
        super();//调用父对象的构造函数
        Object.defineProperty( this, 'id', { value: _object3DId ++ } );//在构造器上声明一个只读属性
        /**
        *Object.defineProperty(obj, prop, descriptor)
        *obj：必需。目标对象
    	*prop：必需。需定义或修改的属性的名字
    	*descriptor：必需。目标属性所拥有的特性
    	*descriptor：value属性对应的值,可以使任意类型的值，默认为undefined，属性的值是否可以被重写。writable设置为true可以被重写；设置为false，不能被重写。默认为false。enumerable此属性是否可以被枚举（使用for...in或Object.keys()）。设置为true可以被枚举；设置为false，不能被枚举。默认为false。configurable是否可以删除目标属性或是否可以再次修改属性的特性（writable, configurable, enumerable）。设置为true可以被删除或可以重新设置特性；设置为false，不能被可以被删除或不可以重新设置特性。默认为false。以上属性如果不传入，则默认为false
        **/
        this.uuid = MathUtils.generateUUID();//获取一个随机值
        this.name = '';//名称
        this.type = 'Object3D';//类型
        this.parent = null;//父对象
        this.children = [];//子代
        this.up = Object3D.DefaultUp.clone();//默认朝向
    	//采用definePropertys方法声明了position、rotation、quaternion、scale可读可写可枚举，modelViewMatrix默认值为Matrix4，normalMatrix默认值为Matrix3
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();
        this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
        this.matrixWorldNeedsUpdate = false;
        this.layers = new Layers();
        this.visible = true;
        this.castShadow = false;
        this.receiveShadow = false;
        this.frustumCulled = true;
        this.renderOrder = 0;
        this.animations = [];
        this.userData = {};
        rotation._onChange( onRotationChange );//绑定改变事件
        quaternion._onChange( onQuaternionChange );//绑定改变事件
        function onRotationChange() {//这里保证了当旋转属性变换时，四元数也会随着改变
            quaternion.setFromEuler( rotation, false );//false表示不执行回调函数_onChange
        }
        function onQuaternionChange() {//这里保证了当四元数属性变换时，旋转属性也会随着改变
            rotation.setFromQuaternion( quaternion, undefined, false );//undefined所占参数表示order(XYZ,YXZ...),false代表不执行回调函数
        }
    }
    ```

+   updateMatrix

    ```js
    updateMatrix() {
        this.matrix.compose( this.position, this.quaternion, this.scale );//将此矩阵设置为由position、 quaternion和scale组成的变换。四元数控制旋转属性。函数作用为更新本地矩阵
        this.matrixWorldNeedsUpdate = true;//世界矩阵需要更新
    }
    ```

+   applyMatrix4

    ```js
    applyMatrix4( matrix ) {
        if ( this.matrixAutoUpdate ) this.updateMatrix();
        this.matrix.premultiply( matrix );//根据参入参数matrix来更新本地矩阵
        this.matrix.decompose( this.position, this.quaternion, this.scale );//再更新一次本地矩阵和世界矩阵
    }
    premultiply( m ) {
        return this.multiplyMatrices( m, this );//乘法矩阵
    }
    //与此相同的方法还有applyQuaternion==>更新四元数属性，
    //跟四元数有关的方法还有
    .setRotationFromAxisAngle(axis, angle){//axis是一个归一化向量，angle表示角度
        this.quaternion.setFromAxisAngle( axis, angle );
    }
    
    .setRotationFromEuler(euler){//euler表示一个欧拉对象
        this.quaternion.setFromEuler( euler, true );
    }
    .setRotationFromMatrix(matrix){//materix表示一个4x4矩阵，并且该矩阵不能具有缩放属性
        this.quaternion.setFromRotationMatrix( m );
    }
    .setRotationFromQuaternion(quaternion){//quaternion表示一个四元数，必须归一化
        this.quaternion.copy( q );
    }
    .rotateOnAxis(axis,angle){//axis是一个归一化向量，angle表示角度
        _q1.setFromAxisAngle( axis, angle );
        this.quaternion.multiply( _q1 );//quaternion X _q1
        //轴——对象空间中的归一化向量。
        //角度——以弧度为单位的角度。
        //沿对象空间中的轴旋转对象。假定轴已归一化。
    }
    rotateOnWorldAxis( axis, angle ) {
        //轴——世界空间中的归一化向量。
    	//角度——以弧度为单位的角度。
    	//沿世界空间中的轴旋转对象。假定轴已归一化。方法假定没有旋转的父级。
        _q1.setFromAxisAngle( axis, angle );
        this.quaternion.premultiply( _q1 );//_q1 X quaternion
        return this;
    }
    //rotateX、rotateY、rotateZ都是调用了rotateOnAxis
    translateOnAxis( axis, distance ) {
        //轴——对象空间中的归一化向量。
        //距离——要平移的距离。
        //沿对象空间中的轴按距离平移对象。假定轴已归一化。
        _v1.copy( axis ).applyQuaternion( this.quaternion );
        this.position.add( _v1.multiplyScalar( distance ) );
        return this;
    }
    //translateX,translateY,translateZdou都是调用了translateOnAxis
    
    ```

+   localToWorld

    ```js
    localToWorld( vector ) {//将向量从局部空间转换到该对象的世界空间。
        return vector.applyMatrix4( this.matrixWorld );
    }
    worldToLocal( vector ) {//将向量从世界空间转换到该对象的局部空间。
        return vector.applyMatrix4( _m1.copy( this.matrixWorld ).invert() );
    }
    ```
    
    
    
+   updateWorldMatrix

    ```js
    updateWorldMatrix( updateParents, updateChildren ) {//参数为两个布尔值
        const parent = this.parent;
        if ( updateParents === true && parent !== null ) {
            parent.updateWorldMatrix( true, false );//递归调用
        }
        if ( this.matrixAutoUpdate ) this.updateMatrix();//更新本地和世界矩阵
        if ( this.parent === null ) {
            this.matrixWorld.copy( this.matrix );//如果不存在父对象就将本地矩阵作为世界矩阵
        } else {
            this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );//父对象的世界矩阵和自己的矩阵相乘得到自己的世界矩阵
        }
        // update children
        if ( updateChildren === true ) {
            const children = this.children;
            for ( let i = 0, l = children.length; i < l; i ++ ) {//递归遍历子对象
                children[ i ].updateWorldMatrix( false, true );
            }
        }
    }
    ```

+   lookAt

    ```js
    lookAt( x, y, z ) {
        // This method does not support objects having non-uniformly-scaled parent(s)
        if ( x.isVector3 ) {
            _target.copy( x );
        } else {
            _target.set( x, y, z );
        }
        const parent = this.parent;
        this.updateWorldMatrix( true, false );//更新父对象的世界矩阵
        _position.setFromMatrixPosition( this.matrixWorld );//得到世界坐标系坐标
        if ( this.isCamera || this.isLight ) {//是否是灯光或者相机对象
            _m1.lookAt( _position, _target, this.up );//第一个参数代表eye(物体坐标),第二个参数代表target(焦点),up(相机朝向)
        } else {
            _m1.lookAt( _target, _position, this.up );//对于几何对象来说，视点减去焦点得到的方向向量与相机的坐标系的N向量轴方向相反，为了保持统一坐标轴方向，这里选择焦点减去视点，如果仍然采用视点减去焦点，则会得到一个正背面相反的几何体(即原本在相机中处于正面的几何体，会被解析为背面从而看不见，原本在相机中处于背面的几何体会被解析成正面，这里的解析只针对于正背可视面)
        }
        this.quaternion.setFromRotationMatrix( _m1 );//更新四元数
        if ( parent ) {
            _m1.extractRotation( parent.matrixWorld );//将提供的矩阵m的旋转分量提取到该矩阵的旋转分量中(替换)
            _q1.setFromRotationMatrix( _m1 );
            this.quaternion.premultiply( _q1.invert() );//四元数得invert方法使得_q1._x*=-1;_q1._y*=-1;;_q1._z*=-1;
            //将自身的四元数乘父对象的四元数，更新自身的旋转属性
        }
    }
    ```

+   add

    ```js
    add( object ) {
        if ( arguments.length > 1 ) {
            for ( let i = 0; i < arguments.length; i ++ ) {//这里代表了 支持一次性传入多个参数
                this.add( arguments[ i ] );
            }
            return this;
        }
        if ( object === this ) {
            console.error( 'THREE.Object3D.add: object can\'t be added as a child of itself.', object );
            return this;
        }
        if ( object && object.isObject3D ) {
            if ( object.parent !== null ) {
                object.parent.remove( object );//先从原来的父对象里移除该对象
            }
            object.parent = this;//再将该对象的父对象指向自身
            this.children.push( object );//添加进自身的children数组
            object.dispatchEvent( _addedEvent );//触发监听事件(add事件)
        } else {
            console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );
        }
        return this;
    }
    ```

+   remove

    ```js
    remove( object ) {
        if ( arguments.length > 1 ) {
            for ( let i = 0; i < arguments.length; i ++ ) {//支持多对象移除
                this.remove( arguments[ i ] );
            }
            return this;
        }
        const index = this.children.indexOf( object );//查询是否存在
        if ( index !== - 1 ) {
            object.parent = null;
            this.children.splice( index, 1 );
            object.dispatchEvent( _removedEvent );//触发监听事件(移除事件)
        }
        return this;
    }
    removeFromParent() {//对象调用该方法使父对象将其remove
        const parent = this.parent;
        if ( parent !== null ) {
            parent.remove( this );
        }
        return this;
    }
    clear() {//移除其所有子对象的父指针
        for ( let i = 0; i < this.children.length; i ++ ) {
            const object = this.children[ i ];
            object.parent = null;
            object.dispatchEvent( _removedEvent );
        }
        this.children.length = 0;
        return this;
    }
    ```

+   attach

    ```js
    attach( object ) {
        //添加对象作为 this 的子对象，同时保持对象的世界变换(保持对象的世界矩阵值不变)。
        this.updateWorldMatrix( true, false );
        _m1$1.copy( this.matrixWorld ).invert();//对this取逆
        if ( object.parent !== null ) {
            object.parent.updateWorldMatrix( true, false );
            _m1$1.multiply( object.parent.matrixWorld );//和对象的父对象的世界矩阵进行相乘，消除父对象的矩阵对子对象的世界矩阵影响
        }
        object.applyMatrix4( _m1$1 );//将逆矩阵和父对象平衡之后的矩阵与子对象进行相乘，保证子对象的世界矩阵不变
        this.add( object );
        object.updateWorldMatrix( false, true );
        return this;
    }
    ```

+   getObjectByProperty

    ```js
    getObjectById( id ) {//通过ID获取
        return this.getObjectByProperty( 'id', id );
    }
    getObjectByName( name ) {//通过name获取
        return this.getObjectByProperty( 'name', name );
    }
    getObjectByProperty( name, value ) {//实际执行方式
        if ( this[ name ] === value ) return this;//如果是本身，返回本身
        for ( let i = 0, l = this.children.length; i < l; i ++ ) {//遍历其所有的子代
            const child = this.children[ i ];
            const object = child.getObjectByProperty( name, value );
            if ( object !== undefined ) {
                return object;
            }
        }
        return undefined;
    }
    ```

+   getWorldPosition

    ```js
    getWorldPosition( target ) {
        this.updateWorldMatrix( true, false );
        return target.setFromMatrixPosition( this.matrixWorld );//从世界矩阵中提取坐标信息
    }
    getWorldQuaternion( target ) {
        this.updateWorldMatrix( true, false );
        this.matrixWorld.decompose( _position, target, _scale );//将世界矩阵分解为坐标 旋转 缩放3个分量
        return target;
    }
    getWorldScale( target ) {//原理同上
        this.updateWorldMatrix( true, false );
        this.matrixWorld.decompose( _position, _quaternion, target );
        return target;
    }
    getWorldDirection( target ) {//得到对象在世界空间中的正 z 轴方向。
        this.updateWorldMatrix( true, false );
        const e = this.matrixWorld.elements;
        return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();
    }
    ```

+   traverse

    ```js
    traverse( callback ) {//获取对象之后执行回调函数
        callback( this );
        const children = this.children;
        for ( let i = 0, l = children.length; i < l; i ++ ) {//遍历其所有子代
            children[ i ].traverse( callback );
        }
    }
    traverseVisible( callback ) {//跳过隐藏的子代
        if ( this.visible === false ) return;
        callback( this );
        const children = this.children;
        for ( let i = 0, l = children.length; i < l; i ++ ) {
            children[ i ].traverseVisible( callback );
        }
    }
    traverseAncestors( callback ) {//往上遍历所有父代
        const parent = this.parent;
        if ( parent !== null ) {
            callback( parent );
            parent.traverseAncestors( callback );
        }
    }
    ```

+   updateMatrixWorld

    ```js
    //区分updateWorldMatrix( updateParents, updateChildren ){}方法
    //updateWorldMatrix方法用于更新世界矩阵
    updateMatrixWorld( force ) {//官方上给的解释是更新本地变换，但是他与updateWorldMatrix的区别就
    /** 
    if ( updateParents === true && parent !== null ) {
    	parent.updateWorldMatrix( true, false );
    }
    **/
    //这一行代码，所以我认为该方法时更新了自己以及他的后代的本地矩阵以及世界矩阵
        if ( this.matrixAutoUpdate ) this.updateMatrix();
        if ( this.matrixWorldNeedsUpdate || force ) {
            if ( this.parent === null ) {
                this.matrixWorld.copy( this.matrix );
            } else {
                this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );
            }
            this.matrixWorldNeedsUpdate = false;
            force = true;
        }
        // update children
        const children = this.children;
        for ( let i = 0, l = children.length; i < l; i ++ ) {
            children[ i ].updateMatrixWorld( force );
        }
    }
    ```

+   clone()

    ```js
    clone( recursive ) {
    	return new this.constructor().copy( this, recursive );
    }
    ```

+   copy()

    ```js
    copy( source, recursive = true ) {
        this.name = source.name;
        this.up.copy( source.up );
        this.position.copy( source.position );
        this.rotation.order = source.rotation.order;
        this.quaternion.copy( source.quaternion );
        this.scale.copy( source.scale );
        this.matrix.copy( source.matrix );
        this.matrixWorld.copy( source.matrixWorld );
        this.matrixAutoUpdate = source.matrixAutoUpdate;
        this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
        this.layers.mask = source.layers.mask;
        this.visible = source.visible;
        this.castShadow = source.castShadow;
        this.receiveShadow = source.receiveShadow;
        this.frustumCulled = source.frustumCulled;
        this.renderOrder = source.renderOrder;
        this.userData = JSON.parse( JSON.stringify( source.userData ) );
        if ( recursive === true ) {
            for ( let i = 0; i < source.children.length; i ++ ) {
                const child = source.children[ i ];
                this.add( child.clone() );
            }
        }
        return this;
    }
    ```

    