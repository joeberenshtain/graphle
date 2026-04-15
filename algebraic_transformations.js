function funcdef(name, args, expr) {
    return { type: "def", name, args, expr}
}
function funccall(name, args) {
    return { type: "call", name, args}
}
// transform
function diff(expression, variable) {
    switch (expression.type) {
        case "+": return add(...expression.args.map(val => diff(val, variable)))
        case "*": return product_rule(expression, variable)

        case "constant": return constant(0)
        case "variable": return expr_eq(variable, expression) ? constant(1) : constant(0)
    }
}
function product_rule(expression, variable) {
    console.assert(expression.type == "*")
    let terms = [];
    expression.args.forEach((arg, i) => {
        let diff_val = diff(arg, variable)
        let prod = mul(diff_val, ...pure_splice(expression.args, i))
        terms.push(prod)
    });
    return add(...terms)

}
function pure_splice(arr, i) {
    // if (i+1 == arr.length) {
    //     return [...arr.slice(0, i)]
    // }
    let new_arr = [
        ...arr.slice(0, i),
        ...arr.slice(i+1)
    ];
    
    return new_arr
}
function evaluate(expression, locals, globals) {
    switch (expression.type) {
        case "+": {
            let total = expression.args.reduce((total, term) => {
                return total + evaluate(term, locals, globals);
            }, 0);
            return total;
        }
        case "-": {
            return -evaluate(expression.arg, locals, globals)
        }
        case "*": {
            let total = expression.args.reduce((total, term) => {
                return total * evaluate(term, locals, globals);
            }, 1);
            return total;
        }
        case "/": {
            return  1 / evaluate(expression.arg, locals, globals)
        }
        case "^": {
            return evaluate(expression.base, locals, globals) ** evaluate(expression.exponent, locals, globals);
        }

        case "constant": {
            return expression.value
        }
        case "variable": {
            if (locals[expression.name] != undefined) {
                return locals[expression.name];
            } else {
                return globals[expression.name];
            }
        }
        case "call": {
            let func = globals[expression.name];
            let func_args = {};
            func.args.forEach((name, i) => {
                func_args[name] = evaluate(expression.args[i], locals, globals)
            });
            let res = evaluate(func.expr, func_args, globals);
            return res;
        }
        case "error": {
            return 0;
        }
    }
}
function simplify(expression) {
    // return expression;
    switch (expression.type) {
        case "+": {

            let flat = expression.args
            //    .flatMap((expr) => expr.type == "+" ? expr.args : expr)
                .map((expr) => simplify(expr))
                .filter((expr) => !(expr.type == "constant" && expr.value == 0))
            
            if (flat.length == 0) {
                return constant(0)
            }
            if (flat.length == 1) {
                return flat[0]
            }
            return add(...flat)
            
        }
        case "-": {
            if (expression.arg.type == "-") {
                return simplify(expression.arg.arg)
            }
        }
        case "*": {
            if (expression.args.some((expr) => expr.type == "constant" && expr.value == 0)) {
                return constant(0)
            }
            let flat = expression.args
                .map((expr) => simplify(expr))
                .filter((expr) => !(expr.type == "constant" && expr.value == 1))
            if (flat.length == 0) {
                return constant(1)
            }
            if (flat.length == 1) {
                return flat[0]
            }
            return mul(...flat);
        }

        case "constant": return expression
        case "variable": return expression
        case "error": return expression;
    }
    return expression;
}
function stringify(expression) {
    switch(expression.type) {
        case "constant": return expression.value.toString()
        case "variable": return expression.name
        case "=": return stringify(expression.lhs) + "=" + stringify(expression.rhs)
        case "error": return "Error: " + expression.message;
        case "-": return "-" + stringify(expression.arg)
        case "/": return "/" + stringify(expression.arg)
        case "^": return stringify(expression.base) + "^" + stringify(expression.exponent)
        default: {
            let string = ""
            let n = 0;
            for (let expr of expression.args) {
                if (n != 0) string += " " + expression.type + " "
                
                string += stringify(expr);
                n+= 1;
            }
            return string;
        }
    }
}
function traverse(expression, f, data) {
    switch(expression.type) {
        case "constant": return f(data, expression)
        case "variable": return f(data, expression)
        case "=": return stringify(expression.lhs) + "=" + stringify(expression.rhs)
        case "error": return "Error: " + expression.message
        default: {
            let string = ""
            let n = 0;
            for (let expr of expression.args) {
                if (n != 0) string += " " + expression.type + " "
                string += stringify(expr);
                n+= 1;
            }
            return string;
        }
    }
}
function dependencies(expression, list=[]) {
    switch(expression.type) {
        case "constant": break;
        case "variable": list.push(expression.name); break;
        case "assignment": dependencies(expression.expression, list); break;
        case "=": dependencies(expression.lhs, list); dependencies(expression.rhs, list); break;
        case "error": return [];
        case "-": dependencies(expression.arg, list); break;
        case "/": dependencies(expression.arg, list); break;
        case "^": dependencies(expression.base, list); dependencies(expression.exponent, list); break
        case "call": {
            list.push(expression.name);
            for (let expr of expression.args) {
                dependencies(expr, list)
            }
            break;
        }
        default: {
            for (let expr of expression.args) {
                dependencies(expr, list)
            }
        }
    }
    return list;
}
// def
function bi(type, a, b) {
    if (type == "+") {
        return add(a, b)
    }
    if (type == "*") {
        return mul(a, b)
    }
    if (type == "/") {
        return mul(a, rec(b))
    }
    if (type == "^") {
        return pow(a, b)
    }
    if (type == "-") {
        return add(a, neg(b))
    }
    return {type, args}
}
function constant(value) {
    return {type: "constant", value}
}
function variable(name) {
    return {type: "variable", name}
}
function error(message) {
    return {type: "error", message}
}
function add(...args) {
    const flat = args.flatMap(a => a.type === '+' ? a.args : [a])
    return { type: "+", args: flat}
}
function neg(arg) {
    return { type: "-", arg }
}
function rec(arg) {
    return { type: "/", arg}
}
function mul(...args) {
    const flat = args.flatMap(a => a.type === "*" ? a.args : [a])
    return { type: "*", args: flat}
}
function pow(base, exponent) {
    return { type: "^", base, exponent}
}
function assign(name, expression) {

    return { type: "assignment", name, expression }
}
function equiv(lhs, rhs) {
    return { type: "=", lhs, rhs}
}
function expr_eq(a, b) {
    if (a.type !== b.type) return false
    switch (a.type) {
        case 'constant': return a.value === b.value
        case 'variable': return a.name === b.name
        case '+':
        case '*': return a.args.length === b.args.length && 
                            a.args.every((arg, i) => exprEq(arg, b.args[i]))
    }
}

