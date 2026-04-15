class EquationList {
    constructor() {
        this.equations = [];
        this.variables = {};
        this.deps = [];
    }
    insert(i, expr) {
        if (expr.type == "assignment") {
            let index = this.variables[expr.name];
            if (index == undefined) {
                this.variables[expr.name] = i;
            }
            if (i > index) {
                console.error("ERROR: this is not good")
                return; // 
            }
            globals[expr.name] = evaluate(expr.expression, [], globals);
            equations[i] = expr;
            clean_render();
            return;
        } 
        if (expr.type == "=") {
            expr = reduce_equiv(expr)
        }
        if (!is_valid_deps(globals, ["x", "y"], expr)) {
            return;
        }

        if (expr.type != "funcdef") {
            let deps = dependencies(expr);
            if (!deps.includes("f")) {
                if (random_sample_eq(expr, solution)) {
                    console.log("EQS:", stringify(expr),  "    :    ", stringify(solution))
                    document.getElementById("popup-win").classList.add('open')
                }
            }
        }
    }
    get(i) {
        return []
    }
    *[Symbol.iterator]() {
        for (let eq of this.equations) {
            yield eq;
        }
    }
}

function insert(context, variable) {
    switch (variable.type) {
        case "def": 
            context[variable.name] = variable;
            return;
        case "assign": 
            context[variable.name] = evaluate(variable.expression, {}, context)
        default: 
            console.error(variable)
    }
}

function get_expr() {
    let text = document.getElementById('input-box').value;
    return parse_expression(new Lexer(text).tokenize())
}

function equation(text) {
    let lexed = new Lexer(text).tokenize();
    return parse_equation(lexed);
}
let day = Math.floor((new Date() - new Date(2026, 3, 15))/86400000)
let start_time = new Date();
let beat_time = undefined;
let formated_time = undefined;
console.log("day", day)
const problems = [
    "x^2 - y^2 - 9",
    "(x-4)^4 + y^4 - 2^4",
    "((x+4)^2 + (y-4)^2 - 16)*((x-4)^2 + (y+4)^2 - 16)*(x-y)",
    "x^2 - y^3 - 10"
]

const globals = {};
const canvas = document.getElementById('canvas');
canvas.width = 640;
canvas.height = 640;

const ctx = canvas.getContext("2d");
const camera = {
    x: 0,
    y: 0,
    w: 30,
    h: 30,
    scale: 20
}

insert(globals, equation("f(x, y) = " + problems[day % problems.length]))

const colours = [
    "var(--border)",
    "#d96b6b",
    "#6bbf8f",
]
console.log("glob", globals)
let equations = [];
let equations_colours = [];  
let solution = (equation("f(x, y)"))
let list_number = 0;
console.log(equations)
create_input("f(x, y)");
clean_render();

function old_logic() {
let input = document.createElement('input');
    input.type = "text"
    input.classList.add("equation");
    let i = equations.length;
    list_number += 1;
    equations.push(undefined)
    input.addEventListener('input', e => {
        let text = e.target.value;
        
        let expr = equation(text);
        if (expr.type == "assignment") {
            globals[expr.name] = evaluate(expr.expression, [], globals);
            equations[i] = expr;
            clean_render();
            return
        } else if (expr.type == "=") {
            expr = reduce_equiv(expr)
        }
        if (!is_valid_deps(globals, ["x", "y"], expr)) {
            return;
        }
        let correct_answer = false;
        if (expr.type != "funcdef") {
            let deps = dependencies(expr);
            
            if (!deps.includes("f") && deps.length <= 2) {
                if (random_sample_eq(expr, solution)) {
                    console.log("EQS:", stringify(expr),  "    :    ", stringify(solution))
                    document.getElementById("popup-win").classList.add('open')
                }
            }
        }
        equations[i] = expr;
        clean_render();
        
    });
    document.getElementById('eq-list').append(input)
}
function create_input(string = "") {
    let container = document.createElement('div');

    let toggle = document.createElement('button');
    let input = document.createElement('input');
    
    input.type = "text"
    container.classList.add("equation-row")
    input.classList.add("equation");
    toggle.classList.add('equation-toggle')
    let i = equations.length;
    list_number += 1;
    equations.push(error("Not initialized"));
    equations_colours.push(1)
    toggle.style.backgroundColor = colours[1]
    toggle.addEventListener('click', e => {
        equations_colours[i] = (equations_colours[i] + 1) % colours.length;
        e.target.style.backgroundColor = colours[equations_colours[i]];
        clean_render()
    })
    input.addEventListener('input', e => {
        let text = e.target.value;
        let expr = equation(text);
        if (expr.type == "funcdef") {
            expr.type = error("Cannot construct function definition in this program due to the programmers laziness.")
            return
        }
        if (expr.type == "assignment") {
            globals[expr.name] = evaluate(expr.expression, [], globals);
            equations[i] = expr;
            clean_render();

            return
        }  
        if (expr.type == "=") {
            expr = reduce_equiv(expr)
        }
        
        if (!is_valid_deps(globals, ["x", "y"], expr)) {
            equations[i] = error("Function references variables that just don't exist.")
            return;
        }
        equations[i] = expr;
        
        let deps = dependencies(expr);
        
        if (!deps.includes("f")) {
            console.log("I AM HERE!", deps)
            if (random_sample_eq(expr, solution)) {
                beat_time = new Date();
                formated_time = formatDuration(beat_time - start_time);
                document.getElementById('time-elapsed').textContent = formated_time
                document.getElementById("popup-win").classList.add('open')
            }
        }
        
        clean_render();
        
    });

    input.value = string;
    input.dispatchEvent(new Event('input', { target: input }))
    container.append(toggle, input)
    document.getElementById('eq-list').append(container)
}
document.getElementById('new-eq-btn').addEventListener('click', () => {
    create_input();
})
document.getElementById('help').addEventListener('click', () => {
    document.getElementById('popup-help').classList.add('open')
});
document.getElementById('close-help').addEventListener('click', () => {
    document.getElementById('popup-help').classList.remove('open')
})
document.getElementById('share-button').addEventListener('click', async () => {
    await navigator.clipboard.writeText("I just beat Graphle in " + formated_time + ". Play Here: joeberenshtain.github.io/Graphle")
});
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}