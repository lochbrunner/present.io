import React from 'react';
import { scaleVec } from '../common/math';
import { Camera, Settings } from '../store';

export function Grid(props: { camera: Camera, settings: Settings }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    let clientHeight = 500;
    let clientWidth = 500;
    if (canvasRef.current !== null) {
        clientWidth = canvasRef.current.parentElement?.clientWidth ?? clientWidth;
        clientHeight = canvasRef.current.parentElement?.clientHeight ?? clientHeight;
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, clientWidth, clientHeight);
        const { offset: rawOffset, scale } = props.camera;
        const offset = scaleVec(rawOffset, scale);
        const { resolution } = props.settings;
        const width = resolution.width * scale;
        const height = resolution.height * scale;
        if (props.settings.background.grid) {
            if (ctx) {
                ctx.strokeStyle = "#eeeeee";
                ctx.lineWidth = 1;
            }
            ctx?.beginPath();
            const step = props.settings.background.gridStep * scale;
            for (let x = step; x < width; x += step) {
                ctx?.moveTo(-offset.x + x, -offset.y);
                ctx?.lineTo(-offset.x + x, -offset.y + height);
            }
            for (let y = step; y < height; y += step) {
                ctx?.moveTo(-offset.x, -offset.y + y);
                ctx?.lineTo(-offset.x + width, -offset.y + y);
            }
            ctx?.stroke();
        }
        if (!props.settings.background.paper) {
            ctx?.beginPath();
            if (ctx) {
                ctx.strokeStyle = "#888888";
                ctx.lineWidth = 1;
            }
            ctx?.moveTo(-offset.x, -offset.y);
            ctx?.lineTo(-offset.x + width, -offset.y);
            ctx?.lineTo(-offset.x + width, -offset.y + height);
            ctx?.lineTo(-offset.x, -offset.y + height);
            ctx?.lineTo(-offset.x, -offset.y);
            ctx?.stroke();
        }
    }
    return (
        <canvas height={clientHeight} width={clientWidth} ref={canvasRef} className="grid" />
    );
}