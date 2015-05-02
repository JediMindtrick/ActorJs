'use strict';

import { Symbol } from './Symbol';
import { StateMachine, State, Trigger } from './StateMachine';
import r from 'ramda';
import Promise from 'bluebird';
import { ActorChannel } from './ActorChannel';

export const StateEnum = {
    New: Symbol('New'),
    Starting: Symbol('Starting'),
    Running: Symbol('Running'),
    Stopped: Symbol('Stopped')
};

//it has/is a state machine
export class Actor {
    constructor(parent = null){
        this._parent = parent;
        this._states = [];
        this._stateMachine = new StateMachine();
        this._channel = new ActorChannel(this);
        this._proxyChannel(['addErrorHandler', 'addErrorMsg', 'addSystemHandler', 'addSystemMsg',
        'addChildHandler', 'addChildMsg', 'addUserHandler', 'addUserMsg', 'ask']);
    }

    _proxyChannel(methods){
        r.forEach(m => {
            this[m] = (...args)=>{
                return this._channel[m](...args);
            };
        }, methods);
    }
}
