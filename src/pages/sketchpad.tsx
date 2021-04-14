import React from 'react';
import { connect } from 'react-redux';
import { ChangeSelection } from 'reducers';
import { Color, Extent, Rectangle, State as RootState, Vector } from 'store';

import Outliner from '../components/outliner';
import PropertyBox from '../components/property-box';
import Tools from '../components/tools';
import Header, { useStyles } from '../components/header';

import './sketchpad.scss';
import { ActionCreators, StateWithHistory } from 'redux-undo';

function asDownload(text: string, filename: string) {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    const blob = new Blob([text], { type: "image/svg+xml" });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

interface Props extends RootState {
    hasFuture: boolean;
    hasPast: boolean;
}

interface Actions {
    add: (object: Rectangle[]) => void;
    changeSelect: (data: ChangeSelection) => void;
    select: (indices: number[]) => void;
    deselectAll: () => void;
    selectedSetProperty: (name: string, value: any) => void;
    selectedFillColor: (color: Color) => void;
    selectedBorderColor: (color: Color) => void;
    selectedBorderWidth: (width: number) => void;
    selectedBorderRadiusX: (radius: number) => void;
    selectedBorderRadiusY: (radius: number) => void;
    selectedMove: (center: Vector) => void;
    selectedRotate: (angle: number) => void;
    selectedDelete: () => void;
    scale: (index: number, extent: Extent, center: Vector) => void;
    undo: () => void;
    redo: () => void;
    move: (props: { from: number, to: number }) => void;
}

interface RectangleCandidate extends Rectangle {
    mouseDown: Vector;
}

interface GeneralProperties {
    fillColor: Color;
    borderColor: Color;
    borderWidth: number;
}

interface RectangleProperties extends GeneralProperties {
    radiusX: number;
    radiusY: number;
}

export type WorkingStates = 'rectangle' | 'select';

interface MoveState {
    type: 'move';
    lastMouseDown: Vector;
}
interface ScaleState {
    type: 'scale';
    firstMouseDown: Vector;
    origExtent: Extent;
    origCenter: Vector;
    dirX: 1 | -1 | 0;
    dirY: 1 | -1 | 0;
    index: number;
}

interface RotateState {
    type: 'rotate';
    firstMouseDown: Vector;
    rotationCenter: Vector;
    origRotation: number;
    index: number;
}

type ManipulationState = (MoveState | ScaleState | RotateState) & {
    notUpdate: boolean;
} | null;

function createTransform(object: Rectangle) {
    const { extent, center, rotation } = object;
    const rotationCenter = { x: center.x + 0.5 * extent.width, y: center.y + 0.5 * extent.height };
    return `rotate(${rotation} ${rotationCenter.x} ${rotationCenter.y})`;
}

function ManipulationTool(props: { objects: Rectangle[], svgRef: SVGSVGElement | null, changeManipulationState: (prop: ManipulationState) => void }) {
    const onScaleDown = (index: number, dirX: ScaleState['dirX'], dirY: ScaleState['dirY'], extent: Extent, center: Vector) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const rect = (props.svgRef as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        props.changeManipulationState({
            type: 'scale',
            firstMouseDown: { x, y },
            origExtent: extent,
            origCenter: center,
            notUpdate: true,
            dirX,
            dirY,
            index
        });
    }

    const onRotateDown = (index: number, rotationCenter: Vector, origRotation: number) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const rect = (props.svgRef as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        props.changeManipulationState({
            type: 'rotate',
            firstMouseDown: { x, y },
            notUpdate: true,
            rotationCenter,
            index,
            origRotation
        });
    };

    const toolStyle = {
        fill: 'rgb(220,240,255)',
        stroke: 'rgb(147,187,255)',
        strokeWidth: 2,
        r: 6
    };

    const resizeLineStyle = {
        fill: "rgb(127,127,255)",
        stroke: "rgba(127,127,255,0.01)",
        strokeWidth: '10'
    }

    const tools = props.objects.map((object, i) => ({ object, i })).filter(data => data.object.isSelected).map(data => {
        const { object, i } = data;
        const { extent, center, rotation } = object;
        const rotationCenter = { x: center.x + 0.5 * extent.width, y: center.y + 0.5 * extent.height };
        const pivotRadius = 0.5 * extent.height + 60;
        const rotationPivot = { x: rotationCenter.x, y: rotationCenter.y - pivotRadius };
        return (
            <g transform={createTransform(object)} className="selection-marker" key={i}>
                <rect onMouseDown={onScaleDown(i, 0, -1, extent, center)} className="tool ns" {...resizeLineStyle} height="2" width={extent.width} x={center.x} y={center.y - 1} />
                <rect onMouseDown={onScaleDown(i, 0, 1, extent, center)} className="tool ns" {...resizeLineStyle} height="2" width={extent.width} x={center.x} y={extent.height + center.y - 1} />
                <rect onMouseDown={onScaleDown(i, 1, 0, extent, center)} className="tool ew" {...resizeLineStyle} width="2" height={extent.height} x={center.x + extent.width - 1} y={center.y} />
                <rect onMouseDown={onScaleDown(i, -1, 0, extent, center)} className="tool ew" {...resizeLineStyle} width="2" height={extent.height} x={center.x - 1} y={center.y} />
                <circle onMouseDown={onScaleDown(i, -1, -1, extent, center)} className="tool nw" {...toolStyle} cx={center.x} cy={center.y} />
                <circle onMouseDown={onScaleDown(i, 1, -1, extent, center)} className="tool ne" {...toolStyle} cx={center.x + extent.width} cy={center.y} />
                <circle onMouseDown={onScaleDown(i, -1, 1, extent, center)} className="tool ne" {...toolStyle} cx={center.x} cy={center.y + extent.height} />
                <circle onMouseDown={onScaleDown(i, 1, 1, extent, center)} className="tool nw" {...toolStyle} cx={center.x + extent.width} cy={center.y + extent.height} />
                <line x1={rotationCenter.x} y1={rotationCenter.y} x2={rotationPivot.x} y2={rotationPivot.y} stroke="rgb(127,127,255)" strokeWidth="2" />
                <circle className="tool" {...toolStyle} fill="rgba(220,240,255, 0.5)" cx={rotationCenter.x} cy={rotationCenter.y} />
                <circle className="tool rotate" onMouseDown={onRotateDown(i, rotationCenter, rotation)} {...toolStyle} cx={rotationPivot.x} cy={rotationPivot.y} />
            </g>);
    })

    return <>{tools}</>
}

function render(props: Props & Actions) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [clipBoard, setClipboard] = React.useState<Rectangle[] | null>(null);
    const [candidate, changeCandidate] = React.useState<RectangleCandidate | null>(null);
    const [workingState, changeWorkingState] = React.useState<WorkingStates>('rectangle');
    const [manipulationState, changeManipulationState] = React.useState<ManipulationState>(null);
    const [drawProperties, changeDrawProperties] = React.useState<RectangleProperties>({
        fillColor: { red: 0, green: 0, blue: 255, opacity: 1 },
        borderColor: { red: 0, green: 0, blue: 0, opacity: 1 },
        borderWidth: 1,
        radiusX: 0,
        radiusY: 0
    });

    const download = () => {
        const { current } = svgRef;
        if (current !== null) {
            const image = current.cloneNode(true) as SVGSVGElement;
            const width = current.width.baseVal.value;
            const height = current.height.baseVal.value;
            const markers = image.getElementsByClassName('selection-marker');
            for (let i = markers.length; i--; i > -1) {
                markers[i].remove();
            }

            const code = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}">${image.innerHTML}</svg>`;
            asDownload(code, 'document.svg');
        }
    };

    const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = (svgRef.current as any).getBoundingClientRect();
        const curX = e.clientX - rect.x;
        const curY = e.clientY - rect.y;
        if (candidate !== null) {
            const width = curX - candidate.mouseDown.x;
            const height = curY - candidate.mouseDown.y;
            if (width >= 0 && height >= 0) {
                changeCandidate({ ...candidate, extent: { width, height } });
            }
            else if (width < 0 && height >= 0) {
                const x = curX;
                changeCandidate({ ...candidate, center: { ...candidate.center, x }, extent: { width: -width, height } });
            } else if (width >= 0 && height < 0) {
                const y = curY;
                changeCandidate({ ...candidate, center: { ...candidate.center, y }, extent: { width, height: -height } });
            } else {
                const x = curX;
                const y = curY;
                changeCandidate({ ...candidate, center: { x, y }, extent: { width: -width, height: -height } });
            }
        }
        else if (manipulationState !== null) {
            if (manipulationState.type === 'move') {
                const x = curX - manipulationState.lastMouseDown.x;
                const y = curY - manipulationState.lastMouseDown.y;
                changeManipulationState({ ...manipulationState, notUpdate: false, lastMouseDown: { x: curX, y: curY } })
                props.selectedMove({ x, y });
            } else if (manipulationState.type === 'scale') {
                const { index } = manipulationState;
                const x = curX - manipulationState.firstMouseDown.x;
                const y = curY - manipulationState.firstMouseDown.y;
                const mouseExtent = { width: x, height: y };
                const { dirX, dirY } = manipulationState;
                const sX = dirX < 0 ? 1 : 0;
                const sY = dirY < 0 ? 1 : 0;
                let extent = { width: manipulationState.origExtent.width + mouseExtent.width * dirX, height: manipulationState.origExtent.height + mouseExtent.height * dirY };
                let center = { x: manipulationState.origCenter.x + sX * x, y: manipulationState.origCenter.y + sY * y };

                if (extent.width < 0) {
                    extent.width *= -1;
                    center = { ...center, x: center.x - extent.width };
                }
                if (extent.height < 0) {
                    extent.height *= -1;
                    center = { ...center, y: center.y - extent.height };
                }

                changeManipulationState({ ...manipulationState, notUpdate: false });
                props.scale(index, extent, center);
            } else if (manipulationState.type === 'rotate') {
                const { rotationCenter, firstMouseDown, origRotation } = manipulationState;
                const firstAngle = Math.atan2(firstMouseDown.y - rotationCenter.y, firstMouseDown.x - rotationCenter.x);
                const currentAngle = Math.atan2(curY - rotationCenter.y, curX - rotationCenter.x);

                props.selectedRotate((currentAngle - firstAngle) * 180 / Math.PI + origRotation);
            }
        }
    };
    const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = (e.target as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        if (workingState === 'rectangle') {
            const name = `rectangle ${props.objects.length}`;
            changeCandidate({ center: { x, y }, extent: { width: 0, height: 0 }, rotation: 0, mouseDown: { x, y }, name, isSelected: true, ...drawProperties });
            props.deselectAll();
        }
    };
    const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            if (candidate.extent.height > 10 && candidate.extent.width > 10) {
                props.add([candidate]);
            }
            changeCandidate(null);
        } else {
            if (manipulationState !== null) {
                changeManipulationState(null);
            } else {
                props.deselectAll();
            }
        }
    };

    const onMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            changeCandidate(null);
        }
    };

    const onKeyPress = (e: React.KeyboardEvent<SVGSVGElement>) => {
        if (e.ctrlKey) {
            if (e.key === 'c') {
                const selectedObjects = props.objects.filter(o => o.isSelected);
                if (selectedObjects.length > 0) {
                    const copiedObjects = selectedObjects.map(o => ({ ...o, name: `${o.name} (copy)` }));
                    navigator.clipboard.writeText(JSON.stringify(copiedObjects));
                }
                setClipboard(selectedObjects);
            }
            else if (e.key === 'x') {
                const selectedObjects = props.objects.filter(o => o.isSelected);
                if (selectedObjects.length > 0) {
                    const copiedObjects = selectedObjects.map(o => ({ ...o, name: `${o.name} (copy)` }));
                    navigator.clipboard.writeText(JSON.stringify(copiedObjects));
                    setClipboard(copiedObjects);
                }
                props.selectedDelete();
            }
            else if (e.key === 'v') {
                if (clipBoard !== null) {
                    props.add(clipBoard);
                }
            }
            else if (e.key === 'd') {
                const selectedObjects = props.objects.filter(o => o.isSelected);
                if (selectedObjects.length > 0) {
                    const copiedObjects = selectedObjects.map(o => ({ ...o, name: `${o.name} (copy)`, center: { x: o.center.x + 50, y: o.center.y + 50 } }));
                    props.add(copiedObjects);
                    e.stopPropagation();
                }
            }
            else if (e.key === 'z') {
                props.undo();
            }
            else if (e.key === 'y') {
                props.redo();
            }
        } else {
            if (e.key === 'Delete') {
                props.selectedDelete();
            } else if (e.key === 'q' && workingState !== 'select') {
                changeWorkingState('select');
            } else if (e.key === 'v' && workingState !== 'rectangle') {
                changeWorkingState('rectangle');
            }
        }
    }
    const rgbaColor = (color: Color) => `rgba(${color.red},${color.green},${color.blue},${color.opacity})`;
    const rectStyle = (object: Rectangle, index: number) => ({
        strokeWidth: object.borderWidth,
        stroke: rgbaColor(object.borderColor),
        fill: rgbaColor(object.fillColor),
        pointerEvents: workingState === 'select' ? 'auto' : 'none',
        rx: object.radiusX,
        ry: object.radiusY,
        onMouseDown: manipulationState === null && workingState === 'select' ? (e: React.MouseEvent<any>) => {
            e.stopPropagation();
            if (e.ctrlKey) {
                props.changeSelect({ state: !object.isSelected, index })
            }
            else if (props.objects.some(o => o.isSelected)) {
                if (!object.isSelected) {
                    props.select([index]);
                }
                const rect = (svgRef.current as any).getBoundingClientRect();
                const x = e.clientX - rect.x;
                const y = e.clientY - rect.y;
                changeManipulationState({ type: 'move', notUpdate: true, lastMouseDown: { x, y } });
            }
        } : undefined,
        onMouseUp: workingState === 'select' ? (e: React.MouseEvent<any>) => {
            if (!e.ctrlKey) {
                if (manipulationState !== null) {
                    changeManipulationState(null);
                    if (manipulationState.notUpdate) {
                        props.select([index]);
                    }
                } else {
                    props.select([index]);
                }
            } else {
                if (manipulationState !== null) {
                    changeManipulationState(null);
                }
            }
            e.stopPropagation();

        } : undefined,
    });

    const candidateObject = candidate !== null ?
        <rect pointerEvents={candidate !== null ? 'none' : 'auto'} x={candidate.center.x} y={candidate.center.y} width={candidate.extent.width} height={candidate.extent.height}
            fill={rgbaColor(candidate.fillColor)} strokeWidth={candidate.borderWidth} stroke={rgbaColor(candidate.borderColor)} /> : null;
    const objects = props.objects.map((data, i) => <rect transform={createTransform(data)} key={i} width={data.extent.width} className={`item ${data.isSelected ? 'selected' : ''}`} height={data.extent.height} x={data.center.x} y={data.center.y}
        {...rectStyle(data, i)} />);


    // TODO: Use material design Simple App Bar
    let propBox = null;
    if (workingState === 'select' || props.objects.filter(o => o.isSelected).length > 0) {
        propBox = <PropertyBox
            selectedObjects={props.objects.filter(o => o.isSelected)}
            setProperty={props.selectedSetProperty}
            changeFillColor={props.selectedFillColor}
            changeBorderColor={props.selectedBorderColor}
        />;
    } else {
        propBox = <PropertyBox
            selectedObjects={[drawProperties as any]}
            setProperty={props.selectedSetProperty}
            changeFillColor={fillColor => changeDrawProperties({ ...drawProperties, fillColor })}
            changeBorderColor={borderColor => changeDrawProperties({ ...drawProperties, borderColor })}
        />;
    }
    const classes = useStyles();
    return (
        <div className={`sketchpad ${classes.root}`} >
            <Header download={download} undo={props.undo} redo={props.redo} hasFuture={props.hasFuture} hasPast={props.hasPast} />
            <Tools workingState={workingState} changeWorkingState={changeWorkingState} />
            <section className="main">
                <svg ref={svgRef} tabIndex={0} onKeyDown={onKeyPress} onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}>
                    {objects}
                    {candidateObject}
                    <ManipulationTool objects={props.objects} svgRef={svgRef.current} changeManipulationState={changeManipulationState} />
                </svg>
            </section>
            <div className="left-menu">
                {propBox}
                <Outliner objects={props.objects} selectedDelete={props.selectedDelete} move={props.move} select={props.select} changeSelect={props.changeSelect} />
            </div>
        </div>
    )
}