function reduce_equiv(expr) {
    console.assert(expr.type == "=", expr);
    return add(expr.lhs, neg(expr.rhs))
}
function get_arguments(expr) {
    console.assert(expr.type == "funcdef");
    let args = [];
    for (let arg of expr.args) {
        args.push(arg.name);
    }
    return args;
}
function is_valid_deps(globals, locals, expr) {
    let deps = dependencies(expr);
    let valid = true;
    for (let dep of deps) {
        
        if (globals[dep] == undefined && !locals.includes(dep)) {
            valid = false;
        }
    }
    return valid;
}
function random_sample_eq(eq1, eq2) {
    console.log("sampling :D", eq1, eq2)
    for (let i = 0; i < 20; i++) {
        let x = Math.random() * camera.w - camera.w / 2 + camera.x;
        let y = Math.random() * camera.h - camera.h / 2 + camera.y
        let coord = { "x": x, "y": y }
        let val1 = evaluate(eq1, coord, globals);
        let val2 = evaluate(eq2, coord, globals);
        if (val1 == undefined) {
            return false
        }
        if (Math.abs(val1 - val2) > 1e-10) {
            console.log("Failure, (${x} ${y})",eq1, eq2, val1, val2)
            return false
        }
    }
    console.log("Success")
    return true
}