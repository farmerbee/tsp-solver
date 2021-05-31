/**
 * 
 *  模拟退火算法，置换编码（序列变异）随机选择使用轮盘算法和逆转序列片段来选择新的边
 * @param {Coordinate[]} opt.coods  坐标节点序列,不提供时自动生成
 * @param {number[][]} opt.distances 节点距离关系二维矩阵 
 * @param {number} opt.nodesNumber 自动生成地图时节点的数目
 * @param {number} opt.temperature  最大温度
 * @param {number} opt.coolingRate 降温速率应小于1 
 * @param {number} opt.searchLimit 每个温度下的搜索次数 
 * @param {number} opt.coolTime 降温次数
 * 
 */
class Anneal {
    constructor(opt) {
        opt = opt || {};
        this.nodesNumber = opt.coods ? opt.coods.length : (opt.nodesNumber ? opt.nodesNumber : 50);
        this.coods = opt.coods || nodeGenerator(this.nodesNumber, 500, 500);
        this.distances = opt.distances || initMatrix(this.coods);
        this.temperature = opt.temperature || 10;
        this.coolingRate = opt.coolingRate || 0.99;
        this.searchLimit = opt.searchLimit || 1000;
        this.coolTime = opt.coolTime || 200;
        // 初始化序列随机生成
        this.solution = initEdge(this.nodesNumber);
        this.solutionBest = this.solution;
        this.ofv = accumDistance(this.distances, this.solution);
        this.ofvBest = this.ofv;
        // 初始化轮盘
        this.roulette = initProbs(this.distances);
        this.done = false;
        // 路径未更新次数
        this.notChange = 0;
        // 渲染用
        this.ofvTrace = [];
    }

    /**
     * 单步模拟求解过程，每次降温后暂停
     */
    step() {
        let searchCount = 0,
            changed = false;
        while (searchCount <= this.searchLimit) {
            let edgeNew = selectEdge(this.roulette),
                sourceIndex = edgeNew.sourceIndex,
                targetIndex = edgeNew.targetIndex;
            let sequenceNew = Math.random() > 0.5
                ?
                reverseArray(this.solution)
                :
                sink(sourceIndex, targetIndex, this.solution),
                ofvNew = accumDistance(this.distances, sequenceNew);
            if (checkAcceptability(this.ofv, ofvNew, this.temperature)) {
                this.solution = sequenceNew;
                this.ofv = ofvNew;
                this.ofvTrace.push(ofvNew);
                if (ofvNew < this.ofvBest) {
                    changed = true;
                    this.solutionBest = sequenceNew;
                    this.ofvBest = ofvNew;
                    // 为了动画演示效果，避免流程过快，如果发现更优序列，则结束此温度的搜索
                    // break;
                    // if (searchCount / this.searchLimit > 0.75)
                    //     break;
                }
                else {
                    this.notChange = this.notChange <= 0 ? 0 : this.notChange--;
                }
            }

            searchCount++;
        }

        //降温
        this.temperature *= this.coolingRate;
        if (!changed)
            this.notChange++;
        // 温度越低，越不容易跳出最优解
        // 为了演示效果，20次没更新路径则终止整个搜索
        if (this.notChange >= 20)
            this.done = true;
    }

    /**
     * 占用全部线程资源求解最优路径，此时线程阻塞
     */
    solve() {
        for (let i = 0; i < this.coolTime; i++) {
            let searchCount = 0;
            while (searchCount <= this.searchLimit) {
                // 根据轮盘选择的边用来sink node
                let edgeNew = selectEdge(this.roulette),
                    sourceIndex = edgeNew.sourceIndex,
                    targetIndex = edgeNew.targetIndex;
                // 随机生成新的序列，或者是片段反转的序列，或者是节点下沉的序列
                let sequenceNew = Math.random() > 0.5
                    ?
                    reverseArray(this.solution)
                    :
                    sink(sourceIndex, targetIndex, this.solution),
                    ofvNew = accumDistance(this.distances, sequenceNew);
                // 更新序列（方案）
                if (checkAcceptability(this.ofv, ofvNew, this.temperature)) {
                    this.solution = sequenceNew;
                    this.ofv = ofvNew;
                    if (ofvNew < this.ofvBest) {
                        this.solutionBest = sequenceNew;
                        this.ofvBest = ofvNew;
                    }
                }

                searchCount++;
            }

            //降温
            this.temperature *= this.coolingRate;
            // }
        }
    }
}

