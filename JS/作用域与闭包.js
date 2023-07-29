/*
 * @Author: haowen.li1
 * @Date: 2023-07-29 11:00:32
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-07-29 15:38:37
//  * @Description:
 */
//作用域链([[Scope]])控制着代码的可访问性，它决定了哪些数据能被函数访问。
//作用域链是在函数定义的时候创建的，它包含了函数被创建的作用域中对象的集合，这个集合被称为 静态作用域。js采用词法作用域，也就是静态作用域。由你在写代码时将变量和块作用域写在哪里来决定的。
var value = 2
function foo() {
  console.log(value)
}
function bar() {
  var value = 3
  foo()
}
bar() // 2
//动态作用域，它依然会像采用词法作用域的形式执行函数，唯一不一样的地方在于：在执行foo()函数时，他不会向外一层查找value，而是从调用的函数作用域中查找，所以最后的结果输出为3。
//全局作用域 1.最外层函数和在最外层函数外面定义的变量。2.所有未定义直接赋值的变量。3.所有window对象的属性
// var value = 2 //全局变量
// value2 = 3;//全局变量
// window.value3 = 4;//全局变量
//函数作用域-函数作用域，就是指声明在函数内部的变量，它正好和全局作用域相反。内层作用域可以访问到外层作用域，而外层作用域不能访问到内层作用域。
// function check() {
//   var localValue = 'local value'
//   console.log(localValue) // 'local value'
// }

// console.log(localValue);// "Uncaught ReferenceError: localValue is not defined"
//块级作用域-块级作用域是指在一个代码块（用{}括起来的部分）中声明的变量，它只在这个代码块中有效。
//老旧的var var只有全局作用域和函数作用域，不存在块级作用域，如果在块级作用域中声明一个变量，那么这个变量就会变成他父作用域下的变量。
//var 穿透了 if，for 和其它代码块。这是因为在早期的 JavaScript 中，块没有词法环境，而 var 就是这个时期的代表之一。
// if (true) {
//   var value = 'blue'
// }
// console.log(value) // 'blue'
// check()
//闭包的形成条件：
//函数嵌套
//内部函数引用外部函数的局部变量
// function foo() {
//     var a = 1;
//     return function () {
//         console.log(a);
//     }
// }

// var bar = foo();
// bar();
