import React from 'react';

import { Extent, minusVec, Vector } from '../common/math';
import { AnyObject, ObjectNames, wrap } from '../objects';

export function createTransform(object: AnyObject) {
    const { origin, rotation } = object;
    // const rotationCenter = { x: upperLeft.x + 0.5 * extent.width, y: upperLeft.y + 0.5 * extent.height };
    return `rotate(${rotation} ${origin.x} ${origin.y})`;
}

export type WorkingStates = 'select' | 'vertex' | ObjectNames;


interface MoveState {
    type: 'move';
    lastMouseDown: Vector;
}
export interface ScaleState {
    type: 'scale';
    firstMouseDown: Vector;
    origExtent: Extent;
    origUpperLeft: Vector;
    origOrigin: Vector;
    dirX: 1 | -1 | 0;
    dirY: 1 | -1 | 0;
    dir: number;
    rotation: number;
    index: number;
}

interface RotateState {
    type: 'rotate';
    firstMouseDown: Vector;
    rotationCenter: Vector;
    origRotation: number;
    index: number;
}

interface MoveOriginState {
    type: 'move-origin';
    origOrigin: Vector;
    rotation: number;
    index: number;
    lastMouseDown: Vector;
}

interface MoveVertexState {
    type: 'move-vertex';
    index: number;
    rotation: number;
    vertexIndex: number;
    lastMouseDown: Vector;
}

interface MoveCameraState {
    type: 'move-camera';
    lastMouseDown: Vector;
}

export type ManipulationState = (MoveState | ScaleState | RotateState | MoveOriginState | MoveVertexState | MoveCameraState) & {
    notUpdate: boolean;
} | null;

export const toolStyle = {
    fill: 'rgb(220,240,255)',
    stroke: 'rgb(147,187,255)',
    strokeWidth: 2,
    r: 6
};

