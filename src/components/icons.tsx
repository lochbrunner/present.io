import React from 'react';
import { createSvgIcon } from '@material-ui/core';

export const RectIcon = createSvgIcon(
    <rect x="2" y="5" width="20" height="15" />, 'RectIcon'
);

export const EllipseIcon = createSvgIcon(
    <ellipse cx="12" cy="12" rx="10" ry="7" />, 'EllipseIcon'
);

export const TextIcon = createSvgIcon(
    <text x="2" y="17" font-size="0.6em">abc</text>, 'TextIcon'
);