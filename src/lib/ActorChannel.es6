'use strict';

import { Symbol } from './Symbol';
import { Queue } from './Queue';
import { StateMachine, State, Trigger } from './StateMachine';
import { MatchEmitter as Emitter } from './MatchEmitter';
import { Scheduler } from './Scheduler';
import r from 'ramda';
import Promise from 'bluebird';

//b/c bluebird will spent a bunch of stuff out to console if we reject a promise
//before it has a catch() handler attached
Promise.onPossiblyUnhandledRejection(function(error) { });

export const SystemMsg = Symbol('SystemMsg');
export const ChildMsg = Symbol('ChildMsg');
export const UserMsg = Symbol('UserMsg');
export const ErrorMsg = Symbol('ErrorMsg');

export class ArgumentError extends Error{
    constructor(message = undefined, fileName = undefined, lineNumber = undefined) {
      super(message, fileName, lineNumber);
    }
}

//it has/is a state machine
export class ActorChannel {
    constructor(actor) {

      if (actor === null || actor === undefined) {
        throw new ArgumentError('You cannot construct an ActorChannel without an Actor!');
      }

      this._actor = actor;

      this._systemMessages = new Queue();
      this._childrenMessages = new Queue();
      this._userMessages = new Queue();

      this._messageHandler = new Emitter();

      this._scheduler = new Scheduler(

            () => {

              var toReturn =
                  this._systemMessages.length > 0     ? this._systemMessages.dequeue() :
                  this._childrenMessages.length > 0   ? this._childrenMessages.dequeue() :
                  this._userMessages.length > 0       ? this._userMessages.dequeue() :
                  undefined;

              return toReturn;
            },

            this._messageHandler.matchFirst,

            _ => {}

        );
    }

    start() {
      this._scheduler.start();
    }

    stop() {
      this._scheduler.stop();
    }

    _createIfThen(pred, act, sym) {
      let self = this;

      return {
            pred: ({msgType: type, deferred: deferred, args: args}) => {
              return r.eq(sym, type) &&
                  pred.apply(self, args);
            },
            act: ({msgType: type, deferred: deferred, args: args}) => {

              try {
                let result = act.apply(self, args);
                deferred.resolve(result);
                return result;
              }catch (err) {
                self._handleError(self._actor, err, args);
                deferred.reject(err, args);
                return err;
              }
            }};
    }

    _addHandler(pred, act, sym) {

      let self = this;

      let predAct = this._createIfThen(pred, act, sym);

      this._messageHandler.add(predAct.pred, predAct.act);
    }

    _handleError(actor, error, argsArray) {

      //do something based on supervision strategy
      if (actor._parent === null || actor._parent === undefined) {
        throw error;
      }else {
        //not entirely sure we shouldn't actually be hot-wiring in an immediate call to the error
        //handler here, instead of putting it in the parent's message queue
        actor._parent.addChildMsg(actor, error, argsArray);
      }
    }

    prependChildHandler(pred, act) {

      let self = this;

      let predAct = this._createIfThen(pred, act, ChildMsg);

      this._messageHandler.prepend(predAct.pred, predAct.act);
    }

    addErrorHandler(pred, act) {
      this._addHandler(pred, act, ErrorMsg);
    }

    addSystemHandler(pred, act) {
      this._addHandler(pred, act, SystemMsg);
    }

    addSystemMsg(...args) {

      let deferred = Promise.defer();

      args.unshift(this._actor._stateMachine);

      this._systemMessages.enqueue({
        msgType: SystemMsg,
        deferred: deferred,
        args: args
      });

      this._scheduler.start();
      return deferred.promise;
    }

    addChildHandler(pred, act) {
      this._addHandler(pred, act, ChildMsg);
    }

    addChildMsg(...args) {

      let deferred = Promise.defer();

      this._childrenMessages.enqueue({
        msgType: ChildMsg,
        deferred: deferred,
        args: args
      });

      this._scheduler.start();

      return deferred.promise;
    }

    addUserHandler(pred, act) {
      this._addHandler(pred, act, UserMsg);
    }

    addUserMsg(...args) {

      let deferred = Promise.defer();

      this._userMessages.enqueue({
        msgType: UserMsg,
        deferred: deferred,
        args: args
      });

      this._scheduler.start();
      return deferred.promise;
    }

    ask(...args) {
      return this.addUserMsg(...args);
    }
}
