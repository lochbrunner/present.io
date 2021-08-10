import React from 'react';
import { addVec, Extent, Vector } from '../common/math';
import { Candidate, PolygonObject } from '../objects';
import { BaseWrapper, rgbaColor } from './base';
import { createTransform, createToolStyle, WorkingStates } from '../components/manipulation-tool';
import { NumberRow } from '../components/property-box';

function createScale(prevWidth: number, prevStart: number, newWidth: number, newStart: number) {
    // TODO: consider mirroring
    return (v: number) => {
        const r = (v - prevStart) / prevWidth;
        return (r * newWidth) + newStart;
    };
}

export class PolygonWrapper extends BaseWrapper {
    private data: PolygonObject;

    constructor(data: PolygonObject) {
        super();
        this.data = data;
    }

    onCreation(pos: Vector): Candidate {
        const points = [...this.data.points.slice(0, -1), pos];
        return {
            ...this.data, points, mouseDown: pos
        };
    }

    onCreationMouseUp(pos: Vector, changeCandidate: (candidate: Candidate) => void): PolygonObject | undefined {
        return undefined;
    }

    onCreationMouseDown(pos: Vector): Candidate | undefined {
        const points = [...this.data.points, pos];
        return {
            ...this.data, points, mouseDown: pos
        };
    }

    onCreationEnded(): PolygonObject | undefined {
        return this.data;
    }

    // UI

    renderCandidate(): JSX.Element {
        const { data } = this;
        const points = data.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
            <polygon points={points}
                fill={rgbaColor(data.fillColor)} strokeWidth={data.borderWidth} stroke={rgbaColor(data.borderColor)} />
        );
    }

    render(commonStyle: any): JSX.Element {
        const { data } = this;
        const points = data.points.map(p => `${p.x},${p.y}`).join(' ');
        const style = {
            ...commonStyle,
        };
        return (
            < polygon points={points} {...style}
                fill={rgbaColor(data.fillColor)} strokeWidth={data.borderWidth} stroke={rgbaColor(data.borderColor)} />);
    }

    tool(index: number, workingState: WorkingStates, scale: number, onVertexDown: (index: number, vertexIndex: number, rotation: number) => (e: React.MouseEvent<any>) => void, createItems: (extent: Extent, origin: Vector, upperLeft: Vector, rotation: number, rotationPivot: Vector) => JSX.Element): JSX.Element {
        const { origin, rotation, points } = this.data;
        const upperLeft = { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) };
        const lowerRight = { x: Math.max(...points.map(p => p.x)), y: Math.max(...points.map(p => p.y)) };
        const extent = { width: lowerRight.x - upperLeft.x, height: lowerRight.y - upperLeft.y, }
        const pivotRadius = 0.5 * extent.height + 60;
        const rotationPivot = { x: origin.x, y: origin.y - pivotRadius };
        if (workingState !== 'vertex') {
            return (
                <g transform={createTransform(this.data)} className="selection-marker" key={index}>
                    {createItems(extent, origin, upperLeft, rotation, rotationPivot)}
                </g>
            );
        }
        else {
            const toolStyle = createToolStyle(scale);
            const points = this.data.points.map((p, i) => <circle key={i} className="tool vertex" cx={p.x} cy={p.y} onMouseDown={onVertexDown(index, i, rotation)} {...toolStyle} />)
            return (
                <g transform={createTransform(this.data)} className="selection-marker" key={index}>
                    {points}
                </g>
            );
        }
    }

    // Reducer

    move(delta: Vector): PolygonObject | undefined {
        return { ...this.data, points: this.data.points.map(p => addVec(p, delta)), origin: addVec(this.data.origin, delta) };
    }

    moveOrigin(origin: Vector, delta: Vector): PolygonObject | undefined {
        return { ...this.data, points: this.data.points.map(p => addVec(p, delta)), origin: addVec(this.data.origin, origin) };
    }

    scale(origin: Vector, upperLeft: Vector, extent: Extent): PolygonObject | undefined {
        const { points } = this.data;
        const prevUpperLeft = { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) };
        const lowerRight = { x: Math.max(...points.map(p => p.x)), y: Math.max(...points.map(p => p.y)) };
        const prevExtent = { width: lowerRight.x - upperLeft.x, height: lowerRight.y - upperLeft.y, }

        const xScale = createScale(prevExtent.width, prevUpperLeft.x, extent.width, upperLeft.x);
        const yScale = createScale(prevExtent.height, prevUpperLeft.y, extent.height, upperLeft.y);
        return {
            ...this.data, points: this.data.points.map(p => ({ x: xScale(p.x), y: yScale(p.y) })), origin
        };
    }

    moveVertex(vertexIndex: number, delta: Vector) {
        return {
            ...this.data, points: this.data.points.map((p, i) => i === vertexIndex ? addVec(p, delta) : p)
        };
    }

    /** Add new vertex after specified index */
    addVertex(vertexIndex: number): PolygonObject | undefined {
        const prevPoint = { ...this.data.points[vertexIndex] };
        const points = [...this.data.points]
        points.splice(vertexIndex, 0, prevPoint);
        return {
            ...this.data, points
        };
    }

    deleteVertex(vertexIndex: number): PolygonObject | undefined {
        return {
            ...this.data, points: this.data.points.filter((p, i) => i !== vertexIndex)
        };
    }

    properties(common: JSX.Element, setProperty: (name: string, value: any) => void): JSX.Element {
        return (
            <div className="property-box">
                {common}
                <NumberRow key={4} object={this.data} change={setProperty} label="path length" valueName="pathLength" />
            </div>
        );
    }
}