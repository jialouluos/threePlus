precision mediump float;
varying vec2 v_uv;
uniform sampler2D uMap;
void main() {
    float dist = texture2D(uMap, v_uv).a;
    gl_FragColor = vec4(dist, 1.0, 1.0, 1.0);
}