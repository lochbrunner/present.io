
import { State } from '../store';

export default (state: State = { value: 0 }, action: { type: string }) => {
    switch (action.type) {
        case 'increase':
            return { ...state, value: state.value + 1 }
        default:
            return state;
    }
}