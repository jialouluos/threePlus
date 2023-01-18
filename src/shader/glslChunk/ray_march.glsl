const float _epsilon = 0.001;//步进间距判定值
const int MAX_STEP = 256;//最大步进数
const float MAX_DIST = 100.;//最大步进距离
float ray_march(vec3 ro, vec3 rd) {
    float dN = 0.0;
    for(int i = 0; i < MAX_STEP; i++) {
        vec3 p = ro + rd * dN;
        float d = GetSDF(p);//GetSDF需要自己单独定义
        dN += d;
        if(dN > MAX_DIST || d < _epsilon)
            break;
    }
    return dN;
}