# Color

+   构造函数

    ```js
    constructor( r, g, b ) {
        if ( g === undefined && b === undefined ) {//r参数可以是一个THREE.Color对象，也可以是一个十六进制数或者一个字符串
            return this.set( r );
        }
        return this.setRGB( r, g, b );
    }
    ```

+   set

    ```js
    set( value ) {
        if ( value && value.isColor ) {//如果是THREE.Color对象直接copy
            this.copy( value );
        } else if ( typeof value === 'number' ) {//如果是十六进制数
            this.setHex( value );
        } else if ( typeof value === 'string' ) {//如果是字符串
            this.setStyle( value );
        }
        return this;
    }
    setScalar( scalar ) {//将rgb都设置为一个标量
        this.r = scalar;
        this.g = scalar;
        this.b = scalar;
        return this;
    }
    setHex( hex ) {//参数形式：0xffff00 
        hex = Math.floor( hex );
        this.r = ( hex >> 16 & 255 ) / 255;
        this.g = ( hex >> 8 & 255 ) / 255;
        this.b = ( hex & 255 ) / 255;
        return this;
    }
    setRGB( r, g, b ) {//参数形式： 355，145，234,值范围为 0~255
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }
    
    setHSL( h, s, l ) {//值范围 0~1
        h = MathUtils.euclideanModulo( h, 1 );
        s = MathUtils.clamp( s, 0, 1 );
        l = MathUtils.clamp( l, 0, 1 );
        if ( s === 0 ) {
            this.r = this.g = this.b = l;
        } else {
            const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
            const q = ( 2 * l ) - p;
            this.r = hue2rgb( q, p, h + 1 / 3 );
            this.g = hue2rgb( q, p, h );
            this.b = hue2rgb( q, p, h - 1 / 3 );
        }
        return this;
    }
    setStyle( style ) {//参数形式： "#ffff00"
        ...
    }
    setColorName( style ) {//参数为Color.js中内置的颜色名字(储存在_colorKeywords[]中)
        ...
    }
    ```

