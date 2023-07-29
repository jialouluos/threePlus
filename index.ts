/*
 * @Author: haowen.li1
 * @Date: 2023-05-02 15:04:02
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-07-27 14:52:07
 * @Description: 
 */

import Demo from '@/pages/Matcap材质';
const start = () => {
    const demo = new Demo("#root", true);
    demo.init();
};
window.onload = start;