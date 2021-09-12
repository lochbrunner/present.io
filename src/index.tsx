const ReactDOM = require('react-dom');
import React from 'react';

import Page from './pages/sketchpad';
import New from './pages/new';
import NotFoundError from './pages/not-found';

import { Provider } from 'react-redux';
import createStore from './store';
import { Route, Router, Switch } from 'react-router-dom';
import { createHashHistory } from "history";

const history = createHashHistory();

ReactDOM.render(
    <Provider store={createStore}>
        <Router history={history}>
            <Switch>
                <Route exact path="/new">
                    <New />
                </Route>
                <Route exact path="/error-404/:slide">
                    <NotFoundError />
                </Route>
                <Route exact path="/:slide?">
                    <Page />
                </Route>
            </Switch>
        </Router>
    </Provider>,

    document.getElementById('root')
);

