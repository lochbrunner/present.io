import React from 'react';
import { Button, createStyles, Dialog, DialogActions, DialogContent, IconButton, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MuiDialogTitle from '@material-ui/core/DialogTitle';

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

export function UploadDialog(props: { onClose: (content?: string) => void, onAbort: () => void, open: boolean }) {
    const { onClose, onAbort, open } = props;
    const handleClose = () => {
        onClose(undefined);
    };

    const handleAbort = () => {
        onAbort();
    }

    const onFileChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (e.target.files !== null) {
            reader.readAsText(e.target.files[0]);
            reader.onload = function () {
                onClose(reader.result as any);
            }

        }
    }

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open} className="upload-dialog">
            <DialogTitle onClose={handleAbort} id="form-dialog-title">Upload File</DialogTitle>
            <DialogContent className="dialog-content">
                <input type="file" id="files" name="files[]" onChange={onFileChanged} />
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleClose} color="primary">
                    Upload
                </Button>
            </DialogActions>
        </Dialog>
    );
}