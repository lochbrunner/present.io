import React from 'react';
import { connect } from 'react-redux';
import { ChangeSelection } from 'reducers';
import { ActionCreators, StateWithHistory } from 'redux-undo';
import { Camera, Color, Settings, State as RootState } from 'store';
import { Paper } from '@material-ui/core';

import Outliner from '../components/outliner';
import PropertyBox from '../components/property-box';
import Tools from '../components/tools';
import { Grid } from '../components/grid';
import { createTransform, ManipulationState, ManipulationTool, ScaleState, WorkingStates } from '../components/manipulation-tool';
import Header, { useStyles } from '../components/header';
import { addVec, Extent, minusVec, Transformation, Vector } from '../common/math';
import { AnyObject, Ellipse, LineObject, Rectangle, TextObject, createCandidate, wrap, Candidate, DrawProperties } from '../objects';

import './sketchpad.scss';

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
    add: (object: AnyObject[]) => void;
    changeSelect: (data: ChangeSelection) => void;
    select: (indices: number[]) => void;
    deselectAll: () => void;
    selectedSetProperty: (name: string, value: any) => void;
    selectedFillColor: (color: Color) => void;
    selectedBorderColor: (color: Color) => void;
    selectedBorderWidth: (width: number) => void;
    selectedBorderRadiusX: (radius: number) => void;
    selectedBorderRadiusY: (radius: number) => void;
    selectedMove: (upperLeft: Vector) => void;
    selectedRotate: (angle: number) => void;
    selectedDelete: () => void;
    moveOrigin: (index: number, deltaUpperLeft: Vector, origin: Vector) => void;
    moveVertex: (index: number, vertexIndex: number, delta: Vector) => void;
    scale: (index: number, extent: Extent, upperLeft: Vector, origin: Vector) => void;
    undo: () => void;
    redo: () => void;
    move: (props: { from: number, to: number }) => void;
    updateSettings: (settings: Settings) => void;
    moveCamera: (deltaOffset: Vector) => void;
}

function fixedOrigin(deltaOrig: Vector, rotation: number): Vector {
    const transformation = new Transformation({ rotation: -rotation, scale: { width: 1, height: 1 }, translation: { x: 0, y: 0 } });
    const back = transformation.apply(deltaOrig);
    return minusVec(deltaOrig, back);
}

function scale(curX: number, curY: number, manipulationState: ScaleState): { index: number, extent: Extent, upperLeft: Vector, origin: Vector } {
    const { index, rotation, origExtent, origUpperLeft, origOrigin } = manipulationState;
    let extent = { ...origExtent };
    let upperLeft = { ...origUpperLeft };
    let origin = { ...origOrigin };

    const x = curX - manipulationState.firstMouseDown.x;
    const y = curY - manipulationState.firstMouseDown.y;
    const parentStep = { x, y };
    const transformation = new Transformation({ rotation, scale: { width: 1, height: 1 }, translation: { x: 0, y: 0 } });
    const childStep = transformation.inverse().apply(parentStep);
    const { dirX, dirY } = manipulationState;
    // In Rect Mode.
    // No transformation yet!
    extent.width += childStep.x * dirX;
    extent.height += childStep.y * dirY;

    if (dirX < 0) {
        upperLeft.x += childStep.x;
    }
    if (dirY < 0) {
        upperLeft.y += childStep.y;
    }

    if (extent.width < 0) {
        extent.width *= -1;
        upperLeft = { ...upperLeft, x: upperLeft.x - extent.width };
    }
    if (extent.height < 0) {
        extent.height *= -1;
        upperLeft = { ...upperLeft, y: upperLeft.y - extent.height };
    }
    // TODO: 
    //  * move origin
    // const deltaUpperLeft = minusVec(upperLeft, origUpperLeft);
    // const delteExtent = minusExtent(extent, origExtent);
    // const deltaOrigChild = deltaUpperLeft
    return { index, extent, upperLeft, origin };
}

function createViewBox(camera: Camera, parent: SVGSVGElement | null): string | undefined {
    if (parent == null) {
        return undefined;
    }
    else {
        const extent = { width: parent.width.baseVal.value, height: parent.height.baseVal.value };
        const { x, y } = camera.offset;
        return `${x} ${y} ${extent.width} ${extent.height}`;
    }
}

