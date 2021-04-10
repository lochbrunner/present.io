import React from 'react';
import { connect } from 'react-redux';
import { Rectangle, State as RootState, Vector } from 'store';

import './sketchpad.scss';

interface Props extends RootState {
}

interface Actions {
    add: (object: Rectangle) => void;
}

interface RectangleCandidate extends Rectangle {
    mouseDown: Vector;
}

function render(props: Props & Actions) {
    const [candidate, changeCandidate] = React.useState<RectangleCandidate | null>(null);
    const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            const rect = (e.target as any).getBoundingClientRect();
            const curX = e.clientX - rect.x;
            const curY = e.clientY - rect.y;
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
    };
    const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = (e.target as any).getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        changeCandidate({ center: { x, y }, extent: { width: 0, height: 0 }, mouseDown: { x, y } });
    };
    const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            props.add(candidate);
        }
        changeCandidate(null);
    };
    const candidateObject = candidate !== null ?
        <rect pointerEvents={candidate !== null ? 'none' : 'auto'} x={candidate.center.x} y={candidate.center.y} width={candidate.extent.width} height={candidate.extent.height}
            fill="rgb(208,228,255)" strokeWidth="1" stroke="rgb(0,0,0)" /> : null;
    const objects = props.objects.map((data, i) => <rect key={i} pointerEvents={'none'} width={data.extent.width} height={data.extent.height} x={data.center.x} y={data.center.y} fill="rgb(0,0,255)" strokeWidth="1" stroke="rgb(0,0,0)" />);

    return (
        <div className="sketchpad">
            <header></header >
            <div className="tools">
            </div>
            <section className="main">
                <svg onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
                    {objects}
                    {candidateObject}
                </svg>
            </section>
            <div className="outliner">
                <p>{JSON.stringify(props.objects)}</p>
            </div>
        </div>
    )
}

export const add = (object: Rectangle) => {
    return {
        type: 'add',
        object
    };
};

const mapStateToProps = (state: RootState): Props => (state);

const mapDispatchToProps = (dispatch: any): Actions => ({
    add: (object: Rectangle) => dispatch(add(object))
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
