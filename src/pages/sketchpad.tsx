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
    selectedFillColor: (color: Color) => void;
    selectedBorderColor: (color: Color) => void;
    selectedBorderWidth: (width: number) => void;
    selectedBorderRadiusX: (radius: number) => void;
    selectedBorderRadiusY: (radius: number) => void;
    selectedMove: (center: Vector) => void;
    selectedDelete: () => void;
    scale: (index: number, extent: Extent, center: Vector) => void;
    undo: () => void;
    redo: () => void;
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
export interface MoveState {
    type: 'move';
    lastMouseDown: Vector;
    notUpdate: boolean;
}
export interface ScaleState {
    type: 'scale';
    firstMouseDown: Vector;
    origExtent: Extent;
    origCenter: Vector;
    notUpdate: boolean;
    dirX: 1 | -1 | 0;
    dirY: 1 | -1 | 0;
    index: number;
}
export type ManipulationState = MoveState | ScaleState | null;

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
            }
        }
    };
    const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = (e.target as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        if (workingState === 'rectangle') {
            const name = `rectangle ${props.objects.length}`;
            changeCandidate({ center: { x, y }, extent: { width: 0, height: 0 }, mouseDown: { x, y }, name, isSelected: true, ...drawProperties });
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
    const objects = props.objects.map((data, i) => <rect key={i} width={data.extent.width} className={`item ${data.isSelected ? 'selected' : ''}`} height={data.extent.height} x={data.center.x} y={data.center.y}
        {...rectStyle(data, i)} />);


    const onScaleDown = (index: number, dirX: ScaleState['dirX'], dirY: ScaleState['dirY'], extent: Extent, center: Vector) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const rect = (svgRef.current as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        changeManipulationState({
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
    const toolStyle = {
        'fill': 'rgb(220,240,255)',
        'stroke': 'rgb(147,187,255)',
        'strokeWidth': 2,
        'r': 6
    };
    const selections = props.objects.map((object, i) => ({ object, i })).filter(data => data.object.isSelected).map(data =>
        <g className="selection-marker" key={data.i}>
            <rect onMouseDown={onScaleDown(data.i, 0, -1, data.object.extent, data.object.center)} className="tool ns" fill="rgb(127,127,255)" stroke="rgba(127,127,255,0.01)" strokeWidth="10" height="2" width={data.object.extent.width} x={data.object.center.x} y={data.object.center.y - 1} />
            <rect onMouseDown={onScaleDown(data.i, 0, 1, data.object.extent, data.object.center)} className="tool ns" fill="rgb(127,127,255)" stroke="rgba(127,127,255,0.01)" strokeWidth="10" height="2" width={data.object.extent.width} x={data.object.center.x} y={data.object.extent.height + data.object.center.y - 1} />
            <rect onMouseDown={onScaleDown(data.i, 1, 0, data.object.extent, data.object.center)} className="tool ew" fill="rgb(127,127,255)" stroke="rgba(127,127,255,0.01)" strokeWidth="10" width="2" height={data.object.extent.height} x={data.object.center.x + data.object.extent.width - 1} y={data.object.center.y} />
            <rect onMouseDown={onScaleDown(data.i, -1, 0, data.object.extent, data.object.center)} className="tool ew" fill="rgb(127,127,255)" stroke="rgba(127,127,255,0.01)" strokeWidth="10" width="2" height={data.object.extent.height} x={data.object.center.x - 1} y={data.object.center.y} />
            <circle onMouseDown={onScaleDown(data.i, -1, -1, data.object.extent, data.object.center)} className="tool nw" {...toolStyle} cx={data.object.center.x.toString()} cy={data.object.center.y.toString()} />
            <circle onMouseDown={onScaleDown(data.i, 1, -1, data.object.extent, data.object.center)} className="tool ne" {...toolStyle} cx={(data.object.center.x + data.object.extent.width).toString()} cy={data.object.center.y.toString()} />
            <circle onMouseDown={onScaleDown(data.i, -1, 1, data.object.extent, data.object.center)} className="tool ne" {...toolStyle} cx={data.object.center.x.toString()} cy={(data.object.center.y + data.object.extent.height).toString()} />
            <circle onMouseDown={onScaleDown(data.i, 1, 1, data.object.extent, data.object.center)} className="tool nw" {...toolStyle} cx={(data.object.center.x + data.object.extent.width).toString()} cy={(data.object.center.y + data.object.extent.height).toString()} />
        </g>)

    // TODO: Use material design Simple App Bar
    let propBox = null;
    if (workingState === 'select' || props.objects.filter(o => o.isSelected).length > 0) {
        propBox = <PropertyBox
            selectedObjects={props.objects.filter(o => o.isSelected)}
            changeFillColor={props.selectedFillColor}
            changeBorderColor={props.selectedBorderColor}
            changeBorderWidth={props.selectedBorderWidth}
            changeBorderRadiusX={props.selectedBorderRadiusX}
            changeBorderRadiusY={props.selectedBorderRadiusY}
        />;
    } else {
        propBox = <PropertyBox
            selectedObjects={[drawProperties as any]}
            changeFillColor={fillColor => changeDrawProperties({ ...drawProperties, fillColor })}
            changeBorderColor={borderColor => changeDrawProperties({ ...drawProperties, borderColor })}
            changeBorderWidth={borderWidth => changeDrawProperties({ ...drawProperties, borderWidth })}
            changeBorderRadiusX={radiusX => changeDrawProperties({ ...drawProperties, radiusX })}
            changeBorderRadiusY={radiusY => changeDrawProperties({ ...drawProperties, radiusY })}
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
                    {selections}
                </svg>
            </section>
            <div className="left-menu">
                {propBox}
                <Outliner objects={props.objects} selectedDelete={props.selectedDelete} select={props.select} changeSelect={props.changeSelect} />
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
    selectedFillColor: (color: Color) => dispatch({ type: 'selected-fill-color', payload: color }),
    selectedBorderColor: (color: Color) => dispatch({ type: 'selected-border-color', payload: color }),
    selectedBorderWidth: (width: number) => dispatch({ type: 'selected-border-width', payload: width }),
    selectedBorderRadiusX: (radius: number) => dispatch({ type: 'selected-border-radius-x', payload: radius }),
    selectedBorderRadiusY: (radius: number) => dispatch({ type: 'selected-border-radius-y', payload: radius }),
    selectedMove: (center: Vector) => dispatch({ type: 'selected-move', payload: center }),
    selectedDelete: () => dispatch({ type: 'selected-delete' }),
    scale: (index: number, extent: Extent, center: Vector) => dispatch({ type: 'scale', payload: { index, extent, center } }),
    undo: () => dispatch(ActionCreators.undo()),
    redo: () => dispatch(ActionCreators.redo()),
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
