/*
 * @Author: haowen.li1
 * @Date: 2023-05-02 15:04:02
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-10-07 22:55:08
 * @Description:
 */

import Demo from '@/study/MeshPhongMaterial';
const start = () => {
	const demo = new Demo('#root', true);
	demo.init();
};
window.onload = start;
