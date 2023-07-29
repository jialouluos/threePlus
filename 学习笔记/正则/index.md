# 正则

## 限定符

### ? 表示只出现0次或1次

```js
const reg = /ab?c/;
ac true
abc true
abbbbbbc false
adc false
```

### * 表示出现0次或多次

```js
const reg = /ab*c/;
ac true
abc true
abbbbbbc true
adc false
```

### + 出现1次及以上

```js
const reg = /ab+c/;
ac false
abc true
abbbbbbc true
adc false
```

### {} 限制出现次数

```js
const reg = /ab{2,}c/;//b出现2次及以上
ac false
abc false
abbbbbbc true
adc false
```

```js
const reg = /(ab){2,}c/;//ab出现2次及以上
ac false
abc false
ababac true
abbbbbbc false
adc false
```

### | 用来表示或

```js
const reg =/a (c|b)/
a dc false
a bd true
a cd true
a dc false
```

### [] 字符集 

```js
const reg =/[0-9]/ //表示所有数字
const reg =/[a-z]/ //表示所有小写字母
const reg =/[a-zA-Z]/ //表示所有字母
const reg =/[^a-zA-Z]/ //表示除了所有字母
```

## 元字符

### \d 数字字符 表示所有数字

### \D 非数字字符

### \w 表示所有的英文字符(包含_)

### \W 非英文字符

### \b 表示字符边界

```js
const reg = /ds\b/
adss false
asd false
ads true
```



### \s 表示空白符(包含Tab和换行和空格)

### \S 表示非空白符(包含Tab和换行和空格)

### . 表示任意字符，但是不包含换行符

### ^ 匹配行首

### $ 匹配行尾

## 贪婪(匹配尽可能多) 惰性(匹配尽可能少)

? 懒惰

默认贪婪

## 断言

### 正向断言(?=表达式)

```js
const reg = /ad(?=c)/
adc ad
djugsdacdadcadas djugsdacdadad
```

### 反向断言(?!表达式)

### 正向后行断言(?<=表达式)

### 反向后行断言(?<!表达式)
