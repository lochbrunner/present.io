
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
    switch (action.type) {
        case 'add':
            return { ...state, objects: [...state.objects.map(o => ({ ...o, isSelected: false })), ...action.payload as any] }
        case 'select':
            {
                const indices: number[] = (action.payload as any).indices;
                return { ...state, objects: state.objects.map((o, i) => ({ ...o, isSelected: indices.indexOf(i) > -1 })) };
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
        case 'selected-set-property':
            {
                const { name, value } = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, [name]: value } } else { return o; } }) };
            }
        case 'selected-fill-color':
            {
                const fillColor = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, fillColor } } else { return o; } }) };
            }
        case 'selected-border-color':
            {
                const borderColor = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, borderColor } } else { return o; } }) };
            }
        case 'selected-move':
            {
                const delta = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, center: { x: o.center.x + delta.x, y: o.center.y + delta.y } } } else { return o; } }) };
            }
        case 'scale': {
            const index = (action.payload as any).index;
            const extent = (action.payload as any).extent;
            const center = (action.payload as any).center;
            const object = { ...state.objects[index], center, extent };
            return { ...state, objects: [...state.objects.slice(0, index), object, ...state.objects.slice(index + 1)] }
        }
        case 'selected-delete':
            return { ...state, objects: state.objects.filter(o => !o.isSelected) };

        default:
            return state;
    }
}