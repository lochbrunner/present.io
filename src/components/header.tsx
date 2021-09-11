import React from 'react';
import { createStyles, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, MenuProps, Theme, Typography, withStyles } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import RedoIcon from '@material-ui/icons/Redo';
import IconButton from '@material-ui/core/IconButton';
import UndoIcon from '@material-ui/icons/Undo';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import MenuIcon from '@material-ui/icons/Menu';

import PublishIcon from '@material-ui/icons/Publish';
import GetAppIcon from '@material-ui/icons/GetApp';
import SettingsIcon from '@material-ui/icons/Settings';


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

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props: MenuProps) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        {...props}
    />
));

const StyledMenuItem = withStyles((theme) => ({
    root: {
        '&:focus': {
            backgroundColor: theme.palette.primary.main,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: theme.palette.common.white,
            },
        },
    },
}))(MenuItem);

export interface Props {
    undo: () => void;
    redo: () => void;
    download: () => void;
    hasFuture: boolean;
    hasPast: boolean;
    settings: Settings;
    updateSettings: (settings: Settings) => void;
    downloadSnapshot: () => void;
    uploadSnapshot: () => void;
}


export default function render(props: Props) {
    const classes = useStyles();
    const [openSettings, setOpenSettings] = React.useState(false);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const downloadSnapshot = () => {
        props.downloadSnapshot();
        handleClose();
    }

    const uploadSnapshot = () => {
        props.uploadSnapshot();
        handleClose();
    }

    const handleClickOpenSettings = () => {
        setOpenSettings(true);
        handleClose();
    };

    const handleCloseSettings = (settings: Settings) => {
        setOpenSettings(false);
        props.updateSettings(settings);
    };

    const handleAbortSettings = () => { setOpenSettings(false); };

    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={openMenu} >
                    <MenuIcon />
                </IconButton>
                <StyledMenu
                    id="menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <StyledMenuItem onClick={downloadSnapshot}>
                        <ListItemIcon>
                            <GetAppIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Download Snapshot" />
                    </StyledMenuItem>
                    <StyledMenuItem onClick={uploadSnapshot}>
                        <ListItemIcon>
                            <PublishIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Upload Snapshot" />
                    </StyledMenuItem>
                    <StyledMenuItem onClick={handleClickOpenSettings}>
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </StyledMenuItem>
                </StyledMenu>
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