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

/*
1.  Emit dying message
2.  Test send message to dead actor (should error)
3.  Test make child error when supervision is set to SupervisionEnum.Stop
4.? encapsulate state logic back into state machine
*/

//it has/is a state machine
export class Actor {

    constructor(opts = {}, parent = null, name = '') {

      /*
    this._states = [];
    this._stateMachine = new StateMachine();
    */
      this._state = StateEnum.New;

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

      this._configChildHandlers(_childHandlers);

      this._state = StateEnum.Starting;
      this._channel.start();
      this._state = StateEnum.Running;
    }

    die() {
      //first we want to emit a dying message...
      this._channel.stop();
      this._state = StateEnum.Dead;
    }

    ask(...args) {

      if (this._state === StateEnum.Dead) {
        throw new Error('Cannot accept message, this actor is dead!');
      }

      return this._channel.ask(...args);
    }

    addChildMsg(...args) {
      return this._channel.addChildMsg(...args);
    }

    addSystemMsg(...args) {
      return this._channel.addSystemMsg(...args);
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

    supervise(opts, name, supervision) {
      const child = new Actor(opts, this, name);
      this._children.push(child);

      if (supervision === SupervisionEnum.Stop) {

        this._channel.prependChildHandler(
            (actor, error, argsArray) => {
              return actor === child;
            },
            (actor, error, argsArray) => {
              //stop the child
              //remove it from the parent's tree
              child.die();
              //do nothing with the mailbox, for now
              let idx = r.findIndex(r.eq(child))(this._children);
              this._children = r.remove(idx, 1)(this._children);
            });

      }else if (supervision === null || supervision === undefined) {
        //this is ok, we will go with the default "panic" strategy
        return child;

      }else {
        throw new Error('Passed a supervision style we cannot currently handle.  Allowed values' +
        ' are SupervisionEnum.Stop and null or undefined.');
      }

      return child;
    }
}