function createBackground(camera: Camera, settings: Settings) {
    if (settings.background.paper) {
        const height = `${settings.resolution.height}px`;
        const width = `${settings.resolution.width}px`;
        const top = `${-camera.offset.y}px`;
        const left = `${-camera.offset.x}px`;
        return (
            <Paper className="paper" elevation={3} style={{ height, width, top, left }} />
        );
    }
    return '';
}

const rgbaColor = (color: Color) => `rgba(${color.red},${color.green},${color.blue},${color.opacity})`;

function CandidateElement(props: { candidate: Candidate | null }) {
    const { candidate } = props;
    if (candidate === null) {
        return null;
    }
    else if (candidate.type === 'rect') {
        return (
            <rect pointerEvents={candidate !== null ? 'none' : 'auto'} x={candidate.upperLeft.x} y={candidate.upperLeft.y} width={candidate.extent.width} height={candidate.extent.height}
                fill={rgbaColor(candidate.fillColor)} strokeWidth={candidate.borderWidth} stroke={rgbaColor(candidate.borderColor)} />
        );
    }
    else if (candidate.type === 'ellipse') {
        const { center, radius } = candidate;
        return (
            <ellipse cx={center.x} cy={center.y} rx={radius.x} ry={radius.y} fill={rgbaColor(candidate.fillColor)} strokeWidth={candidate.borderWidth} stroke={rgbaColor(candidate.borderColor)} />
        );
    } else if (candidate.type === 'text') {
        const style: any = { userSelect: 'none' }
        return (
            <text style={style} x={candidate.start.x} y={candidate.start.y} fill={rgbaColor(candidate.fillColor)}>{candidate.content}</text>
        );
    } else if (candidate.type === 'line') {
        const { start, end } = candidate;
        return (
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={rgbaColor(candidate.borderColor)} />
        );
    }
    else {
        return wrap(candidate)?.renderCandidate() || null;
    }
}

