import { Extent, Vector } from '../common/math';
import { Color } from '../store';
import { BaseWrapper } from './base';
import { PolygonWrapper } from './polygon';

export interface BaseObject {
    name: string;
    isSelected: boolean;
    /** @deprecated */
    fillColor: Color;
    /** @deprecated same as strokeColor */
    borderColor: Color;
    /** @deprecated same as strokeWidth */
    borderWidth: number;
    rotation: number;
    origin: Vector; // origin of rotation
    skew: Vector;
}

export interface Rectangle extends BaseObject {
    type: 'rect';
    upperLeft: Vector;
    extent: Extent;
    radiusX: number;
    radiusY: number;
}

export interface Ellipse extends BaseObject {
    type: 'ellipse';
    center: Vector;
    radius: Vector;
    /**Defines the total path length in user units. */
    pathLength: number;
}

export interface TextObject extends BaseObject {
    type: 'text';
    content: string;
    start: Vector;
    shift: Vector;
    glyphRotation: number;
    lengthAdjust: string;
    textLength: string;
    style: {
        fontFamily?: string;
        fontSize?: string;
        fontSizeAdjust?: any;
        fontStretch: number;
        fontStyle?: 'normal' | 'italic' | 'oblique';
        fontVariant?: any;
        fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
    }
}

export interface LineObject extends BaseObject {
    type: 'line';
    /** x1, y1 */
    start: Vector;
    /** x2, y2 */
    end: Vector;
    /**Defines the total path length in user units. */
    pathLength: number;
}

export interface PolygonObject extends BaseObject {
    type: 'polygon';
    points: Vector[];
    /**Defines the total path length in user units. */
    pathLength: number;
}

export type AnyObject = Rectangle | Ellipse | TextObject | LineObject | PolygonObject;

export type ObjectNames = 'rectangle' | 'ellipse' | 'text' | 'line' | 'polygon';

/** Returns a handy wrapper that provides functionality for the data */
export function wrap(data: AnyObject): BaseWrapper | undefined {
    if (data.type === 'polygon') {
        return new PolygonWrapper(data);
    }
    else {
        return undefined;
    }
}

export type Candidate = AnyObject & { mouseDown: Vector };


export interface GeneralProperties {
    fillColor: Color;
    borderColor: Color;
    borderWidth: number;
}


export interface DrawProperties extends GeneralProperties {
    radiusX: number;
    radiusY: number;
}

export function createCandidate(name: ObjectNames, position: Vector, drawProperties: DrawProperties): Candidate {
    if (name === 'rectangle') {
        return {
            upperLeft: position, extent: { width: 0, height: 0 }, rotation: 0, skew: { x: 0, y: 0 }, origin: position, type: 'rect',
            mouseDown: position, name, isSelected: true, ...drawProperties
        };
    }
    else if (name === 'ellipse') {
        return {
            center: position, radius: { x: 0, y: 0 }, pathLength: 0, rotation: 0, skew: { x: 0, y: 0 }, origin: position, type: 'ellipse',
            mouseDown: position, name, isSelected: true, ...drawProperties
        };
    }
    else if (name === 'text') {
        return {
            content: 'abc', start: position, shift: { x: 0, y: 0 }, glyphRotation: 0, lengthAdjust: '', textLength: '', style: { fontStretch: 100 },
            rotation: 0, skew: { x: 0, y: 0 }, origin: position, type: 'text',
            mouseDown: position, name, isSelected: true, ...drawProperties
        };
    }
    else if (name === 'line') {
        return {
            type: 'line',
            start: position,
            end: position,
            pathLength: 0,
            rotation: 0, skew: { x: 0, y: 0 }, origin: position,
            mouseDown: position, name, isSelected: true, ...drawProperties
        };
    } else if (name === 'polygon') {
        return {
            type: 'polygon',
            points: [position, position],
            pathLength: 0,
            rotation: 0, skew: { x: 0, y: 0 }, origin: position,
            mouseDown: position, name, isSelected: true, ...drawProperties
        };
    }
    throw 'assertNever';
}