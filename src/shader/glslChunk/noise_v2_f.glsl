vec2 random2(in vec2 _st) {
    _st = vec2(dot(_st, vec2(127.326, 321.324)), dot(_st, vec2(15.31, 45.332)));
    return 2.0 * fract(sin(_st) * 432.23) + 1.0; //1.0 ~ 3.0
}
float snoise(vec2 st) { //Gradient Noise
    vec2 i = fract(st);//取小数
    vec2 k = floor(st);//向负无穷取整
    vec2 u = i * i * (3.0 - 2.0 * i);//插值函数
    return mix(mix(dot(random2(k + vec2(0.0, 0.0)), i - vec2(0.0, 0.0)), dot(random2(k + vec2(0.0, 1.0)), i - vec2(0.0, 1.0)), u.y), mix(dot(random2(k + vec2(1.0, 0.0)), i - vec2(1.0, 0.0)), dot(random2(k + vec2(1.0, 1.0)), i - vec2(1.0, 1.0)), u.y), u.x);//二维noise
}