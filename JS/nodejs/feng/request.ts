import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
export interface I_Config {
    enableCancel?: boolean;//是否可以取消请求
    baseURL?: string;
    timeout?: number;
}
export interface I_Response {
    status: number;//状态码
    data: unknown;//数据
    reason: string;//错误原因
}
const prefixConfig: I_Config = {
    enableCancel: true,//true--代表启用取消请求功能
};
const setHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    return config;
};
const handleNetworkError = (errStatus: number) => {
    if (!errStatus) return "未知错误";
    const errorMap: Record<number, string> = {
        400: "错误的请求-400",
        401: "未授权，请重新登录-401",
        403: "拒绝访问-403",
        404: "请求错误,未找到该资源-404",
        405: "请求方法未允许-405",
        408: "请求超时-408",
        500: "服务器端出错-500",
        501: "网络未实现-501",
        502: "网络错误-502",
        503: "服务不可用-503",
        504: "网络超时-504",
        505: "http版本不支持该请求-505"
    };
    return errorMap[errStatus] ? errorMap[errStatus] : `其他连接错误 -- ${errStatus}`;
};
const pendingMap = new Map<string, AxiosRequestConfig>();
/**
 * @param params axios请求参数
 * @param _config 自定义配置
 * @returns Promise\<响应的data数据(res.data)\>
 */
const request = async <T = any>(params: AxiosRequestConfig, _config: I_Config = prefixConfig): Promise<I_Response & { data: T; }> => {
    _config = { ...prefixConfig, ..._config };
    const instance = axios.create({
        baseURL: _config.baseURL || "http://localhost:5400",
        timeout: _config.timeout || 5000,
    });
    instance.interceptors.request.use((req: InternalAxiosRequestConfig) => {
        const routeKey = `${params.url}/${JSON.stringify(params.params)}/${JSON.stringify(params.data)}&request_type=${params.method}`;
        if (pendingMap.has(routeKey)) {
            const cacheReq = pendingMap.get(routeKey)!;
            pendingMap.delete(routeKey);
            pendingMap.set(routeKey, req);
            cacheReq!.cancelToken = new axios.CancelToken(cancel => {
                cancel();
            });
        } else {
            _config.enableCancel && pendingMap.set(routeKey, req);
        }
        return setHeader(req);
    }, _ => _);
    instance.interceptors.response.use((res: AxiosResponse) => {
        if (res.status !== 200) return Promise.reject(handleNetworkError(res.status));
        return res;
    }, err => {
        if (axios.isCancel(err)) {
            return Promise.reject("请慢点点击~");
        } else {
            return Promise.reject(handleNetworkError(err.response.status));
        }
    });
    return instance.request(params).then(res => {
        return res.data;
    }).catch(err => Promise.reject(err));
};

export default request;
