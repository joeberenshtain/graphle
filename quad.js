class QuadNode {
    constructor(x, y, w, h, depth, func) {
        this.x = x; 
        this.y = y; 
        this.w = w; 
        this.h = h; 
        this.depth = depth;
        this.children = undefined;
        this.corners = [
            evaluate(func, { "x": this.x, "y": this.y}, globals),
            evaluate(func, { "x": this.x + this.w, "y": this.y}, globals),
            evaluate(func, { "x": this.x, "y": this.y + this.h}, globals),
            evaluate(func, { "x": this.x + this.w, "y": this.y + this.h}, globals)
        ];
    }
    subdivide(min_depth, func) {
        const hw = this.w / 2, hh = this.h / 2, d = this.depth + 1;
        const above = this.corners.map(v => v >= 0);
        if ((!above.some(a => a) || !above.some(a => !a)) && this.depth > min_depth) return;
        this.children = [
            new QuadNode(this.x,      this.y,      hw, hh, d, func),
            new QuadNode(this.x + hw, this.y,      hw, hh, d, func),
            new QuadNode(this.x,      this.y + hh, hw, hh, d, func),
            new QuadNode(this.x + hw, this.y + hh, hw, hh, d, func),
        ];
    }
    build(min_depth, max_depth, func) {
        if (this.depth >= max_depth) return;
        this.subdivide(min_depth, func);
        if (this.children) for (let child of this.children) child.build(min_depth, max_depth, func);
    }
    render(ctx, cx, cy, scale) {
        if (this.children) {
            for (const child of this.children) child.render(ctx, cx, cy, scale);
            return;
        }
        const [v0, v1, v2, v3] = this.corners;
        const above = [v0, v1, v2, v3].map(v => v >= 0);
        
        if (!above.some(a => a) || !above.some(a => !a)) return;
        const tx = p => (p - cx) * scale + canvas.width / 2.0;
        const ty = p => -(p - cy) * scale + canvas.height / 2.0;

        const { x, y, w, h } = this;
        const x1 = x + w, y1 = y + h;
        const edgePts = [
            [tx(lerp(x, x1, v0, v1)), ty(y) ],
            [tx(x1), ty(lerp(y, y1, v1, v3))],
            [tx(lerp(x, x1, v2, v3)), ty(y1)],
            [tx(x),  ty(lerp(y, y1, v0, v2))],
        ];
        const idx = (v0>=0?8:0)|(v1>=0?4:0)|(v2>=0?2:0)|(v3>=0?1:0);
        for (const [a, b] of MS_LINES[idx]) {
            ctx.moveTo(...edgePts[a]);
            ctx.lineTo(...edgePts[b]);
        }
    }
    leaves(list=[]) {
        if (this.children) {
            for (const child of this.children) {
                child.leaves(list)
            }
        } else {
            list.push(this)
        }
        return list
    }
    fill(ctx, cx, cy, scale) {
        const tx = p => (p - cx) * scale + canvas.width / 2.0;
        const ty = p => -(p - cy) * scale + canvas.height / 2.0;
        
        draw_rect(ctx, cx, cy, scale, this.x, this.y, this.w, this.h)
        const idx = (this.corners[0]>=0?8:0)|(this.corners[1]>=0?4:0)|(this.corners[2]>=0?2:0)|(this.corners[3]>=0?1:0);
        ctx.font = "10px serif"
        ctx.fillText(idx, tx(this.x), ty(this.y))
    }
}
function lerp(a, b, va, vb) {
    if (Math.abs(vb - va) < 1e-10) return (a + b) / 2;
    return a - va / (vb - va) * (b - a);
}
function draw_rect(ctx, cx, cy, scale, x, y, w, h) {
    const tx = p => (p - cx) * scale + canvas.width / 2.0;
    const ty = p => -(p - cy) * scale + canvas.height / 2.0;
    ctx.rect(tx(x), ty(y + h), w * scale, h * scale)
    
}


// 8 4
// 2 1
// 0: top
// 1: right
// 2: bottom
// 3: left
const MS_LINES = [
  [],                 // 0
  [[1, 2]],           // 1
  [[2, 3]],           // 2
  [[1, 3]],           // 3
  [[0, 1]],           // 4
  [[0, 2]],           // 5
  [[0, 2]],           // 6
  [[0, 3]],           // 7
  [[0, 3]],           // 8
  [[0, 2]],           // 9
  [[0, 2]],           // 10
  [[0, 1]],           // 11
  [[1, 3]],           // 12
  [[2, 3]],           // 13
  [[1, 2]],           // 14
  []                  // 15
];