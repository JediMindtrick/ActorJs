'use strict';
import r from 'ramda';
import Either from 'data.either';

const log = msg => {
  if (r.is(Function, msg)) {
    console.log(msg());
  }else {
    console.log(msg);
  }
}

var Fail  = Either.Left
var Right = Either.Right

// Int, Int -> Either(fError, Int)
function divide(a, b) {
  return b === 0 ?         Fail(new Error('Division by 0.'))
  :      /* otherwise */  Right(a / b)
}

divide(5, 0)
.map(_=> {
  log('success');
})
.orElse(_=> { log('error'); });

divide(5, 1)
.map(_=> {
  log('success');
})
.orElse(_=> { log('error'); });
