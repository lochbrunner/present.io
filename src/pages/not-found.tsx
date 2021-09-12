import React from 'react';
import { connect } from 'react-redux';
import { StateWithHistory } from 'redux-undo';
import { State as RootState } from 'store';
import { Link, useParams } from "react-router-dom";

import './not-found.scss';
import { AppBar, Toolbar } from '@material-ui/core';

interface Actions {

}
interface Props {

}
function render(props: Props & Actions) {
    const { slide } = useParams<{ slide?: string }>();
    return (
        <div className="not-found">
            <AppBar position="static">
                <Toolbar></Toolbar>
            </AppBar>
            <div className="content">
                <h1>Slide {slide} could not be found!</h1>
                <section>
                    What to do now?
                    <ul>
                        <li><Link to="/new">Create new slide</Link></li>
                        <li><Link to="/">Play around</Link></li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

const mapStateToProps = (state: StateWithHistory<RootState>): Props => ({

});


const mapDispatchToProps = (dispatch: any): Actions => ({

})


export default connect(mapStateToProps, mapDispatchToProps)(render);