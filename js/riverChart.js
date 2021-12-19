import Chart from "../js/chart.js";

const datevalue = ['snow', 'prcp'];
const datename = ['降雪量', '降水量'];
let currentDate;
let currentName;

d3.csv('../data/weather.csv').then(function(data){
    /* ----------------------------添加选项------------------------  */
    var sel = d3.select("body")
    .append("select")
    .attr("id", "select")
    .attr("size", 3)

    sel.append("optgroup")
        .attr("label", "数据类型")

    sel.append("option")
          .attr("value", datevalue[0])
          .attr("selected", "selected")
          .text(datename[0])
    
    for(let i = 1; i < datename.length; i++){
          sel.append("option")
          .attr("value", datevalue[i])
          .text(datename[i])
    }
    update();
    var myselect = document.getElementById("select")
    myselect.onchange = update;     

    function update(){
        var myselect = document.getElementById("select")
        var index = myselect.selectedIndex;
        currentDate = myselect.options[index].value;
        currentName = myselect.options[index].text;
        

        d3.select(".box")
        .remove()
        
        const mydata = [];
        let currentYear = 2017;
        let weatherDate = {};
        let weatherName = {};
        const buttonYears = [2017];
        const handledData = {};
        const count = {};
        const exist = {};
        const statename=[];
        let monthlytal = [];

        function find(str){
            for(let i=0;i<statename.length;i++){
                if(str==statename[i]) return false;
            }
            return true;
        }

        data.forEach(d => {
            const station = d.station;
            const state = d.state;
            const lat = d.latitude;
            const lon = d.longitude;
            const elev = d.elevation;
            const date = d['date'].split('/');
            weatherDate['tmin'] = Number(d.TMIN);
            weatherDate['tmax'] = Number(d.TMAX);
            weatherDate['tavg'] = Number(d.TAVG);
            weatherName['tavg'] = "平均温度（°F）";
            weatherDate['awnd'] = Number(d.AWND);
            weatherName['awnd'] = "日平均风速（英里/h）"
            weatherDate['wdf5'] = Number(d.WDF5);
            weatherDate['wsf5'] = Number(d.WSF5);
            weatherDate['snow'] = Number(d.SNOW);
            weatherName['snow'] = "降雪量（英寸）"
            weatherDate['snwd'] = Number(d.SNWD);
            weatherName['snwd'] = "积雪量（英寸）"
            const year = date[0];
            const month = Number(date[1]);
            weatherDate['prcp'] = Number(d.PRCP);
            weatherName['prcp'] = "降水量（英寸）"
    
            count[state] = count[state] || {value: 0};
            exist[station] = exist[station] || {value: false};
            if(find(d.state)) statename.push(d.state)
            if(!exist[station].value){
                count[state].value++;
            }
            exist[station].value = true;
    
    
            handledData[state] = handledData[state] || {};
            buttonYears.forEach(el => {
                handledData[state][el] = handledData[state][el] || { total: 0, monthly: [0,0,0,0,0,0,0,0,0,0,0,0] };
            });
            handledData[state][year].total += weatherDate[currentDate];
            handledData[state][year].monthly[month - 1] += weatherDate[currentDate];
        });
        
        for(let m = 0; m < 12; m++){
            let tal = 0;
            for(let i = 0; i < statename.length; i++){
                tal += handledData[statename[i]][currentYear].monthly[m];
            }
            monthlytal.push(tal);
        }
        //console.log(statename)

        for(let i=0;i<12;i++){
            mydata[i]=mydata[i]||{};
            mydata[i].date = i+1;
            for(let j=0;j<64;j++){
            mydata[i][statename[j]]=handledData[statename[j]][currentYear].monthly[i];
            }
        }

        //console.log(mydata)
        /* ----------------------------配置参数------------------------  */
        const chart = new Chart();
        const config = {
            margins: {top: 80, left: 80, bottom: 50, right: 80},
            textColor: 'black',
            gridColor: 'gray',
            title: currentName + '河流图',
            animateDuration: 1000
        }

        chart.margins(config.margins);

        /* ----------------------------尺度转换------------------------  */
        chart.scaleX = d3.scaleLinear()
                        .domain([mydata[0].date, mydata[11].date])
                        .range([0, chart.getBodyWidth()]);
        


        chart.scaleY = d3.scaleLinear()
                        .domain([0, (Math.floor(d3.max(monthlytal)/10) + 100)*10])
                        .range([chart.getBodyHeight(), 0])

        chart.stack = d3.stack()
                        .keys(statename)
                        .order(d3.stackOrderInsideOut)
                        .offset(d3.stackOffsetWiggle);

        /* ----------------------------渲染面------------------------  */
        chart.renderArea = function(){
            const areas = chart.body().insert('g',':first-child')
                            .attr('transform', 'translate(0, -' +  d3.max(mydata, (d) => (d3.mean(Object.values(d)))-100) + ')')   // 使流图的位置处于Y轴中部
                            .selectAll('.area')
                            .data(chart.stack(mydata));

                areas.enter()
                            .append('path')
                            .attr('class', (d) => 'area area-' + d.key)
                        .merge(areas)
                            .style('fill', (d,i) => chart._colors(i))
                            .transition().duration(config.animateDuration)
                            .attrTween('d', areaTween);

            //中间帧函数
            function areaTween(_d){
                if (!_d) return;
                const generateArea = d3.area()
                            .x((d) => d[0])
                            .y0((d) => d[1])
                            .y1((d) => d[2])
                            .curve(d3.curveCardinal.tension(0));

                const pointX = mydata.map((d) => chart.scaleX(new Date(d.date)));
                const pointY0 = _d.map((d) => chart.scaleY(d[0]));
                const pointY1 = _d.map((d) => chart.scaleY(d[1]));

                const interpolate = getAreaInterpolate(pointX, pointY0, pointY1);

                const ponits = [];

                return function(t){
                    ponits.push([interpolate.x(t), interpolate.y0(t), interpolate.y1(t)]);
                    return generateArea(ponits);
                }
            }

            //点插值
            function getAreaInterpolate(pointX, pointY0, pointY1){

                const domain = d3.range(0, 1, 1/(pointX.length-1));
                domain.push(1);

                const interpolateX = d3.scaleLinear()
                                        .domain(domain)
                                        .range(pointX);

                const interpolateY0 = d3.scaleLinear()
                                        .domain(domain)
                                        .range(pointY0);

                const interpolateY1 = d3.scaleLinear()
                                        .domain(domain)
                                        .range(pointY1);
                return {
                    x: interpolateX,
                    y0: interpolateY0,
                    y1: interpolateY1
                };

            }

        }

        /* ----------------------------渲染坐标轴------------------------  */
        chart.renderX = function(){
            chart.svg().insert('g','.body')
                    .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                    .attr('class', 'xAxis')
                    .call(d3.axisBottom(chart.scaleX));
        }

        chart.renderY = function(){
            chart.svg().insert('g','.body')
                    .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                    .attr('class', 'yAxis')
                    .call(d3.axisLeft(chart.scaleY));
        }

        chart.renderAxis = function(){
            chart.renderX();
            chart.renderY();
        }

        /* ----------------------------渲染文本标签------------------------  */
        chart.renderText = function(){
            d3.select('.xAxis').append('text')
                                .attr('class', 'axisText')
                                .attr('x', chart.getBodyWidth())
                                .attr('y', 0)
                                .attr('fill', config.textColor)
                                .attr('dy', 40)
                                .text('日期（月份）');

            d3.select('.yAxis').append('text')
                                .attr('class', 'axisText')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('fill', config.textColor)
                                .attr('transform', 'rotate(-90)')
                                .attr('dy', -40)
                                .attr('text-anchor','end')
                                .text(weatherName[currentDate]);
        }

        /* ----------------------------渲染网格线------------------------  */
        chart.renderGrid = function(){
            d3.selectAll('.xAxis .tick')
                .append('line')
                .attr('class','grid')
                .attr('stroke', config.gridColor)
                .attr('stroke-dasharray', '10,10')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', -chart.getBodyHeight());
        }

        /* ----------------------------渲染图标题------------------------  */
        chart.renderTitle = function(){
            chart.svg().append('text')
                    .classed('title', true)
                    .attr('x', chart.width()/2)
                    .attr('y', 0)
                    .attr('dy', '2em')
                    .text(config.title)
                    .attr('fill', config.textColor)
                    .attr('text-anchor', 'middle')
                    .attr('stroke', config.textColor);

        }

        /* ----------------------------绑定鼠标交互事件------------------------  */
        chart.addMouseOn = function(){
            //防抖函数
            function debounce(fn, time){
                let timeId = null;
                return function(){
                    const context = this;
                    const event = d3.event;
                    timeId && clearTimeout(timeId)
                    timeId = setTimeout(function(){
                        d3.event = event;
                        fn.apply(context, arguments);
                    }, time);
                }
            }

            d3.selectAll('.area')
                .on('mouseover', function(d){
                    const e = d3.event;
                    const position = d3.mouse(chart.svg().node());
                    e.target.style.cursor = 'hand'

                    d3.selectAll('.area')
                        .attr('fill-opacity', 0.3);

                    d3.select(e.target)
                        .attr('fill-opacity', 1);

                    chart.svg()
                        .append('text')
                        .classed('tip', true)
                        .attr('x', position[0]+5)
                        .attr('y', position[1])
                        .attr('fill', config.textColor)
                        .text(d.key);
                })
                .on('mouseleave', function(){
                    const e = d3.event;

                    d3.selectAll('.area')
                        .attr('fill-opacity', 1);

                    d3.select('.tip').remove();
                })
                .on('mousemove', debounce(function(){
                        const position = d3.mouse(chart.svg().node());
                        d3.select('.tip')
                        .attr('x', position[0]+5)
                        .attr('y', position[1]-5);
                    }, 6)
                );
        }

        chart.render = function(){

            chart.renderAxis();

            chart.renderText();

            chart.renderGrid();

            chart.renderTitle();

            chart.renderArea();

            chart.addMouseOn();
        }

        chart.renderChart();
    }
    


});














