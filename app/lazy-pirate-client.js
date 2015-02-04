#!/usr/bin/env node

var _zmq = require('zmq');
var _q = require('q');
var _uuid = require('uuid');
var Monitor = require('zmq-lib').Monitor;
var LazyPirateClient = require('zmq-lib').LazyPirateClient;
var EventDefinitions = require('zmq-lib').EventDefinitions;
var MessageDefinitions = require('zmq-lib').MessageDefinitions;

var _config = require('./config');
var _identifier = 'LPC_' + _uuid.v4();
var _args = require('yargs')

                // Identifier
                .demand('identifier')
                .alias('identifier', 'i')
                .default('identifier', _identifier)
                .describe('identifier', 'A unique identifier for the client')

                // Client message
                .demand('message')
                .alias('message', 'm')
                .default('message', '{' + _identifier + '} Hello!')
                .describe('message', 'Message that the client will send')

                // Client message count
                .demand('message-count')
                .alias('message-count', 'c')
                .default('message-count', 1)
                .describe('message-count', 'The number of messages that the client will send')

                // Monitor frequency
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

var retryMonitor = new Monitor(_args['monitor-frequency'], _args['retry-count']);
var _client = new LazyPirateClient(_config.QueueFE, retryMonitor);
var _messageIndex = 1;
var _maxMessages = _args['message-count'];

function _sendMessage() {
    if(_messageIndex <= _maxMessages) {
        var message =  _args.message + ' (' +  _messageIndex.toString() + ')';
        log('sending message: ', message);
        _client.send([ MessageDefinitions.REQUEST, 'SVC', message ]);
        _messageIndex++;
    }
}

_client.on(EventDefinitions.READY, function() {
    _sendMessage();
});

_client.on(EventDefinitions.RESPONSE, function() {
    var frames = Array.prototype.splice.call(arguments, 0);

    log(SEPARATOR);
    log('Client received response: ');
    log('\t Message    :  ' + frames[0].toString());
    log(SEPARATOR);

    _sendMessage();
});

_client.initialize();

if(_args['die'] > 0) {
    setTimeout(function() {
        log('Shutting down client' );
        _client.dispose();
        log('Exiting');
    }, _args['die']);
    log('Client started - auto terminate in ' +  _args['die'] + 'ms');
} else {
    log('Client started - press CTRL+C to terminate');
}
log('Connected to endpoint [' + _config.QueueFE + ']');
