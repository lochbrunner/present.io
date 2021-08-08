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