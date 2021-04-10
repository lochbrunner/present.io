const ReactDOM = require('react-dom');
import React from 'react';

import Page from './pages/sketchpad';

import { Provider } from 'react-redux';
import createStore from './store';



ReactDOM.render(
    <Provider store={createStore}>
        <Page />
    </Provider>,

    document.getElementById('root')
);

