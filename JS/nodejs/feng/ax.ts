import request from "./request";
import type { test1 } from './as';
export const getScrver2 = <R = any>(params: test1) => {
    return new Promise<R>((_res, _rej) => {
        request<R>({
            url: `server?id=${params.name}`,
            method: "get"
        }).then(res => {
            if (res.status !== 200) {
                console.log("内部错误", res.reason);
                return _rej(res.reason);
            } else {
                _res(res.data || true);
            }
        }).catch((err: Error) => {
            console.log(err);
            _rej(err);
        });;
    });
};
