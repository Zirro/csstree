'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;
var noop = function() {};

function each(processChunk, node) {
    var list = node.children;
    var cursor = list.head;

    while (cursor !== null) {
        this.generate(processChunk, cursor.data, cursor, list);
        cursor = cursor.next;
    }
}

function eachComma(processChunk, node) {
    var list = node.children;
    var cursor = list.head;

    while (cursor !== null) {
        if (cursor.prev) {
            processChunk(',');
        }

        this.generate(processChunk, cursor.data, cursor, list);
        cursor = cursor.next;
    }
}

function createGenerator(types) {
    var context = {
        generate: function(processChunk, node, item, list) {
            if (hasOwnProperty.call(types, node.type)) {
                types[node.type].call(this, processChunk, node, item, list);
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        },
        each: each,
        eachComma: eachComma
    };

    return function(node, fn) {
        if (typeof fn !== 'function') {
            // default generator concats all chunks in a single string
            var buffer = [];
            context.generate(function(chunk) {
                buffer.push(chunk);
            }, node);
            return buffer.join('');
        }
        context.generate(fn, node);
    };
}

function createMarkupGenerator(types) {
    var context = {
        generate: function(processChunk, node, item, list) {
            if (hasOwnProperty.call(types, node.type)) {
                var nodeBuffer = [];
                types[node.type].call(this, function(chunk) {
                    nodeBuffer.push(chunk);
                }, node, item, list);
                processChunk({
                    node: node,
                    value: nodeBuffer
                });
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        },
        each: each,
        eachComma: eachComma
    };

    return function(node, enter, leave) {
        function walk(node, buffer) {
            var value = node.value;

            enter(node.node, buffer, value);

            if (typeof value === 'string') {
                buffer += value;
            } else {
                for (var i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'string') {
                        buffer += value[i];
                    } else {
                        buffer = walk(value[i], buffer);
                    }
                }
            }

            leave(node.node, buffer, value);

            return buffer;
        }

        if (typeof enter !== 'function') {
            enter = noop;
        }
        if (typeof leave !== 'function') {
            leave = noop;
        }

        var buffer = [];
        context.generate(function() {
            buffer.push.apply(buffer, arguments);
        }, node);
        return walk(buffer[0], '');
    };
}

module.exports = {
    createGenerator: createGenerator,
    createMarkupGenerator: createMarkupGenerator,
    sourceMap: require('./sourceMap')
};
