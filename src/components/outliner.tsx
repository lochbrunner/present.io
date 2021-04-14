import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import { TreeItemProps, TreeView, TreeItem } from '@material-ui/lab';
import Typography from '@material-ui/core/Typography';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import { ChangeSelection } from 'reducers';
import { Rectangle } from 'store';

import './outliner.scss';
import { RectIcon } from './icons';


declare module 'csstype' {
    interface Properties {
        '--tree-view-color'?: string;
        '--tree-view-bg-color'?: string;
    }
}

type StyledTreeItemProps = TreeItemProps & {
    bgColor?: string;
    color?: string;
    labelIcon: React.ElementType<SvgIconProps>;
    labelInfo?: string;
    labelText: string;
};

const useTreeItemStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            color: theme.palette.text.secondary,
            '&:hover > $content': {
                backgroundColor: theme.palette.action.hover,
            },
            '&:focus > $content, &$selected > $content': {
                backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
                color: 'var(--tree-view-color)',
            },
            '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
                backgroundColor: 'transparent',
            },
        },
        content: {
            color: theme.palette.text.secondary,
            borderTopRightRadius: theme.spacing(2),
            borderBottomRightRadius: theme.spacing(2),
            paddingRight: theme.spacing(1),
            fontWeight: theme.typography.fontWeightMedium,
            '$expanded > &': {
                fontWeight: theme.typography.fontWeightRegular,
            },
        },
        group: {
            marginLeft: 0,
            '& $content': {
                paddingLeft: theme.spacing(2),
            },
        },
        expanded: {},
        selected: {},
        label: {
            fontWeight: 'inherit',
            color: 'inherit',
        },
        labelRoot: {
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(0.5, 0),
        },
        labelIcon: {
            marginRight: theme.spacing(1),
        },
        labelText: {
            fontWeight: 'inherit',
            flexGrow: 1,
        },
    }),
);

function StyledTreeItem(props: StyledTreeItemProps) {
    const classes = useTreeItemStyles();
    const { labelText, labelIcon: LabelIcon, labelInfo, color, bgColor, ...other } = props;

    return (
        <TreeItem
            label={
                <div className={classes.labelRoot}>
                    <LabelIcon color="inherit" className={classes.labelIcon} />
                    <Typography variant="body2" className={classes.labelText}>
                        {labelText}
                    </Typography>
                    <Typography variant="caption" color="inherit">
                        {labelInfo}
                    </Typography>
                </div>
            }
            style={{
                '--tree-view-color': color,
                '--tree-view-bg-color': bgColor,
            }}
            classes={{
                root: classes.root,
                content: classes.content,
                expanded: classes.expanded,
                selected: classes.selected,
                group: classes.group,
                label: classes.label,
            }}
            {...other}
        />
    );
}

const useStyles = makeStyles(
    createStyles({
        root: {
            height: 264,
            flexGrow: 1,
            maxWidth: 400,
        },
    }),
);

export interface Props {
    objects: Rectangle[];
    changeSelect: (data: ChangeSelection) => void;
    select: (index: number[]) => void;
    selectedDelete: () => void;
    move: (props: { from: number, to: number }) => void;
}

export default function render(props: Props) {
    const [dragDrop, changeDragDrop] = React.useState<number | null>(null);
    const [hover, changeHover] = React.useState<number | null>(null);

    const classes = useStyles();

    const onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!e.ctrlKey) {
            if (e.key === 'Delete') {
                props.selectedDelete();
            }
        }
    }

    const onMouseDown = (index: number) => (e: React.MouseEvent<any>) => {
        if (!e.ctrlKey && dragDrop === null) {
            changeDragDrop(index);
        }
    };

    const onMouseUp = (index: number) => (e: React.MouseEvent<any>) => {
        if (!e.ctrlKey && dragDrop !== null) {
            props.move({ from: dragDrop, to: index });
            changeHover(null);
            changeDragDrop(null);
        }
    };

    const onMouseMove = (index: number) => (e: React.MouseEvent<any>) => {
        if (!e.ctrlKey && dragDrop !== null) {
            changeHover(index);
        }
    };

    const onMouseLeave = (e: any) => {
        changeHover(null);
        changeDragDrop(null);
    };

    const objects = props.objects.map((object, i) =>
        <StyledTreeItem onMouseMove={onMouseMove(i)} onMouseDown={onMouseDown(i)} onMouseUp={onMouseUp(i)} key={i} labelText={object.name} nodeId={i.toString()} labelIcon={RectIcon} />)

    if (hover !== null) {
        objects.splice(hover, 0, <div key="hover" className="hover"></div>);
    }
    return (
        <div onMouseLeave={onMouseLeave} onKeyDown={onKeyPress} tabIndex={1} className="outliner">
            <TreeView
                onNodeSelect={(e, i) => { props.select(i.map(j => parseInt(j))); }}
                selected={props.objects.map((o, i) => ({ isSelected: o.isSelected, index: i.toString() })).filter(o => o.isSelected).map(o => o.index)}
                multiSelect
                className={classes.root}
                defaultExpanded={['3']}
                defaultCollapseIcon={<ArrowDropDownIcon />}
                defaultExpandIcon={<ArrowRightIcon />}
                defaultEndIcon={<div style={{ width: 24 }} />}>
                {objects}
            </TreeView>
        </div>
    );
}