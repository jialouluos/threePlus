varying vec2 v_uv;
#if defined (USE_UP_GRADIENT)
    //开启向上渐变
varying vec3 v_Position;
#endif
#if defined (USE_DYNAMIC_UP)
uniform float u_Time;
uniform float u_Height;
#endif
void main() {
    vec4 vmPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vmPosition;
    v_uv = uv;
    #if defined (USE_UP_GRADIENT)
    v_Position = position.xyz;
    v_Position.x = vmPosition.x;
    #endif
    #if defined (USE_DYNAMIC_UP)
    vec3 pos = position;
    pos.y = clamp(pos.y, -u_Height / 2.0, -u_Height / 2.0 + u_Time * 5.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    #endif
}