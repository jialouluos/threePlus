#include <common>
uniform vec3 diffuse;//!这里diffuse就是material中的color

void main() {
    vec4 diffuseColor = vec4(diffuse,1.0);
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    #ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
    reflectedLight.indirectDiffuse *= diffuseColor.rgb;
    vec3 outgoingLight = reflectedLight.indirectDiffuse;//?outgoingLight作为gl_FragColor的rgb值
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
}