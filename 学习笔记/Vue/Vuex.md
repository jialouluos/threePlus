# Vuex

```js
//该文件用于创建Vuex中最为核心的store
import Vue from 'vue'
//引入Vuex
import Vuex from 'vuex'
//应用Vuex插件
Vue.use(Vuex)

//准备actions——用于响应组件中的动作
const actions = {
	jiaOdd(context,value){
		console.log('actions中的jiaOdd被调用了')
		if(context.state.sum % 2){
			context.commit('JIA',value)
		}
	}
}
//准备mutations——用于操作数据（state）
const mutations = {
	JIA(state,value){
		console.log('mutations中的JIA被调用了')
		state.sum += value
	}
}
//准备state——用于存储数据
const state = {
	sum:0 //当前的和
}

//创建并暴露store
export default new Vuex.Store({
	actions,
	mutations,
	state,
})
```

```html
<template>
	<div>
		<h1>当前求和为：{{$store.state.sum}}</h1>
		<button @click="incrementOdd">当前求和为奇数再加</button>
	</div>
</template>

<script>
	export default {
		name:'Count',
		data() {
			return {
			}
		},
		methods: {
			incrementOdd(){
				this.$store.dispatch('jiaOdd',this.n)
			},
		}
	}
</script>

```

