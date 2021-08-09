import React from 'react';
import * as _ from 'lodash';

import './tools.scss';

import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import EditIcon from '@material-ui/icons/Edit';
import { EllipseIcon, LineIcon, PolygonIcon, RectIcon, TextIcon, VertexToolIcon } from './icons';
import { WorkingStates } from './manipulation-tool';

export interface Props {
    workingState: WorkingStates;
    changeWorkingState: (state: WorkingStates) => void;
}

export default function render(props: Props) {
    const state2index = {
        'select': 0, 'vertex': 1, 'rectangle': 2, 'ellipse': 3, 'text': 4, 'line': 5, 'polygon': 6
    };
    const index2state = _.invert(state2index);
    return (
        <div className="tools" >
            <BottomNavigation
                value={state2index[props.workingState]}

                onChange={(event, newValue) => {
                    props.changeWorkingState(index2state[newValue] as any);
                }}
                showLabels
            >
                <BottomNavigationAction label="Edit" icon={<EditIcon />} />
                <BottomNavigationAction label="Vertex" icon={<VertexToolIcon />} />
                <BottomNavigationAction label="Rectangles" icon={<RectIcon />} />
                <BottomNavigationAction label="Ellipse" icon={<EllipseIcon />} />
                <BottomNavigationAction label="Text" icon={<TextIcon />} />
                <BottomNavigationAction label="Line" icon={<LineIcon />} />
                <BottomNavigationAction label="Polygon" icon={<PolygonIcon />} />
            </BottomNavigation>
        </div >
    );
}