/**
 * 遗传算法，每一代选择最优染色体，然后在种群中根据轮盘选择种群数量减一的染色体进行交叉.
 * (因此，种群数量最好设为奇数）产生后代,生产完毕后，淘汰全部的非最优父辈染色体。
 * 后代染色体根据变异概率，随机变异或片段反转。
 * 迭代直到繁衍上限。
 * @param {number} opt.scale 种群数量，进化时保持衡量
 * @param {number} opt.crossProb 交叉（配）的概率
 * @param {number} opt.mutateProb 变异的概率
 * @param {number} opt.generationLimit 进化上限
 */
class Gene {
    constructor(opt) {
        opt = opt || {};
        this.nodesNumber = opt.coods ? opt.coods.length : (opt.nodesNumber ? opt.nodesNumber : 50);
        this.coods = opt.coods || nodeGenerator(this.nodesNumber, 500, 500);
        this.distances = opt.distances || initMatrix(this.coods);
        //todo: get from parameter
        this.scale = opt.scale || this.nodesNumber * 10 + 1;
        this.crossProb = opt.crossProb || 0.9;
        this.mutateProb = opt.mutateProb || 0.1;
        //todo: get from parameter
        this.generationLimit = opt.generationLimit || 1000;
        this.generation = 0;
        // 初始化种群
        this.group = this._initGroup();
        // 初始化最优路径和距离，这两个参数在种群中没有被使用
        this.solutionBest = initEdge(this.nodesNumber);
        this.ofvBest = accumDistance(this.distances, this.solutionBest);
        this.done = false;
        this.notChange = 0;
        this.ofvTrace = [];
    }

    /**
     * solve one time
     */
    solve() {
        while (this.generation < this.generationLimit) {
            this.step();
        }
    }

    /**
     * 每10代演示一次
     */
    step() {
        for (let i = 0; i < 10; i++) {
            // 构建轮盘时，种群最优已经检查更新
            let groupRoulette = this._groupRoulette(this.group),
                groupNew = [];

            //交叉
            for (let i = 0; i < this.scale - 1; i++) {
                let p1 = this._select(this.group, groupRoulette, 1)[0];
                if (gumbleRoulette(this.crossProb)) {
                    let p2 = this._select(this.group, groupRoulette, 1)[0];
                    groupNew.push(this._cross(p1, p2));
                }
                // 不能交叉时，直接复制给子代
                else {
                    groupNew.push(p1);
                }
            }

            // 变异,反转
            groupNew.forEach((chrom, index) => {
                if (gumbleRoulette(this.mutateProb)) {
                    this._mutate(chrom);
                }
                let chromRe = this._reverse(chrom);
                if (chromRe)
                    groupNew[index] = chromRe;
            })
            //子代和父代竞争
            groupRoulette = this._groupRoulette([...groupNew, ...this.group]);
            this.group = this._select([...this.group, ...groupNew], groupRoulette, this.scale);
            // this.group.push(initEdge(this.nodesNumber));

            this.generation++;
            if (this.generation == this.generationLimit)
                this.done = true;

        }
    }

    /**
     * 生产初始种群
     * @returns {number[][]} group 
     */
    _initGroup() {
        let group = [];
        for (let i = 0; i < this.scale; i++) {
            group.push(initEdge(this.nodesNumber));
        }

        return group;
    }


    /**
     *  根据种群中的染色体序列的适应度生成轮盘.
     *  同时，在遍历过程中更新最优值(最短距离，路径) 
     * @param {number[][]} group 
     * @returns {number[]} roulette 
     */
    _groupRoulette(group) {
        let changed = false;
        if (!group)
            return;
        let sum = 0,
            roulette = [];
        //计算适应度
        let fitnesses = group.map(chrom => {
            let distance = accumDistance(this.distances, chrom);
            // 更新最优值
            if (distance < this.ofvBest) {
                this.ofvBest = distance;
                this.solutionBest = chrom;
                this.ofvTrace.push(distance);
                changed = true;
            }
            let fitness = 1 / distance;
            sum += fitness;
            return fitness;
        })

        //计算累积概率
        fitnesses.reduce((accum, cur) => {
            // 适应概率
            let prob = cur / sum;
            roulette.push(accum + prob);
            return prob + accum;
        }, 0);

        if (changed) {
            this.notChange = 0;
        } else {
            this.notChange++;
            // 避免演示等待时间过长，连续N次种群没有变优时退出
            if (this.notChange >= this.nodesNumber * 5)
                this.done = true;
        }
        return roulette;
    }

