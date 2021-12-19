import Chart from "../js/chart.js";
let currentYear = 2017;
let currentState = 'AB';
let currentMonth = 1;
const buttonYears = [2017];

const handledData = {};
const count = {};
const exist = {};
const statename=[];
const statemonth = [];
const stateday = [];
const mydata = [];

function find(str){
    for(let i=0;i<statename.length;i++){
        if(str===statename[i]) return false;
    }
    return true;
}

function find2(st, mo){
    for(let i=0;i<statemonth[st].length;i++){
        if(mo===statemonth[st][i]) return false;
    }
    return true;
}

function find3(st, mo, da){
    for(let i=0;i<stateday[st][mo].length;i++){
        if(da===stateday[st][mo][i]) return false;
    }
    return true;
}

d3.csv('../data/weather.csv').then(function(data){
    data.forEach(d => {
        const station = d.station;
        const state = d.state;
        const lat = d.latitude;
        const lon = d.longitude;
        const elev = d.elevation;
        const date = d['date'].split('/');
        const tmin = Number(d.TMIN);
        const tmax = Number(d.TMAX);
        const tavg = Number(d.TAVG);
        const awnd = Number(d.AWND);
        const wdf5 = Number(d.WDF5);
        const wsf5 = Number(d.WSF5);
        const snow = Number(d.SNOW);
        const snwd = Number(d.SNWD);
        const year = date[0];
        const month = Number(date[1]);
        const day = Number(date[2]);
        const prcp = Number(d.PRCP);
    
        count[state] = count[state] || {};
        count[state][month] = count[state][month] || {};
        count[state][month][day] = count[state][month][day] || {value: 0};
        exist[station] = exist[station] || {};
        exist[station][month] = exist[station][month] || {};
        exist[station][month][day] = exist[station][month][day] || {value: false};
        handledData[state] = handledData[state] || {};
        handledData[state][month] = handledData[state][month] || {};
        handledData[state][month][day] = handledData[state][month][day] || {total: 0};

        statemonth[state] = statemonth[state] || [];
        stateday[state] = stateday[state] || [];
        stateday[state][month] = stateday[state][month] || [];

        if(find(d.state)) statename.push(d.state)
        if(find2(d.state, month)) statemonth[state].push(month)
        if(find3(d.state, month, day)) stateday[state][month].push(day)
    
        if(!exist[station][month][day].value){
          count[state][month][day].value++;
        }
        exist[station][month][day].value = true;
        
        handledData[state][month][day].total += tavg; 
      });
      for(let i = 0; i < statename.length; i++){
          for(let m = 0; m < statemonth[statename[i]].length; m++){
              for(let d = 0; d < stateday[statename[i]][statemonth[statename[i]][m]].length; d++){
                  let hd = handledData[statename[i]][statemonth[statename[i]][m]][stateday[statename[i]][statemonth[statename[i]][m]][d]].total;
                  let ct = count[statename[i]][statemonth[statename[i]][m]][stateday[statename[i]][statemonth[statename[i]][m]][d]].value;
                  handledData[statename[i]][statemonth[statename[i]][m]][stateday[statename[i]][statemonth[statename[i]][m]][d]].total = hd / ct;
              }
          }
      }
    function update(){
        var myselect = document.getElementById("select")
        var index = myselect.selectedIndex;
        currentState =  myselect.options[index].value;
        console.log(currentState)

        statemonth[currentState].sort(function(a, b){
            return a - b;
        });

        stateday[currentState][currentMonth].sort(function(a, b){
            return a - b;
        });
        for(let i = 0; i < stateday[currentState][currentMonth].length; i++){
            mydata[i] = mydata[i] || {};
            mydata[i].date = stateday[currentState][currentMonth][i];
            mydata[i].tavge = handledData[currentState][currentMonth][stateday[currentState][currentMonth][i]].total;
        }

        d3.select("#select2")
        .remove()
        
        d3.select(".box")
        .remove()

        var sel2 = d3.select("body")
        .append("select")
        .attr("id", "select2")
        .attr("size", 6)

        sel2.append("optgroup")
            .attr("label", "月份")

        sel2.append("option")
            .attr("value", statemonth[currentState][0])
            .attr("selected", "selected")
            .text(statemonth[currentState][0])
        
        for(let i = 1; i < statemonth[currentState].length; i++){
            sel2.append("option")
            .attr("value", statemonth[currentState][i])
            .text(statemonth[currentState][i])
        }
        update2()
        var myselect2 = document.getElementById("select2")
        myselect2.onchange = update2;  
        function update2(){
            var myselect2 = document.getElementById("select2")
            var index = myselect2.selectedIndex;
            currentMonth =  myselect2.options[index].value;
            console.log(currentMonth)

            stateday[currentState][currentMonth].sort(function(a, b){
                return a - b;
            });
            
            for(let i = 0; i < stateday[currentState][currentMonth].length; i++){
                mydata[i] = mydata[i] || {};
                mydata[i].date = stateday[currentState][currentMonth][i];
                mydata[i].tavge = handledData[currentState][currentMonth][stateday[currentState][currentMonth][i]].total;
            }
            
            d3.select(".box")
                .remove()
            /* ----------------------------配置参数------------------------  */
            const chart = new Chart();
            const config = {
                lineColor: chart._colors(0),
                margins: {top: 80, left: 80, bottom: 50, right: 80},
                textColor: 'black',
                gridColor: 'gray',
                ShowGridX: [],
                ShowGridY: [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                title: currentState + ' - 温度折线图',
                pointSize: 5,
                pointColor: 'white',
                hoverColor: 'red',
                animateDuration: 1000
            }

            chart.margins(config.margins);
            console.log(mydata)

            

            /* ----------------------------尺度转换------------------------  */
            chart.scaleX = d3.scaleBand()
                            .domain(mydata.map((d) => d.date))
                            .range([0, chart.getBodyWidth()])
            
            chart.scaleY = d3.scaleLinear()
                            .domain([(Math.floor(d3.min(mydata, (d) => d.tavge)/10) - 1)*10, (Math.floor(d3.max(mydata, (d) => d.tavge)/10) + 1)*10])
                            .range([chart.getBodyHeight(), 0])
            
            /* ----------------------------渲染线条------------------------  */
            chart.renderLines = function(){

                let lines = chart.body().selectAll('.line')
                            .data([mydata]);

                    lines.enter()
                            .append('path')
                            .classed('line', true)
                            .merge(lines)
                            .attr('fill', 'none')
                            .attr('stroke', config.lineColor)
                            .attr('transform', 'translate(' + chart.scaleX.bandwidth()/2 +',0)')
                            .transition().duration(config.animateDuration)
                            .attrTween('d', lineTween);
                    
                    lines.exit()
                            .remove();
                    
                    //中间帧函数
                    function lineTween(){
                        const generateLine = d3.line()
                                                .x((d) => d[0])
                                                .y((d) => d[1]);

                        const pointX = mydata.map((d) => chart.scaleX(d.date));
                        const pointY = mydata.map((d) => chart.scaleY(d.tavge));

                        const interpolate = getInterpolate(pointX, pointY);                
                        
                        const ponits = [];

                        const interval = 1/(pointX.length-1);

                        let index = 0;

                        return function(t){
                            if (t - interval > 0 && t % interval < Math.pow(10, -1.5)){  //保证线条一定经过数据点
                                index = Math.floor(t / interval);
                                ponits.push([pointX[index], pointY[index]]);
                            }else{
                                ponits.push([interpolate.x(t), interpolate.y(t)]);
                            }
                            
                            return generateLine(ponits);
                        }
                    }

                    //点插值
                    function getInterpolate(pointX, pointY){

                        const domain = d3.range(0, 1, 1/(pointX.length-1));
                        domain.push(1);

                        const interpolateX = d3.scaleLinear()
                                                .domain(domain)
                                                .range(pointX);

                        const interpolateY = d3.scaleLinear()
                                                .domain(domain)
                                                .range(pointY);
                        return {
                            x: interpolateX,
                            y: interpolateY
                        };

                    }
            }

            /* ----------------------------渲染点------------------------  */
            chart.renderPonits = function(){
                let ponits = chart.body().selectAll('.point')
                            .data(mydata);
                    
                    ponits.enter()
                            .append('circle')
                            .classed('point', true)
                        .merge(ponits)
                            .attr('cx', (d) => chart.scaleX(d.date))
                            .attr('cy', (d) => chart.scaleY(d.tavge))
                            .attr('r', 0)
                            .attr('fill', config.pointColor)
                            .attr('stroke', config.lineColor)
                            .attr('transform', 'translate(' + chart.scaleX.bandwidth()/2 +',0)')
                            .transition().duration(config.animateDuration)
                            .attr('r', config.pointSize);
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
                                    .attr('dy', 30)
                                    .text('日期');

                d3.select('.yAxis').append('text')
                                    .attr('class', 'axisText')
                                    .attr('x', 0)
                                    .attr('y', 0)
                                    .attr('fill', config.textColor)
                                    .attr('transform', 'rotate(-90)')
                                    .attr('dy', -40)
                                    .attr('text-anchor','end')
                                    .text('平均温度（°F）');
            }

            /* ----------------------------渲染网格线------------------------  */
            chart.renderGrid = function(){
                d3.selectAll('.yAxis .tick')
                    .each(function(d, i){
                        if (config.ShowGridY.indexOf(d) > -1){
                            d3.select(this).append('line')
                                .attr('class','grid')
                                .attr('stroke', config.gridColor)
                                .attr('x1', 0)
                                .attr('y1', 0)
                                .attr('x2', chart.getBodyWidth())
                                .attr('y2', 0);
                        }
                    });

                d3.selectAll('.xAxis .tick')
                    .each(function(d, i){
                        if (config.ShowGridX.indexOf(d) > -1){
                            d3.select(this).append('line')
                                .attr('class','grid')
                                .attr('stroke', config.gridColor)
                                .attr('x1', 0)
                                .attr('y1', 0)
                                .attr('x2', 0)
                                .attr('y2', -chart.getBodyHeight());
                        }
                    });
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

                d3.selectAll('.point')
                    .on('mouseover', function(d){
                        const e = d3.event;
                        const position = d3.mouse(chart.svg().node());
                        e.target.style.cursor = 'hand'

                        d3.select(e.target)
                            .attr('fill', config.textColor);
                        
                        chart.svg()
                            .append('text')
                            .classed('tip', true)
                            .attr('x', position[0]+5)
                            .attr('y', position[1])
                            .attr('fill', config.textColor)
                            .text('平均温度：' + d.tavge);
                    })
                    .on('mouseleave', function(){
                        const e = d3.event;
                        
                        d3.select(e.target)
                            .attr('fill', config.pointColor);
                            
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

                chart.renderLines();

                chart.renderPonits();

                chart.renderTitle();

                chart.addMouseOn();
            }

            chart.renderChart();
        }  
            
    }
    /* ----------------------------添加选项------------------------  */
    var sel = d3.select("body")
    .append("select")
    .attr("id", "select")
    .attr("size", 10)

    sel.append("optgroup")
        .attr("label", "州")

    statename.sort();

    sel.append("option")
          .attr("value", statename[0])
          .attr("selected", "selected")
          .text(statename[0])
    
    for(let i = 1; i < statename.length-1; i++){
          sel.append("option")
          .attr("value", statename[i])
          .text(statename[i])
    }
    update();
    var myselect = document.getElementById("select")
    myselect.onchange = update;     
});














