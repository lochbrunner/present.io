import { WorkingStates } from 'pages/sketchpad';
import React from 'react';

import './tools.scss';

export interface Props {
    workingState: WorkingStates;
    changeWorkingState: (state: WorkingStates) => void;
}

export default function render(props: Props) {
    return (
        <div className="tools">
            <div onClick={e => props.changeWorkingState('select')} className={props.workingState === 'select' ? 'active' : 'passive'}>Select</div>
            <div onClick={e => props.changeWorkingState('rectangle')} className={props.workingState === 'rectangle' ? 'active' : 'passive'}>Rectangle</div>
        </div>
    );
}