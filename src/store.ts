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
export interface BaseObject {
    name: string;
    isSelected: boolean;
    fillColor: Color;
    borderColor: Color;
    borderWidth: number;
    rotation: number;
    origin: Vector; // origin of rotation
    skew: Vector;
}

export interface Rectangle extends BaseObject {
    type: 'rect';
    upperLeft: Vector;
    extent: Extent;
    radiusX: number;
    radiusY: number;
}

export interface Ellipse extends BaseObject {
    type: 'ellipse';
    center: Vector;
    radius: Vector;
    pathLength: number;
}

export interface TextObject extends BaseObject {
    type: 'text';
    content: string;
    start: Vector;
    shift: Vector;
    glyphRotation: number;
    lengthAdjust: string;
    textLength: string;
    style: {
        fontFamily?: string;
        fontSize?: string;
        fontSizeAdjust?: any;
        fontStretch: number;
        fontStyle?: 'normal' | 'italic' | 'oblique';
        fontVariant?: any;
        fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
    }
}

export type AnyObject = Rectangle | Ellipse | TextObject;


export interface Settings {
    background: { paper: boolean; grid: boolean; gridStep: number }
    resolution: Extent;
};

function initSettings(): Settings {
    return { background: { paper: true, grid: false, gridStep: 25 }, resolution: { width: 800, height: 600 } };
}

export interface Camera {
    offset: Vector;
}

function initCamera() {
    return { offset: { x: -20, y: -20 } };
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