function render(props: Props & Actions) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [clipBoard, setClipboard] = React.useState<AnyObject[] | null>(null);
    const [candidate, changeCandidate] = React.useState<Candidate | null>(null);
    const [workingState, changeWorkingState] = React.useState<WorkingStates>('rectangle');
    const [manipulationState, changeManipulationState] = React.useState<ManipulationState>(null);
    const [drawProperties, changeDrawProperties] = React.useState<DrawProperties>({
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
            const { width, height } = props.settings.resolution;
            const markers = image.getElementsByClassName('selection-marker');
            for (let i = markers.length; i--; i > -1) {
                markers[i].remove();
            }

            const code = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}">${image.innerHTML}</svg>`;
            asDownload(code, 'document.svg');
        }
    };

    const getMousePos = (e: React.MouseEvent<any>): Vector => {
        const rect = (svgRef.current as any).getBoundingClientRect();
        const { offset } = props.camera;
        let x = e.clientX - rect.x + offset.x;
        let y = e.clientY - rect.y + offset.y;
        if (e.ctrlKey) {
            // Snap to grid
            const step = props.settings.background.gridStep;
            x = Math.round(x / step) * step;
            y = Math.round(y / step) * step;
        }
        return { x, y };
    };

    const getMouseRawPos = (e: React.MouseEvent<any>): Vector => {
        const rect = (svgRef.current as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        return { x, y };
    };

    const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.altKey) {
            const { x: curX, y: curY } = getMouseRawPos(e);
            if (manipulationState !== null && manipulationState.type === 'move-camera') {
                const { x, y } = manipulationState.lastMouseDown;
                props.moveCamera({ x: x - curX, y: y - curY })
                changeManipulationState({ type: 'move-camera', lastMouseDown: { x: curX, y: curY }, notUpdate: false });
            }
        } else {

            const { x: curX, y: curY } = getMousePos(e);
            if (candidate !== null) {
                const width = curX - candidate.mouseDown.x;
                const height = curY - candidate.mouseDown.y;
                if (candidate.type === 'rect') {
                    if (width >= 0 && height >= 0) {
                        changeCandidate({ ...candidate, extent: { width, height } });
                    }
                    else if (width < 0 && height >= 0) {
                        const x = curX;
                        changeCandidate({ ...candidate, upperLeft: { ...candidate.upperLeft, x }, extent: { width: -width, height } });
                    } else if (width >= 0 && height < 0) {
                        const y = curY;
                        changeCandidate({ ...candidate, upperLeft: { ...candidate.upperLeft, y }, extent: { width, height: -height } });
                    } else {
                        const x = curX;
                        const y = curY;
                        changeCandidate({ ...candidate, upperLeft: { x, y }, extent: { width: -width, height: -height } });
                    }
                }
                else if (candidate.type === 'ellipse') {
                    let radius = { x: width / 2, y: height / 2 };
                    const center = addVec(candidate.mouseDown, radius);
                    radius.x = Math.abs(radius.x);
                    radius.y = Math.abs(radius.y);
                    changeCandidate({ ...candidate, radius, center });
                }
                else if (candidate.type === 'text') {
                    const start = { x: curX, y: curY };
                    changeCandidate({ ...candidate, start });
                }
                else if (candidate.type === 'line') {
                    const end = { x: curX, y: curY };
                    changeCandidate({ ...candidate, end });
                }
                else {
                    const newCandidate = wrap(candidate)?.onCreation({ x: curX, y: curY });
                    if (newCandidate !== undefined)
                        changeCandidate(newCandidate);
                }
            }
            else if (manipulationState !== null) {
                if (manipulationState.type === 'move') {
                    const x = curX - manipulationState.lastMouseDown.x;
                    const y = curY - manipulationState.lastMouseDown.y;
                    changeManipulationState({ ...manipulationState, notUpdate: false, lastMouseDown: { x: curX, y: curY } })
                    props.selectedMove({ x, y });
                } else if (manipulationState.type === 'scale') {
                    changeManipulationState({ ...manipulationState, notUpdate: false });
                    const { index, extent, upperLeft, origin } = scale(curX, curY, manipulationState);
                    props.scale(index, extent, upperLeft, origin);
                } else if (manipulationState.type === 'rotate') {
                    const { rotationCenter, firstMouseDown, origRotation } = manipulationState;
                    const firstAngle = Math.atan2(firstMouseDown.y - rotationCenter.y, firstMouseDown.x - rotationCenter.x);
                    const currentAngle = Math.atan2(curY - rotationCenter.y, curX - rotationCenter.x);
                    props.selectedRotate((currentAngle - firstAngle) * 180 / Math.PI + origRotation);
                } else if (manipulationState.type === 'move-origin') {
                    const { index, lastMouseDown, rotation } = manipulationState;
                    const x = curX - lastMouseDown.x;
                    const y = curY - lastMouseDown.y;
                    const deltaOrig = { x, y };
                    const deltaUpperLeft = fixedOrigin(deltaOrig, rotation);
                    props.moveOrigin(index, deltaUpperLeft, deltaOrig);
                    changeManipulationState({ ...manipulationState, notUpdate: false, lastMouseDown: { x: curX, y: curY } });
                } else if (manipulationState.type === 'move-vertex') {
                    const { index, lastMouseDown, vertexIndex, rotation } = manipulationState;
                    const x = curX - lastMouseDown.x;
                    const y = curY - lastMouseDown.y;
                    const parentStep = { x, y };
                    const transformation = new Transformation({ rotation, scale: { width: 1, height: 1 }, translation: { x: 0, y: 0 } });
                    const delta = transformation.inverse().apply(parentStep);
                    props.moveVertex(index, vertexIndex, delta);
                    changeManipulationState({ ...manipulationState, notUpdate: false, lastMouseDown: { x: curX, y: curY } });
                }
            }
        }
    };
    const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.altKey) {
            const { x, y } = getMouseRawPos(e);
            changeManipulationState({ type: 'move-camera', lastMouseDown: { x, y }, notUpdate: false });
        }
        else if (workingState !== 'select' && workingState !== 'vertex') {
            const position = getMousePos(e);
            if (candidate !== null) {
                const newCandidate = wrap(candidate)?.onCreationMouseDown(position);
                if (newCandidate !== undefined) {
                    changeCandidate(newCandidate);
                    return;
                }
            }
            changeCandidate(createCandidate(workingState, position, drawProperties));
            props.deselectAll();

        }
    };
    const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            if (candidate.type === 'rect') {
                if (candidate.extent.height > 10 && candidate.extent.width > 10) {
                    candidate.origin = { x: candidate.upperLeft.x + candidate.extent.width / 2, y: candidate.upperLeft.y + candidate.extent.height / 2 };
                    props.add([candidate]);
                    changeCandidate(null);
                }
            } else if (candidate.type === 'ellipse') {
                if (candidate.radius.x > 10 && candidate.radius.y > 10) {
                    candidate.origin = { ...candidate.center };
                    props.add([candidate]);
                    changeCandidate(null);
                }
            } else if (candidate.type === 'text') {
                candidate.borderWidth = 0;
                props.add([candidate]);
                changeCandidate(null);
            } else if (candidate.type === 'line') {
                candidate.borderWidth = 2;
                const { start, end } = candidate;
                candidate.origin = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                props.add([candidate]);
                changeCandidate(null);
            } else {
                const sealed = wrap(candidate)?.onCreationMouseUp(getMouseRawPos(e), changeCandidate);
                if (sealed !== undefined) {
                    props.add([sealed]);
                }
            }

        } else {
            if (manipulationState !== null) {
                changeManipulationState(null);
            } else if (workingState !== 'vertex') {
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
                    const margin = { x: 50, y: 50 };
                    const copyObject = (o: AnyObject): AnyObject => {
                        if (o.type === 'rect') {
                            return { ...o, name: `${o.name} (copy)`, upperLeft: addVec(o.upperLeft, margin) }
                        }
                        else if (o.type === 'ellipse') {
                            return { ...o, name: `${o.name} (copy)`, center: addVec(o.center, margin) };
                        }
                        else {
                            return { ...(o as any), name: `${(o as any).name} (copy)`, };
                        }
                    };
                    const copiedObjects = selectedObjects.map(copyObject);
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
            } else if (e.key === 'Enter') {
                if (candidate !== null) {
                    const sealed = wrap(candidate)?.onCreationEnded();
                    if (sealed !== undefined) {
                        props.add([sealed]);
                        changeCandidate(null);
                    }
                }
            } else if (e.key === 'q' && workingState !== 'select') {
                changeWorkingState('select');
            } else if (e.key === 'v' && workingState !== 'select') {
                changeWorkingState('vertex');
            } else if (e.key === 'r' && workingState !== 'rectangle') {
                changeWorkingState('rectangle');
                changeDrawProperties({ ...drawProperties, borderWidth: 1 });
            } else if (e.key === 'e' && workingState !== 'ellipse') {
                changeWorkingState('ellipse');
                changeDrawProperties({ ...drawProperties, borderWidth: 1 });
            } else if (e.key === 't' && workingState !== 'text') {
                changeWorkingState('text');
                changeDrawProperties({ ...drawProperties, borderWidth: 0 });
            } else if (e.key === 'l' && workingState !== 'line') {
                changeWorkingState('line');
                changeDrawProperties({ ...drawProperties, borderWidth: 0 });
            } else if (e.key === 'p' && workingState !== 'polygon') {
                changeWorkingState('polygon');
                changeDrawProperties({ ...drawProperties, borderWidth: 0 });
            }
        }
    };

    const commonStyle = (object: AnyObject, index: number) => ({
        strokeWidth: object.borderWidth,
        stroke: rgbaColor(object.borderColor),
        fill: rgbaColor(object.fillColor),
        key: index,
        pointerEvents: workingState === 'select' ? 'auto' : 'none',
        transform: createTransform(object),
        className: `item ${object.isSelected ? 'selected' : ''}`,
        onMouseDown: manipulationState === null && workingState === 'select' ? (e: React.MouseEvent<any>) => {
            e.stopPropagation();
            if (e.ctrlKey) {
                props.changeSelect({ state: !object.isSelected, index })
            }
            else if (props.objects.some(o => o.isSelected)) {
                if (!object.isSelected) {
                    props.select([index]);
                }
                const { x, y } = getMousePos(e);
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

    const rectStyle = (object: Rectangle, index: number) => ({
        ...commonStyle(object, index),
        rx: object.radiusX,
        ry: object.radiusY,

    });

    const ellipseStyle = (object: Ellipse, index: number) => ({
        ...commonStyle(object, index),
    });

    const textStyle = (object: TextObject, index: number) => ({
        ...commonStyle(object, index),
        fontFamily: object.style.fontFamily,
        fontSize: object.style.fontSize,
        fontStyle: object.style.fontStyle,
        fontStretch: `${object.style.fontStretch}%`,
        fontWeight: object.style.fontWeight,
    });

    const lineStyle = (object: LineObject, index: number) => ({
        ...commonStyle(object, index),
    });

    const candidateObject = <CandidateElement candidate={candidate} />;
    const objects = props.objects.map((data, i) => {
        if (data.type === 'rect') {
            return (
                <rect width={data.extent.width} height={data.extent.height} x={data.upperLeft.x} y={data.upperLeft.y}
                    {...rectStyle(data, i)} />
            );
        } else if (data.type === 'ellipse') {
            return (
                <ellipse rx={data.radius.x} ry={data.radius.y} cx={data.center.x} cy={data.center.y} pathLength={data.pathLength}
                    {...ellipseStyle(data, i)} />
            );
        } else if (data.type === 'text') {
            const { start } = data;
            return (
                <text style={{ userSelect: 'none' }} {...start} {...textStyle(data, i)} >
                    {data.content}
                </text>
            );
        } else if (data.type === 'line') {
            const { start, end } = data;
            return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} {...lineStyle(data, i)} />;
        } else {
            return wrap(data)?.render(commonStyle(data, i));
        }
    });


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
    const background = createBackground(props.camera, props.settings);
    const viewBox = createViewBox(props.camera, svgRef.current);
    const mainStyle: any = {};
    if (props.settings.background.paper) {
        mainStyle['backgroundColor'] = '#fcfcfc';
    }

    return (
        <div className={`sketchpad ${classes.root}`} >
            <Header download={download} undo={props.undo} redo={props.redo} hasFuture={props.hasFuture} hasPast={props.hasPast} settings={props.settings} updateSettings={props.updateSettings} />
            <Tools workingState={workingState} changeWorkingState={changeWorkingState} />
            <section className="main" style={mainStyle}>
                {background}
                <Grid camera={props.camera} settings={props.settings} />
                <svg ref={svgRef} viewBox={viewBox} tabIndex={0} onKeyDown={onKeyPress} onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}>
                    {objects}
                    {candidateObject}
                    <ManipulationTool objects={props.objects} workingState={workingState} svgRef={svgRef.current} changeManipulationState={changeManipulationState} getMousePos={getMousePos} />
                </svg>
            </section>
            <div className="left-menu">
                {propBox}
                <Outliner objects={props.objects} selectedDelete={props.selectedDelete} move={props.move} select={props.select} changeSelect={props.changeSelect} />
            </div>
        </div>
    )
}

export const add = (payload: AnyObject[]) => {
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
    add: (object: AnyObject[]) => dispatch(add(object)),
    changeSelect: (object: ChangeSelection) => dispatch(changeSelect(object)),
    select: (indices: number[]) => dispatch(select(indices)),
    deselectAll: () => dispatch({ type: 'deselect-all' }),
    moveOrigin: (index: number, deltaUpperLeft: Vector, origin: Vector) => dispatch({ type: 'move-origin', payload: { index, deltaUpperLeft, origin } }),
    moveVertex: (index: number, vertexIndex: number, delta: Vector) => dispatch({ type: 'move-vertex', payload: { index, vertexIndex, delta } }),
    selectedSetProperty: (name: string, value: any) => dispatch({ type: 'selected-set-property', payload: { name, value } }),
    selectedFillColor: (color: Color) => dispatch({ type: 'selected-fill-color', payload: color }),
    selectedBorderColor: (color: Color) => dispatch({ type: 'selected-border-color', payload: color }),
    selectedBorderWidth: (width: number) => dispatch({ type: 'selected-border-width', payload: width }),
    selectedBorderRadiusX: (radius: number) => dispatch({ type: 'selected-border-radius-x', payload: radius }),
    selectedBorderRadiusY: (radius: number) => dispatch({ type: 'selected-border-radius-y', payload: radius }),
    selectedMove: (delta: Vector, snap?: number) => dispatch({ type: 'selected-move', payload: { delta, snap } }),
    selectedRotate: (angle: number) => dispatch({ type: 'selected-rotate', payload: angle }),
    selectedDelete: () => dispatch({ type: 'selected-delete' }),
    scale: (index: number, extent: Extent, upperLeft: Vector, origin: Vector) => dispatch({ type: 'scale', payload: { index, extent, upperLeft, origin } }),
    undo: () => dispatch(ActionCreators.undo()),
    redo: () => dispatch(ActionCreators.redo()),
    move: (payload: { from: number, to: number }) => dispatch({ type: 'move', payload }),
    updateSettings: (settings: Settings) => dispatch({ type: 'settings', payload: settings }),
    moveCamera: (deltaOffset: Vector) => dispatch({ type: 'move-camera', payload: deltaOffset })
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
