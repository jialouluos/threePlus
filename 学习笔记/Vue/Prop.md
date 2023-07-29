 

## prop

```html
<template>
    <div>
        <Student name="李四" sex="男" :age="18"></Student>
    </div>
</template>
<script>
    import Student from 'xxx';
    export default {
        name:"App",
        components:{Student}
    }
</script>
```

```html
<template>
    <div>
        <h1>{{mag}}</h1>
        <h2>{{name}}</h2>
        <h2>{{sex}}</h2>
    </div>
</template>
<script>
    //通过props得到的值不能修改，是只读的
    //外部传进来的数据优先级更高
    //但是可以this.Myname =this.name
    //通过父组件给子组件传递函数类型的props实现：子给父
    //子给父传数据，回调留在父里面
    export default {
        name:"Student",
        data(){
            return {
                msg:"欢迎欢迎"
            }
        },
        props:["name","sex","age"],//简单写法
        //还可以这样写
        props:{
            name:String,
            sex:String,
            age:Number
        },
        //还可以这样写
        props:{
            name:{
                type:String,
                required:true
            },
            age:{
                type:Number,
                default:99
            }
        }
    }
</script>
```

1
