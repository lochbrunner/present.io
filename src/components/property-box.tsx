import React from 'react';
import { Color, Rectangle } from 'store';
import { ColorPicker, createColor, Color as ComponentColor } from 'material-ui-color';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import './property-box.scss';

export interface Props {
    selectedObjects: Rectangle[];
    changeFillColor: (color: Color) => void;
    changeBorderColor: (color: Color) => void;
    changeBorderWidth: (width: number) => void;
    changeBorderRadiusX: (radius: number) => void;
    changeBorderRadiusY: (radius: number) => void;
}

function convertFromColor(color: ComponentColor): Color {
    const raw = (color.raw as any);
    if (raw.rgb !== undefined) {

        return {
            opacity: color.alpha,
            red: raw.rgb[0],
            green: raw.rgb[1],
            blue: raw.rgb[2],
        }
    } else {
        return {
            opacity: color.alpha,
            red: color.rgb[0],
            green: color.rgb[1],
            blue: color.rgb[2],
        }
    }

}

function colorToHex(color: Color): string {
    const hex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${hex(color.red)}${hex(color.green)}${hex(color.blue)}${hex(color.opacity * 255)}`;
}

export default function render(props: Props) {
    const defaultColors = ['red', 'blue', 'green', 'black', 'yellow', 'orange'];
    const [fillColorPalette, changeColorPallette] = React.useState<ComponentColor[]>(defaultColors.map(createColor as any));
    if (props.selectedObjects.length > 0) {
        const changeFillColor = (color: ComponentColor) => {
            if (color.raw == undefined) {
                return;
            }
            if ((color.raw as any).rgb === undefined) {
                changeColorPallette([...fillColorPalette.slice(Math.max(-17)), color]);
            }
            props.changeFillColor(convertFromColor(color));
        }
        const changeBorderColor = (color: ComponentColor) => {
            if (color.raw == undefined) {
                return;
            }
            if ((color.raw as any).rgb === undefined) {
                changeColorPallette([...fillColorPalette.slice(Math.max(-17)), color]);
            }
            props.changeBorderColor(convertFromColor(color));
        }
        return (
            <div className="property-box">
                <div>
                    <FormGroup row>
                        <FormControlLabel className="color" labelPlacement="start" label="fill" control={
                            <ColorPicker value={createColor(colorToHex(props.selectedObjects[0].fillColor))} palette={fillColorPalette}
                                onChange={changeFillColor} />
                        } />
                    </FormGroup>
                    <FormGroup row>
                        <FormControlLabel className="color" labelPlacement="start" label="border" control={
                            <ColorPicker value={createColor(colorToHex(props.selectedObjects[0].borderColor))} palette={fillColorPalette}
                                onChange={changeBorderColor} />} />
                    </FormGroup>
                    <FormGroup row>
                        <FormControlLabel labelPlacement="start" label="width" control={
                            <TextField value={props.selectedObjects[0].borderWidth}
                                onChange={e => props.changeBorderWidth(parseInt(e.target.value))}
                                type="number" />
                        } />
                    </FormGroup>
                    <FormGroup row>
                        <FormControlLabel labelPlacement="start" label="rx" control={
                            <TextField value={props.selectedObjects[0].radiusX}
                                onChange={e => props.changeBorderRadiusX(parseInt(e.target.value))}
                                type="number" />
                        } />
                    </FormGroup>
                    <FormGroup row>
                        <FormControlLabel labelPlacement="start" label="ry" control={
                            <TextField value={props.selectedObjects[0].radiusY}
                                onChange={e => props.changeBorderRadiusY(parseInt(e.target.value))}
                                type="number" />
                        } />
                    </FormGroup>
                </div>
            </div>
        );
    } else {
        return (
            <div className="property-box">
                <p>Nothing selected</p>
            </div>
        );
    }
}