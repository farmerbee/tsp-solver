/**
 * 
 * @param  x 节点x坐标
 * @param  y 节点y坐标
 * @param  r 节点在二阶矩阵中的行
 * @param  c 节点在二阶矩阵中的列
 * @return adjacency 存储相邻节点的矩阵索引和相对距离
 */
function Axis(name, x = 0, y = 0, r = 0, c = 0) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.adjacency = [];
    this.index = new MatrixIndex(r, c);
}

function MatrixIndex(row = 0, column = 0) {
    this.row = row;
    this.column = column;
}

function AdInfo(index, distance) {
    this.index = index;
    this.distance = distance;
}

function Link(source, target, distance) {
    this.source = source;
    this.target = target;
    this.label = {
        show: true,
        formatter: distance.toString(),
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000'
    };
    this.lineStyle = {
        width: 1,
        curveness: 0,
        color: '#9248b9'
    }
}
/**
 * 
 * @param  vectorLength 生成向量元素数量
 * @param  limitation 向量元素总和上限 
 * @returns 指定长度的向量，所有元素总和不超过指定上限  
 */
function vectorGenerator(vectorLength, limitation) {
    const result = new Array(vectorLength).fill(0);
    // the limitation of every node's coordinate
    const min = parseInt(limitation / vectorLength) - 50,
        max = parseInt(limitation / vectorLength) + 20;
    //生成相对位置
    for (let i = 0; i < vectorLength; i++) {
        result[i] = parseInt(min + (max - min) * Math.random());
    }

    //生成同一个轴的绝对位置
    result.reduce((pre, cur, index) => {
        result[index] = cur + pre;
        return cur + pre;
    }, 0)
    return result;
}


/**
 * 
 * @param  rowNum 矩阵的行数
 * @param  colNum 矩阵的列数
 * @returns {}.data  无向图邻接表
 * @returns {}.links 渲染用的节点-边映射表 
 */
function graphGenerator(rowNum, colNum) {
    const result = [],
        links = [],
        city = cities.split(',');

    // 生成x坐标
    for (let i = 0; i < rowNum; i++) {
        const row = [];
        const xs = vectorGenerator(colNum, 1000);
        xs.forEach((x, index) => {
            row.push(new Axis(city.pop(), x, 0, r = i, c = index));
        })

        result.push(row);
    }

    // 生成y坐标
    for (let i = 0; i < colNum; i++) {
        const ys = vectorGenerator(rowNum, 600);
        result.forEach((row, index) => {
            row[i].y = ys[index];
        })
    }

    // 向下、右、右下搜索确立连接关系
    for (let i = 0; i < rowNum; i++) {
        for (let j = 0; j < colNum; j++) {
            const ads = [result[i][j + 1], result[i + 1] ? result[i + 1][j] : null, (result[i + 1] ? result[i + 1][j + 1] : null)],
                curNode = result[i][j];
            ads.forEach(ad => {
                if (ad) {
                    // if (Math.random() > 0.5) {
                    const curIndex = getFlatIndex(curNode, colNum),
                        adIndex = getFlatIndex(ad, colNum);
                    let distance = parseInt(Math.sqrt((curNode.x - ad.x) ** 2 + (curNode.y - ad.y) ** 2));
                    curNode.adjacency.push(new AdInfo(adIndex, distance));
                    ad.adjacency.push(new AdInfo(curIndex, distance));
                    links.push(new Link(curIndex, adIndex, distance));
                    // }
                }
            })
        }
    }

    return {
        data: result.flat(1),
        links: links
    };
}

function getFlatIndex(node, colLength) {
    return node.index.row * colLength + node.index.column;
}

