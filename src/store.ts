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
export interface Rectangle {
    center: Vector;
    extent: Extent;
    name: string;
    isSelected: boolean;
}

export interface State {
    objects: Rectangle[];
}

export default createStore<State, Action, any, any>(reducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
