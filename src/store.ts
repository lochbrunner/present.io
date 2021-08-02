import reducer, { Action } from './reducers';
import undoable, { StateWithHistory } from 'redux-undo';
import { createStore } from 'redux'
import { Extent, Vector } from 'common/math';

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
    rotation: number;
    origin: Vector; // origin of rotation
    skew: Vector;
}

export interface Rectangle extends Object {
    upperLeft: Vector;
    extent: Extent;
    radiusX: number;
    radiusY: number;
}


export interface Settings {
    background: { paper: boolean; grid: boolean; }
    resolution: Extent;
};

function initSettings() {
    return { background: { paper: true, grid: false }, resolution: { width: 800, height: 600 } };
}

export interface Camera {
    offset: Vector;
}

function initCamera() {
    return { offset: { x: 0, y: 0 } };
}

export interface State {
    objects: Rectangle[];
    settings: Settings;
    camera: Camera;
}

export function initState(): State {
    return { objects: [], settings: initSettings(), camera: initCamera() };
}

const undoAbleReducer = undoable(reducer);

export default createStore<StateWithHistory<State>, Action, any, any>(undoAbleReducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
