## Deep Readonly

```ts
//my
type DeepReadonly<T> = {
  readonly [U in keyof T]: T[U] extends () => void ? T[U] : T[U] extends object ? DeepReadonly<T[U]> : T[U]
};
//other
type DeepReadonly<T> = {
  readonly [K in keyof T]: keyof T[K] extends never ? T[K] : DeepReadonly<T[K]>;
};//收获 对函数进行keyof会得到nerve，这样可以进行函数类型的筛选
//other
type DeepReadonly<T> = {
  readonly [U in keyof T]: T[U] extends Function ? T[U] : T[U] extends object ? DeepReadonly<T[U]> : T[U]
};//有关键字Function可以直接进行判断

```

## Tuple to Union(元组转合集)

```ts
//eg
type Arr = ['1', '2', '3']
type Test = TupleToUnion<Arr> // expected to be '1' | '2' | '3'
//my and ohter
type TupleToUnion<T extends Array<any>> = T[number];
//T[number] 索引签名，可以理解为获取数组中的每个索引
```

## Chainable Options(可串联构造器)

```ts
declare const config: Chainable
const result = config
  .option('foo', 123)
  .option('name', 'type-challenges')
  .option('bar', { value: 'Hello World' })
  .get()
// 期望 result 的类型是：
interface Result {
  foo: number
  name: string
  bar: {
    value: string
  }
}
//my
type Chainable<T extends Record<string, any> = {}> = {
  option<K extends string, V extends any>(key: K, value: V): Chainable<{
    [U in keyof T|K]: K extends U ? V : T[U]
  }>;
  get(): T;
};
//other
type Chainable<T extends Record<string, any> = {}> = {
  option<K extends string, V extends any>(key: K, value: V): Chainable<{
    [I in keyof T as I extends K ? never : I]: T[I]
  } & {
      [U in K]: V
    }>;
  get(): T;
};//做了一步将已有的键清除的操作(never)
```

## Last of Array(最后一个元素)

```ts
type arr1 = ['a', 'b', 'c']
type arr2 = [3, 2, 1]
type tail1 = Last<arr1> // expected to be 'c'
type tail2 = Last<arr2> // expected to be 1
//my
type Last<T extends any[]> = T extends [...infer R, infer U] ? U : undefined;
//other
type Last<T extends any[]> = T extends [...args: any[], last: infer U] ? U : never;
```

## Pop(出堆)

```ts
type arr1 = ['a', 'b', 'c', 'd']
type arr2 = [3, 2, 1]
type re1 = Pop<arr1> // expected to be ['a', 'b', 'c']
type re2 = Pop<arr2> // expected to be [3, 2]
//my and other
type Pop<T extends any[]> = T extends [...infer U, infer R] ? U : [];
```

## Promise.all

```ts
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise<string>((resolve, reject) => {
  setTimeout(resolve, 100, 'foo');
});

// expected to be `Promise<[number, 42, string]>`
const p = PromiseAll([promise1, promise2, promise3] as const)
//other
declare function PromiseAll<T extends unknown[]>(values: readonly [...T]): Promise<{
  [U in keyof T]: Awaited<T[U]>
}>;//Awaited以及Promise的ts类型编写
```

## Type Lookup

```ts
在此挑战中，我们想通过在联合类型Cat | Dog中搜索公共type字段来获取相应的类型。换句话说，在以下示例中，我们期望LookUp<Dog | Cat, 'dog'>获得Dog，LookUp<Dog | Cat, 'cat'>获得Cat。
interface Cat {
  type: 'cat'
  breeds: 'Abyssinian' | 'Shorthair' | 'Curl' | 'Bengal'
}

interface Dog {
  type: 'dog'
  breeds: 'Hound' | 'Brittany' | 'Bulldog' | 'Boxer'
  color: 'brown' | 'white' | 'black'
}
//other
type LookUp<U extends { type: string; }, T extends string> = U extends { type: T; } ? U : never;
```

## Trim Left

```ts
type trimed = TrimLeft<'  Hello World  '> // expected to be 'Hello World  '
//my
type TrimLeft<S extends string> = S extends (` ${infer B}` | `\n${infer B}` | `\t${infer B}`) ? TrimLeft<B> : S;
//other
type TrimLeft<S extends string> = S extends `${' '|'\n'|'\t'}${infer B}` ? TrimLeft<B> : S;
```

## Trim

```ts
type trimmed = Trim<'  Hello World  '> // expected to be 'Hello World'
//my and other
type Trim<S extends string> = S extends `${' ' | '\n' | '\t'}${infer B}` ? Trim<B> : S extends `${infer B}${' ' | '\n' | '\t'}` ? Trim<B> : S;
```

## Capitalize

```ts
type capitalized = Capitalize<'hello world'> // expected to be 'Hello world'
//my
type MyCapitalize<S extends string> = S extends `${infer A} ${infer B}` ? `${Capitalize<A>} ${B}`:Capitalize<S>;
//other
type MyCapitalize<S extends string> = S extends `${infer A}${infer B}` ? `${Uppercase<A>}${B}` : S;
```

