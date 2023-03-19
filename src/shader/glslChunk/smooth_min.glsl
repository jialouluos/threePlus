//smoothMin https://www.iquilezles.org/www/articles/smin/smin.htm
//smoothMin(float a,float b,float k):float
float smooth_min(float a, float b, float k) {
    float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
    return mix(b, a, h) - k * h * (1. - h);
}