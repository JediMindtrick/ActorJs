var     expect      = require("chai").expect,
        assert      = require('chai').assert,
        Poison      = require('../../lib/SystemMessages').PoisonPill;

import r from 'ramda';

describe('Supervision',function(){
    it('will re-throw child exceptions if they are not handled by a strategy',function(done){
        done();
    });

    it('will delegate child exceptions handled by a strategy',function(done){
        done();
    });
});
