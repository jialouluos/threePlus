varying vec2 v_uv;
void main() {
    vec4 vmPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vmPosition;
    v_uv = uv;
}