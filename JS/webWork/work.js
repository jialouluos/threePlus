addEventListener("message", ({ data }) => {
    console.log(data)
    const text = new OffscreenCanvas(data.width, data.height)
    console.log(text)
    const ctx = text.getContext("2d")
    ctx.fillRect(100, 100, 300, 200)
    const imageBitMap = text.transferToImageBitmap();
    const bitCtx = data.getContext('bitmaprenderer');
    console.log(imageBitMap);
    bitCtx.transferFromImageBitmap(imageBitMap);
    console.log(bitCtx);
// Math.random
    // postMessage(imageBitMap)
})