var     expect      = require("chai").expect,
        assert      = require('chai').assert,
        Strategy    = require('../../lib/SupervisionStrategies'),
        resumeOn    = Strategy.resumeOn,
        stopOn      = Strategy.stopOn,
        restartOn   = Strategy.restartOn,
        escalateOn  = Strategy.escalateOn;

import {ActorTerminated, ActorRestarted, PoisonPill as Poison} from '../../lib/SystemMessages';
import r from 'ramda';

describe('Supervision Strategies',function(){

    it('provides a resume strategy',function(done){
        done();
    });

    it('provides a stop strategy',function(done){
        done();
    });

    it('provides a restart strategy',function(done){
        done();
    });

    it('provides an escalate strategy',function(done){
        done();
    });

});
