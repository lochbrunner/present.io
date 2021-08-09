import React from 'react';
import { ColorPicker, createColor, Color as ComponentColor } from 'material-ui-color';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import { AnyObject, wrap } from '../objects';
import { Color } from '../store';
import './property-box.scss';
import { createStyles, InputBase, MenuItem, Select, Theme, withStyles } from '@material-ui/core';

const BootstrapInput = withStyles((theme: Theme) =>
    createStyles({
        root: {
            'label + &': {
                marginTop: theme.spacing(3),
            },
        },
        input: {
            borderRadius: 4,
            position: 'relative',
            backgroundColor: theme.palette.background.paper,
            border: '1px solid #ced4da',
            fontSize: 16,
            padding: '10px 26px 10px 12px',
            transition: theme.transitions.create(['border-color', 'box-shadow']),
            // Use the system font instead of the default Roboto font.
            fontFamily: [
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'Roboto',
                '"Helvetica Neue"',
                'Arial',
                'sans-serif',
                '"Apple Color Emoji"',
                '"Segoe UI Emoji"',
                '"Segoe UI Symbol"',
            ].join(','),
            '&:focus': {
                borderRadius: 4,
                borderColor: '#80bdff',
                boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
            },
        },
    }),
)(InputBase);

export interface Props {
    selectedObjects: AnyObject[];
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

function ColorRow(props: { label: string, valueName: string, colorPallette: ComponentColor[], change: (color: ComponentColor) => void, object: any }) {
    return (
        <FormGroup row>
            <FormControlLabel className="color" labelPlacement="start" label={props.label} control={
                <ColorPicker value={createColor(colorToHex(props.object[props.valueName]))} palette={props.colorPallette}
                    onChange={props.change} />
            } />
        </FormGroup>
    );
}

export function NumberRow(props: { label: string, valueName: string, object: any, change: (name: string, value: any) => void, step?: number }) {
    return (
        <FormGroup row>
            <FormControlLabel labelPlacement="start" label={props.label} control={
                <TextField value={props.object[props.valueName]}
                    onChange={e => props.change(props.valueName, parseInt(e.target.value))}
                    type="number" />
            } />
        </FormGroup>
    );
}

function StringRow(props: { label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    return (
        <FormGroup row>
            <FormControlLabel labelPlacement="start" label={props.label} control={
                <TextField value={props.object[props.valueName]}
                    onChange={e => props.change(props.valueName, e.target.value)}
                />
            } />
        </FormGroup>
    );
}

function EnumRow(props: { label: string, valueName: string, object: any, values: any, change: (name: string, value: any) => void }) {
    return (
        <FormGroup row>
            <FormControlLabel labelPlacement="start" label={props.label} control={
                <Select
                    labelId={props.label}
                    id={props.label}
                    value={props.object[props.valueName]}
                    onChange={e => props.change(props.valueName, e.target.value)}
                    input={<BootstrapInput />}
                >
                    {props.values}
                </Select>
            } />
        </FormGroup>
    );

}

// function ExtentRow(props: { key: number, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
//     const object = props.object[props.valueName];
//     return object && (
//         <>
//             <NumberRow key="width" label="width" valueName="width" object={object} change={(name, width) => props.change(props.valueName, { ...object, width })} />
//             <NumberRow key="height" label="height" valueName="height" object={object} change={(name, height) => props.change(props.valueName, { ...object, height })} />
//         </>
//     ) || '';
// }

function VectorRow(props: { key: number, label: string, valueName: string, object: any, change: (name: string, value: any) => void }) {
    const object = props.object[props.valueName];
    return object && (
        <>
            <NumberRow key="x" label={`${props.label}.x`} valueName="x" object={object} change={(name, x) => props.change(props.valueName, { ...object, x })} />
            <NumberRow key="y" label={`${props.label}.y`} valueName="y" object={object} change={(name, y) => props.change(props.valueName, { ...object, y })} />
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

        const common = (
            <>
                <StringRow key={0} object={object} change={props.setProperty} label="name" valueName="name" />
                <ColorRow key={1} object={object} label="fill" valueName="fillColor" colorPallette={fillColorPalette} change={changeFillColor} />
                <ColorRow key={2} object={object} label="border" valueName="borderColor" colorPallette={fillColorPalette} change={changeBorderColor} />
                <NumberRow key={3} object={object} change={props.setProperty} label="border width" valueName="borderWidth" />
            </>
        );

        if (object.type === 'rect') {
            return (
                <div className="property-box">
                    {common}
                    <NumberRow key={4} object={object} change={props.setProperty} label="rx" valueName="radiusX" />
                    <NumberRow key={5} object={object} change={props.setProperty} label="ry" valueName="radiusY" />
                </div>
            );
        } else if (object.type === 'ellipse') {
            return (
                <div className="property-box">
                    {common}
                    <NumberRow key={4} object={object} change={props.setProperty} label="path length" valueName="pathLength" />
                </div>
            );
        }
        else if (object.type === 'text') {
            const fontFamilies = [
                'serif',
                'sans-serif',
                'cursive',
                'fantasy',
                'monospace',
                'Gill Sans Extrabold',
                'Goudy Bookletter 1911',
                'system-ui',
                'ui-serif',
                'ui-sans-serif',
                'ui-monospace',
                'ui-rounded',
                'emoji',
                'math',
                'fangsong',
            ].map((v, i) => <MenuItem key={i} value={v}>{v}</MenuItem>);
            const fontStyles = [
                'normal',
                'italic',
                'oblique',
            ].map((v, i) => <MenuItem key={i} value={v}>{v}</MenuItem>);
            const fontWeights = [
                'normal',
                'bold',
                'bolder',
                'lighter',
            ].map((v, i) => <MenuItem key={i} value={v}>{v}</MenuItem>);
            const changeNested = (name: string, value: any) => props.setProperty('style', { ...object.style, [name]: value });
            return (
                <div className="property-box">
                    {common}
                    <StringRow key={4} object={object} change={props.setProperty} label="content" valueName="content" />
                    <NumberRow key={5} object={object} change={props.setProperty} label="glyph rotation" valueName="glyphRotation" />
                    <VectorRow key={6} object={object} change={props.setProperty} label="shift" valueName="shift" />
                    <EnumRow key={7} object={object.style} label="font family" valueName="fontFamily" values={fontFamilies}
                        change={changeNested} />
                    <StringRow key={8} object={object.style} change={changeNested} label="font size" valueName="fontSize" />
                    <EnumRow key={9} object={object.style} label="font style" valueName="fontStyle" values={fontStyles}
                        change={changeNested} />
                    <NumberRow key={10} object={object.style} change={changeNested} label="font stretch" valueName="fontStretch" />
                    <EnumRow key={9} object={object.style} label="font weight" valueName="fontWeight" values={fontWeights}
                        change={changeNested} />
                </div>
            );
        } else if (object.type === 'line') {
            return (
                <div className="property-box">
                    <StringRow key={0} object={object} change={props.setProperty} label="name" valueName="name" />
                    <ColorRow key={2} object={object} label="stroke" valueName="borderColor" colorPallette={fillColorPalette} change={changeBorderColor} />
                    <NumberRow key={3} object={object} change={props.setProperty} label="stroke width" valueName="borderWidth" />
                    <NumberRow key={4} object={object} change={props.setProperty} label="path length" valueName="pathLength" />
                </div>
            );
        } else {
            return wrap(object)?.properties(common, props.setProperty) || null;
        }

    } else {
        return (
            <div className="property-box">
                <p className="empty">Nothing selected</p>
            </div>
        );
    }
}