+   gamma颜色空间与线性空间的互相转化

    ```js
    copyGammaToLinear( color, gammaFactor = 2.0 ) {
        this.r = Math.pow( color.r, gammaFactor );
        this.g = Math.pow( color.g, gammaFactor );
        this.b = Math.pow( color.b, gammaFactor );
        return this;
    }
    copyLinearToGamma( color, gammaFactor = 2.0 ) {
        const safeInverse = ( gammaFactor > 0 ) ? ( 1.0 / gammaFactor ) : 1.0;
        this.r = Math.pow( color.r, safeInverse );
        this.g = Math.pow( color.g, safeInverse );
        this.b = Math.pow( color.b, safeInverse );
        return this;
    }
    convertGammaToLinear( gammaFactor ) {
        this.copyGammaToLinear( this, gammaFactor );
        return this;
    }
    convertLinearToGamma( gammaFactor ) {
        this.copyLinearToGamma( this, gammaFactor );
        return this;
    }
    ```

    +   sRGB颜色空间与线性空间的互相转化

        ```js
        copySRGBToLinear( color ) {
            this.r = SRGBToLinear( color.r );
            this.g = SRGBToLinear( color.g );
            this.b = SRGBToLinear( color.b );
            return this;
        }
        copyLinearToSRGB( color ) {
            this.r = LinearToSRGB( color.r );
            this.g = LinearToSRGB( color.g );
            this.b = LinearToSRGB( color.b );
            return this;
        }
        convertSRGBToLinear() {
            this.copySRGBToLinear( this );
            return this;
        }
        convertLinearToSRGB() {
            this.copyLinearToSRGB( this );
            return this;
        }
        function SRGBToLinear( c ) {
            return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );
        }
        function LinearToSRGB( c ) {
            return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;
        }
        ```

    +   getColorValue

        ```js
        getHex() {
            return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;
        }
        getHexString() {
            return ( '000000' + this.getHex().toString( 16 ) ).slice( - 6 );
        }
        getHSL( target ) {//范围 0~1
            const r = this.r, g = this.g, b = this.b;
            const max = Math.max( r, g, b );
            const min = Math.min( r, g, b );
            let hue, saturation;
            const lightness = ( min + max ) / 2.0;
            if ( min === max ) {
                hue = 0;
                saturation = 0;
            } else {
                const delta = max - min;
                saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );
                switch ( max ) {
                    case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
                    case g: hue = ( b - r ) / delta + 2; break;
                    case b: hue = ( r - g ) / delta + 4; break;
                }
                hue /= 6;
            }
            target.h = hue;
            target.s = saturation;
            target.l = lightness;
            return target;
        }
        getStyle() {
            return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';
        }
        offsetHSL( h, s, l ) {
            this.getHSL( _hslA );
            _hslA.h += h; _hslA.s += s; _hslA.l += l;
            this.setHSL( _hslA.h, _hslA.s, _hslA.l );
            return this;
        }
        ```

    +   加减

        ```js
        add( color ) {
            this.r += color.r;
            this.g += color.g;
            this.b += color.b;
            return this;
        }
        addColors( color1, color2 ) {
            this.r = color1.r + color2.r;
            this.g = color1.g + color2.g;
            this.b = color1.b + color2.b;
            return this;
        }
        addScalar( s ) {
            this.r += s;
            this.g += s;
            this.b += s;
            return this;
        }
        sub( color ) {
        	this.r = Math.max( 0, this.r - color.r );
        	this.g = Math.max( 0, this.g - color.g );
        	this.b = Math.max( 0, this.b - color.b );
        	return this;
        }
        ```

    +   乘

        ```js
        multiply( color ) {
            this.r *= color.r;
            this.g *= color.g;
            this.b *= color.b;
            return this;
        }
        multiplyScalar( s ) {
            this.r *= s;
            this.g *= s;
            this.b *= s;
            return this;
        }
        ```

    +   lerp

        ```js
        lerp( color, alpha ) {//线性取值，取color到this之间的颜色值的alpha区间的值
            this.r += ( color.r - this.r ) * alpha;
            this.g += ( color.g - this.g ) * alpha;
            this.b += ( color.b - this.b ) * alpha;
            return this;
        }
        lerpColors( color1, color2, alpha ) {//从color1开始线性插值
            this.r = color1.r + ( color2.r - color1.r ) * alpha;
            this.g = color1.g + ( color2.g - color1.g ) * alpha;
            this.b = color1.b + ( color2.b - color1.b ) * alpha;
            return this;
        }
        lerpHSL( color, alpha ) {//线性插值
            this.getHSL( _hslA );
            color.getHSL( _hslB );
            const h = MathUtils.lerp( _hslA.h, _hslB.h, alpha );
            const s = MathUtils.lerp( _hslA.s, _hslB.s, alpha );
            const l = MathUtils.lerp( _hslA.l, _hslB.l, alpha );
            this.setHSL( h, s, l );
            return this;
        }
        ```

    +   equals

        ```js
        equals( c ) {//比较两个颜色值是否相等
            return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );
        }
        ```

    +   fromArray

        ```js
        fromArray( array, offset = 0 ) {
            this.r = array[ offset ];
            this.g = array[ offset + 1 ];
            this.b = array[ offset + 2 ];
            return this;
        }
        toArray( array = [], offset = 0 ) {
            array[ offset ] = this.r;
            array[ offset + 1 ] = this.g;
            array[ offset + 2 ] = this.b;
            return array;
        }
        ```

    +   fromBufferAttribute

        ```js
        fromBufferAttribute( attribute, index ) {
            this.r = attribute.getX( index );
            this.g = attribute.getY( index );
            this.b = attribute.getZ( index );
            if ( attribute.normalized === true ) {
                // assuming Uint8Array
                this.r /= 255;
                this.g /= 255;
                this.b /= 255;
            }
            return this;
        }
        ```

        
