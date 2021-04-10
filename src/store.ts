import reducer from './reducers';
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
}

export interface State {
    objects: Rectangle[];
}

export default createStore<State, any, any, any>(reducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
