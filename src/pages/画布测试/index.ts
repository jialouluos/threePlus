import MyCanvas from '../../util/_canvas/index';
const canvas = new MyCanvas(1600, 1600);

for (let i = 0; i < 5; i++) {
    const font = new FontFace('ZhuZiAWan', 'url("fonts/ZhuZiAWan/ZhuZiAWan.ttc")');
    font.load().then(_ => {
        canvas.setStyle((ctx) => {
            return () => {
                console.log(canvas.ctx.font);
                ctx.font = "60px ZhuZiAWan";
                console.log(canvas.ctx.font);
                canvas.createText("你好世界 helioeasdas1");
            };
        });
    });
}



const root = document.getElementById("root");
root.appendChild(canvas.dom);
export default 1;
