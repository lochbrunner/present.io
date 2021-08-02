import React from 'react';
import { Button, createStyles, Dialog, DialogActions, DialogContent, FormControlLabel, FormGroup, IconButton, Switch, TextField, Theme, Typography, WithStyles, withStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MuiDialogTitle from '@material-ui/core/DialogTitle';

import { Settings } from 'store';

export interface DialogTitleProps extends WithStyles<typeof styles> {
    id: string;
    children: React.ReactNode;
    onClose: () => void;
}

const styles = (theme: Theme) =>
    createStyles({
        root: {
            margin: 0,
            padding: theme.spacing(2),
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
        },
    });

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

function deepCopySettings(orig: Settings): Settings {
    return { background: { ...orig.background }, resolution: { ...orig.resolution } };
}

export function SettingsDialog(props: { settings: Settings, onClose: (settings: Settings) => void, onAbort: () => void, open: boolean }) {
    const { onClose, onAbort, settings, open } = props;

    const handleClose = () => {
        onClose(settings);
    };

    const [candidate, setCandidate] = React.useState<Settings>(deepCopySettings(settings));

    const handleAbort = () => {
        setCandidate(deepCopySettings(settings));
        onAbort();
    }

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open} className="settings-dialog">
            <DialogTitle onClose={handleAbort} id="form-dialog-title">Settings</DialogTitle>
            <DialogContent className="dialog-content">
                <FormGroup row>
                    <FormControlLabel labelPlacement="start" label="Paper" control={
                        <Switch className="value" checked={candidate.background.paper} onChange={(e, checked) => setCandidate({ ...candidate, background: { ...candidate.background, paper: checked } })} name="paper" />
                    } />
                </FormGroup>
                <FormGroup row>
                    <FormControlLabel labelPlacement="start" label="Grid" control={
                        <Switch className="value" checked={candidate.background.grid} onChange={(e, checked) => setCandidate({ ...candidate, background: { ...candidate.background, grid: checked } })} name="grid" />
                    } />
                </FormGroup>
                <FormGroup row>
                    <FormControlLabel labelPlacement="start" label="Width" control={
                        <TextField value={candidate.resolution.width} className="value"
                            onChange={e => setCandidate({ ...candidate, resolution: { ...candidate.resolution, width: parseInt(e.target.value) } },)}
                            type="number" />
                    } />
                </FormGroup>
                <FormGroup row>
                    <FormControlLabel labelPlacement="start" label="Height" control={
                        <TextField value={candidate.resolution.height} className="value"
                            onChange={e => setCandidate({ ...candidate, resolution: { ...candidate.resolution, height: parseInt(e.target.value) } },)}
                            type="number" />
                    } />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleClose} color="primary">
                    Save changes
                </Button>
            </DialogActions>
        </Dialog>
    );
}