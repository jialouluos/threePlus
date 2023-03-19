precision mediump float;
uniform vec3 diffuse;
uniform float u_Opacity;
varying vec2 v_uv;
#if defined (USE_UP_GRADIENT)
    //开启向上渐变
uniform float u_MaxHeight;
varying vec3 v_Position;
#endif
void main() {

    vec2 st = v_uv;
    gl_FragColor = vec4(diffuse, u_Opacity);
    #if defined (USE_UP_GRADIENT)
    st.y = (1.2 - (v_Position.y + u_MaxHeight) / (u_MaxHeight * 2.0));
    st.y = smoothstep(0.0, 1.0, st.y);
    st.y *= 0.8;
    vec3 col = st.y * diffuse;
    if(st.y <= 0.0)
        discard;
    else
        gl_FragColor = vec4(col, st.y);
    #endif
}