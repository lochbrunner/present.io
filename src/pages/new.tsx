import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { StateWithHistory } from 'redux-undo';
import { State as RootState } from 'store';
import { useHistory } from "react-router-dom";

interface Actions {

}
interface Props {

}
function render(props: Props & Actions) {
    // Create new document
    const history = useHistory();
    useEffect(() => {
        fetch('./api/slide', {
            method: 'PUT'
        }).then(response => response.json()).then((slide: number) => {
            history.push(`/${slide}`);
        });
    });

    return (
        <div>
            Waiting for new document...
        </div>
    );
}

const mapStateToProps = (state: StateWithHistory<RootState>): Props => ({

});


const mapDispatchToProps = (dispatch: any): Actions => ({

})


export default connect(mapStateToProps, mapDispatchToProps)(render);