export function ManipulationTool(props: { objects: AnyObject[], workingState: WorkingStates, svgRef: SVGSVGElement | null, changeManipulationState: (prop: ManipulationState) => void, getMousePos: (e: React.MouseEvent<any>) => Vector }) {
    const onScaleDown = (index: number, dirX: ScaleState['dirX'], dirY: ScaleState['dirY'], extent: Extent, upperLeft: Vector, rotation: number, dir: number, origin: Vector) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const { x, y } = props.getMousePos(e);
        props.changeManipulationState({
            type: 'scale',
            firstMouseDown: { x, y },
            origExtent: extent,
            origUpperLeft: upperLeft,
            origOrigin: origin,
            notUpdate: true,
            dirX,
            dirY,
            dir,
            index,
            rotation,
        });
    }

    const onRotateDown = (index: number, rotationCenter: Vector, origRotation: number) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const { x, y } = props.getMousePos(e);
        props.changeManipulationState({
            type: 'rotate',
            firstMouseDown: { x, y },
            notUpdate: true,
            rotationCenter,
            index,
            origRotation
        });
    };

    const onOriginDown = (index: number, origOrigin: Vector, rotation: number) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const { x, y } = props.getMousePos(e);
        props.changeManipulationState({
            type: 'move-origin',
            lastMouseDown: { x, y },
            origOrigin,
            index,
            rotation,
            notUpdate: true,
        });
    };

    const onVertexDown = (index: number, vertexIndex: number, rotation: number) => (e: React.MouseEvent<any>) => {
        e.stopPropagation();
        const { x, y } = props.getMousePos(e);
        props.changeManipulationState({
            type: 'move-vertex',
            lastMouseDown: { x, y },
            index,
            rotation,
            vertexIndex,
            notUpdate: true,
        });
    };

    const resizeLineStyle = {
        fill: "rgb(127,127,255)",
        stroke: "rgba(127,127,255,0.01)",
        strokeWidth: '10'
    }

    const tools = props.objects.map((object, i) => ({ object, i })).filter(data => data.object.isSelected).map(data => {
        const { object, i } = data;
        const createItems = (extent: Extent, origin: Vector, upperLeft: Vector, rotation: number, rotationPivot: Vector) => {
            return (
                <>
                    <rect onMouseDown={onScaleDown(i, 0, -1, extent, upperLeft, rotation, 0, origin)} className="tool ns" {...resizeLineStyle} height="2" width={extent.width} x={upperLeft.x} y={upperLeft.y - 1} />
                    <rect onMouseDown={onScaleDown(i, 0, 1, extent, upperLeft, rotation, 180, origin)} className="tool ns" {...resizeLineStyle} height="2" width={extent.width} x={upperLeft.x} y={extent.height + upperLeft.y - 1} />
                    <rect onMouseDown={onScaleDown(i, 1, 0, extent, upperLeft, rotation, 90, origin)} className="tool ew" {...resizeLineStyle} width="2" height={extent.height} x={upperLeft.x + extent.width - 1} y={upperLeft.y} />
                    <rect onMouseDown={onScaleDown(i, -1, 0, extent, upperLeft, rotation, 270, origin)} className="tool ew" {...resizeLineStyle} width="2" height={extent.height} x={upperLeft.x - 1} y={upperLeft.y} />
                    <circle onMouseDown={onScaleDown(i, -1, -1, extent, upperLeft, rotation, 0, origin)} className="tool nw" {...toolStyle} cx={upperLeft.x} cy={upperLeft.y} />
                    <circle onMouseDown={onScaleDown(i, 1, -1, extent, upperLeft, rotation, 0, origin)} className="tool ne" {...toolStyle} cx={upperLeft.x + extent.width} cy={upperLeft.y} />
                    <circle onMouseDown={onScaleDown(i, -1, 1, extent, upperLeft, rotation, 0, origin)} className="tool ne" {...toolStyle} cx={upperLeft.x} cy={upperLeft.y + extent.height} />
                    <circle onMouseDown={onScaleDown(i, 1, 1, extent, upperLeft, rotation, 0, origin)} className="tool nw" {...toolStyle} cx={upperLeft.x + extent.width} cy={upperLeft.y + extent.height} />
                    <line x1={origin.x} y1={origin.y} x2={rotationPivot.x} y2={rotationPivot.y} stroke="rgb(127,127,255)" strokeWidth="2" />
                    <circle className="tool origin" onMouseDown={onOriginDown(i, origin, rotation)} {...toolStyle} fill="rgba(220,240,255, 0.5)" cx={origin.x} cy={origin.y} />
                    <circle className="tool rotate" onMouseDown={onRotateDown(i, origin, rotation)} {...toolStyle} cx={rotationPivot.x} cy={rotationPivot.y} />
                </>
            );
        }

        if (object.type === 'rect') {
            const { extent, upperLeft, rotation, origin } = object;
            const pivotRadius = 0.5 * extent.height + 60;
            const rotationPivot = { x: origin.x, y: origin.y - pivotRadius };
            return (
                <g transform={createTransform(object)} className="selection-marker" key={i}>
                    {createItems(extent, origin, upperLeft, rotation, rotationPivot)}
                </g>);
        } else if (object.type === 'ellipse') {
            const { radius, rotation, origin, center } = object;
            const pivotRadius = 0.5 * radius.y + 60;
            const rotationPivot = { x: origin.x, y: origin.y - pivotRadius };
            const upperLeft = minusVec(center, radius);
            const extent = { width: radius.x * 2, height: radius.y * 2 };
            return (
                <g transform={createTransform(object)} className="selection-marker" key={i}>
                    {createItems(extent, origin, upperLeft, rotation, rotationPivot)}
                </g>
            );
        } else if (object.type === 'text') {
            const { origin, rotation } = object;
            const pivotRadius = 60;
            const rotationPivot = { x: origin.x, y: origin.y - pivotRadius };
            // TODO get extent of rendered text
            return (
                <g transform={createTransform(object)} className="selection-marker" key={i}>
                    <line x1={origin.x} y1={origin.y} x2={rotationPivot.x} y2={rotationPivot.y} stroke="rgb(127,127,255)" strokeWidth="2" />
                    <circle className="tool origin" onMouseDown={onOriginDown(i, origin, rotation)} {...toolStyle} fill="rgba(220,240,255, 0.5)" cx={origin.x} cy={origin.y} />
                    <circle className="tool rotate" onMouseDown={onRotateDown(i, origin, rotation)} {...toolStyle} cx={rotationPivot.x} cy={rotationPivot.y} />
                </g>
            );
        } else if (object.type === 'line') {
            const { origin, rotation, start, end } = object;
            const extent = { width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y) };
            const upperLeft = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) };
            const pivotRadius = 0.5 * extent.height + 60;
            const rotationPivot = { x: origin.x, y: origin.y - pivotRadius };
            if (props.workingState !== 'vertex') {
                return (
                    <g transform={createTransform(object)} className="selection-marker" key={i}>
                        {createItems(extent, origin, upperLeft, rotation, rotationPivot)}
                    </g>
                );
            } else {
                return (
                    <g transform={createTransform(object)} className="selection-marker" key={i}>
                        <circle className="tool vertex" onMouseDown={onVertexDown(i, 0, rotation)} {...toolStyle} cx={start.x} cy={start.y} />
                        <circle className="tool vertex" onMouseDown={onVertexDown(i, 1, rotation)} {...toolStyle} cx={end.x} cy={end.y} />
                    </g>
                );
            }
        } else {
            return wrap(object)?.tool(i, props.workingState, onVertexDown, createItems);
        }
    })

    return <>{tools}</>
}