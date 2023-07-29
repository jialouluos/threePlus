/*
 * @Author: haowen.li1
 * @Date: 2023-07-29 11:00:32
 * @LastEditors: haowen.li1
 * @LastEditTime: 2023-07-29 17:22:49
 * @Description:class z
 */

class Test {
  name = 'haoWen123'
  static static_name = 'static_name'
  constructor() {
    this.cons_name = 'cona_name'
  }
  getname1() {
    return {
      tets: this.getname2()
    }
  }
  getname2 = () => {
    console.log(this.name)
    return {
      heh: this.getname3()
    }
  }
  getname3 = () => {
    return 'name3'
  }
}
const tets = new Test()
tets.getname1()
tets.getname2()
console.log(tets)

let arr = [11, 22, 33, 44]
const obj = {
  name: 1,
  name2: 2
}
for (const value of Object.entries(obj)) {
  console.log(value)
}

