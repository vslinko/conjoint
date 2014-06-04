var expect = require('chai').expect;
var fs = require('fs');

var parser = require('../lib/parser'),
		parse = parser.parse;


describe('parser', function() {
		it('should parse complex example', function() {
				var source = fs.readFileSync(__dirname + '/../examples/allFeatures.cj').toString();
				// fs.writeFileSync(__dirname + '/../examples/allFeatures.cj.ast.json', JSON.stringify(parse(source), null, 4));
				var ast = fs.readFileSync(__dirname + '/../examples/allFeatures.cj.ast.json').toString();

				expect(parse(source)).to.eql(JSON.parse(ast));
		});
});
