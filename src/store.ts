import reducer, { Action } from './reducers';
import { createStore } from 'redux'

export interface Vector {
    x: number;
    y: number;
}

export interface Extent {
    width: number;
    height: number;
}

export interface Color {
    red: number;        // [0,255]
    green: number;      // [0,255]
    blue: number;       // [0,255]
    opacity: number;    // [0,1]
}
export interface Object {
    name: string;
    isSelected: boolean;
    fillColor: Color;
    borderColor: Color;
    borderWidth: number;
}

export interface Rectangle extends Object {
    center: Vector;
    extent: Extent;
    radiusX: number;
    radiusY: number;
}

export interface State {
    objects: Rectangle[];
}

export default createStore<State, Action, any, any>(reducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
