import React from 'react';

import { AnyObject, Candidate } from '../objects';
import { Extent, Vector } from '../common/math';
import { Color } from '../store';
import { WorkingStates } from '../components/manipulation-tool';

export const rgbaColor = (color: Color) => `rgba(${color.red},${color.green},${color.blue},${color.opacity})`;

export class BaseWrapper {
    onCreation(pos: Vector): Candidate {
        throw 'not implemented yet!';
    }

    onCreationEnded(): AnyObject | undefined {
        return undefined;
    }

    move(delta: Vector): AnyObject | undefined {
        return undefined;
    }

    scale(origin: Vector, upperLeft: Vector, extent: Extent): AnyObject | undefined {
        return undefined;
    }

    moveOrigin(origin: Vector, delta: Vector): AnyObject | undefined {
        return undefined;
    }

    onCreationMouseUp(pos: Vector, changeCandidate: (candidate: Candidate) => void): AnyObject | undefined {
        throw 'not implemented yet!';
    }

    onCreationMouseDown(pos: Vector): Candidate | undefined {
        return undefined;
    }

    renderCandidate(): JSX.Element {
        throw 'not implemented yet!';
    }

    render(commonStyle: any): JSX.Element {
        throw 'not implemented yet!';
    }

    tool(index: number, workingState: WorkingStates, onVertexDown: (index: number, vertexIndex: number, rotation: number) => (e: React.MouseEvent<any>) => void, createItems: (extent: Extent, origin: Vector, upperLeft: Vector, rotation: number, rotationPivot: Vector) => JSX.Element): JSX.Element {
        throw 'not implemented yet!';
    }

    properties(common: JSX.Element, setProperty: (name: string, value: any) => void): JSX.Element {
        return <div className="property-box"></div>;
    }

    moveVertex(vertexIndex: number, delta: Vector) {
        throw 'not implemented yet!';
    }

    /** Add new vertex after specified index */
    addVertex(vertexIndex: number): AnyObject | undefined {
        throw 'not implemented yet!';
    }

    deleteVertex(vertexIndex: number): AnyObject | undefined {
        throw 'not implemented yet!';
    }
}