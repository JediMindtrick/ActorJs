import r from 'ramda';
import { expect, assert } from 'chai';

import * as matchLib from '../../lib/MatchEmitter';
var Emitter = matchLib.MatchEmitter;
var mixer = matchLib.mixinMatchEmitter;
var InvocationError = matchLib.InvocationError;

var log = msg => console.log(msg);

class TestMessage {
    constructor(message){
        this.message = message;
    }
}

describe('MatchEmitter',function(){

    it('matches and runs the first valid matcher when asked',function(){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
                    ({message: msg}) => matches++/*log(msg)*/ );

        emitter.add(r.is(TestMessage),
                    _ => assert.fail('we should only match the first match'));

        emitter.matchFirst(new TestMessage('hi'));

        expect(matches).to.equal(1);
    });

    it('matches and runs all valid matchers when asked',function(){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
                    ({message: msg}) => matches++ );

        emitter.add(r.is(TestMessage),
                    _ => matches++ );

        emitter.matchAll(new TestMessage('hi'));

        expect(matches).to.equal(2);
    });

    it('provides a function to mixin MatchEmitter into any class',function(){
        mixer(TestMessage);

        var emitter = new TestMessage();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
        ({message: msg}) => matches++/*log(msg)*/ );

        emitter.matchFirst(new TestMessage('hi'));

        expect(matches).to.equal(1);
    });

    it('throws an InvocationError if an exception is thrown for first match',function(done){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(
            msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
            ({message: msg}) => { throw new Error('this is an intentional error'); } );

        let testMessage = new TestMessage('hi');


        emitter.matchFirst(testMessage)
        .map(_ => assert.fail('this function invocation should not succeed'))
        .orElse(err => {

            expect(r.is(InvocationError,err)).to.equal(true);
            expect(err.args[0]).to.equal(testMessage);
            expect(err.innerError.message).to.equal('this is an intentional error');
            done();
        });

    });

    it('returns an Either as the result of matchFirst()',function(done){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
        ({message: msg}) => matches++/*log(msg)*/ );

        emitter.add(r.is(TestMessage),
        _ => assert.fail('we should only match the first match'));

        emitter.matchFirst(new TestMessage('hi'))
        .map(result => {
            expect(r.is(TestMessage,result));
            expect(matches).to.equal(1);
            done();
        })
        .orElse(assert.fail);

    });

    it('returns a list of Eithers when calling matchAll()',function(done){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
        ({message: msg}) => { } );

        emitter.add(r.is(TestMessage),
        _ => { });

        emitter.matchAll(new TestMessage('hi'))
        .forEach(either => {
            either
                .map(_ => matches++)
                .orElse(assert.fail);
        });

        expect(matches).to.equal(2);
        done();

    });

});
