import r from 'ramda';
import Either from 'data.either';
let Failure = Either.Left,
    Success = Either.Right;

const log = msg => {
  if (r.is(Function, msg)) {
    console.log(msg());
  }else {
    console.log(msg);
  }
}

let foo = a => a < 2 ? Failure('wha-wha') : Success('woohooo');

foo(1)
.map(log)
.orElse(e => log('epic fail: ' + e));

foo(3)
.map(log)
.orElse(e => log('epic fail: ' + e));
