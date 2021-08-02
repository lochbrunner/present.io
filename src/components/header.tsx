import React from 'react';
import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import RedoIcon from '@material-ui/icons/Redo';
import IconButton from '@material-ui/core/IconButton';
import UndoIcon from '@material-ui/icons/Undo';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import MenuIcon from '@material-ui/icons/Menu';


import './header.scss';
import { Settings } from 'store';
import { SettingsDialog } from './settings';

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
    settings: Settings;
    updateSettings: (settings: Settings) => void;
}


export default function render(props: Props) {
    const classes = useStyles();
    const [openSettings, setOpenSettings] = React.useState(false);

    const handleClickOpenSettings = () => {
        setOpenSettings(true);
    };

    const handleCloseSettings = (settings: Settings) => {
        setOpenSettings(false);
        props.updateSettings(settings);
    };

    const handleAbortSettings = () => { setOpenSettings(false); };

    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={handleClickOpenSettings} >
                    <MenuIcon />
                </IconButton>
                <SettingsDialog settings={props.settings} onClose={handleCloseSettings} onAbort={handleAbortSettings} open={openSettings} />
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