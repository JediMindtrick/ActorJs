'use strict';

import r from 'ramda';
import Either from 'data.either';
let Failure = Either.Left;
let Success = Either.Right;
let log = console.log;

export class NoMatch extends Error {
    constructor(args = [], message = undefined, fileName = undefined, lineNumber = undefined) {
      super(message, fileName, lineNumber); //call the parent method with super
      this.args = args;
    }
}

export class InvocationError extends Error {
    constructor(args = [], innerError = null, message = undefined, fileName = undefined, lineNumber = undefined) {
      super(message, fileName, lineNumber); //call the parent method with super
      this.args = args;
      this.innerError = innerError;
    }
}

export function getMatchFirst(arr) {
  return (...args) => {

    var found = r.find(pair => pair[0](...args), arr);
    if (found !== undefined) {
      try {
        let result = found[1](...args);
        let toReturn = r.is(Error, result) ? Failure(result) : Success(result);
        return toReturn;
      }catch (err) {
        return Failure(new InvocationError(args, err));
      }

    }else {
      return Failure(new NoMatch(args, 'no match found'));
    }
  };
}

export function getMatchAll(arr) {
  return (...args) => {
    var found = r.filter(pair => pair[0](...args), arr);
    if (found !== undefined) {

      return r.map(pair => {
        try {
          let result = pair[1](...args);
          return r.is(Error, result) ? Failure(result) : Success(result);
        }catch (err) {
          return Failure(new InvocationError(args, err));
        }
      }, found);

    }else {
      return [Failure(new NoMatch(args, 'no match found'))];
    }
  };
}

export class MatchEmitter {

    constructor() {
      this.matchers = [];
      this.default = function(act) {
        this.add(_ => true, act);
      };
      this.matchFirst = getMatchFirst(this.matchers);
      this.matchAll = getMatchAll(this.matchers);
    }

    add (test, action) {
      this.matchers.push([test, action]);
    }

    prepend (test, action) {
      this.matchers.unshift([test, action]);
    }
}
