var List = require('../../utils/list');

module.exports = {
    parse: {
        expression: function() {
            return new List().appendData(
                this.MediaQueryList()
            );
        },
        block: function() {
            return this.Block(this.Rule);
        }
    }
};
