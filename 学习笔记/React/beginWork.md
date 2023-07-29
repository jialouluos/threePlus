# beginWork

在一次`setState\useState`后，`dispatchAction`被触发，在该函数内会创建一个更新优先级，然后执行`scheduleUpdateOnFiber`,`scheduleUpdateOnFiber`是更新的入口，通过调用`markUpdateLaneFromFiberToRoot`去将更新优先级标记到当前fiber节点的lanes上,然后沿着该fiber节点到`rootFiber`的这条父级链逐步给链路上节点的`childLanes`都更新优先级。如果存在缓冲树，则缓冲树上的对应节点优先级也会被更新。

如果确定要更新，则会发起异步调度`ensureRootIsScheduled`,最后的更新任务是`performSyncWorkOnRoot`，该函数包括了`render`以及`commit`两阶段

后面`RootFiber`向下调和时便可以根据这个优先级快速的找到需要更新的节点并排除不需要更新的节点，需要注意的是**调和不一定render，render一定调和**，在调和过程中如果发现`childLanes`等于当前优先级则说明其子节点存在更新，则继续调和其子节点，其本身不会触发render函数，否则就返回。直到找到真正发生更新的节点，然后再进行render，如果更新的节点是sibling节点，则调和时，会先调和其父节点的child节点，然后child节点调和之后会退出，接着再调和sibling节点。

大致流程如下：

`ensureRootIsScheduled=>performSyncWorkOnRoot=>renderRootSync=>workLoopSync=>while performUnitOfWork=>beginWork`

在`beginWork`中会做3种情况的判断并分别以不同逻辑去处理，`didReceiveUpdate`用来记录更新是否来源于父级

情况一(挂载)：判断`current===null`这里用来判断本次更新是否是mounted，如果是，则直接去处理对应类型的节点(生成)

情况二(更新来源父节点)：如果不为mounted那么会继续判断更新是否是来自当前fiber父级的影响`oldprops===newprops`，(props由受父级控制)如果是，则`didReceiveUpdate = true`

情况三(更新来源子节点)：如果不为父级，则判断更新是否来源于本身，`includesSomeLane(renderLanes, updateLanes)`，如果自身不符合更新优先级，则调用`bailoutOnAlreadyFinishedWork`去处理子节点，如果子节点存在更新，则克隆子节点并返回，然后继续`beginWork`，否则返回null，开始`completeWork`

情况四(更新来源自身节点)：自身为更新源，则按照不同的逻辑去处理对应类型的节点(更新)

## 总结

beginWork阶段包括beginWork和state状态计算以及Diff，beginWork是处理节点更新的入口，beginWork的主要作用是通过更新优先级去遍历当前fiber，拦截无需更新的节点,经过一些处理之后返回他的子节点，为后续completeWork做好准备

-   **fiber是调和过程中的最小单元，每一个需要调和的 fiber 都会进入 workLoop 中。**
-   **而组件是最小的更新单元，React 的更新源于数据层 state 的变化。**
