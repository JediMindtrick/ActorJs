import r from 'ramda';
import { expect, assert } from 'chai';
import { Actor } from '../../lib/Actor';
import { StateMachine, State, Trigger, StateAlreadyExists } from '../../lib/StateMachine';
import { SystemMsg, ChildMsg, UserMsg } from '../../lib/ActorChannel';
import Promise from 'bluebird';

var log = msg => console.log(msg);

describe('Actor',function(){

    it('has a special channel for system messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addSystemHandler(r.always(true), (machine,_) => {
            count++;
            expect(count).to.equal(1);
            done();
        });
        kb.addSystemMsg('foo');
    });

    it('has a special channel for children messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addChildHandler(r.always(true), msg => {
            count++;
            expect(msg).to.equal('foo');
            expect(count).to.equal(1);
            done();
        });

        kb.addChildMsg('foo');
    });

    it('has a special channel for user messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addUserHandler(r.always(true), msg => {
            count++;
            expect(msg).to.equal('foo');
            expect(count).to.equal(1);
            done();
        });

        kb.ask('foo');
    });

    it('returns a promise of results when a message is passed to it',function(done){

        const kb = new Actor();

        kb.addUserHandler(r.always(true), msg => {
            return 'bar';
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
        let kb = new Actor();
        let count = 0;

        kb.addSystemHandler(
            (machine, msg) => {
                return r.is(First, msg);
            },
            msg => {
                count++;
                expect(count).to.equal(1);
                return count;
        });

        kb.addSystemHandler(
            (machine, msg) => {
                return r.is(Second, msg);
            },
            msg => {
                count++;
                expect(count).to.equal(2);
                return count;
        });

        kb.addChildHandler(r.is(Third), msg => {
            count++;
            expect(count).to.equal(3);
            return count;
        });

        kb.addChildHandler(r.is(Fourth), msg => {
            count++;
            expect(count).to.equal(4);
            return count;
        });

        kb.addChildHandler(r.is(Fifth), msg => {
            count++;
            expect(count).to.equal(5);
            return count;
        });

        kb.addUserHandler(r.is(Sixth), msg => {
            count++;
            expect(count).to.equal(6);
            return count;
        });

        kb.addUserHandler(r.is(Seventh), msg => {
            count++;
            expect(count).to.equal(7);
            done();
            return count;
        });

        kb._channel._systemMessages.enqueue([SystemMsg, Promise.defer(), {d: 'state machine'}, new First()]);

        kb._channel._systemMessages.enqueue([SystemMsg, Promise.defer(), {d: 'state machine'}, new Second()]);

        kb._channel._childrenMessages.enqueue([ChildMsg, Promise.defer(), new Third()]);
        kb._channel._childrenMessages.enqueue([ChildMsg, Promise.defer(), new Fourth()]);
        kb._channel._childrenMessages.enqueue([ChildMsg, Promise.defer(), new Fifth()]);

        kb._channel._userMessages.enqueue([UserMsg, Promise.defer(), new Sixth()]);
        kb._channel._userMessages.enqueue([UserMsg, Promise.defer(), new Seventh()]);

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
        }, null, 'child');

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
