class Tokens {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }
    advance() {
        if (this.current >= this.tokens.length) {
            return {type: "eof"}
        }
        return this.tokens[this.current++];
    }

    peek() {
        if (this.current >= this.tokens.length) {
            return {type: "eof"}
        }
        return this.tokens[this.current];
    }
    eat(token) {
        if (this.current >= this.tokens.length) {
            return false;
        }
        if (this.tokens[this.current].value == token) {
            this.current++;
            return true;
        } else {
            return false;
        }
    }
    expect(token) {
        let c = this.peek();
        if (!this.eat(token)) {
            throw new Error("Invalid Token, expected '" + token + "'. Instead got: '" + c.value + "'.")
        }
    }
    is_end() {
        return this.current >= this.tokens.length;
    }
}
class Lexer {
    constructor(input) {
        this.input = input;
        this.current = 0;
    }

    tokenize() {
        const tokens = [];
        while (!this.isAtEnd()) {
            const char = this.peek();
            if (this.isDigit(char)) {
                tokens.push(this.readNumber());
            } else if (this.isOperator(char)) {
                tokens.push(this.readOperator());
            } else if (this.isWhitespace(char)) {
                this.advance();
            } else if (this.isAlphabetic(char)) {
                tokens.push({ type: "VARIABLE", value: this.advance()})
            } else {
                tokens.push({ type: "VARIABLE", value: this.advance()})
            }
        }
        return new Tokens(tokens);
    }
    
    readNumber() {
        let value = "";
        while (this.isDigit(this.peek())) {
        value += this.advance();
        }
        return { type: "NUMBER", value: parseFloat(value) };
    }

    readOperator() {
        const value = this.advance();
        return { type: "OPERATOR", value };
    }

    isDigit(char) {
        return char >= "0" && char <= "9";
    }
    isAlphabetic(char) {
        return /^[a-zA-Z()]+$/.test(char)
    }
    isOperator(char) {
        return "+-*/()^".includes(char);
    }

    isWhitespace(char) {
        return /\s/.test(char);
    }

    advance() {
        return this.input[this.current++];
    }

    peek() {
        return this.input[this.current];
    }
    eat(token) {
        if (this.input[this.current].value == token) {
            this.current++;
            return true;
        } else {
            return false;
        }
    }
    expect(token) {
        if (!this.eat(token)) {
            throw new Error("Invalid Token, expected " + token)
        }
    }
    isAtEnd(){
        return this.current >= this.input.length;
    }
}