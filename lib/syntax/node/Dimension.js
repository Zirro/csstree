var NUMBER = require('../../tokenizer').TYPE.Number;

// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
function readUnit(scanner) {
    var unit = scanner.getTokenValue();
    var backSlashPos = unit.indexOf('\\');

    if (backSlashPos > 0) {
        // patch token offset
        scanner.tokenStart += backSlashPos;

        // return part before backslash
        return unit.substring(0, backSlashPos);
    }

    // no backslash in unit name
    scanner.next();

    return unit;
}

// number ident
module.exports = {
    name: 'Dimension',
    structure: {
        value: String,
        unit: String
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var value = this.scanner.consume(NUMBER);
        var unit = readUnit(this.scanner);

        return {
            type: 'Dimension',
            loc: this.getLocation(start, this.scanner.tokenStart),
            value: value,
            unit: unit
        };
    },
    generate: function(node) {
        if (node.value.startsWith('-0')) {
            return node.value.slice(1) + node.unit;
        }
        if (node.value.startsWith('-.')) {
            return '-0.' + node.value.slice(2) + node.unit;
        }
        if (node.value.startsWith('.')) {
            return '0' + node.value + node.unit;
        }
        return node.value + node.unit;
    }
};
