import React from 'react';
import { connect } from 'react-redux';
import { State } from 'store';

interface Props {
    value: number;
}

interface Actions {
    increase: () => void;
}

function render(props: Props & Actions) {
    return (
        <div>
            < h1 > Page</h1 >
            <p>{props.value}</p>
            <button onClick={props.increase}>Increase</button>
        </div>
    )
}

export const increase = () => {
    return {
        type: 'increase'
    };
};

const mapStateToProps = (state: State): Props => ({
    value: state.value
})

const mapDispatchToProps = (dispatch: any): Actions => ({
    increase: () => dispatch(increase())
})

export default connect(mapStateToProps, mapDispatchToProps)(render);
