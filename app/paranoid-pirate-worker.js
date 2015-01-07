#!/usr/bin/env node

var _zmq = require('zmq');
var _q = require('q');
var _uuid = require('uuid');
var Monitor = require('zmq-lib').Monitor;
var ParanoidPirateWorker = require('zmq-lib').ParanoidPirateWorker;
var MessageDefinitions = require('zmq-lib').MessageDefinitions;
var EventDefinitions = require('zmq-lib').EventDefinitions;

var _config = require('./config');
var _identifier = 'PPW_' + _uuid.v4();
var _args = require('yargs')

                // Identifier
                .demand('identifier')
                .alias('identifier', 'i')
                .default('identifier', _identifier)
                .describe('identifier', 'A unique identifier for the worker')

                // Heartbeat frequency
                .demand('monitor-frequency')
                .alias('monitor-frequency', 'f')
                .default('monitor-frequency', 1000)
                .describe('monitor-frequency', 'Monitor frequency in milliseconds')

                // Retry count
                .demand('retry-count')
                .alias('retry-count', 'r')
                .default('retry-count', 3)
                .describe('retry-count', 'Retry count in milliseconds')

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

var retryMonitor = new Monitor(_args['monitor-frequency'], _args['retry-count']);
var worker = new ParanoidPirateWorker(_config.QueueBE, retryMonitor);

worker.on(EventDefinitions.REQUEST, function(frames) {
    log(SEPARATOR);
    log('Worker received message: ');
    log('\t Client Id  :  ' + frames[0]);
    log('\t Message    :  ' + frames[2].toString());
    log(SEPARATOR);
    worker.send([ frames[0], frames[1], 'ECHO ' + frames[2].toString()]);
});
worker.initialize();

if(_args['die'] > 0) {
    setTimeout(function() {
        log('Shutting down worker' );
        worker.dispose();
        log('Exiting');
    }, _args['die']);
    log('Worker started - auto terminate in ' +  _args['die'] + 'ms');
} else {
    log('Worker started - press CTRL+C to terminate');
}
log('Connected to endpoint [' + _config.QueueFE + ']');
