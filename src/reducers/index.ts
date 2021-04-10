
import { Rectangle, State } from '../store';

export interface ChangeSelection {
    state: boolean;
    index: number;
}

export interface Action {
    type: string;
    payload: Rectangle | ChangeSelection;
}

export default (state: State = { objects: [] }, action: Action) => {
    console.log(action)
    switch (action.type) {
        case 'add':
            return { ...state, objects: [...state.objects, action.payload as any] }
        case 'select':
            {
                const index = (action.payload as any).index;
                const object = state.objects[index];
                return { ...state, objects: [...state.objects.slice(0, index).map(o => ({ ...o, isSelected: false })), { ...object, isSelected: true }, ...state.objects.slice(index + 1).map(o => ({ ...o, isSelected: false }))] }
            }
        case 'change-select':
            {
                const index = (action.payload as any).index;
                const isSelected = (action.payload as any).state;
                const object = state.objects[index];
                return { ...state, objects: [...state.objects.slice(0, index), { ...object, isSelected }, ...state.objects.slice(index + 1)] }
            }
        case 'deselect-all':
            return { ...state, objects: state.objects.map(o => ({ ...o, isSelected: false })) }
        default:
            return state;
    }
}