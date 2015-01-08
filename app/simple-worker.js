#!/usr/bin/env node

var _zmq = require('zmq');
var _q = require('q');
var _uuid = require('uuid');
var MessageDefinitions = require('zmq-lib').MessageDefinitions;

var _config = require('./config');
var _identifier = 'SIW_' + _uuid.v4();
var _args = require('yargs')

                // Identifier
                .demand('identifier')
                .alias('identifier', 'i')
                .default('identifier', _identifier)
                .describe('identifier', 'A unique identifier for the worker')

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

                .usage('$0 [options]')
                .help('help')
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

var worker = _zmq.createSocket('req');
worker.connect(_config.QueueBE);

worker.on('message', function() {
    var frames = Array.prototype.splice.call(arguments, 0);

    log(SEPARATOR);
    log('Worker received message: ');
    log('\t Client Id  :  ' + frames[0]);
    log('\t Message    :  ' + frames[2].toString());
    log(SEPARATOR);
    worker.send([
        frames[0],
        frames[1],
        'ECHO ' + frames[2].toString()]);
});
worker.send(MessageDefinitions.READY);

if(_args['die'] > 0) {
    setTimeout(function() {
        log('Shutting down worker' );
        worker.close();
        log('Exiting');
    }, _args['die']);
    log('Worker started - auto terminate in ' +  _args['die'] + 'ms');
} else {
    log('Worker started - press CTRL+C to terminate');
}
log('Connected to endpoint [' + _config.QueueFE + ']');