    /**
     *  根据种群和轮盘，选择指定数量的染色体 
     * @param {number[][]} group 
     * @param {number[]} roulette 
     * @param {number} num 
     * @returns {number[][]} chroms 
     */
    _select(group, roulette, num) {
        let res = [];
        for (let i = 0; i < num; i++) {
            let rand = Math.random(),
                idx = 0;
            for (let i = 0; i < roulette.length; i++) {
                if (i === 0) {
                    if (rand < roulette[i])
                        break;
                } else {
                    if (rand > roulette[i - 1] && rand <= roulette[i]) {
                        idx = i;
                        break;
                    }
                }
            }
            res.push(group[idx]);
        }

        return res;
    }



    /**
     *  子路径交叉
     *  https://blog.csdn.net/hba646333407/article/details/103349279 
     * @param {number[]} f 
     * @param {number[]} m 
     * @returns {number[]} child 
     */
    _cross(f, m) {
        let father = [...f],
            mother = [...m];
        // 随机选择片段的起始位置
        let start = Math.floor(Math.random() * father.length),
            end = 1 + Math.floor(Math.random() * (father.length - 1));
        if (end >= start) {
            end++;
        } else {
            [start, end] = [end, start];
        }
        if (end >= father.length)
            end = father.length - 1;

        let segment = father.slice(start, end + 1),
            j = start;
        for (let i = 0; i < mother.length && j <= end; i++) {
            let mval = mother[i];
            if (segment.indexOf(mval) != -1) {
                father[j] = mval;
                mother[i] = segment[j - start];
                j++;
            }
        }

        // 返回最优后代
        return accumDistance(this.distances, father) < accumDistance(this.distances, mother)
            ? father : mother;
    }

    /**
     *  交换两个随机位置的值来让染色体变异，会改变原染色体 
     * @param {number[]} chrom 
     */
    _mutate(chrom) {
        let start = Math.floor(Math.random() * chrom.length),
            end = 1 + Math.floor(Math.random() * (chrom.length - 1));
        if (start == end)
            end += 1;

        if (end >= chrom.length)
            end = chrom.length - 1;
        [chrom[start], chrom[end]] = [chrom[end], chrom[start]];
    }

    /**
     *  反转染色体部分片段，如果新染色体变优，则返回反转后的染色体.
     *  否则，返回空（为避免频繁内存操作）
     * @param {number[]} chrom 
     * @returns {number[] | undefined } chrom || undefined 
     */
    _reverse(chrom) {
        let chromNew = reverseArray(chrom),
            distanceOri = accumDistance(this.distances, chrom),
            distanceNew = accumDistance(this.distances, chromNew);

        if (distanceOri > distanceNew) {
            return chromNew;
        } else {
            return undefined;
        }
    }
}

/**
 * 分支界定算法求解TSP问题：1.确定上下界 2.回溯。
 * 由于算法的复杂度阶乘式增长，所以只适合求解少量节点的问题。
 * 经测试，本次实验限制在10个节点
 */
class BackBound {
    constructor(opt) {
        opt = opt || {};
        this.nodesNumber = opt.coods ? opt.coods.length : (opt.nodesNumber ? opt.nodesNumber : 50);
        this.coods = opt.coods || nodeGenerator(this.nodesNumber, 500, 500);
        this.distances = opt.distances || initMatrix(this.coods);
        this.optimalDistance = this._initOptimalDistance(this.distances);
        this.root = new _Node(0, 0, null, new Array(this.nodesNumber - 1).fill(0).map((_, idx) => idx + 1), []);
        this.ofvBest = Infinity;
        //随机初始化序列，主要为渲染用
        this.solutionBest = initEdge(this.nodesNumber);
        //用来演示回溯节点的当前路径
        this.backSolution = this.solutionBest;
        // 统计节点搜索的数量
        this.counter = 0;
        this.stepIndex = 1;
        this.done = false;
        this.ofvTrace = [];
    }


