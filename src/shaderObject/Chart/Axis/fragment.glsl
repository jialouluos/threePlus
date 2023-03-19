precision mediump float;
varying vec2 v_uv;
varying vec3 v_Color;
uniform bool u_enableDynamicColor;
uniform float u_Time;
void main() {
    vec2 st = v_uv;
    vec3 col = vec3(0.0);
    if(u_enableDynamicColor) {
        col = 0.5 + 0.5 * cos(u_Time + st.xyx + vec3(0, 2, 4));
    } else {
        col = v_Color;
    }
    gl_FragColor = vec4(col, 1.0);
}