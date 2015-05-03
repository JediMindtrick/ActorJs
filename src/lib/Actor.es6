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

/*
//defined by user-programmer
UserMsg -> normal program messages

//defined by system/class definition
SystemMsg -> shut-down, restart, etc...

//defined by supervision strategy
ChildMsg -> delegated children errors, child messages like shutdown, restart, etc...
*/

//it has/is a state machine
export class Actor {

    constructor(opts = {}, parent = null, name = ''){

        this._states = [];
        this._stateMachine = new StateMachine();

        this._name = name;
        this._parent = parent;
        this._children = [];

        this._channel = new ActorChannel(this);
        this._proxyChannel(['addErrorHandler', 'addErrorMsg', 'addSystemHandler', 'addSystemMsg',
        'addChildHandler', 'addChildMsg', 'addUserHandler', 'addUserMsg', 'ask']);

        if(opts.receive !== undefined && r.is(Array, opts.receive)){
            this._configUserHandlers(opts.receive);
        }

        if(opts.systemHandlers !== undefined && r.is(Array, opts.systemHandlers)){
            this._configSystemHandlers(opts.systemHandlers);
        }

        if(opts.childHandlers !== undefined && r.is(Array, opts.childHandlers)){
            this._configChildHandlers(opts.childHandlers);
        }

    }

    supervise(opts, _, name){
        return new Actor(opts, this, name);
    }

    _configChildHandlers(handlers){
        r.forEach(({test: pred, act: act}) => {
            this.addChildHandler(pred, act);
        }, handlers);

        this.addChildHandler(
            (_, error) =>{
                return r.is(Error, error);
            },

            (_, error) => {
                return this._channel._handleError(this, error, []);
            }
        );

        this.addChildHandler(
            error =>{
                return r.is(Error, error);
            },

            error => {
                return this._channel._handleError(this, error, []);
            }
        );

    }

    _configSystemHandlers(handlers){
        r.forEach(({test: pred, act: act}) => {
            this.addSystemHandler(pred, act);
        }, handlers);
    }

    _configUserHandlers(handlers){
        r.forEach(({test: pred, act: act}) => {
            this.addUserHandler(pred, act);
        }, handlers);
    }

    _proxyChannel(methods){
        r.forEach(m => {
            this[m] = (...args)=>{
                return this._channel[m](...args);
            };
        }, methods);
    }
}
