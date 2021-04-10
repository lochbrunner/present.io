
import { Rectangle, State } from '../store';

interface Action {
    type: string;
    object: Rectangle;
}

export default (state: State = { objects: [] }, action: Action) => {
    switch (action.type) {
        case 'add':
            return { ...state, objects: [...state.objects, action.object] }
        default:
            return state;
    }
}