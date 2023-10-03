precision mediump float;
varying vec2 v_uv;
uniform float u_Time;
void main() {
    vec2 st = v_uv;
    vec3 col = 0.5 + 0.5 * cos(u_Time + st.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(col, 1.0);
}