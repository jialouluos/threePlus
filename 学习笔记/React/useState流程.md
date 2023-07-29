```js
setState/useState => dispatchReducerAction => scheduleUpdateOnFiber => {
    markUpdateLaneFromFiberToRoot//递归向上更新优先级 ChildLane = UpdateLane
    lane === SyncLane && 初始化 && performSyncWorkOnRoot
    lane === SyncLane && 可控 && ensureRootIsScheduled => performSyncWorkOnRoot =>{
    	renderRootSync//render
    	commitRoot//commit 阶段
    	ensureRootIsScheduled//如果有其他的等待中的任务，那么继续更新
    }
    lane === SyncLane && 不可控 && ensureRootIsScheduled => performSyncWorkOnRoot =>{
    	renderRootSync//render
    	commitRoot//commit 阶段
    	ensureRootIsScheduled//如果有其他的等待中的任务，那么继续更新
    } && flushSyncCallbackQueue
}
```

```js
renderRootSync ==> workLoopSync ==>while performUnitOfWork ==>{
   beginWork
   next===null && completeUnitOfWork
}
```

