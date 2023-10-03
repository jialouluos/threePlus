/*
 * @Author: haowen.li1
 * @Date: 2023-07-24 13:39:45
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-10-03 12:14:38
 * @Description:
 */
import {
	to_center,
	smooth_min,
	fresnel,
	sdf,
	ray_march,
	catmull_rom_spline,
	quat_from_axis_angle,
	rotate2d,
	rotate_vector,
	fbm,
	noise_v3_v3,
	noise_v2_f,
} from '@/shader/glslChunk';
import { vertex_shader_base_template, fragment_shader_base_template } from '@/shader/glslTemplate';

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
		fragment_shader_base_template,
	},
};
