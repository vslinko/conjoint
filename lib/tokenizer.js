var TokenType = {
	  Comment: 'Comment',
	  Keyword: 'Keyword',
	  Identifier: 'Identifier',
	  Punctuator: 'Punctuator',
	  NullLiteral: 'NullLiteral',
	  BooleanLiteral: 'BooleanLiteral',
	  NumericLiteral: 'NumericLiteral',
	  CharacterLiteral: 'CharacterLiteral',
	  StringLiteral: 'StringLiteral',
	  EOF: 'EOF'
};


function isWhiteSpace(character) {
		return character === 0x20;
}


function isLineTerminator(character) {
		return character === 0x0A;
}


function isDecimalDigit(character) {
    return (character >= 48 && character <= 57); // 0-9
}


function isAlpha(character) {
		return (character >= 0x41 && character <= 0x5A) // A-Z
				|| (character >= 0x61 && character <= 0x7A); // a-z
}


function isIdentifierStart(character) {
		return isAlpha(character);
}


function isIdentifierPart(character) {
		return isAlpha(character)
				|| isDecimalDigit(character);
}


function isKeyword(identifier) {
		return ['let', 'import', 'from'].indexOf(identifier) >= 0;
}


function tokenIterator(source) {
		var currentPosition,
				currentLineNumber,
				currentLineStartPosition,
				sourceLength;

		currentPosition = 0;
		currentLineNumber = 0;
		currentLineStartPosition = 0;
		sourceLength = source.length;

		function throwError(message) {
				if (!condition) {
						message += ' at line ';
						message += currentLineNumber + 1;
						message += ' at column ';
						message += currentPosition - currentLineStartPosition + 1;
						message += '\n\t';
						message += source.split(/\n/g)[currentLineNumber];
						message += '\n\t';
						message += new Array(currentPosition - currentLineStartPosition + 1).join(' ');
						message += '^';

						throw new TypeError(message);
				}
		}

		function assert(condition, message) {
				if (!condition) {
						throwError(message);
				}
		}

		function assertCharacter(condition, character) {
				assert(condition, 'Unexpected character "' + character + '"');
		}

		function getCurrentPosition() {
				return {
						position: currentPosition,
						line: currentLineNumber,
						column: currentPosition - currentLineStartPosition
				};
		}

		function skipWhiteSpaces() {
				var character;

				while (currentPosition < sourceLength) {
						character = source.charCodeAt(currentPosition);

						if (isWhiteSpace(character)) {
								currentPosition++;
						} else if (isLineTerminator(character)) {
								currentPosition++;
								currentLineNumber++;
								currentLineStartPosition = currentPosition;
						} else {
								break;
						}
				}
		}

		function scanComment() {
				var character,
						value;

				character = source.charCodeAt(currentPosition);
				assertCharacter(character === 0x23, character); // #
				currentPosition++;

				value = '';

				while (currentPosition < sourceLength) {
						character = source.charCodeAt(currentPosition);

						if (isLineTerminator(character)) {
								break;
						} else {
								currentPosition++;
								value += String.fromCharCode(character);
						}
				}

				return {
						type: TokenType.Comment,
						value: value
				};
		}

		function scanIdentifier() {
				var character,
						value,
						type;

				character = source.charCodeAt(currentPosition);
				assertCharacter(isIdentifierStart(character), character);
				currentPosition++;

				value = String.fromCharCode(character);

				while (currentPosition < sourceLength) {
						character = source.charCodeAt(currentPosition);

						if (isIdentifierPart(character)) {
								currentPosition++;
								value += String.fromCharCode(character);
						} else {
								break;
						}
				}

				if (isKeyword(value)) {
						type = TokenType.Keyword;
				} else if (value === 'null') {
						type = TokenType.NullLiteral;
				} else if (value === 'true' || value === 'false') {
						type = TokenType.BooleanLiteral;
				} else {
						type = TokenType.Identifier;
				}

				return {
						type: type,
						value: value
				};
		}

		function scanNumericLiteral() {
				var character,
						value;

				character = source.charCodeAt(currentPosition);
				assertCharacter(isDecimalDigit(character), character);
				currentPosition++;

				value = String.fromCharCode(character);

				while (currentPosition < sourceLength) {
						character = source.charCodeAt(currentPosition);

						if (isDecimalDigit(character)) {
								currentPosition++;
								value += String.fromCharCode(character);
						} else {
								break;
						}
				}

				return {
						type: TokenType.NumericLiteral,
						value: Number(value)
				};
		}

		function scanCharacterLiteral() {
				var character,
						value;

				character = source.charCodeAt(currentPosition);
				assertCharacter(character === 0x27, character); // '
				currentPosition++;

				character = source.charCodeAt(currentPosition);
				assertCharacter(character !== 0x27, character); // '
				currentPosition++;
				value = String.fromCharCode(character);

				character = source.charCodeAt(currentPosition);
				assertCharacter(character === 0x27, character); // '
				currentPosition++;

				return {
						type: TokenType.CharacterLiteral,
						value: value
				};
		}

		function scanStringLiteral() {
				var character,
						value;

				character = source.charCodeAt(currentPosition);
				assertCharacter(character === 0x22, character); // "
				currentPosition++;

				value = '';

				while (currentPosition < sourceLength) {
						character = source.charCodeAt(currentPosition);

						if (character === 0x22) { // "
								currentPosition++;
								return {
										type: TokenType.StringLiteral,
										value: value
								};
						} else if (isLineTerminator(character)) {
								currentPosition++;
								currentLineNumber++;
								currentLineStartPosition = currentPosition;
								value += String.fromCharCode(character);
						} else {
								currentPosition++;
								value += String.fromCharCode(character);
						}
				}

				throwError('Unexpected end of file');
		}

		function scanPunctuator() {
				var character,
						value;

				character = source.charCodeAt(currentPosition);

				switch (character) {
			      case 0x25: // %
			      case 0x28: // (
			      case 0x29: // )
			      case 0x2A: // *
			      case 0x2B: // +
			      case 0x2C: // ,
			      case 0x2D: // -
			      case 0x2E: // .
			      case 0x2F: // /
			      case 0x3A: // :
			      case 0x3B: // ;
			      case 0x3F: // ?
			      case 0x5B: // [
			      case 0x5D: // ]
			      case 0x5E: // ^
			      case 0x7B: // {
			      case 0x7D: // }
			      case 0x7E: // ~
								currentPosition++;
			      		return {
			      				type: TokenType.Punctuator,
			      				value: String.fromCharCode(character)
			      		};
			  }

				value = source.substr(currentPosition, 3);
				if (value === '>>>') {
						currentPosition += 3;
						return {
	      				type: TokenType.Punctuator,
	      				value: value
	      		};
				}

				value = value.substr(0, 2);
				if (['<<', '>>', '&&', '||', '==', '!='].indexOf(value) >= 0) {
						currentPosition += 2;
						return {
	      				type: TokenType.Punctuator,
	      				value: value
	      		};
				}

				value = value.substr(0, 1);
				if (['<', '>', '=', '!', '&', '|'].indexOf(value) >= 0) {
						currentPosition++;
						return {
	      				type: TokenType.Punctuator,
	      				value: value
	      		};
				}

				assertCharacter(false, character);
		}

		function collectToken() {
				var character,
						start,
						token;

				skipWhiteSpaces();

				if (currentPosition >= sourceLength) {
						return {
								type: TokenType.EOF,
								value: null,
								start: getCurrentPosition(),
								end: getCurrentPosition()
						};
				}

				start = getCurrentPosition();
				character = source.charCodeAt(currentPosition);

				if (character === 0x23) { // #
						token = scanComment();
				} else if (isIdentifierStart(character)) {
						token = scanIdentifier();
				} else if (isDecimalDigit(character)) {
						token = scanNumericLiteral();
				} else if (character === 0x27) { // '
						token = scanCharacterLiteral();
				} else if (character === 0x22) { // "
						token = scanStringLiteral();
				} else {
						token = scanPunctuator();
				}

				token.start = start;
				token.end = getCurrentPosition();

				return token;
		}

		return collectToken;
}


module.exports.TokenType = TokenType;
module.exports.tokenIterator = tokenIterator;