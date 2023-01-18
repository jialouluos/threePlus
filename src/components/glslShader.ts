import { to_center, smooth_min, fresnel, sdf, ray_march, catmull_rom_spline, quat_from_axis_angle, rotate2d, rotate_vector, fbm, noise_v3_v3, noise_v2_f } from '@/shader/glslChunk';
import { vertex_shader_base_template, fragement_shader_base_template } from '@/shader/glslTemplate';

export default {
    glslChunk: {
        to_center,
        smooth_min,
        fresnel,
        noises: {
            noise_v3_v3,
            noise_v2_f,
        },
        fbm,
        rotate_vector,
        quat_from_axis_angle,
        rotate2d,
        sdf,
        ray_march,
        catmull_rom_spline,
    },
    glslTemplate: {
        vertex_shader_base_template,
        fragement_shader_base_template,
    }
};
