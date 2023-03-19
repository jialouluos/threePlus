import MeshMain from "../MeshMain";
import vertexShader from './vertex.glsl';
import fragmentShader from './fragment.glsl';
export type ChartType = "axis" | "bar" | "pie" | "broken";
import Axis, { Params } from './Axis';
import Bar, { I_BarData, BarParams } from './Bar';
import Fan from './Fan';
export default class extends MeshMain {
    constructor() {
        super();
    }
    //坐标轴axis
    createAxis(size: number, division: number, params?: Params) {
        return new Axis(size, division, params);
    }
    //柱状图bar
    createBar(data: I_BarData[], Params?: BarParams) {
        return new Bar(data, Params);
    }
    //扇形图fan
    createFan(data: I_BarData[], d: any) {
        return new Fan(data, d);
    }

}