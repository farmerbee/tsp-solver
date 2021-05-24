; (function () {
    const sourceData = graphGenerator(5, 10),
        data = sourceData.data,
        links = sourceData.links,
        cities = data.map(info => {
            return info.name;
        });

    const startDom = document.getElementById('start-city'),
        midDom = document.getElementById('mid-city'),
        endDom = document.getElementById('end-city');

    init();

    function init() {
        bindEvent();
    }

    function bindEvent() {
        window.addEventListener('load', renderMap(data, links));
        window.addEventListener('load', renderOption(cities));
        startDom.addEventListener('change', selectHandle.bind(this));
        endDom.addEventListener('change', selectHandle.bind(this));
        midDom.addEventListener('change', selectHandle.bind(this));
    }

    //todo: 重新渲染选项
    function initCity(cities, wrapDom, cityBan, citySelcted) {
        wrapDom.innerHTML = `
        <option value="" disabled selected></option>
        `;
        const frags = document.createDocumentFragment();
        cities.forEach(city => {
            const optionDom = document.createElement('option');
            optionDom.innerHTML = `${city}`;
            if (cityBan == city) {
                optionDom.disabled = true;
            }
            if (citySelcted == city) {
                optionDom.selected = true;
            }
            frags.appendChild(optionDom);
        })

        wrapDom.appendChild(frags);
    }

    function renderOption(cities, cityBan) {
        const selectDoms = document.getElementsByClassName('select-button');
        Array.prototype.forEach.call(selectDoms, dom => {
            initCity(cities, dom, cityBan);
        })
    }

    /**
     *  任意边选中一座城市时，禁用另一边同样的城市 
     *  在下方显示选中的城市
     *  
     */
    function selectHandle(e) {
        const sourceId = e.target.id === 'start-city' ? 'start-city' : 'end-city',
            // targetDom = document.getElementById(targetId),
            targeIds = filterCity(sourceId),
            cityBan = e.target.value;

        //todo
        targeIds.forEach(id => {
            const targetDom = document.getElementById(id);
            initCity(cities, targetDom, cityBan, targetDom.value);
        })
        // initCity(cities, targetDom, cityBan, targetDom.value);
    }


    /**
     *  筛选需要禁用选项卡的名字 
     * @param {string} domName 选项卡节点名字
     * @returns 需要禁用的DOM节点的名字
     */
    function filterCity(domName) {
        const nameBuf = ['start-city', 'mid-city', 'end-city'];
        return nameBuf.filter(name => {
            return name != domName;
        })
    }

    /**
     * 
     * @param  data 原始数据信息，符合echarts data的数组
     * @param  links 节点关系数据
     */
    function renderMap(data, links) {
        const chartDom = document.getElementsByClassName('box')[0];
        const myChart = echarts.init(chartDom);
        const option = {
            title: {
                text: '物流示意地图',
                left: 'center',
                top: '10'
            },
            tooltip: {},
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [
                {
                    type: 'graph',
                    layout: 'none',
                    // the size of node
                    symbolSize: 10,
                    roam: true,
                    label: {
                        show: true
                    },
                    edgeSymbolSize: [4, 10],
                    edgeLabel: {
                        fontSize: 20
                    },
                    data: data,
                    links: links
                }
            ]
        };

        myChart.setOption(option);
        myChart.on('click', function (e) {
            console.log(e.data);
        })

    }
})()
