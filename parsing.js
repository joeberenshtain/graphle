function parse_equation(lexer) {
    let expr = parse_expression(lexer);
    if (expr.type == "error") {
        return expr;
    }
    
    if (lexer.eat("=")) {
        let other = parse_expression(lexer);
        if (other.type == "error") {
            return other;
        }

        if (expr.type === "variable" && (expr.name !== "x" && expr.name !== "y")) {
            return assign(expr.name, other)
        } else if (expr.type === "call") {
            // validate params are all plain names
            if (!expr.args.every(a => a.type === "variable")) {
                return error("function parameters must be plain names")
            }
            return funcdef(expr.name, expr.args.map(a => a.name), other)
        } else {
            return equiv(expr, other) // x^2 + y^2 = 1 case
        }
    } else if (lexer.is_end()) {
        return expr;
    } else {
        return error("Unexpected Symbol.")
    }
}

function parse_expression(lexer, bp = 0) {
    let lhs;
    let token = lexer.advance();
    switch (token.type) {
        case "NUMBER": lhs = constant(token.value); break;
        case "VARIABLE": lhs = variable(token.value); break;
        case "OPERATOR": {
            if (token.value == "(") {
                lhs = parse_expression(lexer);
                lexer.expect(")");
                break;

            }
        }
        default: return error(`Unexpected token: ${token.type}, lexer: ${lexer.current}`);
    }

    while (!lexer.is_end()) {
        let op = lexer.peek();
        let op_prec = get_precedence(op);
        switch (op.value) {
            case "(": {
                if (lhs.type != "variable") {
                    return error("Cannot call a non-variable")
                }
                lexer.expect("(")
                let name = lhs.name;
                let args = parse_arguments(lexer);
                lexer.expect(")");
                
                lhs = funccall(name, args)
                continue;
            }
            case ")": {
                
                return lhs;
            }
        }
        if (op_prec == undefined) {
            return lhs
        }
        if (op_prec > bp) {
            lexer.advance();
            let rhs = parse_expression(lexer, op_prec);
            if (rhs.type == "error") {
                return rhs
            }
            lhs = bi(op.value, lhs, rhs)
        } else {
            return lhs
        }
    }
    return lhs
}
function parse_arguments(lexer) {
    let args = [];
    
    do {
        let arg = parse_expression(lexer);
        if (arg.type == "error") {
            return arg
        }
        args.push(arg);
    } while (lexer.eat(","));
    return args;
}
function get_precedence(token) {
    let op = token.value;
    switch (token.type) {
        case "OPERATOR": break;
        default: return undefined;
    }
    return precedence[op]
}


const precedence = {
    "+" : 1,
    "-" : 1,
    "*" : 2,
    "/" : 2,
    "^" : 3,
};