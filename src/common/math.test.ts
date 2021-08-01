import { Transformation } from './math';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

declare global {
    namespace jest {
        interface Matchers<R, T> {
            toBeDeepCloseTo(expected: T, precision: number): CustomMatcherResult
        }
    }
}

test('just scaling', () => {
    const a = { x: 1, y: 2 };
    const rotation = 0;
    const scale = { width: 2, height: 3 };
    const translation = { x: 0, y: 0 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 2, y: 6 }

    expect(actual).toEqual(expected);
});

test('just translation', () => {
    const a = { x: 1, y: 2 };
    const rotation = 0;
    const scale = { width: 1, height: 1 };
    const translation = { x: 10, y: 20 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 11, y: 22 }

    expect(actual).toEqual(expected);
});

test('just rotation 180', () => {
    const a = { x: 1, y: 2 };
    const rotation = 180;
    const scale = { width: 1, height: 1 };
    const translation = { x: 0, y: 0 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: -1, y: -2 };

    expect(actual).toBeDeepCloseTo(expected, 7);
});

test('just rotation 90', () => {
    const a = { x: 1, y: 2 };
    const rotation = -90;
    const scale = { width: 1, height: 1 };
    const translation = { x: 0, y: 0 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 2, y: -1 };

    expect(actual).toBeDeepCloseTo(expected, 7);
});

test('rotation 90 and scale', () => {
    const a = { x: 1, y: 2 };
    const rotation = -90;
    const scale = { width: 5, height: 7 };
    const translation = { x: 0, y: 0 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 14, y: -5 };

    expect(actual).toBeDeepCloseTo(expected, 7);
});

test('rotation 90 and translate', () => {
    const a = { x: 1, y: 2 };
    const rotation = -90;
    const scale = { width: 1, height: 1 };
    const translation = { x: 5, y: 7 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 7, y: 6 };

    expect(actual).toBeDeepCloseTo(expected, 7);
});

test('translate and scale', () => {
    const a = { x: 1, y: 2 };
    const rotation = 0;
    const scale = { width: 5, height: 7 };
    const translation = { x: 10, y: 20 };
    const transformation = new Transformation({ rotation, scale, translation });
    const actual = transformation.apply(a);
    const expected = { x: 15, y: 34 };

    expect(actual).toEqual(expected);
});

test('inverse', () => {
    const rotation = -90;
    const scale = { width: 5, height: 7 };
    const translation = { x: 10, y: 20 };
    const transformation = new Transformation({ rotation, scale, translation });
    const inverse = transformation.inverse()
    const actual = transformation.multiply(inverse);
    const identity = Transformation.identity();

    expect(actual.matrix).toBeDeepCloseTo(identity.matrix, 7);
});