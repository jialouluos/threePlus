export interface reqConfig {
    enableCancel: boolean;//是否可以取消请求
}
export interface resParams {
    status: number;//状态码
    data: any;//数据
    reason: string;//错误原因
}
export type GET<T extends any, R extends Promise<resParams> = Promise<resParams>> = (params: T, config: reqConfig) => R;
export interface test1 {
    name: string;
}