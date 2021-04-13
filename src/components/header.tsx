import React from 'react';
import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import RedoIcon from '@material-ui/icons/Redo';
import IconButton from '@material-ui/core/IconButton';
import UndoIcon from '@material-ui/icons/Undo';
import SaveAltIcon from '@material-ui/icons/SaveAlt';


import './header.scss';

export const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        title: {
            flexGrow: 1,
        },
    }),
);

export interface Props {
    undo: () => void;
    redo: () => void;
    download: () => void;
    hasFuture: boolean;
    hasPast: boolean;
}

export default function render(props: Props) {
    const classes = useStyles();
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Present IO
                </Typography>
                <IconButton
                    aria-label="undo last action"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    onClick={props.undo}
                    disabled={!props.hasPast}
                >
                    <UndoIcon />
                </IconButton>
                <IconButton
                    aria-label="redo last action"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    onClick={props.redo}
                    disabled={!props.hasFuture}
                >
                    <RedoIcon />
                </IconButton>
                <IconButton
                    aria-label="save document"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    onClick={props.download}
                >
                    <SaveAltIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}