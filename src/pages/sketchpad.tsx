import React from 'react';
import { connect } from 'react-redux';
import { ChangeSelection } from 'reducers';
import { Color, Rectangle, State as RootState, Vector } from 'store';

import Outliner from '../components/outliner';
import PropertyBox from '../components/property-box';
import Tools from '../components/tools';

import './sketchpad.scss';

interface Props extends RootState {
}

interface Actions {
    add: (object: Rectangle) => void;
    changeSelect: (data: ChangeSelection) => void;
    select: (index: number) => void;
    deselectAll: () => void;
    selectedFillColor: (color: Color) => void;
    selectedBorderColor: (color: Color) => void;
    selectedBorderWidth: (width: number) => void;
    selectedBorderRadiusX: (radius: number) => void;
    selectedBorderRadiusY: (radius: number) => void;
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

function render(props: Props & Actions) {
    const [candidate, changeCandidate] = React.useState<RectangleCandidate | null>(null);
    const [workingState, changeWorkingState] = React.useState<WorkingStates>('rectangle');
    const [drawProperties, changeDrawProperties] = React.useState<RectangleProperties>({
        fillColor: { red: 0, green: 0, blue: 0, opacity: 1 },
        borderColor: { red: 0, green: 0, blue: 0, opacity: 1 },
        borderWidth: 1,
        radiusX: 0,
        radiusY: 0
    });
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
            changeCandidate({ center: { x, y }, extent: { width: 0, height: 0 }, mouseDown: { x, y }, name, isSelected: true, ...drawProperties });
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
        strokeWidth: object.borderWidth,
        stroke: `rgba(${object.borderColor.red},${object.borderColor.green},${object.borderColor.blue},${object.borderColor.opacity})`,
        fill: `rgba(${object.fillColor.red},${object.fillColor.green},${object.fillColor.blue},${object.fillColor.opacity})`,
        pointerEvents: workingState === 'rectangle' ? 'none' : 'auto',
        rx: object.radiusX,
        ry: object.radiusY,
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
            <div className="left-menu">
                {propBox}
                <Outliner objects={props.objects} select={props.select} changeSelect={props.changeSelect} />
            </div>
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
    deselectAll: () => dispatch({ type: 'deselect-all' }),
    selectedFillColor: (color: Color) => dispatch({ type: 'selected-fill-color', payload: color }),
    selectedBorderColor: (color: Color) => dispatch({ type: 'selected-border-color', payload: color }),
    selectedBorderWidth: (width: number) => dispatch({ type: 'selected-border-width', payload: width }),
    selectedBorderRadiusX: (radius: number) => dispatch({ type: 'selected-border-radius-x', payload: radius }),
    selectedBorderRadiusY: (radius: number) => dispatch({ type: 'selected-border-radius-y', payload: radius }),
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
