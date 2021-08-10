import reducer, { Action } from './reducers';
import undoable, { StateWithHistory } from 'redux-undo';
import { createStore } from 'redux'
import { Extent, Vector } from 'common/math';
import { AnyObject } from './objects';

export interface Color {
    red: number;        // [0,255]
    green: number;      // [0,255]
    blue: number;       // [0,255]
    opacity: number;    // [0,1]
}

export interface Settings {
    background: { paper: boolean; grid: boolean; gridStep: number }
    resolution: Extent;
};

function initSettings(): Settings {
    return { background: { paper: true, grid: false, gridStep: 25 }, resolution: { width: 800, height: 600 } };
}

export interface Camera {
    offset: Vector;
    scale: number;
}

function initCamera(): Camera {
    return { offset: { x: -20, y: -20 }, scale: 1 };
}

export interface State {
    objects: AnyObject[];
    settings: Settings;
    camera: Camera;
}

export function initState(): State {
    return { objects: [], settings: initSettings(), camera: initCamera() };
}

const undoAbleReducer = undoable(reducer);

export default createStore<StateWithHistory<State>, Action, any, any>(undoAbleReducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
