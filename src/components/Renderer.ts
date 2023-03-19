import EventEmitter from "eventemitter3";

type RendererEvent = {
    onSceneRenderCompleted: () => void;
    onSceneRendererBefore: () => void;
    cameraMove: (arg: Renderer) => void;
};
export class Renderer extends EventEmitter<RendererEvent>{
    constructor() {
        super();
        console.log(1);
    }
    emitEvent() {
        this.emit("cameraMove", this);//发布
    }
}
const render = new Renderer();
render.addListener("cameraMove", (dsa) => {//订阅
    console.log(dsa);
});
render.addListener("cameraMove", (dsa) => {//订阅
    console.log(dsa + "" + 1);
});