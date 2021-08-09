import React from 'react';
import { createSvgIcon } from '@material-ui/core';

const color = 'rgba(0, 0, 0, 0.54)';

export const RectIcon = createSvgIcon(
    <rect x="2" y="5" width="20" height="15" />, 'RectIcon'
);

export const EllipseIcon = createSvgIcon(
    <ellipse cx="12" cy="12" rx="10" ry="7" />, 'EllipseIcon'
);

export const TextIcon = createSvgIcon(
    <text x="2" y="17" font-size="0.6em">abc</text>, 'TextIcon'
);

export const LineIcon = createSvgIcon(
    <g>
        <line x1="5" y1="16" x2="19" y2="8" stroke={color} stroke-width="2" />
        <circle cx="5" cy="16" r="3" fill={color} />
        <circle cx="19" cy="8" r="3" fill={color} />
    </g>, 'LineIcon'
);

export const VertexToolIcon = createSvgIcon(
    <g>
        <path transform="translate(2 -2)" d="M 3 17.25 V 21 h 3.75 L 17.81 9.94 l -3.75 -3.75 L 3 17.25 Z M 20.71 7.04 c 0.39 -0.39 0.39 -1.02 0 -1.41 l -2.34 -2.34 a 0.9959 0.9959 0 0 0 -1.41 0 l -1.83 1.83 l 3.75 3.75 l 1.83 -1.83 Z" />
        <circle cx="6" cy="18" r="5" fill="none" stroke-width="2" stroke={color} />
    </g>, 'VertexToolIcon'
);