export type DeepObject<T extends object> = {
    [U in keyof T]: T[U] extends object ? DeepObject<T[U]> : T[U];
};
