'use strict';

var through2 = require('through2');
var ForkStream = require('fork-stream');
var eventStream = require('event-stream');
var duplexer2 = require('duplexer2');

module.exports = function (condition, trueStream, falseStream) {
	if (!trueStream) {
		throw new Error('fork-stream: child action is required');
	}

	// output stream
	var outStream = through2.obj();

	// create fork-stream
	var forkStream = new ForkStream({
		classifier: function (e, cb) {
			var ans = !!condition(e);
			return cb(null, ans);
		}
	});

	// if condition is true, pipe input to trueStream
	forkStream.a.pipe(trueStream);

	var mergedStream;

	if (falseStream) {
		// if there's an 'else' condition
		// if condition is false
		// pipe input to falseStream 
		forkStream.b.pipe(falseStream);
		// merge output with trueStream's output
		mergedStream = eventStream.merge(falseStream, trueStream);
	} else {
		// if there's no 'else' condition
		// if condition is false
		// merge output with trueStream's output
		mergedStream = eventStream.merge(forkStream.b, trueStream);
	}

	// send everything down-stream
	mergedStream.pipe(outStream);

	// consumers write in to forkStream, we write out to outStream
	return duplexer2(forkStream, outStream);
};
