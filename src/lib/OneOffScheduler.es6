'use strict';
import { Scheduler } from './Scheduler';

export function scheduleOneOff(argsArr, doFunc, _theThis) {
  let ran = false;

  let scheduler = new Scheduler(
        () => { //getFunc
          if (!ran) {
            ran = true;
            return true;
          }
        },
        () => {//do func
          doFunc.apply((_theThis || null), argsArr);
          scheduler.stop();
        },
        () => { }); //swallow errors for now
}
