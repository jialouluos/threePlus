
/**
 *@note 球体
 *@param p 光线的三维坐标
 *@param s 球体的半径
 *@sdf_Sphere(vec3 p, float s):float
 */
float sdf_Sphere(vec3 p, float s) {
                // 半径为 s,注意图形内部距离为负
    return length(p) - s;
}
/**
 *@note 圆角立方体
 *@param p 光线的三维坐标
 *@param b 立方体的长宽高
 *@param r 控制圆角的程度
 *@sdf_roundBox(vec3 p, vec3 b, float r):float
 */
float sdf_roundBox(vec3 p, vec3 b, float r) {
    return length(max(abs(p) - b, 0.0)) - r;
}
/**
 *@note 立方体
 *@param p 光线的三维坐标
 *@param b 立方体的长宽高
 *@sdf_box(vec3 p, vec3 b):float
 */
float sdf_box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}
/**
*@note （纵向）圆环体
*@param p 光线的三维坐标
*@param t 圆环的半径
*@sdf_torus(vec3 p, vec2 t):float
*/
float sdf_torus(vec3 p, vec2 t) {
            // t.x 控制圆环半径， t.y 控制粗细
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}
/**
*@note （横向）圆环体
*@param p 光线的三维坐标
*@param t 圆环的半径
*@sdf_torus(vec3 p, vec2 t):float
*/
float sdf_torus2(vec3 p, vec2 t) {
            // t.x 控制圆环半径， t.y 控制粗细
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}
/**
*@note 胶囊体（圆角直线）
*@param p 光线的三维坐标
*@param a 起点
*@param b 终点
*@param r 粗细
*@sdf_capsule(vec3 p, vec3 a, vec3 b, float r):float
*/
float sdf_capsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
            // |pa|*cos(theta) / |ba|
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            // ba*h 表示 pa 投影到 ba 上的向量, pa - ba*h 表示 p 点到 ba 线段的距离向量
            // r 控制了直线的宽度
    return length(pa - ba * h) - r;
}
