; (function () {
    // 交互环境
    const canvasDom = document.getElementById('map'),
        canvasHeader = document.getElementById('map-header'),
        mapDom = document.getElementById('map-type'),
        numWrapDom = document.getElementsByClassName('number-wrap')[0],
        numDom = document.getElementsByClassName('node-number')[0],
        algoDom = document.getElementById('algorithm'),
        solveDom = document.getElementsByClassName('solve')[0],
        animateDom = document.getElementsByClassName('animate')[0],
        analyzeDom = document.getElementsByClassName('analyze')[0],
        annealParamDom = document.getElementsByClassName('anneal-param-wrap')[0],
        gaParamDom = document.getElementsByClassName('ga-param-wrap')[0],
        annealTempDom = document.getElementById('anneal-temperature'),
        annealTimeDom = document.getElementById('aneal-times'),
        gaScaleDom = document.getElementById('ga-scale'),
        gaGenerationDom = document.getElementById('ga-generation');
    //画图环境
    const ctx = canvasDom.getContext('2d'),
        headerCtx = canvasHeader.getContext('2d'),
        cwid = canvasDom.width,
        chgt = canvasDom.height;

    init();
    function init() {
        bindEvent();
    }

    function bindEvent() {
        mapDom.addEventListener('change', handleType.bind(this));
        solveDom.addEventListener('click', handleSolve.bind(this));
        animateDom.addEventListener('click', handleAnimate.bind(this));
        analyzeDom.addEventListener('click', handleAnalyze.bind(this));
        algoDom.addEventListener('change', handleAlgoChange.bind(this));
    }


    function handleAnalyze() {
        let result = [],
            solver = null,
            coods = null,
            distances = null;
        const mapType = mapDom.value,
            algoType = algoDom.value,
            nodesNumber = numDom.value ? parseInt(numDom.value) : undefined;
        // 每次迭代都使用相同的地图信息
        switch (mapType) {
            case 'automap':
                coods = nodeGenerator(nodesNumber, 500, 500);
                distances = initMatrix(coods);
                break;
            case 'dantzig':
                coods = generateCoordinates(dantzig42Coods, 42);
                coods = scaleCoods(coods, canvasDom.clientWidth, canvasDom.height);
                distances = generateData_2(dantzig42Data, 42);
                break;
            default:
        }
        const options = {
            coods: coods,
            distances: distances,
            nodesNumber: nodesNumber,
            temperature: parseInt(annealTempDom.value),
            coolTime: parseInt(annealTimeDom.value),
            scale: parseInt(gaScaleDom.value) * parseInt(numDom.value),
            generationLimit: parseInt(gaGenerationDom.value)
        }

        let testCounter = 10,
            toId = null;
        test();
        function test() {

            const solver = resolveSolver(algoType, options);
            ctx.clearRect(0, 0, cwid, chgt);
            headerCtx.clearRect(0, 0, 1000, 1000);
            solver.solve();
            result.push(solver.ofvBest);
            drawOfvChart(result, ctx, 10, cwid - 50, cwid - 100, chgt - 300, '测试次数', true, true);
            testCounter--;
            if (testCounter <= 0) {
                clearTimeout(toId);
                toId = null;
                drawOfvChart(result, ctx, 10, cwid - 50, cwid - 100, chgt - 300, '测试次数');
                console.log('done')
            } else {
                toId = setTimeout(() => {
                    test();
                }, 50);
            }
        }
        // for (let i = 0; i < 10; i++) {
        //     const solver = resolveSolver(algoType, options);
        //     ctx.clearRect(0, 0, cwid, chgt);
        //     headerCtx.clearRect(0, 0, 1000, 1000);
        //     solver.solve();
        //     result.push(solver.ofvBest);
        //     drawOfvChart(result, ctx, 10, cwid - 50, cwid - 100, chgt - 300, '测试次数');
        // }
    }


    function handleAlgoChange() {
        const type = algoDom.value;
        switch (type) {
            case 'anneal':
                gaParamDom.className = 'ga-param-wrap';
                annealParamDom.className = 'anneal-param-wrap active';
                break;
            case 'ga':
                gaParamDom.className = 'ga-param-wrap active';
                annealParamDom.className = 'anneal-param-wrap';
                break;
            default:
        }
    }


    /**
     *  handle map type changing event 
     * @param {*} e 
     */
    function handleType(e) {
        if (e.target.value == 'automap') {
            numWrapDom.className = 'number-wrap active';
        } else {
            numWrapDom.className = 'number-wrap';
        }
    }

    function handleSolve() {
        ctx.clearRect(0, 0, 1000, 1000);
        headerCtx.clearRect(0, 0, 1000, 1000);
        const mapType = mapDom.value,
            algoType = algoDom.value;
        switch (mapType) {
            case 'automap':
                solve(algoType, {
                    nodesNumber: parseInt(numDom.value),
                    temperature: parseInt(annealTempDom.value),
                    coolTime: parseInt(annealTimeDom.value),
                    scale: parseInt(gaScaleDom.value) * parseInt(numDom.value),
                    generationLimit: parseInt(gaGenerationDom.value)
                });
                break;
            case 'dantzig':
                let data = generateCoordinates(dantzig42Coods, 42);
                data = scaleCoods(data, canvasDom.clientWidth, canvasDom.height);
                let m = generateData_2(dantzig42Data, 42);
                solve(algoType, {
                    coods: data,
                    distances: m,
                    temperature: parseInt(annealTempDom.value),
                    coolTime: parseInt(annealTimeDom.value),
                    scale: parseInt(gaScaleDom.value) * 42,
                    generationLimit: parseInt(gaGenerationDom.value)
                }, 699);
                break;
            default:
        }
    }

    function handleAnimate() {
        ctx.clearRect(0, 0, 1000, 1000);
        headerCtx.clearRect(0, 0, 1000, 1000);
        const mapType = mapDom.value,
            algoType = algoDom.value;
        const xlabel = algoType == 'ga' ? '进化次数' : '温度';
        switch (mapType) {
            case 'automap':
                animate(algoType, {
                    nodesNumber: parseInt(numDom.value),
                    temperature: parseInt(annealTempDom.value),
                    coolTime: parseInt(annealTimeDom.value),
                    scale: parseInt(gaScaleDom.value) * parseInt(numDom.value),
                    generationLimit: parseInt(gaGenerationDom.value)
                }, {
                    xlabel: xlabel
                });
                break;
            case 'dantzig':
                let data = generateCoordinates(dantzig42Coods, 42);
                data = scaleCoods(data, canvasDom.clientWidth, canvasDom.height);
                let m = generateData_2(dantzig42Data, 42);
                animate(algoType, {
                    coods: data,
                    distances: m,
                    temperature: parseInt(annealTempDom.value),
                    coolTime: parseInt(annealTimeDom.value),
                    scale: parseInt(gaScaleDom.value) * 42,
                    generationLimit: parseInt(gaGenerationDom.value)

                }, {
                    optimal: 699,
                    xlabel: xlabel
                });
                break;
            default:
        }
    }


    /**
     *  根据算法类型模拟演示算法当前最优路径 
     * @param {string} algoType type of algorithm
     * @param {{x,y}[]} opt.coods
     * @param {number[]} opt.distances
     * @param {number} chartInfo.optimal 公开数据集的最佳路径长度
     * @param {string} chartInfo.xlabel 折线图x坐标显示名 
     */
    function animate(algoType, opt, chartInfo) {
        const animator = resolveSolver(algoType, opt);
        setTimeout(() => {
            animate();
        }, 200);
        let toId = null;
        function animate() {
            animator.step();
            ctx.save();
            ctx.clearRect(0, 0, 1000, 1000);
            ctx.font = 'lighter 20px consolas';
            ctx.strokeText(`当前最短路径总长为${animator.ofvBest}`, cwid / 4, chgt - 20)
            drawNodes(animator.coods, ctx);
            drawPaths(animator.solutionBest, animator.coods, ctx, true);
            drawOfvChart(animator.ofvTrace, headerCtx, 20, 70, 700, 70, chartInfo.xlabel)
            if (!animator.done) {
                toId = setTimeout(() => {
                    animate();
                }, 50);
            } else {
                ctx.clearRect(0, 0, 1000, 1000);
                ctx.font = 'lighter 20px consolas';
                let optimalMessage = chartInfo.optimal ? `,公开最佳路径长度为${chartInfo.optimal}` : '';
                ctx.strokeText(`近似最短路径总长为${animator.ofvBest}${optimalMessage}`, cwid / 4, chgt - 20)
                drawNodes(animator.coods, ctx);
                drawPaths(animator.solutionBest, animator.coods, ctx);
                clearTimeout(toId);
                toId = null;
            }
            ctx.restore();
        }

    }

    /**
     * 占全全部线程求解最优路径  
     * @param {*} algoType 
     * @param {{x,y}[]} opt.coods 
     * @param {number[][]} opt.distances
     * @param {number} optimal 公开数据集的最佳路径长度
     */
    function solve(algoType, opt, optimal) {
        const solver = resolveSolver(algoType, opt);

        ctx.clearRect(0, 0, 1000, 1000);
        drawNodes(solver.coods, ctx);
        drawPaths(solver.solutionBest, solver.coods, ctx);
        // wait for initializing the original data
        setTimeout(() => {
            solver.solve();
            ctx.save();
            ctx.clearRect(0, 0, 1000, 1000);
            ctx.font = 'lighter 20px consolas';
            let optimalMessage = optimal ? `,公开最佳路径长度为${optimal}` : '';
            ctx.strokeText(`近似最短路径总长为${solver.ofvBest} ${optimalMessage}`, cwid / 4, chgt - 20);
            drawNodes(solver.coods, ctx);
            drawPaths(solver.solutionBest, solver.coods, ctx);
            ctx.restore();
        }, 500);
    }


    /**
     *  根据算法名，生成相应的对象 
     * @param {string} algoType 
     * @param {{}} opt options to initialize 
     * @returns {{}} solver object 
     */
    function resolveSolver(algoType, opt) {
        switch (algoType) {
            case 'anneal':
                return new Anneal(opt);
                break;
            case 'ga':
                return new Gene(opt);
                break;
            default:
        }
    }


    /**
     * draw the chart over the map 
     * @param {*} sequence 
     * @param {*} ctx 
     * @param {*} baseX 
     * @param {*} baseY 
     * @param {*} width 
     * @param {*} height 
     * @param {*} xlabel 
     */
    function drawOfvChart(sequence, ctx, baseX, baseY, width, height, xlabel, axis, autoColor) {
        ctx.save();
        ctx.clearRect(0, 0, 1000, 1000);
        drawChart([sequence], ctx, baseX, baseY, width, height, axis, autoColor);
        ctx.strokeStyle = 'blue';
        ctx.clientWidth = 1;
        ctx.font = `${parseInt((width + height) / 55)}px sans-serif`;
        ctx.strokeText('路径长度', 0, baseY - height + 10);
        ctx.strokeText(xlabel, baseX + width / 4 * 3, baseY);
        ctx.restore();
    }

})()
