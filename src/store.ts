import reducer from './reducers';
import { createStore } from 'redux'

export interface State {
    value: number;
}

export default createStore<State, any, any, any>(reducer, undefined, (window as any).__REDUX_DEVTOOLS_EXTENSION__?.());
