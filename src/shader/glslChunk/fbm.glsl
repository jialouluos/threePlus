    #define FBM_COUNT  5
float fbm(vec2 st) {
    float result = 0.0;//输出值
    float A = 0.5;//振幅
    mat2 rotate = mat2(cos(0.5), sin(0.5),//旋转矩阵
    -sin(0.5), cos(0.5));
    for(int i = 0; i < FBM_COUNT; i++) {//分型布朗运动核心
        result += A * snoise(st);
        st *= 2.;//频率2倍
        st *= rotate;
        A *= 0.5;//振幅1/2倍
    }
    return result;
}