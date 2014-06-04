var tokenizer = require('./tokenizer'),
		TokenType = tokenizer.TokenType,
		tokenIterator = tokenizer.tokenIterator;


var Syntax = {
		Program: 'Program',
		Comment: 'Comment',
		ImportDeclaration: 'ImportDeclaration',
		ImportSpecifier: 'ImportSpecifier',
		VariableDeclaration: 'VariableDeclaration',
		CallExpression: 'CallExpression',
		Argument: 'Argument',
		Identifier: 'Identifier',
		Literal: 'Literal'
};


function createProgram(body) {
		return {
				type: Syntax.Program,
				body: body
		};
}


function createComment(text) {
		return {
				type: Syntax.Comment,
				text: text
		};
}


function createImportDeclaration(specifiers, source) {
		return {
				type: Syntax.ImportDeclaration,
				specifiers: specifiers,
				source: source
		};
}


function createImportSpecifier(id) {
		return {
				type: Syntax.ImportSpecifier,
				id: id
		};
}


function createVariableDeclaration(id, valueType, optional, init) {
		return {
				type: Syntax.VariableDeclaration,
				id: id,
				valueType: valueType,
				optional: optional,
				init: init
		};
}


function createCallExpression(callee, args) {
		return {
				type: Syntax.CallExpression,
				callee: callee,
				'arguments': args
		};
}


function createArgument(id) {
		return {
				type: Syntax.Argument,
				id: id
		};
}


function createIdentifier(name) {
		return {
				type: Syntax.Identifier,
				name: name
		};
}


function createLiteral(value, valueType) {
		return {
				type: Syntax.Literal,
				value: value,
				valueType: valueType
		};
}


function parse(source) {
		var getNextToken,
				currentToken,
				nextToken;

		getNextToken = tokenIterator(source);
		nextToken = getNextToken();

		function assert(condition, message) {
				if (!condition) {
						throw new TypeError(message);
				}
		}

		function assertToken(condition, token) {
				var message = 'Unexpected token "' + token.type + '"';
				var lines = source.split(/\n/);

				message += '\n\t';
				message += lines[token.start.line];
				message += '\n\t';
				message += new Array(token.start.column + 1).join(' ');
				message += '^';

				assert(condition, message);
		}

		function expectKeyword(keyword) {
				var token = shiftToken();
				assertToken(token.type === TokenType.Keyword && token.value === keyword, token);
		}

		function expectPunctuator(punctuator) {
				var token = shiftToken();
				assertToken(token.type === TokenType.Punctuator || token.value === punctuator, token);
		}

		function matchPunctuator(punctuator) {
				return nextToken.type === TokenType.Punctuator && nextToken.value === punctuator;
		}

		function markerCreate() {
				return nextToken.start;
		}

		function markerApply(startMarker, node) {
				node.start = startMarker;
				node.end = nextToken.start;
				return node;
		}

		function shiftToken() {
				var token = nextToken;
				nextToken = getNextToken();
				return token;
		}

		function parseIdentifier() {
				var marker = markerCreate();
				var token = shiftToken();
				assertToken(token.type === TokenType.Identifier, token);
				return markerApply(marker, createIdentifier(token.value));
		}

		function parsePrimaryExpression() {
				var marker;

				if (nextToken.type === TokenType.Identifier) {
						return parseIdentifier();
				}

				if (nextToken.type === TokenType.StringLiteral) {
						return markerApply(markerCreate(), createLiteral(shiftToken().value, 'String'));
				}

				if (nextToken.type === TokenType.NumericLiteral) {
						return markerApply(markerCreate(), createLiteral(shiftToken().value, 'Numeric'));
				}

				if (nextToken.type === TokenType.CharacterLiteral) {
						return markerApply(markerCreate(), createLiteral(shiftToken().value, 'Character'));
				}

				if (nextToken.type === TokenType.NullLiteral) {
						marker = markerCreate();
						shiftToken();
						return markerApply(marker, createLiteral(null, 'Null'));
				}

				if (nextToken.type === TokenType.BooleanLiteral) {
						return markerApply(markerCreate(), createLiteral(shiftToken().value === 'true', 'Boolean'));
				}

				assertToken(false, nextToken);
		}

		function parseArgument() {
				var id,
						marker = markerCreate();

				id = parseIdentifier();

				return markerApply(marker, createArgument(id));
		}

		function parseArguments() {
				var args = [];

				expectPunctuator('(');

				while (!matchPunctuator(')')) {
						args.push(parseArgument());
				}

				expectPunctuator(')');

				return args;
		}

		function parseLeftHandSideExpressionAllowCall() {
				var expression, marker = markerCreate();

				expression = parsePrimaryExpression();

				while (matchPunctuator('(')) {
						expression = markerApply(marker, createCallExpression(expression, parseArguments()));
				}

				expectPunctuator(';');

				return expression;
		}

		function parseImportSpecifier() {
				var marker = markerCreate();
				var id = parseIdentifier();
				return markerApply(marker, createImportSpecifier(id));
		}

		function parseImportDeclaration() {
				var specifiers = [],
						source,
						marker = markerCreate();

				expectKeyword('import');
				expectPunctuator('{');

				do {
						specifiers.push(parseImportSpecifier());
				} while (matchPunctuator(',') && shiftToken());

				expectPunctuator('}');
				expectKeyword('from');

				source = parsePrimaryExpression();
				assertToken(source.type === Syntax.Literal, source);

				expectPunctuator(';');

				return markerApply(marker, createImportDeclaration(specifiers, source));
		}

		function parseVariableDeclaration() {
				var id,
						valueType,
						optional = false,
						init,
						marker = markerCreate();

				expectKeyword('let');
				id = parseIdentifier();

				expectPunctuator(':');
				valueType = parseIdentifier();

				if (matchPunctuator('?')) {
						shiftToken();
						optional = true;
				}

				expectPunctuator('=');
				init = parsePrimaryExpression();
				expectPunctuator(';');

				return markerApply(marker, createVariableDeclaration(id, valueType, optional, init));
		}

		function parseProgramElement() {
				var token,
						marker;

				if (nextToken.type === TokenType.Comment) {
						marker = markerCreate();
						token = shiftToken();
						return markerApply(marker, createComment(token.value));
				} else if (nextToken.type === TokenType.Keyword) {
						if (nextToken.value === 'import') {
								return parseImportDeclaration();
						} else if (nextToken.value === 'let') {
								return parseVariableDeclaration();
						}
				} else {
						return parseLeftHandSideExpressionAllowCall();
				}
		}

		function parseProgramElements() {
				var programElements = [];

				while (nextToken.type !== TokenType.EOF) {
						programElements.push(parseProgramElement());
				}

				return programElements;
		}

		function parseProgram() {
				var body,
						marker = markerCreate();

				body = parseProgramElements();

				return markerApply(marker, createProgram(body));
		}

		return parseProgram();
}


module.exports.Syntax = Syntax;
module.exports.parse = parse;