    solve(node = this.root) {
        const childLen = node.children.length,
            children = node.children;
        for (let i = 0; i < childLen; i++) {
            this.counter++;
            const curIndex = children[i],
                curNodeValue = node.nodeValue + this.distances[node.index][curIndex],
                curParent = node,
                // 父节点中的兄弟节点即为该节点的孩子节点
                curChildren = [...children.slice(0, i), ...children.slice(i + 1)],
                prePath = node.path;
            // 如果当前节点的预估值已经大于了当前最优值，则回溯到兄弟或父节点
            if (curNodeValue + this.optimalDistance[curIndex] >= this.ofvBest) {
                this.backSolution = [...prePath, curIndex];
                continue;
            }
            // 如果该节点已经是叶节点，更新最优值，并回溯
            if (curChildren.length == 0) {
                const curSeq = [...prePath, curIndex, 0],
                    curDistance = curNodeValue + this.distances[curIndex][0];
                if (curDistance < this.ofvBest) {
                    this.solutionBest = curSeq;
                    this.ofvBest = curDistance;
                    this.ofvTrace.push(this.ofvBest);
                }
                continue;
            }
            const curNode = new _Node(curIndex, curNodeValue, curParent, curChildren, prePath);
            this.solve(curNode);
        }
    }

    /**
     *  除了第一个外，序列中的每个节点渲染一次 
     * @returns 
     */
    step() {
        if (this.stepIndex >= this.nodesNumber) {
            this.done = true;
            return;
        }
        this.counter++;
        const children = this.root.children,
            curIndex = children[this.stepIndex - 1],
            curNodeValue = this.distances[0][this.stepIndex],
            curParent = this.root,
            // 父节点中的兄弟节点即为该节点的孩子节点
            curChildren = [...children.slice(0, this.stepIndex - 1), ...children.slice(this.stepIndex)],
            prePath = [0, curIndex];

        const curNode = new _Node(curIndex, curNodeValue, curParent, curChildren, prePath);
        this.solve(curNode);
        this.stepIndex++;
    }

    /**
     *  最短边数组，用来预估边界。
     * 由于是用来预估边界，所以只含最短路径值
     * @param {number[][]} distances 
     */
    _initOptimalDistance(distances) {
        return distances.map((d) => {
            return Math.min(...d);
        })
    }


}

/**
 *  分支界定算法节点对象 
 * @param {number} index 节点在所在的索引值
 * @param {number} nodeValue 当前节点路径长度 
 * @param {_Node} parent 父节点 
 * @param {number[]} children  孩子节点序列
 * @param {number[]} path 当前路径 
 */
function _Node(index, nodeValue, parent, children, path) {
    this.index = index;
    this.nodeValue = nodeValue;
    this.parent = parent;
    this.children = children;
    this.path = [...path, index];
}

/**
 *  节点坐标对象 
 * @param {number} x x axis position
 * @param {number} y y axis position
 */
function Coordinate(x = 0, y = 0) {
    this.x = x;
    this.y = y;
}

function Prob(sourceIndex, targetIndex, prob) {
    this.sourceIndex = sourceIndex;
    this.targetIndex = targetIndex;
    this.prob = prob;
}


/**
 *  生成并返回包含节点坐标信息的数组 
 * @param {number} num 节点的数量
 * @param {number} width 绘画区域宽度
 * @param {nuber} height 绘画区域高度
 * @returns Coordinate[]
 */
function nodeGenerator(num, width, height) {
    const nodes = [];
    if (num > 0) {
        for (let i = 0; i < num; i++) {
            // let x = width * (Math.random()+Math.random()-Math.random()),
            // y = height * (Math.random()+Math.random()-Math.random());
            let x = width * Math.random(),
                y = height * Math.random();
            x = x < 10 ? x + 10 : x;
            y = y < 10 ? y + 10 : y;
            nodes.push(new Coordinate(x, y));
        }
    }
    return nodes;
}

/**
 * 根据所输入的节点的坐标，输出彼此间的距离信息矩阵 
 * @param {coordiante[]} nodes 
 * @returns 节点间距离信息矩阵，行/列值与其在nodes中的索引相同
 */
function initMatrix(nodes) {
    if (!nodes)
        return;
    const len = nodes.length,
        matrix = new Array(len).fill(0).map(() => new Array(len));
    // console.log(matrix);
    for (let i = 0; i < len; i++) {
        // 对角线值设为极大值，下三角的值取对应上三角的值
        for (let j = 0; j < len; j++) {
            if (i == j) {
                matrix[i][j] = Infinity;
            } else if (i > j) {
                matrix[i][j] = matrix[j][i];
            } else {
                matrix[i][j] = parseInt(calDistance(nodes[i], nodes[j]));
            }
        }
    }

    return matrix;
}


/**
 * 计算两个节点间的距离
 * @param {coordinate} n1 node1
 * @param {coordinate} n2 node2
 * @returns distance: number
 */
function calDistance(n1, n2) {
    return Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
}

