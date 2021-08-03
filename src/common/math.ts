import { inv, multiply } from 'mathjs';

export interface Vector {
    x: number;
    y: number;
}

export interface Extent {
    width: number;
    height: number;
}

export interface TransformationArgs {
    rotation: number;
    scale: Extent;
    translation: Vector;
}

export interface TransformationData {
    matrix: number[][];
}

export function minusVec(a: Vector, b: Vector): Vector {
    return { x: a.x - b.x, y: a.y - b.y };
}

export function addVec(a: Vector, b: Vector): Vector {
    return { x: a.x + b.x, y: a.y + b.y };
}

export function scaleVec(a: Vector, b: number): Vector {
    return { x: a.x * b, y: a.y * b };
}

export function minusExtent(a: Extent, b: Extent): Extent {
    return { width: a.width - b.width, height: a.height - b.height };
}

export class Transformation {

    private matrix_: number[][];

    // rotation in degree clockwise
    constructor(args: TransformationArgs | TransformationData) {
        if ('matrix' in args) {
            this.matrix_ = args.matrix;
        }
        else {
            const { rotation, scale, translation } = args;
            const cos = Math.cos(rotation / 180 * Math.PI);
            const sin = Math.sin(rotation / 180 * Math.PI)
            this.matrix_ = [
                [cos * scale.width, -sin * scale.height, translation.x],
                [sin * scale.width, cos * scale.height, translation.y],
                [0, 0, 1]
            ];
        }
    }

    public get matrix() {
        return this.matrix_;
    }

    apply(vector: Vector): Vector {
        const harmonic = [vector.x, vector.y, 1.];
        const rotated = this.matrix_.map(row => row.reduce((p, v, i) => p + v * harmonic[i], 0));
        return { x: rotated[0], y: rotated[1] };
    }

    inverse(): Transformation {
        return new Transformation({ matrix: inv(this.matrix_) });
    }

    multiply(transformation: Transformation): Transformation {
        const matrix = multiply(this.matrix_, transformation.matrix_);
        return new Transformation({ matrix });
    }

    static identity() {
        const matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        return new Transformation({ matrix });
    }
}