float fresnel(float bias, float scale, float power, vec3 I, vec3 N) {
    return bias + scale * pow(1. + dot(I, N), power);
}