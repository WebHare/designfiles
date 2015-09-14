/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! LOAD: frameworks.mootools.core
!*/

/** This package contains an standards-conforming implementation of the ECMAScript 6 promise.

    Implemented with as bases the ECMAScript 6 draft at https://people.mozilla.org/~jorendorff/es6-draft.html
    The implementation is based on the state of the draft at 05-04-2014 (rev. 23).
*/

(function($) { //mootools/scope wrapper
"use strict"

// ---------------------------------------------------------------------------
//
// Extra helper functions
//

/// Bind wrapper. Needed because the promise/A+ tests use mocha, which messes up Function.prototype.bind
function bind(func, thisptr)
{
  var base_args = Array.prototype.slice.call(arguments, 2);
  var res = (function()
    {
      //console.log('call bind', 'this:', thisptr, 'base:', base_args, 'args', arguments);
      var local_args = Array.prototype.slice.call(arguments, 0);
      var final_args = base_args.concat(local_args);
      return func.apply(thisptr, final_args);
    })
  res.func = func;
  res.thisptr = thisptr;
  res.args = base_args;
  return res;
}

/** scheduleTask schedules a function to be executed asap (outsite the current executioncontext).
    Uses setImmediate if present (IE10+), otherwise MessageChannel if present. Fallback to setTimeout on
    non-capable browsers (IE8-9)
*/
var scheduleTask;
if (window.setImmediate)
{
  scheduleTask = function(task) { window.setImmediate(task); }
}
else if (window.MessageChannel)
{
  var channel = new MessageChannel();
  var head = {}, tail = head;
  channel.port1.onmessage = function () {
      head = head.next;
      var task = head.task;
      delete head.task;
      task();
  };
  scheduleTask = function (task) {
      tail = tail.next = {task: task};
      channel.port2.postMessage(0);
  };
}
else
  scheduleTask = function(task) { setTimeout(task, 0); }

// ---------------------------------------------------------------------------
//
// Helper functions for ECMAScript 6 stuff
//

function isUndefinedOrNull(value)
{
  return typeof value == "undefined" || (typeof value == "object" && !value);
}

function isObject(value)
{
  return value && (typeof value == "function" || typeof value == "object");
}

var tasks = [];
var busy = false;

function executeTasks()
{
  //console.log('executeTasks', tasks.length);
  busy = true;
  var cb = setTimeout(executeTasks, 0); // only needed so we can throw errors
  while (tasks.length)
  {
    var task = tasks.splice(0, 1)[0];
    //console.log('task:', task, task.func, task.args);
    //console.log('**** TASK BARRIER');
    task();
  }
  busy = false;
  clearTimeout(cb);
}

var enqueueTask = function(func)
{
  tasks.push(func);
  if (tasks.length == 1 && !busy)
    scheduleTask(executeTasks);
}


// ---------------------------------------------------------------------------
//
// Implementation taken from ecmascript 6 draft
//

function createResolvingFunctions(promise)
{
  var alreadyResolved = { value: false };
  return { resolve: bind(promiseResolveFunction, undefined, promise, alreadyResolved)
         , reject: bind(promiseRejectFunction, undefined, promise, alreadyResolved)
         };
}

function promiseRejectFunction(promise, alreadyResolved, reason)
{
  if (alreadyResolved.value)
    return;
  alreadyResolved.value = true;

  rejectPromise(promise, reason);
}

function promiseResolveFunction(promise, alreadyResolved, resolution)
{
  if (alreadyResolved.value)
    return;
  alreadyResolved.value = true;

  if (promise === resolution)
  {
    try
    {
      throw TypeError("Trying to resolve a promise with itself");
    }
    catch (e)
    {
      return rejectPromise(promise, e);
    }
  }

  if (!isObject(resolution))
    return fulfillPromise(promise, resolution);

  var then;
  try
  {
    then = resolution.then;
  }
  catch (e)
  {
    return rejectPromise(promise, e);
  }

  if (typeof then != "function")
    return fulfillPromise(promise, resolution);

  // Need new resolving functions, original ones are now disabled (alreadyResolved.value == true)
  var resolvingFunctions = createResolvingFunctions(promise);

  try
  {
    return then.call(resolution, resolvingFunctions.resolve, resolvingFunctions.reject);
  }
  catch (e)
  {
    return resolvingFunctions.reject(e);
  }
}

function fulfillPromise(promise, value)
{
  if (promise._promiseState != "pending")
    throw Error("Assertion failure - PromiseState should be 'pending'");

  var reactions = promise._promiseFulfillReactions;
  promise._promiseResult = value;
  promise._promiseFulfillReactions = undefined;
  promise._promiseRejectReactions = undefined;
  promise._promiseState = "fulfilled";
  triggerPromiseReactions(reactions, value);
}

function newPromiseCapability(c)
{
  /* This functions is NewPromiseCapability & CreatePromiseCapabilityRecord combined. Can't separate the stuff in
     plain javascript
  */
  var promiseCapability =
    { promise: null
    , resolve: null
    , reject: null
    };

  var executor = bind(getCapabilitiesExecutor, null, promiseCapability);

  promiseCapability.promise = new c(executor);
  if (typeof promiseCapability.resolve != "function" || typeof promiseCapability.reject != "function")
    throw TypeError("Resolve & reject function must both be callable");

  // point 8 ignored, we can't preconstruct a promise
  return promiseCapability;
}

function getCapabilitiesExecutor(capability, resolve, reject)
{
  if (capability.resolve || capability.reject)
    throw TypeError("promiseCapabilityRecord already initialized");

  capability.resolve = resolve;
  capability.reject = reject;
}

function isPromise(x)
{
  return typeof x == "object" && x && x._promiseState ? true : false;
}

function rejectPromise(promise, reason)
{
  var reactions = promise._promiseRejectReactions;
  promise._promiseResult = reason;
  promise._promiseFulfillReactions = undefined;
  promise._promiseRejectReactions = undefined;
  promise._promiseState = "rejected";
  triggerPromiseReactions(reactions, reason);
}

function triggerPromiseReactions(reactions, argument)
{
  var orglen = tasks.length;
  for (var i = 0; i < reactions.length; ++i)
    enqueueTask(bind(promiseReactionTask, null, reactions[i], argument));
}

function promiseReactionTask(reaction, argument)
{
  var promiseCapability = reaction.capabilities;
  var handler = reaction.handler;
  var handlerResult;

  //console.log('promiseReactionTask on ', promiseCapability.promise.id, handler.func || handler, argument);
  //console.log('- what: ', reaction.what, 'with', argument);

  try
  {
    handlerResult = handler(argument);
    //console.log('promiseReactionTask handler result', handlerResult);
  }
  catch (e)
  {
    //console.log('promiseReactionTask threw', e);
    handlerResult = e;
    promiseCapability.reject(e);
    return;
  }

  promiseCapability.resolve(handlerResult);
}

function createPromiseReaction(capabilities, handler, what)
{
  return { capabilities: capabilities, handler: handler, what: what };
}


var ctr = 0;
function Promise(executor)
{
  var promise = this;
  if (!isObject(promise))
    throw TypeError("Promise is not an object");
  // ADDME: Check whether this object is worthy of being a promise
  if (typeof promise._promiseState != "undefined")
    throw TypeError("Promise already initialized");

  if (typeof executor != "function")
    throw TypeError("Promise executor is not callable");

  promise.id = ++ctr;
  //console.error('created promise', promise.id);

  initializePromise(promise, executor);
}

function initializePromise(promise, executor)
{
//  Assertions, not really needed to check here
//  if (typeof promise._promiseState != "undefined")
//    throw TypeError("inititializePromise called on a non-promise");
//  if (typeof executor != "function")
//    throw TypeError("inititializePromise called with a non-callable executor");

  promise._promiseState = "pending";
  promise._promiseFulfillReactions = [];
  promise._promiseRejectReactions = [];
  promise._promiseResult = undefined;

  var resolvingFunctions = createResolvingFunctions(promise);

  try
  {
    executor(resolvingFunctions.resolve, resolvingFunctions.reject);
  }
  catch (e)
  {
    resolvingFunctions.reject.call(undefined, e);
  }
  return promise;
}

Promise.all = function(iterable)
{
  // Test for iterability (must be array for now)
  if (typeOf(iterable) != "array")
    throw new Error("First argument to Promise.all must be an array");

  var promiseCapability = newPromiseCapability(this);
  var values = [];
  var remainingElementsCount = { value: 1 };
  var index = 0;

  try
  {
    for (var i = 0;; ++i)
    {
      if (i >= iterable.length)
      {
        if (remainingElementsCount.value == 0)
          promiseCapability.resolve.call(undefined, values);
        return promiseCapability.promise;
      }

      var nextValue = iterable[i];
      var nextPromise  = this.resolve(nextValue);
      var slots = { alreadyCalled: false };
      var resolveElement = bind(promiseAllResolveElementFunction, null, slots, index, values, promiseCapability, remainingElementsCount);
      ++remainingElementsCount.value;
      nextPromise.then(resolveElement, promiseCapability.reject);
      ++index;
    }
  }
  catch (e)
  {
    promiseCapability.reject(e);
    return promiseCapability.promise;
  }
}

function promiseAllResolveElementFunction(slots, index, values, promiseCapability, remainingElementsCount, x)
{
  if (slots.alreadyCalled)
    return;
  slots.alreadyCalled = true;

  values[index] = x;
  if (--remainingElementsCount.value == 0)
    promiseCapability(values);
}

Promise.race = function(iterable)
{
  // Test for iterability (must be array for now)
  if (typeOf(iterable) != "array")
    throw new Error("First argument to Promise.race must be an array");

  var promiseCapability = newPromiseCapability(this);

  try
  {
    for (var i = 0;; ++i)
    {
      if (i >= iterable.length)
        return promiseCapability.promise;

      var nextValue = iterable[i];
      var nextPromise = this.resolve(nextValue);
      nextPromise.then(promiseCapability.resolve, promiseCapability.reject);
    }
  }
  catch (e)
  {
    promiseCapability.reject(e);
    return promiseCapability.promise;
  }
}

Promise.reject = function(r)
{
  var promiseCapability = newPromiseCapability(this);
  promiseCapability.reject(r);
  //console.log('create promise rejected with ',r,':', promiseCapability.promise.id);
  return promiseCapability.promise;
}

Promise.resolve = function(x)
{
  if (isPromise(x) && x.constructor === this)
    return x;

  var promiseCapability = newPromiseCapability(this);
  promiseCapability.resolve(x);
  //console.log('create promise resolved with ',x,':', promiseCapability.promise);
  return promiseCapability.promise;
}

Promise.prototype["catch"] = function(onRejected)
{
  var undef;
  return this.then(undef, onRejected);
}

var thencounter = 0;

Promise.prototype.then = function(onFulfilled, onRejected)
{
  var tcnt = ++thencounter;
//  console.log('called .then, id:', tcnt, this.id, this);
//  console.trace();

  var promise = this;
  if (!isPromise(promise))
    throw TypeError("Promise.prototype.then called on a non-promise");

  if (isUndefinedOrNull(onFulfilled))
    onFulfilled = identityFunction;
  else if (typeof onFulfilled != "function")
    onFulfilled = identityFunction;// throw TypeError("Promise.prototype.then parameter onFulfilled is not callable");
  // Against A+!

  if (isUndefinedOrNull(onRejected))
    onRejected = throwerFunction;
  else if (typeof onRejected != "function")
    onRejected = throwerFunction;// throw TypeError("Promise.prototype.then parameter onRejected is not callable");
  // Against A+!

  //console.log('Calling .then on promise ', this.id, onFulfilled, onRejected);

  var promiseCapability = newPromiseCapability(promise.constructor);

  var fulfillReaction = createPromiseReaction(promiseCapability, onFulfilled, "Promise "+ promise.id+" resolved, calling onfulfillment of then " + tcnt);
  var rejectReaction = createPromiseReaction(promiseCapability, onRejected, "Promise "+ promise.id+" rejected, calling onRejected of then " + tcnt);

  if (promise._promiseState == "pending")
  {
    promise._promiseFulfillReactions.push(fulfillReaction);
    promise._promiseRejectReactions.push(rejectReaction);
  }
  else if (promise._promiseState == "fulfilled")
  {
    //console.log('- promise', promise.id, 'already resolved');
    enqueueTask(bind(promiseReactionTask, null, fulfillReaction, promise._promiseResult));
  }
  else
  {
    //console.log('- promise', promise.id, 'already rejected');
    enqueueTask(bind(promiseReactionTask, null, rejectReaction, promise._promiseResult));
  }

  return promiseCapability.promise;
}

function identityFunction(x) { return x; }

function throwerFunction(e) { throw e; }

window.$wh = window.$wh || {};
window.$wh.Promise = Promise;

if (!window.Promise)
  window.Promise = Promise;

// Extra stuff that is handy

/** Create a promise together with resolve & reject functions
    @return
    @cell return.promise
    @cell return.resolve
    @cell return.reject
*/
$wh.Promise.defer = function()
{
  var deferred =
    { promise: null
    , resolve: null
    , reject: null
    };

  deferred.promise = new this(function(resolve, reject) { deferred.resolve = resolve; deferred.reject = reject; });
  return deferred;
}

/** Finally function for promises (executes callback without parameters, waits on returned thenables, then fulfills with
    original result
*/
$wh.Promise.prototype["finally"] = function(callback)
{
  // From https://github.com/domenic/promises-unwrapping/issues/18
  var constructor = this.constructor;
  return this.then(
    function(value) { return constructor.resolve(callback()).then(function() { return value; }); },
    function(reason) { return constructor.resolve(callback()).then(function() { throw reason; }); });
}

/// Add the stuff to existing Promise implementation if present
if (!window.Promise.defer)
  window.Promise.defer = $wh.Promise.defer;

if (!window.Promise.prototype["finally"])
  window.Promise.prototype["finally"] = $wh.Promise.prototype["finally"];

// underscore variants, IE 8 has problems with using 'catch' and 'finally' as keys
$wh.Promise.prototype._finally = $wh.Promise.prototype["finally"];
window.Promise.prototype._finally = window.Promise.prototype["finally"];

$wh.Promise.prototype._catch = $wh.Promise.prototype["catch"];
window.Promise.prototype._catch = window.Promise.prototype["catch"];

})(document.id); //end mootools/scope/strict wrapper
