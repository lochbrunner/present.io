
import { initState, State } from '../store';
import { AnyObject, Rectangle, wrap } from '../objects';
import arrayMove from 'array-move';
import { addVec, Vector } from '../common/math';

export interface ChangeSelection {
    state: boolean;
    index: number;
}

export interface Action {
    type: string;
    payload: Rectangle | ChangeSelection;
}

function add(a: Vector, b: Vector, snap?: number): Vector {
    let orig = {
        x: a.x + b.x,
        y: a.y + b.y,
    };
    if (snap !== undefined) {
        orig.x = Math.round(orig.x / snap) * snap;
        orig.y = Math.round(orig.y / snap) * snap;
    }
    return orig;
}

function snapNearest(old1: number, old2: number, a: number, b: number): [number, number] {
    const varA1 = Math.abs(old1 - a) + Math.abs(old2 - b);
    const varA2 = Math.abs(old2 - a) + Math.abs(old1 - b);
    if (varA1 < varA2) {
        return [a, b];
    } else {
        return [b, a];
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
                const { delta } = (action.payload as any);
                const move = (o: AnyObject): AnyObject => {
                    if (o.type === 'rect') {
                        return { ...o, upperLeft: add(o.upperLeft, delta), origin: add(o.origin, delta) };
                    } else if (o.type === 'ellipse') {
                        return { ...o, center: add(o.center, delta), origin: add(o.origin, delta) };
                    }
                    else if (o.type === 'text') {
                        return { ...o, start: add(o.start, delta), origin: add(o.origin, delta) };

                    } else if (o.type === 'line') {
                        return { ...o, start: add(o.start, delta), end: add(o.end, delta), origin: add(o.origin, delta) };
                    } else {
                        return wrap(o)?.move(delta) ||
                        {
                            ...(o as any)
                        };
                    }
                }
                return {
                    ...state, objects: state.objects
                        .map(o => { if (o.isSelected) { return move(o); } else { return o; } })
                };
            };


        case 'selected-rotate':
            {
                const rotation = (action.payload as any);
                return { ...state, objects: state.objects.map(o => { if (o.isSelected) { return { ...o, rotation } } else { return o; } }) };
            }
        case 'move-origin':
            {
                const { origin, index, deltaUpperLeft } = (action.payload as any);
                const prevObject = state.objects[index]
                const createObject = (o: AnyObject): AnyObject => {
                    if (o.type === 'rect') {
                        return { ...o, origin: add(origin, o.origin), upperLeft: add(deltaUpperLeft, o.upperLeft) };
                    } else if (o.type === 'ellipse') {
                        return { ...o, origin: add(origin, o.origin), center: add(deltaUpperLeft, o.center) };
                    } else if (o.type === 'text') {
                        return { ...o, origin: add(origin, o.origin), start: add(deltaUpperLeft, o.start) };
                    } else if (o.type === 'line') {
                        return { ...o, origin: add(origin, o.origin), start: add(deltaUpperLeft, o.start), end: add(deltaUpperLeft, o.end) };
                    } else {
                        return wrap(o)?.moveOrigin(origin, deltaUpperLeft) || { ...(o as any) };
                    }
                }
                return { ...state, objects: [...state.objects.slice(0, index), createObject(prevObject), ...state.objects.slice(index + 1)] }
            }
        case 'move-vertex':
            {
                const { index, vertexIndex, delta } = (action.payload as any);
                const prevObject = state.objects[index];
                const createObject = (o: AnyObject): AnyObject => {
                    if (o.type === 'line') {
                        if (vertexIndex === 0) {
                            return { ...o, start: add(o.start, delta) };
                        } else {
                            return { ...o, end: add(o.end, delta) };
                        }
                    }
                    else {
                        return wrap(o)?.moveVertex(vertexIndex, delta) || { ...o };
                    }
                }
                return { ...state, objects: [...state.objects.slice(0, index), createObject(prevObject), ...state.objects.slice(index + 1)] }
            }
        case 'move':
            {
                const { from, to } = (action.payload as any);
                return { ...state, objects: arrayMove(state.objects, from, to) };
            }
        case 'scale': {
            const { origin, upperLeft, extent, index } = (action.payload as any);
            const createObject = (prevObject: AnyObject) => {
                if (prevObject.type === 'rect') {
                    return { ...prevObject, upperLeft, extent, origin };
                } else if (prevObject.type === 'ellipse') {
                    const radius = { x: extent.width / 2, y: extent.height / 2 };
                    return { ...prevObject, origin, center: addVec(upperLeft, radius), radius };
                } else if (prevObject.type === 'line') {
                    const [x1, x2] = snapNearest(prevObject.start.x, prevObject.end.x, upperLeft.x, upperLeft.x + extent.width);
                    const [y1, y2] = snapNearest(prevObject.start.y, prevObject.end.y, upperLeft.y, upperLeft.y + extent.height);
                    const start = { x: x1, y: y1 };
                    const end = { x: x2, y: y2 };
                    return { ...prevObject, origin, start, end };
                } else {
                    return wrap(prevObject)?.scale(origin, upperLeft, extent) || { ...(prevObject as any) };
                }
            }
            return { ...state, objects: [...state.objects.slice(0, index), createObject(state.objects[index]), ...state.objects.slice(index + 1)] }
        }
        case 'selected-delete':
            return { ...state, objects: state.objects.filter(o => !o.isSelected) };
        case 'settings': {
            const settings = (action.payload as any);
            return { ...state, settings };
        }
        case 'move-camera': {
            const deltaOffset = (action.payload as any);
            return { ...state, camera: { ...state.camera, offset: add(deltaOffset, state.camera.offset) } };
        }
        default:
            return state;
    }
}