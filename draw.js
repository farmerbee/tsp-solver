
/**
 *  根据坐标绘制节点 
 * @param {number[]} coods 
 * @param {canvas context} ctx 
 * @param {*} canvasWidth 
 * @param {*} canvasHeight 
 */
function drawNodes(coods, ctx, canvas = null, scale = false) {
    ctx.save();
    if (scale) {
        coods = scaleCoods(coods, canvas.width, canvas.height)
    }
    coods.forEach((cood, index) => {
        ctx.beginPath();
        ctx.arc(cood.x, cood.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    })
    ctx.restore();
}



/**
 *  根据序列绘制节点路径 
 * @param {number[]} sequence 
 * @param {number[]} coods 
 * @param {convas-context} ctx 
 * @param {boolean} randColor
 */
function drawPaths(sequence, coods, ctx, randColor = false) {
    ctx.save();
    ctx.beginPath();
    if (randColor) {
        ctx.strokeStyle = hexColor();
    }
    sequence.forEach((i, index) => {
        if (index == 0) {
            ctx.moveTo(coods[i].x, coods[i].y);
        } else {
            ctx.lineTo(coods[i].x, coods[i].y);
        }
    })
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

/**
 *  draw chart 
 * @param {number[]} sequences 二维数组，每一行为需要渲染的数据 
 * @param {*} ctx 
 * @param {number} baseX 坐标原点x 
 * @param {number} baseY 坐标原点y 
 * @param {number} width 图的宽度 
 * @param {number} height 图的高度 
 * @param {boolean} axisNeed 是否需要渲染坐标轴
 */
function drawChart(sequences, ctx, baseX, baseY, width, height, axisNeed = true, autoColor=false) {
    // todo: get colors from parameters
    ctx.save();
    const colors = ['#33cc33', '#9900cc', '#ff9900', '#ff0033']
    // 坐标轴
    if (axisNeed) {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.moveTo(baseX, baseY);
        // axis x
        ctx.lineTo(baseX + width, baseY);
        ctx.moveTo(baseX, baseY);
        // axis y
        ctx.lineTo(baseX, baseY - height);
        ctx.stroke();
    }

    // 折线
    sequences.forEach((sequence, i) => {
        let coods = scaleSequence(sequence, baseX, baseY, width, height * 0.75);
        ctx.beginPath();
        // ctx.strokeStyle = colors[i];
        if(autoColor){
            ctx.strokeStyle = hexColor();
        }
        ctx.lineWidth = 3;
        coods.forEach((cood, index) => {
            if (index == 0) {
                ctx.moveTo(cood.x, cood.y);
            } else {
                ctx.lineTo(cood.x, cood.y);
            }
        })
        ctx.stroke();
    })
    ctx.restore();
}

/**
 *  根据单一数字序列放缩生成坐标 
 * @param {number[]} sequence 
 * @param {number} baseX 
 * @param {number} baseY 
 * @param {number} width 
 * @param {number} height 
 * @returns {{x,y}[]} 
 */
function scaleSequence(sequence, baseX, baseY, width, height) {
    if (!sequence)
        return;
    let xUnit = width / sequence.length,
        yMax = Math.max(...sequence),
        yScale = (height - 5) / yMax;
    let coods = sequence.map((value, index) => {
        let x = baseX + xUnit * index;
        let y = baseY - value * yScale;
        return new Coordinate(x, y);
    })

    return coods;
}

/**
 *  根据完整的坐标序列比例放缩坐标点 
 * @param {{x,y}[]} coods 
 * @param {number} width 
 * @param {number} height 
 * @returns {{x,y}[]} 
 */
function scaleCoods(coods, width, height) {
    if (!coods)
        return;
    let xMax = Math.max(...coods.map(c => c.x)),
        xScale = (width - 10) / xMax,
        yMax = Math.max(...coods.map(c => c.y)),
        yScale = (height - 10) / yMax;

    return coods.map(cood => {
        return {
            x: cood.x * xScale,
            y: cood.y * yScale
        }
    })
}

/**
 * 随机产生16进制RGB字符串
 * @returns {string} heximal color string
 */
function hexColor() {
    let r = new Number(Math.floor(Math.random() * 255)).toString(16);
    let g = new Number(Math.floor(Math.random() * 255)).toString(16);
    let b = new Number(Math.floor(Math.random() * 255)).toString(16);
    return '#' + r + g + b;
}