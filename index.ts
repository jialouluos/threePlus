/*
 * @Author: haowen.li1
 * @Date: 2023-05-02 15:04:02
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-10-04 15:27:03
 * @Description:
 */

import Demo from '@/matrialObject/BasicMaterial';
const start = () => {
	const demo = new Demo('#root', true);
	demo.init();
};
window.onload = start;
