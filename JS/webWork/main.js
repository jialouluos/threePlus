const work = new Worker('./work.js')
const canvas = document.createElement('canvas');
const bitCanvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 600;
bitCanvas.style.width = '500px';
bitCanvas.style.height = '600px';
bitCanvas.width = 500;
bitCanvas.height = 600;
const bitCtx = bitCanvas.getContext('bitmaprenderer')
document.body.appendChild(canvas);
const transferScreen = canvas.transferControlToOffscreen();
work.postMessage(transferScreen, [transferScreen]);
work.onmessage = function ({ data }) {
    console.log(data);
  
}