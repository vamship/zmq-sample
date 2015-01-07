#!/usr/bin/env node

var _zmq = require('zmq');
var _q = require('q');
var _uuid = require('uuid');
var SimpleQueue = require('zmq-lib').SimpleQueue;
var EventDefinitions = require('zmq-lib').EventDefinitions;

var _config = require('./config');
var _identifier = 'SIQ_' + _uuid.v4();
var _args = require('yargs')

                // Identifier
                .demand('identifier')
                .alias('identifier', 'i')
                .default('identifier', _identifier)
                .describe('identifier', 'A unique identifier for the queue')

                // Auto die parameter
                .demand('die')
                .alias('die', 'd')
                .default('die', -1)
                .describe('die', 'If greater than zero, the number of milliseconds after which the process will terminate')

                // Silent flag
                .demand('silent')
                .alias('silent', 's')
                .default('silent', false)
                .describe('silent', 'Run in silent mode (no console output)')

                .argv;

var SEPARATOR = (new Array(81)).join('-');
function log() {
    if(_args.silent) {
        return;
    }
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift('[' + _args.identifier + ']::');
    console.log.apply(console, args);
}


var queue = new SimpleQueue(_config.QueueFE, _config.QueueBE);

queue.on(EventDefinitions.REQUEST, function() {
    log('Request received');
});

queue.on(EventDefinitions.ASSIGNED_REQUEST, function() {
    log('Request assigned to worker');
});

queue.on(EventDefinitions.ASSIGNED_RESPONSE, function() {
    log('Response assigned to client');
});

queue.initialize().then(function() {;
    if(_args['die'] > 0) {
        setTimeout(function() {
            log('Shutting down queue' );
            queue.dispose();
            log('Exiting');
        }, _args['die']);
        log('Queue started - auto terminate in ' +  _args['die'] + 'ms');
    } else {
        log('Queue started - press CTRL+C to terminate');
    }
    log('Front end endpoint is [' + _config.QueueFE + ']');
    log('Back end endpoint is [' + _config.QueueBE + ']');
}, function(err) {
    log('Error starting queue: ', err);
});
