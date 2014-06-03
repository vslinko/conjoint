var expect = require('chai').expect;
var fs = require('fs');

var tokenizer = require('../lib/tokenizer'),
		TokenType = tokenizer.TokenType,
		tokenIterator = tokenizer.tokenIterator;


function getTokens(source) {
		var tokens = [];
		var nextToken = tokenIterator(source);

		do {
				var token = nextToken();
				tokens.push(token);
		} while (token.type !== TokenType.EOF);

		return tokens;
}


describe('tokenIterator', function() {
		it('should parse comments', function() {
				expect(getTokens('# comment').slice(0, -1)).to.eql([
						{
								type: TokenType.Comment,
								value: ' comment',
								start: {position: 0, line: 0, column: 0},
								end: {position: 9, line: 0, column: 9}
						}
				]);
		});

		it('should parse keywords', function() {
				var keywords = ['let', 'import', 'from'];

				keywords.forEach(function(keyword) {
						expect(getTokens(keyword).slice(0, -1)).to.eql([
								{
										type: TokenType.Keyword,
										value: keyword,
										start: {position: 0, line: 0, column: 0},
										end: {position: keyword.length, line: 0, column: keyword.length}
								}
						]);
				});
		});

		it('should parse identifiers', function() {
				var identifiers = ['variableName', 'ClassName', 'a1', 'a123'];

				identifiers.forEach(function(identifier) {
						expect(getTokens(identifier).slice(0, -1)).to.eql([
								{
										type: TokenType.Identifier,
										value: identifier,
										start: {position: 0, line: 0, column: 0},
										end: {position: identifier.length, line: 0, column: identifier.length}
								}
						]);
				});
		});

		it('should parse punctuators', function() {
				var punctuators = [
						'%', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '?', '[',
						']', '^', '{', '}', '~', '<', '>', '=', '!', '&', '|', '<<', '>>',
						'&&', '||', '==', '!=', '>>>'
				];

				punctuators.forEach(function(punctuator) {
						expect(getTokens(punctuator).slice(0, -1)).to.eql([
								{
										type: TokenType.Punctuator,
										value: punctuator,
										start: {position: 0, line: 0, column: 0},
										end: {position: punctuator.length, line: 0, column: punctuator.length}
								}
						]);
				});
		});

		it('should parse null literal', function() {
				expect(getTokens('null').slice(0, -1)).to.eql([
						{
								type: TokenType.NullLiteral,
								value: 'null',
								start: {position: 0, line: 0, column: 0},
								end: {position: 4, line: 0, column: 4}
						}
				]);
		});

		it('should parse boolean literals', function() {
				var booleanLiterals = ['true', 'false'];

				booleanLiterals.forEach(function(booleanLiteral) {
						expect(getTokens(booleanLiteral).slice(0, -1)).to.eql([
								{
										type: TokenType.BooleanLiteral,
										value: booleanLiteral,
										start: {position: 0, line: 0, column: 0},
										end: {position: booleanLiteral.length, line: 0, column: booleanLiteral.length}
								}
						]);
				});
		});

		it('should parse numeric literals', function() {
				var numericLiterals = [['1', 1], ['123', 123]];

				numericLiterals.forEach(function(numericLiteral) {
						expect(getTokens(numericLiteral[0]).slice(0, -1)).to.eql([
								{
										type: TokenType.NumericLiteral,
										value: numericLiteral[1],
										start: {position: 0, line: 0, column: 0},
										end: {position: numericLiteral[0].length, line: 0, column: numericLiteral[0].length}
								}
						]);
				});
		});

		it('should parse character literals', function() {
				var characterLiterals = [["'a'", 'a'], ["'b'", 'b']];

				characterLiterals.forEach(function(characterLiteral) {
						expect(getTokens(characterLiteral[0]).slice(0, -1)).to.eql([
								{
										type: TokenType.CharacterLiteral,
										value: characterLiteral[1],
										start: {position: 0, line: 0, column: 0},
										end: {position: characterLiteral[0].length, line: 0, column: characterLiteral[0].length}
								}
						]);
				});
		});

		it('should parse string literals', function() {
				var stringLiterals = [['"hello world"', 'hello world'], ['"one\ntwo\nthree"', 'one\ntwo\nthree']];

				stringLiterals.forEach(function(stringLiteral) {
						var lines = stringLiteral[0].split(/\n/);

						expect(getTokens(stringLiteral[0]).slice(0, -1)).to.eql([
								{
										type: TokenType.StringLiteral,
										value: stringLiteral[1],
										start: {position: 0, line: 0, column: 0},
										end: {position: stringLiteral[0].length, line: lines.length - 1, column: lines.slice(-1)[0].length}
								}
						]);
				});
		});

		it('should parse end of file', function() {
				expect(getTokens('')).to.eql([
						{
								type: TokenType.EOF,
								value: null,
								start: {position: 0, line: 0, column: 0},
								end: {position: 0, line: 0, column: 0}
						}
				]);
		});

		it('should parse complex example', function() {
				var source = fs.readFileSync(__dirname + '/../examples/allFeatures.cj').toString();
				// fs.writeFileSync(__dirname + '/../examples/allFeatures.cj.tokens.json', JSON.stringify(getTokens(source), null, 4));
				var tokens = fs.readFileSync(__dirname + '/../examples/allFeatures.cj.tokens.json').toString();

				expect(getTokens(source)).to.eql(JSON.parse(tokens));
		});
});
