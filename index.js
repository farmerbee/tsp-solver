; (function () {
    // 交互环境
    const canvasDom = document.getElementById('map'),
        canvasHeader = document.getElementById('map-header'),
        mapDom = document.getElementById('map-type'),
        hdDom = document.getElementsByClassName('hd')[0],
        hdModuleDom = document.getElementsByClassName('hd-module')[0],
        numWrapDom = document.getElementsByClassName('number-wrap')[0],
        numDom = document.getElementsByClassName('node-number')[0],
        algoDom = document.getElementById('algorithm'),
        solveDom = document.getElementsByClassName('solve')[0],
        animateDom = document.getElementsByClassName('animate')[0],
        analyzeDom = document.getElementsByClassName('analyze')[0],
        testDom = document.getElementsByClassName('right-test')[0],
        rightDom = document.getElementsByClassName('right')[0],
        testSumitDom = document.getElementsByClassName('test-submit')[0],
        testTimeDom = document.getElementById('test-time'),
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
        testSumitDom.addEventListener('click', handleTest.bind(this));
    }

    function handleAnalyze() {
        rightDom.className = 'right';
        testDom.className = 'right-test active';
    }


    function handleTest() {
        hdModuleDom.className = 'hd-module active';
        clearCanvas();
        let result = [],
            coods = null,
            distances = null;
        const mapType = mapDom.value,
            algoType = algoDom.value,
            nodesNumber = numDom.value ? parseInt(numDom.value) : undefined,
            testTime = parseInt(testTimeDom.value);
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

        let testCounter = testTime,
            toId = null;
        //延迟执行，避免擦除画布时卡顿
        drawTest([], ctx, 50, chgt / 3 * 2, cwid - 100, chgt - 300, {
            xlabel: '近似最短路径',
            ylabel: '测试次数'
        }, 0)

        setTimeout(() => {
            test();
        }, 50);
        let baseLine = 0;
        function test() {
            const solver = resolveSolver(algoType, options);
            ctx.clearRect(0, 0, cwid, chgt);
            headerCtx.clearRect(0, 0, 1000, 1000);
            solver.solve();
            result.push(solver.ofvBest);
            baseLine = mapType == 'automap' ? Math.min(...result) : 699;
            drawTest(result, ctx, 50, chgt / 3 * 2, cwid - 100, chgt - 300, {
                xlabel: '近似最短路径',
                ylabel: '测试次数'
            }, baseLine)
            testCounter--;
            const testInfo = `已测试${testTime - testCounter}次，还剩${testCounter}次`;
            ctx.font = `20px Droid Sans Mono`;
            ctx.strokeText(testInfo, cwid / 4 * 1, chgt / 3 * 2.4);
            if (testCounter <= 0) {
                clearTimeout(toId);
                toId = null;
                hdModuleDom.className = 'hd-module';
                rightDom.className = 'right active';
                testDom.className = 'right-test';
                clearCanvas();
                drawTest(result, ctx, 50, chgt / 3 * 2, cwid - 100, chgt - 300, {
                    xlabel: '近似最短路径',
                    ylabel: '测试次数'
                }, baseLine);
                const max = Math.max(...result),
                    min = Math.min(...result),
                    avg = parseInt(result.reduce((pre, cur) => pre + cur) / result.length);
                const testInfo = `共测试${testTime}次，最大值为：${max}，最小值为：${min}，均值为:${avg}`;
                const aer = parseInt((avg - baseLine) / baseLine * 100);
                const errorRate = mapType == 'automap' ? '' : `公开最优值为${baseLine},平均错误率为${aer}%`;
                ctx.font = `20px Droid Sans Mono`;
                ctx.strokeText(testInfo, 0, chgt / 3 * 2.4);
                ctx.strokeText(errorRate, 0, chgt / 3 * 2.6);
            } else {
                toId = setTimeout(() => {
                    test();
                }, 50);
            }
        }
    }

    /**
     * 算法切换handler
     */
    function handleAlgoChange() {
        const type = algoDom.value;
        switch (type) {
            case 'anneal':
                gaParamDom.className = 'ga-param-wrap';
                annealParamDom.className = 'anneal-param-wrap active';
                boundOff();
                break;
            case 'ga':
                gaParamDom.className = 'ga-param-wrap active';
                annealParamDom.className = 'anneal-param-wrap';
                boundOff();
                break;
            case 'backbound':
                boundOn();
                break;
            default:
        }
    }

    function boundOn() {
        annealParamDom.className = 'anneal-param-wrap';
        gaParamDom.className = 'ga-param-wrap';
        numWrapDom.className = 'number-wrap active';
        mapDom.innerHTML = `
                    <option class="auto-option" value="automap" selected>自动生成</option>
                `
        numDom.innerHTML = `
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="14">14</option>
                `
    }

    function boundOff() {
        numWrapDom.className = 'number-wrap active';
        mapDom.innerHTML = `
                    <option class="auto-option" value="automap" >自动生成</option>
                    <option value="dantzig">dantzig42</option>
                `
        numDom.innerHTML = `
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
                <option value="100">100</option>
                `
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
        hdModuleDom.className = 'hd-module active';
        clearCanvas();
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
        hdModuleDom.className = 'hd-module active';
        clearCanvas();
        const mapType = mapDom.value,
            algoType = algoDom.value;
        const xlabel = algoType == 'ga' ? '进化次数' : (algoType == 'anneal' ? '温度（递减）' : '搜索次数');
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
        let itDuration = 0;
        const animator = resolveSolver(algoType, opt);
        setTimeout(() => {
            animate();
        }, 200);
        //根据不同算法，设置不同的渲染间隔
        switch (algoType) {
            case 'anneal':
                itDuration = 100;
                break;
            case 'ga':
                itDuration = 50;
                break;
            default:
                itDuration = 100;
        }
        let toId = null;
        function animate() {
            animator.step();
            ctx.save();
            clearCanvas();
            ctx.font = 'lighter 20px consolas';
            ctx.strokeText(`当前最短路径总长为${animator.ofvBest}`, cwid / 4, chgt - 20)
            drawNodes(animator.coods, ctx);
            algoType == 'backbound'
                ?
                drawPaths(animator.backSolution, animator.coods, ctx, true, false)
                :
                drawPaths(animator.solutionBest, animator.coods, ctx, true)
            drawOfvChart(animator.ofvTrace, headerCtx, 20, 70, 700, 70, chartInfo.xlabel)
            if (!animator.done) {
                toId = setTimeout(() => {
                    animate();
                }, itDuration);
            } else {
                clearCanvas();
                ctx.font = 'lighter 20px consolas';
                let optimalMessage = chartInfo.optimal ? `,公开最佳路径长度为${chartInfo.optimal}` : '',
                    counterInfo = algoType == 'backbound' ? `,共搜索${animator.counter}个节点` : '',
                    resultType = algoType == 'backbound' ? '' : '近似';
                ctx.strokeText(`${resultType}最短路径总长为${animator.ofvBest}${optimalMessage}${counterInfo}`, cwid / 4, chgt - 20)
                drawNodes(animator.coods, ctx);
                drawPaths(animator.solutionBest, animator.coods, ctx);
                drawOfvChart(animator.ofvTrace, headerCtx, 20, 70, 700, 70, chartInfo.xlabel)
                clearTimeout(toId);
                toId = null;
                hdModuleDom.className = 'hd-module';
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
        drawNodes(solver.coods, ctx);
        drawPaths(solver.solutionBest, solver.coods, ctx);
        // wait for initializing the original data
        setTimeout(() => {
            solver.solve();
            ctx.save();
            clearCanvas();
            ctx.font = 'lighter 20px consolas';
            let optimalMessage = optimal ? `,公开最佳路径长度为${optimal}` : '',
                counterInfo = algoType == 'backbound' ? `,共搜索${solver.counter}个节点` : '',
                resultType = algoType == 'backbound' ? '' : '近似';
            ctx.strokeText(`${resultType}最短路径总长为${solver.ofvBest} ${optimalMessage}${counterInfo}`, cwid / 4, chgt - 20);
            drawNodes(solver.coods, ctx);
            drawPaths(solver.solutionBest, solver.coods, ctx);
            ctx.restore();
            hdModuleDom.className = 'hd-module';
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
            case 'backbound':
                return new BackBound(opt);
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
        drawChart([sequence], ctx, baseX, baseY, width, height, axis, autoColor);
        ctx.strokeStyle = 'blue';
        ctx.clientWidth = 1;
        ctx.font = `${parseInt((width + height) / 55)}px sans-serif`;
        ctx.strokeText('路径长度', 0, baseY - height + 10);
        ctx.strokeText(xlabel, baseX + width / 3 * 2, baseY);
        ctx.restore();
    }

    /**
     * clear canvas
     */
    function clearCanvas() {
        ctx.clearRect(0, 0, cwid, chgt);
        headerCtx.clearRect(0, 0, canvasHeader.width, canvasHeader.height);
    }

})()
