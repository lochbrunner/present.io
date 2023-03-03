import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { StateWithHistory } from 'redux-undo';
import { State as RootState } from 'store';
import { useNavigate } from "react-router-dom";

interface Actions {

}
interface Props {

}
function render(props: Props & Actions) {
    // Create new document
    const navigate = useNavigate();
    useEffect(() => {
        fetch('./api/slide', {
            method: 'PUT'
        }).then(response => response.json()).then((slide: number) => {
            navigate(`/${slide}`);
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