'use strict';

import { Symbol } from './Symbol';
import { Queue } from './Queue';
import { StateMachine, State, Trigger } from './StateMachine';
import { MatchEmitter as Emitter } from './MatchEmitter';
import { Scheduler } from './Scheduler';
import r from 'ramda';
import Promise from 'bluebird';

Promise.onPossiblyUnhandledRejection(function(error){ });

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
    constructor(actor){

        if(actor === null || actor === undefined){
            throw new ArgumentError('You cannot construct an ActorChannel without an Actor!');
        }

        this._actor = actor;

        this._systemMessages = new Queue();
        this._childrenMessages = new Queue();
        this._userMessages = new Queue();

        this._messageHandler = new Emitter();

        this._scheduler = new Scheduler(

            (...args) => {

                var toReturn =
                    this._systemMessages.length > 0     ? this._systemMessages.dequeue() :
                    this._childrenMessages.length > 0   ? this._childrenMessages.dequeue() :
                    this._userMessages.length > 0       ? this._userMessages.dequeue() :
                    undefined;

                return toReturn;
            },

            (...args) => {

                //for some reason, if we just call someFunc(...args), then the args get wrapped into another array
                //that has happened already here
                let result = this._messageHandler.matchFirst.apply(this._actor, args[0]);
                return result;
            },

            _ => {}
        );

    }

    _addHandler(pred, act, sym){

        let self = this;

        this._messageHandler.add(
            (...args)=>{
                return r.eq(sym, r.head(args)) &&
                    pred.apply(self, r.tail(r.tail(args)));
            },
            (...args) => {
                let deferred = r.head(r.tail(args));

                try{
                    let result = act.apply(self, r.tail(r.tail(args)));
                    deferred.resolve(result);
                    return result;
                }catch(err){
                    deferred.reject(err, r.tail(r.tail(args)));
                    self._handleError(self._actor, err, r.tail(r.tail(args)));
                    return err;
                }
            });
    }

    _handleError(actor, error, argsArray){

        //do something based on supervision strategy
        if(actor._parent === null || actor._parent === undefined){
            throw error;
        }else{
            actor._parent.addChildMsg(actor, error, argsArray);
        }
    }

    addErrorHandler(pred, act){
        this._addHandler(pred, act, ErrorMsg);
    }

    addSystemHandler(pred, act){
        this._addHandler(pred, act, SystemMsg);
    }

    addSystemMsg(...args){

        let deferred = Promise.defer();

        args.unshift(this._actor._stateMachine);
        args.unshift(deferred);
        args.unshift(SystemMsg);
        this._systemMessages.enqueue(args);

        this._scheduler.start();
        return deferred.promise;
    }

    addChildHandler(pred, act){
        this._addHandler(pred, act, ChildMsg);
    }

    addChildMsg(...args){

        let deferred = Promise.defer();
        args.unshift(deferred);
        args.unshift(ChildMsg);
        this._childrenMessages.enqueue(args);

        this._scheduler.start();

        return deferred.promise;
    }

    addUserHandler(pred, act){
        this._addHandler(pred, act, UserMsg);
    }

    addUserMsg(...args){

        let deferred = Promise.defer();
        args.unshift(deferred);
        args.unshift(UserMsg);
        this._userMessages.enqueue(args);

        this._scheduler.start();
        return deferred.promise;
    }

    ask(...args){
        return this.addUserMsg(...args);
    }
}
