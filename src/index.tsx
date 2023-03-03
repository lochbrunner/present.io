const ReactDOM = require('react-dom');
import React from 'react';

import Page from './pages/sketchpad';
import New from './pages/new';
import NotFoundError from './pages/not-found';

import { Provider } from 'react-redux';
import createStore from './store';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';


ReactDOM.render(
    <Provider store={createStore}>
        <Router>
            <Routes>
                <Route path="/new" element={<New />} />
                <Route path="/error-404/:slide" element={<NotFoundError />} />
                <Route path="/:slide?" element={<Page />} />
            </Routes>
        </Router>
    </Provider>,

    document.getElementById('root')
);

