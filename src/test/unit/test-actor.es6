import r from 'ramda';
import { expect, assert } from 'chai';
import { Actor } from '../../lib/Actor';
import { StateMachine, State, Trigger, StateAlreadyExists } from '../../lib/StateMachine';
import { SystemMsg, ChildMsg, UserMsg } from '../../lib/ActorChannel';
import Promise from 'bluebird';

var log = msg => console.log(msg);

describe('Actor',function(){

    it('returns a promise of results when a message is passed to it',function(done){

        const kb = new Actor({
            receive: [
                {
                    test: r.always(true),
                    act: msg => {
                        return 'bar';
                    }
                }
            ]
        });

        kb.ask('foo')
        .then(result => {
            expect(result).to.equal('bar');
            done();
        });

    });

    it('can be passed a list of user handlers in the constructor',function(done){

        const kb = new Actor({
            receive:[
                {
                    test: r.always(true),
                    act: msg => {
                        return 'bar';
                    }
                }
            ]
        });

        kb.ask('foo')
        .then(result => {
            expect(result).to.equal('bar');
            done();
        });

    });

    it('can be passed a list of system handlers in the constructor',function(done){

        const kb = new Actor({
            systemHandlers:[
                {
                    test: r.always(true),
                    act: msg => {
                        return 'bar';
                    }
                }
            ]
        });

        kb.addSystemMsg('foo')
        .then(result => {
            expect(result).to.equal('bar');
            done();
        });

    });

    it('can be passed a list of child handlers in the constructor',function(done){

        const kb = new Actor({
            childHandlers:[
                {
                    test: r.always(true),
                    act: msg => {
                        return 'bar';
                    }
                }
            ]
        });

        kb.addChildMsg('foo')
        .then(result => {
            expect(result).to.equal('bar');
            done();
        });

    });

    class First {
        constructor(){
            this.type = 'first';
        }
    }
    class Second {}

    class Third {}
    class Fourth {}
    class Fifth {}

    class Sixth {}
    class Seventh {}

    it('is deterministic in the order of message processing',function(done){

        let count = 0;
        let kb = new Actor({
            systemHandlers:[
                {
                    test: (machine, msg) => {
                        return r.is(First, msg);
                    },
                    act: msg => {
                        count++;
                        expect(count).to.equal(1);
                        return count;
                    }
                },
                {
                    test: (machine, msg) => {
                        return r.is(Second, msg);
                    },
                    act: msg => {
                        count++;
                        expect(count).to.equal(2);
                        return count;
                    }
                }
            ],
            childHandlers:[
                {
                    test: r.is(Third),
                    act: msg => {
                        count++;
                        expect(count).to.equal(3);
                        return count;
                    }
                },
                {
                    test: r.is(Fourth),
                    act: msg => {
                        count++;
                        expect(count).to.equal(4);
                        return count;
                    }
                },
                {
                    test: r.is(Fifth),
                    act: msg => {
                        count++;
                        expect(count).to.equal(5);
                        return count;
                    }
                }
            ],
            receive: [
                {
                    test: r.is(Sixth),
                    act: msg => {
                        count++;
                        expect(count).to.equal(6);
                        return count;
                    }
                },
                {
                    test: r.is(Seventh),
                    act: msg => {
                        count++;
                        expect(count).to.equal(7);
                        done();
                        return count;
                    }
                }
            ]
        });

        let putMsg = (queue,type,args)=>{
            queue.enqueue({
                msgType: type,
                deferred: Promise.defer(),
                args: args
            });
        }

        putMsg(kb._channel._systemMessages, SystemMsg, [{d: 'state machine'}, new First()]);
        putMsg(kb._channel._systemMessages, SystemMsg, [{d: 'state machine'}, new Second()]);

        putMsg(kb._channel._childrenMessages, ChildMsg, [new Third()]);
        putMsg(kb._channel._childrenMessages, ChildMsg, [new Fourth()]);
        putMsg(kb._channel._childrenMessages, ChildMsg, [new Fifth()]);

        putMsg(kb._channel._userMessages, UserMsg, [new Sixth()]);
        putMsg(kb._channel._userMessages, UserMsg, [new Seventh()]);

        kb._channel._scheduler.start();

    });

    it('will delegate errors from child up to parent',function(done){

        const kb = new Actor({
            childHandlers:[
                {
                    test: r.always(true),
                    act: msg => {
                        done();
                        return 'bar';
                    }
                }
            ]
        }, null, 'parent');

        var child = kb.supervise({
            receive: [
                {
                    test: r.always(true),
                    act: msg => {
                        throw new Error('foo');
                    }
                }
            ]
        }, 'child');

        child.ask('fizz');

    });

    /* The implementation does in fact do this, but I can't figure out a good way to test it without
    breaking the test run
        it('throws any errors, if it has no parent',function(done){
            let kb = new Actor();
            let count = 0;

            kb.addUserHandler(r.always(true), msg => {
                throw new Error('intentional error');
            });

    //this doesn't work, evidently ES6 classes don't allow for overriding instance methods?
            kb._handleError = function(error,args){
                expect(r.is(Error,error)).to.equal(true);
                done();
            }


            kb.ask('foo');

        });
        */

});
