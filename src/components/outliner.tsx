import React from 'react';
import { ChangeSelection } from 'reducers';
import { Rectangle } from 'store';

import './outliner.scss';

export interface Props {
    objects: Rectangle[];
    changeSelect: (data: ChangeSelection) => void;
    select: (index: number) => void;
}

export default function render(props: Props) {

    const onClick = (object: Rectangle, index: number) => (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.ctrlKey) {
            props.changeSelect({ state: !object.isSelected, index })
        } else {
            props.select(index);
        }
    }

    const objects = props.objects.map((object, i) => <div onClick={onClick(object, i)} className={`item ${object.isSelected ? 'selected' : ''}`} key={i}>{object.name}</div>)
    return (
        <div className="outliner">
            {objects}
        </div>
    );
}