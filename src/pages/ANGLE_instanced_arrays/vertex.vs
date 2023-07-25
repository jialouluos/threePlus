attribute vec4 a_Position;
attribute vec4 a_Translate;
uniform mat4 u_perspectiveMatrix;
uniform mat4 u_modelViewMatrix;
void main() {
    vec4 mvPosition = u_modelViewMatrix * vec4(a_Position.xyz + a_Translate.xyz, a_Position.w);

    gl_Position = u_perspectiveMatrix * mvPosition;
    gl_PointSize = 10.0;
}