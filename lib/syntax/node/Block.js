var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var SEMICOLON = TYPE.Semicolon;
var ATRULE = TYPE.Atrule;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var EOF = 0;

// TODO: move to Raw
function consumeRaw(start) {
    var type = 0;
    var end;

    scan:
    for (var i = 0; type = this.scanner.lookupType(i); i++) {
        switch (type) {
            case SEMICOLON:
                i++;
                break scan;
            case RIGHTCURLYBRACKET:
            case EOF:
                break scan;
        }
    }

    this.scanner.skip(i);
    if (this.scanner.tokenStart > start) {
        end = this.scanner.getOffsetExcludeWS();
    } else {
        end = this.scanner.tokenStart;
    }

    return {
        type: 'Raw',
        loc: this.getLocation(start, end),
        value: this.scanner.source.substring(start, end)
    };
}

module.exports = {
    name: 'Block',
    structure: {
        children: [['Atrule', 'Rule', 'Declaration']]
    },
    parse: function(defaultConsumer) {
        if (!defaultConsumer) {
            defaultConsumer = this.Declaration;
        }

        var start = this.scanner.tokenStart;
        var children = new List();

        this.scanner.eat(LEFTCURLYBRACKET);

        scan:
        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case RIGHTCURLYBRACKET:
                    break scan;

                case WHITESPACE:
                case COMMENT:
                case SEMICOLON:
                    this.scanner.next();
                    break;

                case ATRULE:
                    children.appendData(this.tolerantParse(this.Atrule, consumeRaw));
                    break;

                default:
                    children.appendData(this.tolerantParse(defaultConsumer, consumeRaw));
            }
        }

        this.scanner.eat(RIGHTCURLYBRACKET);

        return {
            type: 'Block',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    generate: function(processChunk, node) {
        processChunk('{');
        this.each(processChunk, node);
        processChunk('}');
    },
    walkContext: 'block'
};
