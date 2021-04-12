import { WorkingStates } from 'pages/sketchpad';
import React from 'react';
import * as _ from 'lodash';

import './tools.scss';

import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import EditIcon from '@material-ui/icons/Edit';
import { RectIcon } from './icons';

export interface Props {
    workingState: WorkingStates;
    changeWorkingState: (state: WorkingStates) => void;
}

export default function render(props: Props) {
    const state2index = { 'select': 0, 'rectangle': 1 };
    const index2state = _.invert(state2index);
    return (
        <div className="tools">
            <BottomNavigation
                value={state2index[props.workingState]}

                onChange={(event, newValue) => {
                    props.changeWorkingState(index2state[newValue] as any);
                }}
                showLabels
            >
                <BottomNavigationAction label="Edit" icon={<EditIcon />} />
                <BottomNavigationAction label="Rectangles" icon={<RectIcon />} />
            </BottomNavigation>
        </div>
    );
}