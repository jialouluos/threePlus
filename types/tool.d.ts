export type DeepObject<T extends object> = {
    [U in keyof T]: T[U] extends object ? DeepObject<T[U]> : T[U];
};
export type PickByType<T extends object, R> = {
    [U in keyof T]: T[U] extends R ? U : never;
}[keyof T];

export type NumberRange<L extends number, H extends number, R extends number[] = []> = H extends R['length'] ?
    [...R, R['length']][number] :
    R['length'] extends L ?
    NumberRange<number, H, [...R, R['length']]> :
    NumberRange<L, H, [...R, L]>;
declare const tet: NumberRange<1, 4>;