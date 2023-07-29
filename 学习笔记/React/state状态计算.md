# state状态计算

在一次`setState`之后，`dispatchAction`被触发，该函数内部会调用`enqueueSetState`去生成一个`update`，并调用`enqueueUpdate`将其放入`updateQueue`等待后续更新处理，多次调用`setState`会生成多个`update`对象，对于`updateQueue`它存在着一个`baseState`去保存着上一次更新得出的最后状态，并作为下一次更新的基础，同时`shared.pending`(环状链表)还存着本次更新的`update`队列，还存在着`firstBaseUpdate`去记录着第一次被跳过的低优先级`update`对象以及存在着`lastBaseUpdate`记录从第一次被跳过到最后一个`update`截取的队列的最后一个`update`

*state的计算发生在类组件对应的fiber节点beginWork中的`updateClassInstance`函数中(即在判断完更新来源之后的各组件处理阶段)在状态计算完毕之后，紧跟着就是去调用`finishClassComponent`执行render函数和diff、 打上effectTag（即新版本的flag）。*

在更新前，如果存在上次遗留的update(从`firstBaseUpdate`到`lastBaseUpdate`)链表，则会将遗留链表和新链接合并，同时也会将`current`树上的节点同样处理一遍，这样在任务如果被高优先级的任务打破时，能够避免丢失未处理的`update`。

在更新时，会循环链表，更新时以上次`baseState`储存的状态为基础，是否更新会依据`renderLanes`和`update.lane`，当循环到更新优先级第一次不足渲染优先级时，该`update`会被记录(`firstBaseUpdate`)并且被跳过,接着继续往后遍历，优先级足够会继续执行（这里主要是为了相应用户交互,后续第二次执行依然依照baseState计算）
，但是这时无论优先级如何都会`lastBaseUpdate`截取被下来，不会被`baseState`记录。直到最后一个`update`(`lastBaseUpdate`)，下次更新时依靠的状态`baseState`是由`firstBaseUpdate`之前的`update`计算得来的，之后就算有满足优先级的`update`也不会被`baseState`记录

在更新完成时，如果不存在跳过，则`baseState`会被赋值为新计算的`state`，`lanes`会被清空如果存在跳过，则赋值为第一个被跳过的更新之前的`update`计算出来的状态，`lane`会被赋值为低优先级`update`的`lane`然后放入`lanes`中，再次发起调度去更新低优先级`update`，最后更新一下WIP上面的`memoizedState`

## 总结

状态计算通过判断优先级去实现更新，每次只更新同一优先级，对于被跳过的update，会被记录，同时存在一个专门的状态值去记录本次更新的状态，并作为下一次的基础，在下次更新时就会按照原本预期的次序去进行更新，这样保证了最终呈现的处理结果和用户的行为触发的交互的结果保持一致。