export const add = (payload: Rectangle[]) => {
    return {
        type: 'add',
        payload
    };

};

export const select = (indices: number[]) => {
    return {
        type: 'select',
        payload: { indices },
    }
};

export const changeSelect = (payload: ChangeSelection) => {
    return {
        type: 'change-select',
        payload,
    }
};

const mapStateToProps = (state: StateWithHistory<RootState>): Props => ({
    ...state.present,
    hasFuture: state.future.length > 0,
    hasPast: state.past.length > 0
});


const mapDispatchToProps = (dispatch: any): Actions => ({
    add: (object: Rectangle[]) => dispatch(add(object)),
    changeSelect: (object: ChangeSelection) => dispatch(changeSelect(object)),
    select: (indices: number[]) => dispatch(select(indices)),
    deselectAll: () => dispatch({ type: 'deselect-all' }),
    selectedSetProperty: (name: string, value: any) => dispatch({ type: 'selected-set-property', payload: { name, value } }),
    selectedFillColor: (color: Color) => dispatch({ type: 'selected-fill-color', payload: color }),
    selectedBorderColor: (color: Color) => dispatch({ type: 'selected-border-color', payload: color }),
    selectedBorderWidth: (width: number) => dispatch({ type: 'selected-border-width', payload: width }),
    selectedBorderRadiusX: (radius: number) => dispatch({ type: 'selected-border-radius-x', payload: radius }),
    selectedBorderRadiusY: (radius: number) => dispatch({ type: 'selected-border-radius-y', payload: radius }),
    selectedMove: (center: Vector) => dispatch({ type: 'selected-move', payload: center }),
    selectedRotate: (angle: number) => dispatch({ type: 'selected-rotate', payload: angle }),
    selectedDelete: () => dispatch({ type: 'selected-delete' }),
    scale: (index: number, extent: Extent, center: Vector) => dispatch({ type: 'scale', payload: { index, extent, center } }),
    undo: () => dispatch(ActionCreators.undo()),
    redo: () => dispatch(ActionCreators.redo()),
    move: (payload: { from: number, to: number }) => dispatch({ type: 'move', payload }),
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
