'use strict';

import { Symbol } from './Symbol';
import { Queue } from './Queue';
import { StateMachine, State, Trigger } from './StateMachine';
import { MatchEmitter as Emitter } from './MatchEmitter';
import { Scheduler } from './Scheduler';
import r from 'ramda';
import Promise from 'bluebird';

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

        this._errorMessages = new Queue();
        this._systemMessages = new Queue();
        this._childrenMessages = new Queue();
        this._userMessages = new Queue();

        this._messageHandler = new Emitter();

        this._scheduler = new Scheduler(

            (...args) => {

                var toReturn =
                    this._errorMessages.length > 0      ? this._errorMessages.dequeue() :
                    this._systemMessages.length > 0     ? this._systemMessages.dequeue() :
                    this._childrenMessages.length > 0   ? this._childrenMessages.dequeue() :
                    this._userMessages.length > 0       ? this._userMessages.dequeue() :
                    undefined;

                return toReturn;
            },

            (...args) => {

                //for some reason, if we just call someFunc(...args), then the args get wrapped into another array
                //that has happened already here
                this._messageHandler.matchFirst.apply(this._actor, args[0])
                .orElse(error => {
                    this._handleError(this._actor, error, args[0]);
                });
            },

            this._handleError
        );

    }

    _handleError(actor, error, argsArray){
        //do something based on supervision strategy
        if(actor._parent === null || actor._parent === undefined){
            throw error;
        }else{
            actor._parent.addChildMsg(actor, error, argsArray);
        }
    }

    _addHandler(pred, act, sym){
        this._messageHandler.add(
            (...args)=>{
                return r.eq(sym, r.head(args)) &&
                    pred.apply(this, r.tail(r.tail(args)));
            },
            (...args) => {
                let deferred = r.head(r.tail(args));

                try{
                    let result = act.apply(this, r.tail(r.tail(args)));
                    deferred.resolve(result);
                    return result;
                }catch(err){
                    deferred.reject(err, r.tail(r.tail(args)));
                    this._handleError(err, r.tail(r.tail(args)));
                    return err;
                }
            });
    }

    addErrorHandler(pred, act){
        this._addHandler(pred, act, ErrorMsg);
    }

    addErrorMsg(...args){

        let deferred = Promise.defer();

        args.unshift(this._actor._stateMachine);
        args.unshift(deferred);
        args.unshift(ErrorMsg);
        this._systemMessages.enqueue(args);

        this._scheduler.start();
        return deferred.promise;
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
