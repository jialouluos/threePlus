/*
 * @Author: haowen.li1
 * @Date: 2023-05-02 15:04:02
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-09-29 16:44:52
 * @Description:
 */

import Demo from '@/pages/阴影调优';
const start = () => {
	const demo = new Demo('#root', true);
	demo.init();
};
window.onload = start;
