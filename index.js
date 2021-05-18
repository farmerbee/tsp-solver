const chartDom = document.getElementsByClassName('box')[0];
const myChart = echarts.init(chartDom);
let option;

const sourceData = graphGenerator(5, 10),
    data = sourceData.data,
    links = sourceData.links;

option = {
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
myChart.on('click', function(e){
    console.log(e.data);
})

//  rerender
setTimeout(() => {
    // option.title.text = 'change'
    for(let i=0; i< 5; i++){
        links[i].lineStyle.width = '5'
    }
    myChart.setOption(option);
}, 10000);
