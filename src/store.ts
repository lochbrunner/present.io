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

export interface State {
    objects: Rectangle[];
}

const undoAbleReducer = undoable(reducer);

export default createStore<StateWithHistory<State>, Action, any, any>(undoAbleReducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
