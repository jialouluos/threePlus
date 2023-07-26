/*
 * @Author: haowen.li1
 * @Date: 2023-07-25 14:02:08
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-07-25 14:37:20
 * @Description:下载文件的几种方式
 */
interface TypeMap {
    arrayBuffer: ArrayBuffer;
    dataURL: string;
    text: string;
}
export function readBlob<T extends keyof TypeMap>(blob: Blob, type: T): Promise<TypeMap[T]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                (resolve as (val: string | ArrayBuffer) => void)(ev.target!.result!);
            } catch (ex) {
                reject(ex);
            }
        };
        reader.onerror = (err) => {
            reject(err);
        };

        switch (type) {
            case 'arrayBuffer':
                reader.readAsArrayBuffer(blob);
                return;

            case 'dataURL':
                reader.readAsDataURL(blob);
                return;

            case 'text':
                reader.readAsText(blob);
                return;
        }
    });
}
/**
 * src: https://gist.github.com/romgrk/40c89ba3cd077c4f4f42b63ddcf20735
 */
export function download({
    content,
    type = 'application/octet-binary',
    filename,
}: {
    filename: string;
    content: BlobPart;
    type?: string;
}) {
    const fileBlob = new Blob([content], { type });
    const url = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);

    const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
    });
    link.dispatchEvent(event);

    // Deallocate resources
    if (URL.revokeObjectURL) {
        URL.revokeObjectURL(url);
    }
}
export function downloadFileByURL(url: string, name?: string) {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', name || 'unknownFile');
    const event = new MouseEvent('click', {
        bubbles: false,
        cancelable: true,
    });
    link.dispatchEvent(event);
}
export function openTextFileByURL(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
}
