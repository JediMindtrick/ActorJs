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
  Stopped: Symbol('Stopped'),
  Dead: Symbol('Dead')
};

export const SupervisionEnum = {
  Stop: Symbol('Stop')
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

    constructor(opts = {}, parent = null, name = '') {

      this._states = [];
      this._stateMachine = new StateMachine();

      this._name = name;
      this._parent = parent;
      this._children = [];

      this._channel = new ActorChannel(this);

      if (opts.receive !== undefined && r.is(Array, opts.receive)) {
        this._configUserHandlers(opts.receive);
      }

      if (opts.systemHandlers !== undefined && r.is(Array, opts.systemHandlers)) {
        this._configSystemHandlers(opts.systemHandlers);
      }

      const _childHandlers = opts.childHandlers !== undefined && r.is(Array, opts.childHandlers) ?
        opts.childHandlers : [];

      this._configSupervision(opts, _childHandlers);

      this._configChildHandlers(_childHandlers);
    }

//ask
//addChildMsg
//addSystemMsg

    ask(...args) {
      return this._channel.ask(...args);
    }

    addChildMsg(...args) {
      return this._channel.addChildMsg(...args);
    }

    addSystemMsg(...args) {
      return this._channel.addSystemMsg(...args);
    }

    _configSupervision(opts, childHandlers) {
      if (opts.supervision === undefined || opts.supervision === null) {
        return;//default strategy is to do nothing, which delegates up the hierarchy
      }else if (r.is(Array, opts.supervision)) {
        r.forEach(childHandlers.push, childHandlers);
      }else if (opts.supervision === SupervisionEnum.Stop) {

        //actor._parent.addChildMsg(actor, error, argsArray);
        childHandlers.push((actor, error, argsArray) => {

        });
      }
    }

    _configChildHandlers(handlers) {
      r.forEach(({test: pred, act: act}) => {
        this._channel.addChildHandler(pred, act);
      }, handlers);

      this._channel.addChildHandler(
            (_, error, args) => {
              return r.is(Error, error);
            },

            (_, error, args) => {
              return this._channel._handleError(this, error, []);
            }

        );
    }

    _configSystemHandlers(handlers) {
      r.forEach(({test: pred, act: act}) => {
        this._channel.addSystemHandler(pred, act);
      }, handlers);
    }

    _configUserHandlers(handlers) {
      r.forEach(({test: pred, act: act}) => {
        this._channel.addUserHandler(pred, act);
      }, handlers);
    }

    supervise(opts, _, name) {
      const child = new Actor(opts, this, name);
      this._children.push(child);

      return child;
    }
}
