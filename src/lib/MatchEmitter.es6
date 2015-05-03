'use strict';

import r from 'ramda';
import Either from 'data.either';
let Failure = Either.Left,
    Success = Either.Right;

export class NoMatch extends Error {
    constructor(args = [], message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message, fileName, lineNumber); //call the parent method with super
        this.args = args;
    }
}

export class InvocationError extends Error {
    constructor(args = [], innerError = null, message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message, fileName, lineNumber); //call the parent method with super
        this.args = args;
        this.innerError = innerError;
    }
}

export function getAddMatcher(arr){
    return (test, action) => {
        arr.push([test, action]);
    };
}
export function getMatchFirst(arr){
    return (...args) => {

        var found = r.find(pair => pair[0](...args), arr);
        if(found !== undefined){
            try{
                let result = found[1](...args);
                return r.is(Error, result) ? Failure(result) : Success(result);
            }catch(err){
                return Failure(new InvocationError(args, err));
            }

        }else{
            console.log('no match found');
            return Failure(new NoMatch(...args, 'no match found'));
        }
    };
}

export function getMatchAll(arr){
    return (...args) => {
        var found = r.filter(pair => pair[0](...args), arr);
        if(found !== undefined){

            return r.map(pair => {
                try{
                    let result = pair[1](...args);
                    return r.is(Error, result) ? Failure(result) : Success(result);
                }catch(err){
                    return Failure(new InvocationError(args, err));
                }
            }, found);

        }else{
            return [Failure(new NoMatch(...args, 'no match found'))];
        }
    };
}

export class MatchEmitter {
    constructor(){
        this.matchers = [];
        this.add = getAddMatcher(this.matchers);
        this.default = function(act){
            this.add(_ => true, act);
        };
        this.matchFirst = getMatchFirst(this.matchers);
        this.matchAll = getMatchAll(this.matchers);
    }
}

export function mixinMatchEmitter({prototype: _proto}){
    var matchers = [];
    _proto.add = getAddMatcher(matchers);
    _proto.matchFirst = getMatchFirst(matchers);
    _proto.matchAll = getMatchAll(matchers);
}
