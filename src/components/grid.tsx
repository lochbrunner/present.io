import React from 'react';
import { Camera, Settings } from 'store';

export function Grid(props: { camera: Camera, settings: Settings }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    let height = 500;
    let width = 500;
    if (canvasRef.current !== null) {
        width = canvasRef.current.parentElement?.clientWidth ?? 500;
        height = canvasRef.current.parentElement?.clientHeight ?? 500;
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, width, height);
        const { offset } = props.camera;
        const { resolution } = props.settings;
        if (props.settings.background.grid) {
            if (ctx) {
                ctx.strokeStyle = "#eeeeee";
                ctx.lineWidth = 1;
            }
            ctx?.beginPath();
            const step = props.settings.background.gridStep;
            for (let x = step; x < resolution.width; x += step) {
                ctx?.moveTo(-offset.x + x, -offset.y);
                ctx?.lineTo(-offset.x + x, -offset.y + resolution.height);
            }
            for (let y = step; y < resolution.height; y += step) {
                ctx?.moveTo(-offset.x, -offset.y + y);
                ctx?.lineTo(-offset.x + resolution.width, -offset.y + y);
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
            ctx?.lineTo(-offset.x + resolution.width, -offset.y);
            ctx?.lineTo(-offset.x + resolution.width, -offset.y + resolution.height);
            ctx?.lineTo(-offset.x, -offset.y + resolution.height);
            ctx?.lineTo(-offset.x, -offset.y);
            ctx?.stroke();
        }
    }
    return (
        <canvas height={height} width={width} ref={canvasRef} className="grid" />
    );
}