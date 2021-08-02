
import { initState, Rectangle, State } from '../store';
import arrayMove from 'array-move';
import { Vector } from 'common/math';

export interface ChangeSelection {
    state: boolean;
    index: number;
}

export interface Action {
    type: string;
    payload: Rectangle | ChangeSelection;
}

function add(a: Vector, b: Vector): Vector {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    }
}


export default (state: State = initState(), action: Action) => {
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
                const { index } = (action.payload as any);
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
                return {
                    ...state, objects: state.objects
                        .map(o => { if (o.isSelected) { return { ...o, upperLeft: add(o.upperLeft, delta), origin: add(o.origin, delta) } } else { return o; } })
                };
            }
        case 'selected-rotate':
            {
                const rotation = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, rotation } } else { return o; } }) };
            }
        case 'move-origin':
            {
                const { origin, index, deltaUpperLeft } = (action.payload as any);
                const prevObject = state.objects[index]
                const object = { ...prevObject, origin: add(origin, prevObject.origin), upperLeft: add(deltaUpperLeft, prevObject.upperLeft) };
                return { ...state, objects: [...state.objects.slice(0, index), object, ...state.objects.slice(index + 1)] }
            }
        case 'move':
            {
                const { from, to } = (action.payload as any);
                return { ...state, objects: arrayMove(state.objects, from, to) };
            }
        case 'scale': {
            const { origin, upperLeft, extent, index } = (action.payload as any);
            const object = { ...state.objects[index], upperLeft, extent, origin };
            return { ...state, objects: [...state.objects.slice(0, index), object, ...state.objects.slice(index + 1)] }
        }
        case 'selected-delete':
            return { ...state, objects: state.objects.filter(o => !o.isSelected) };
        case 'settings': {
            const settings = (action.payload as any);
            return { ...state, settings };
        }
        default:
            return state;
    }
}