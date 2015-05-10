'use strict';

export class PoisonPill extends Error {
    constructor(message = undefined, fileName = undefined, lineNumber = undefined) {
      super(message, fileName, lineNumber);
    }
}
export class ActorTerminated extends Error {
    constructor(actor, message = undefined, fileName = undefined, lineNumber = undefined) {
      super(message, fileName, lineNumber);
      this.actor = actor;
    }
}
export class ActorRestarted {
    constructor(actor) {
      this.actor = actor;
    }
}
