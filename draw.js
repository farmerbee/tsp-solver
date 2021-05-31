
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
function drawPaths(sequence, coods, ctx, randColor = false, needClose = true) {
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
    if (needClose)
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
function drawChart(sequences, ctx, baseX, baseY, width, height, axisNeed = true, autoColor = false) {
    // todo: get colors from parameters
    ctx.save();
    // 坐标轴
    if (axisNeed) {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.moveTo(baseX, baseY);
        // axis x
        ctx.lineTo(baseX + width, baseY);
        ctx.lineTo(baseX + width - 5, baseY - 5);
        ctx.lineTo(baseX + width, baseY);
        ctx.lineTo(baseX + width - 5, baseY + 5);
        ctx.moveTo(baseX, baseY);
        // axis y
        ctx.lineTo(baseX, baseY - height);
        ctx.lineTo(baseX - 5, baseY - height + 5);
        ctx.lineTo(baseX, baseY - height);
        ctx.lineTo(baseX + 5, baseY - height + 5);
        ctx.stroke();

        // ctx.lineTo(baseX + width, baseY);
        // ctx.moveTo(baseX, baseY);
        // // axis y
        // ctx.lineTo(baseX, baseY - height);
        // ctx.stroke();
    }

    // 折线
    sequences.forEach((sequence, i) => {
        let coods = scaleSequence(sequence, baseX, baseY, width, height * 0.75);
        ctx.beginPath();
        // ctx.strokeStyle = colors[i];
        if (autoColor) {
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
 *  根据单一数字序列放缩生成坐标,主要为画序列图（折线，柱状图等）
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
    const seqLen = sequence.length;
    let xUnit = seqLen <= 5 ? width * 0.9 / 5 : width * 0.9 / seqLen,
        yMax = Math.max(...sequence),
        yScale = (height * 0.8) / yMax;
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
 *  画柱状图 
 * @param {*} sequence 
 * @param {*} ctx 
 * @param {*} baseX 
 * @param {*} baseY 
 * @param {*} width 
 * @param {*} height 
 */
function drawHistoGram(sequence, ctx, baseX, baseY, width, height, label) {
    const seqLen = sequence.length;
    let pace = 0;
    if (seqLen <= 5) {
        pace = width * 0.9 / 5;
    } else {
        pace = width * 0.9 / seqLen;
    }
    let seq = scaleSequence(sequence, baseX, baseY, width, height).map(cood => cood.y);
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.moveTo(baseX, baseY);
    // axis x
    ctx.lineTo(baseX + width, baseY);
    ctx.lineTo(baseX + width - 5, baseY - 5);
    ctx.lineTo(baseX + width, baseY);
    ctx.lineTo(baseX + width - 5, baseY + 5);
    ctx.moveTo(baseX, baseY);
    // axis y
    ctx.lineTo(baseX, baseY - height);
    ctx.lineTo(baseX - 5, baseY - height + 5);
    ctx.lineTo(baseX, baseY - height);
    ctx.lineTo(baseX + 5, baseY - height + 5);
    ctx.stroke();
    // x, y label
    if (label) {
        ctx.save();
        ctx.font = `${(height + width) / 55}px Droid Sans Mono`;
        ctx.strokeText(label.xlabel, baseX, baseY - height);
        ctx.strokeText(label.ylabel, baseX + width - 50, baseY + (height + width) / 55);
        ctx.restore();
    }
    seq.forEach((v, i) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(baseX + pace * i, baseY);
        ctx.fillStyle = hexColor();
        ctx.rect(baseX + pace * i, baseY, pace, -(baseY - v));
        ctx.fill();
        ctx.restore();
    })
}


/**
 *  decorator of @drawHistoGram
 *  可以画基准线 
 * @param {number} baseLine 用于对比的基准线高度/值
 */
function drawTest(sequence, ctx, baseX, baseY, width, height, label, baseLine) {
    // 和要画的序列里的值一起放缩
    const baseCood = scaleSequence([baseLine, ...sequence], baseX, baseY, width, height)[0];
    drawHistoGram(sequence, ctx, baseX, baseY, width, height, label);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(baseCood.x, baseCood.y);
    ctx.lineTo(baseX + width, baseCood.y);
    ctx.stroke();
    ctx.font = `${(width + height) / 60}px Droid Sans Mono`;
    ctx.strokeText('' + baseLine, baseX - (width + height) / 60 * 2, baseCood.y)
    ctx.restore();
}

/**
 * 随机产生16进制RGB字符串
 * @returns {string} heximal color string
 */
function hexColor() {
    // 合法的8位16进制数，至少是17
    let r = new Number(17 + Math.floor(Math.random() * (255 - 17))).toString(16);
    let g = new Number(17 + Math.floor(Math.random() * (255 - 17))).toString(16);
    let b = new Number(17 + Math.floor(Math.random() * (255 - 17))).toString(16);
    let value = r + g + b;
    return '#' + value;
}