/**
 *  根据全部节点信息，初始化节点累积概率数组 
 * @param {*} matrix 
 * @returns 
 */
function initProbs(matrix) {
    if (!matrix)
        return;
    const len = matrix.length,
        probs = [];
    let sum = 0;
    // 只取下三角的值
    for (let i = 1; i < len; i++) {
        for (let j = 0; j < i; j++) {
            sum += 1 / matrix[i][j];
        }
    }
    for (let i = 1; i < len; i++) {
        for (let j = 0; j < i; j++) {
            const prob = (1 / matrix[i][j]) / sum;
            probs.push(new Prob(i, j, prob));
        }
    }

    probs.reduce((pre, cur) => {
        let accum = pre + cur.prob;
        cur.prob = accum;
        return accum;
    }, 0)
    return probs;
}

/**
 *  根据轮盘算法，从累积概率数组中选择边 
 * @param {*} probs 
 */
function selectEdge(probs) {
    if (!probs)
        return;
    const nextPostion = Math.random();
    for (let i = 0; i < probs.length; i++) {
        if (i === 0) {
            if (nextPostion < probs[i].prob) {
                return 0;
            } else {
                continue;
            }
        }
        if (nextPostion > probs[i - 1].prob && nextPostion < probs[i].prob) {
            return probs[i];
        }
    }

    return new Prob(0, 1);
}


/**
 *  生成指定数量的随机索引序列 
 * @param {number} nodeNumber 
 * @returns 
 */
function initEdge(nodeNumber) {
    let res = new Array(nodeNumber).fill(0);
    res = res.map((_, index) => index);
    res = shuffleArray(res);
    return res;
}


/**
 *  shuffle数组，会改变原数组结构 
 * @param {*} array 
 * @param {*} size 
 * @returns 
 */
function shuffleArray(array, size) {
    let index = -1,
        length = array.length,
        lastIndex = length - 1;

    size = size === undefined ? length : size;
    while (++index < size) {
        var rand = index + Math.floor(Math.random() * (lastIndex - index + 1))
        value = array[rand];

        array[rand] = array[index];

        array[index] = value;
    }
    array.length = size;
    return array;
}

/**
 *  根据索引序列计算总距离 
 * @param {number[][]} matrix 
 * @param {number[]} sequence 
 */
function accumDistance(matrix, sequence) {
    if (!sequence)
        return;
    let accum = 0;
    sequence.reduce((preIndex, curIndex) => {
        accum += matrix[preIndex][curIndex];
        return curIndex;
    }, sequence[sequence.length - 1])

    return accum;
}



/**
 *  检查是否接受新的序列，以ofv即路径总长度为基准 
 * @param {number} ofv 
 * @param {number} ofvNew 
 * @param {number} temperature 
 * @returns 
 */
function checkAcceptability(ofv, ofvNew, temperature) {
    if (ofvNew < ofv) {
        return true;
    }
    const delta = ofv - ofvNew;
    if (Math.random() < Math.exp(delta / temperature)) {
        return true;
    }
    return false;
}


/**
 *  将target节点下沉到source节点后面，即将其插入到序列中target后面 
 * @param {number} source the index of the source node in matrix
 * @param {number} target the index of the target node in matrix
 * @param {number[]} sequence the sequence to be check 
 * @returns number[]
 */
function sink(source, target, sequence) {
    if (!sequence)
        return;
    // sink
    let res = [];
    sequence.forEach(num => {
        if (num != target) {
            res.push(num);
            if (num == source) {
                res.push(target);
            }
        }
    })

    return res;
}

/**
 *  随机选取两个点，反转两点间序列（包括这两点），不改变原数组 
 * @param {number[]} arr 
 * @returns number[]
 */
function reverseArray(arr) {
    let res = [];
    let start = Math.floor(Math.random() * arr.length),
        end = 1 + Math.floor(Math.random() * (arr.length - 1));
    if (end >= start) {
        end++;
    } else {
        [start, end] = [end, start];
    }

    res = [...arr.slice(0, start), ...arr.slice(start, end + 1).reverse(), ...arr.slice(end + 1)]
    return res;
}

/**
 *  根据轮盘，随机决定是否被选中。概率越大，越容易被选中（真随机的话） 
 * @param {number} prob  轮赌的概率，应该小于1 
 * @returns {boolean} selected 是否被选中 
 */
function gumbleRoulette(prob) {
    let rand = Math.random();
    if (rand <= 1 - prob)
        return false;
    return true;
}

