import React from 'react';
import { connect } from 'react-redux';
import { ChangeSelection } from 'reducers';
import { Rectangle, State as RootState, Vector } from 'store';

import Outliner from '../components/outliner';
import Tools from '../components/tools';

import './sketchpad.scss';

interface Props extends RootState {
}

interface Actions {
    add: (object: Rectangle) => void;
    changeSelect: (data: ChangeSelection) => void;
    select: (index: number) => void;
    deselectAll: () => void;
}

interface RectangleCandidate extends Rectangle {
    mouseDown: Vector;
}

export type WorkingStates = 'rectangle' | 'select';

function render(props: Props & Actions) {
    const [candidate, changeCandidate] = React.useState<RectangleCandidate | null>(null);
    const [workingState, changeWorkingState] = React.useState<WorkingStates>('rectangle');
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
        if (workingState === 'rectangle') {
            const name = `rectangle ${props.objects.length}`;
            changeCandidate({ center: { x, y }, extent: { width: 0, height: 0 }, mouseDown: { x, y }, name, isSelected: true });
            props.deselectAll();
        }
    };
    const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            if (candidate.extent.height > 10 && candidate.extent.width > 10) {
                props.add(candidate);
            }
            changeCandidate(null);
        }
    };

    const onMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
        if (candidate !== null) {
            changeCandidate(null);
        }
    };

    const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (workingState === 'select') {
            props.deselectAll();
        }
    }

    const rectStyle = (object: Rectangle, index: number) => ({
        strokeWidth: '1',
        stroke: 'rgb(0,0,0)',
        fill: 'rgb(0,0,255)',
        pointerEvents: workingState === 'rectangle' ? 'none' : 'auto',
        onClick: workingState === 'select' ? (e: React.MouseEvent<any>) => {
            e.stopPropagation();
            if (e.ctrlKey) {
                props.changeSelect({ state: !object.isSelected, index })
            }
            else {
                props.select(index);
            }
        } : undefined
    });

    const candidateObject = candidate !== null ?
        <rect pointerEvents={candidate !== null ? 'none' : 'auto'} x={candidate.center.x} y={candidate.center.y} width={candidate.extent.width} height={candidate.extent.height}
            fill="rgb(208,228,255)" strokeWidth="1" stroke="rgb(0,0,0)" /> : null;
    const objects = props.objects.map((data, i) => <rect key={i} width={data.extent.width} height={data.extent.height} x={data.center.x} y={data.center.y}
        {...rectStyle(data, i)} />);

    const selections = props.objects.filter(object => object.isSelected).map((data, i) =>
        <g key={i}>
            <rect fill="none" strokeWidth="2" stroke="rgb(127,127,255)" width={data.extent.width} height={data.extent.height} x={data.center.x} y={data.center.y} />
            <circle fill="rgb(127,127,255)" r="6" cx={data.center.x.toString()} cy={data.center.y.toString()} />
            <circle fill="rgb(127,127,255)" r="6" cx={(data.center.x + data.extent.width).toString()} cy={data.center.y.toString()} />
            <circle fill="rgb(127,127,255)" r="6" cx={data.center.x.toString()} cy={(data.center.y + data.extent.height).toString()} />
            <circle fill="rgb(127,127,255)" r="6" cx={(data.center.x + data.extent.width).toString()} cy={(data.center.y + data.extent.height).toString()} />
        </g>)

    return (
        <div className="sketchpad">
            <header></header >
            <Tools workingState={workingState} changeWorkingState={changeWorkingState} />
            <section className="main">
                <svg onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave} onClick={onClick}>
                    {objects}
                    {candidateObject}
                    {selections}
                </svg>
            </section>
            <Outliner objects={props.objects} select={props.select} changeSelect={props.changeSelect} />
        </div>
    )
}

export const add = (payload: Rectangle) => {
    return {
        type: 'add',
        payload
    };

};

export const select = (index: number) => {
    return {
        type: 'select',
        payload: { index },
    }
};

export const changeSelect = (payload: ChangeSelection) => {
    return {
        type: 'change-select',
        payload,
    }
};

const mapStateToProps = (state: RootState): Props => (state);

const mapDispatchToProps = (dispatch: any): Actions => ({
    add: (object: Rectangle) => dispatch(add(object)),
    changeSelect: (object: ChangeSelection) => dispatch(changeSelect(object)),
    select: (index: number) => dispatch(select(index)),
    deselectAll: () => dispatch({ type: 'deselect-all' })
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
