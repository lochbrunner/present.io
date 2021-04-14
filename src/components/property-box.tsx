import React from 'react';
import { Color, Rectangle } from 'store';
import { ColorPicker, createColor, Color as ComponentColor } from 'material-ui-color';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import './property-box.scss';

export interface Props {
    selectedObjects: Rectangle[];
    setProperty: (name: string, value: any) => void;
    changeFillColor: (color: Color) => void;
    changeBorderColor: (color: Color) => void;
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

function ColorRow(props: { key: number, label: string, valueName: string, colorPallette: ComponentColor[], change: (color: ComponentColor) => void, object: any }) {
    return (
        <FormGroup key={props.key} row>
            <FormControlLabel className="color" labelPlacement="start" label={props.label} control={
                <ColorPicker value={createColor(colorToHex(props.object[props.valueName]))} palette={props.colorPallette}
                    onChange={props.change} />
            } />
        </FormGroup>
    );
}

function NumberRow(props: { key: number | string, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    return (
        <FormGroup key={props.key} row>
            <FormControlLabel labelPlacement="start" label={props.label} control={
                <TextField value={props.object[props.valueName]}
                    onChange={e => props.change(props.valueName, parseInt(e.target.value))}
                    type="number" />
            } />
        </FormGroup>
    );
}

function StringRow(props: { key: number, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    return (
        <FormGroup key={props.key} row>
            <FormControlLabel labelPlacement="start" label={props.label} control={
                <TextField value={props.object[props.valueName]}
                    onChange={e => props.change(props.valueName, e.target.value)}
                />
            } />
        </FormGroup>
    );
}

function ExtentRow(props: { key: number, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    const object = props.object[props.valueName];
    return object && (
        <>
            <NumberRow key="width" label="width" valueName="width" object={object} change={(name, width) => props.change(props.valueName, { ...object, width })} />
            <NumberRow key="height" label="height" valueName="height" object={object} change={(name, height) => props.change(props.valueName, { ...object, height })} />
        </>
    ) || '';
}

function VectorRow(props: { key: number, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    const object = props.object[props.valueName];
    return object && (
        <>
            <NumberRow key="x" label="x" valueName="x" object={object} change={(name, x) => props.change(props.valueName, { ...object, x })} />
            <NumberRow key="y" label="y" valueName="y" object={object} change={(name, y) => props.change(props.valueName, { ...object, y })} />
        </>
    ) || '';
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
        const object = props.selectedObjects[0];

        return (
            <div className="property-box">
                <div>
                    <StringRow key={0} object={object} change={props.setProperty} label="name" valueName="name" />
                    <ColorRow key={1} object={object} label="fill" valueName="fillColor" colorPallette={fillColorPalette} change={changeFillColor} />
                    <ColorRow key={2} object={object} label="border" valueName="borderColor" colorPallette={fillColorPalette} change={changeBorderColor} />
                    <NumberRow key={3} object={object} change={props.setProperty} label="border width" valueName="borderWidth" />
                    <NumberRow key={4} object={object} change={props.setProperty} label="rx" valueName="radiusX" />
                    <NumberRow key={5} object={object} change={props.setProperty} label="ry" valueName="radiusY" />
                    <ExtentRow key={6} object={object} change={props.setProperty} label="size" valueName="extent" />
                    <VectorRow key={7} object={object} change={props.setProperty} label="position" valueName="center" />
                </div>
            </div>
        );
    } else {
        return (
            <div className="property-box">
                <p className="empty">Nothing selected</p>
            </div>
        );
    }
}