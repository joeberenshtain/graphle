function drawGrid(ctx, camera) {
    const { x: cx, y: cy, w, h, scale } = camera;

    const screenW = canvas.width;
    const screenH = canvas.height;

    const left   = cx - w / 2;
    const right  = cx + w / 2;
    const top    = cy - h / 2;
    const bottom = cy + h / 2;

    const step = 1;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // vertical lines
    for (let i = Math.floor(left); i <= Math.ceil(right); i += step) {
        const sx = (i - cx) * scale + screenW / 2;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, screenH);
    }

    // horizontal lines
    for (let i = Math.floor(top); i <= Math.ceil(bottom); i += step) {
        const sy = (i - cy) * scale + screenH / 2;
        ctx.moveTo(0, sy);
        ctx.lineTo(screenW, sy);
    }

    ctx.stroke();

    // axes
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const ax = (0 - cx) * scale + screenW / 2;
    const ay = (0 - cy) * scale + screenH / 2;

    ctx.moveTo(ax, 0);
    ctx.lineTo(ax, screenH);

    ctx.moveTo(0, ay);
    ctx.lineTo(screenW, ay);

    ctx.stroke();
}
function clean_render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);    
    drawGrid(ctx, camera);
    ctx.strokeStyle = "#f00"
    let i = 0;

    for (const eq of equations) {
        let colour = equations_colours[i];
        i+=1
        if (colour == 0) {
            continue;
        } 

        if (eq.type == "error") {
            continue;
        }
        let deps = dependencies(eq);
        let valid = true;
        if (eq.type == "funcdef") {
            let args = get_arguments(eq);
            let valid = is_valid_deps(globals, args, eq.expr);
            if (!valid) {
                continue;
            }
            continue;
        } else if (eq.type == "assignment") {

            let valid = is_valid_deps(globals, [], eq.expression);
            if (!valid) {
                continue;
            }
            continue;
        } else {
            let valid = is_valid_deps(globals, ["x", "y"], eq);
            if (!valid) {
                continue;
            }
        }
        if (false) {
            ctx.strokeStyle = "#0f0"

            debug_render(eq)
        }

        ctx.strokeStyle = colours[colour]
        render_expr(eq)
    }
}
const MIN_DEPTH = 4;
const MAX_DEPTH = 7;
function render_expr(expr) {
    let tree = new QuadNode(-16, -16, 32, 32, 0, expr)
    tree.build(MIN_DEPTH, MAX_DEPTH, expr)
    ctx.beginPath()
    tree.render(ctx, 0, 0, camera.scale)
    ctx.closePath();
    ctx.stroke();
}
function debug_render(expr) {
    let tree = new QuadNode(-16, -16, 32, 32, 0, expr)
    tree.build(MIN_DEPTH, MAX_DEPTH, expr)
    ctx.beginPath()
    //tree.render(ctx, 0, 0, 10)
    let leaves = tree.leaves();
    for (let leaf of leaves) {
        leaf.fill(ctx, 0, 0, camera.scale);
    }
    ctx.closePath();
    ctx.stroke();
}