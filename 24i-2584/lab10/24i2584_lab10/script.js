// FAST Data Analysis & Visualization — Lab 10
// Data is loaded from dataset/air_quality_2025.csv.
// Missing dates are intentionally NOT filled or replaced with zero.

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%d %b %Y");
const formatMonth = d3.timeFormat("%b");
const colors = {
  city: "#176b53", suburb: "#527fa6", low: "#dce9c7",
  moderate: "#9fc58a", high: "#e8b45e", severe: "#c95d50",
  mean: "#176b53", band: "#b9d8c6"
};
const tooltip = d3.select("#tooltip");

function showTip(event, html) {
  tooltip.html(html).style("opacity", 1)
    .style("left", (event.clientX + 12) + "px")
    .style("top", (event.clientY + 12) + "px");
}
function hideTip() { tooltip.style("opacity", 0); }
function baseSvg(selector, width=820, height=310, margin={top:18,right:25,bottom:42,left:55}) {
  const svg = d3.select(selector).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role","img");
  return {svg, width, height, margin,
    innerW: width-margin.left-margin.right,
    innerH: height-margin.top-margin.bottom};
}
function addAxes(g, x, y, innerH, yTicks=5, xFormat=null) {
  g.append("g").attr("class","axis")
    .attr("transform",`translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(xFormat || d3.timeFormat("%b")));
  g.append("g").attr("class","axis").call(d3.axisLeft(y).ticks(yTicks));
  g.append("g").attr("class","gridline")
    .call(d3.axisLeft(y).ticks(yTicks).tickSize(-x.range()[1]).tickFormat(""));
}
function makeLine(data, x, y, field, defined=true) {
  return d3.line()
    .defined(d => defined ? d[field] != null && Number.isFinite(+d[field]) : true)
    .x(d => x(d.date)).y(d => y(d[field]));
}
function legend(selector, items) {
  const root = d3.select(selector).append("div").attr("class","legend");
  items.forEach(item => {
    const k = root.append("span").attr("class","key");
    k.append("span").attr("class","swatch").style("background",item.color);
    k.append("span").text(item.label);
  });
}
function monthStart(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function safePct(n, total) { return total ? (100*n/total).toFixed(1) : "0.0"; }

d3.csv("dataset/air_quality_2025.csv", d => ({
  date: parseDate(d.date),
  pm25_city: +d.pm25_city,
  pm25_suburb: +d.pm25_suburb,
  temp_c: +d.temp_c
})).then(raw => {
  // Data cleaning: discard malformed/negative/duplicate records and sort by date.
  const seen = new Set();
  const data = raw.filter(d =>
    d.date instanceof Date && !isNaN(d.date) &&
    Number.isFinite(d.pm25_city) && d.pm25_city >= 0 &&
    Number.isFinite(d.pm25_suburb) && d.pm25_suburb >= 0 &&
    Number.isFinite(d.temp_c)
  ).filter(d => {
    const key = +d.date;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b) => a.date-b.date);

  if (!data.length) throw new Error("No valid rows were loaded from the CSV.");
  const allDates = d3.timeDay.range(new Date(2025,0,1), new Date(2026,0,1));
  const dateSet = new Set(data.map(d => +d.date));
  const missingDates = allDates.filter(d => !dateSet.has(+d));
  const above15 = data.filter(d => d.pm25_city > 15).length;
  const above75 = data.filter(d => d.pm25_city > 75).length;
  const topTwo = [...data].sort((a,b) => b.pm25_city-a.pm25_city).slice(0,2);

  // Task 1 — dataset inspection / KPI cards.
  const stats = [
    ["Recorded rows", data.length, "Valid daily records"],
    ["Missing dates", missingDates.length, "Dates with no recorded row"],
    ["Days above 15", above15, `${safePct(above15,data.length)}% of recorded days`],
    ["Days above 75", above75, `${safePct(above75,data.length)}% of recorded days`]
  ];
  d3.select("#stats").selectAll("div").data(stats).join("div").attr("class","stat")
    .html(d => `<div class="label">${d[0]}</div><div class="value">${d[1]}</div><div class="hint">${d[2]}</div>`);

  // Task 2 — daily city PM2.5 line, guideline lines, top two days.
  {
    const {svg,width,height,margin,innerW,innerH}=baseSvg("#chart1",1000,350,{top:22,right:30,bottom:48,left:60});
    const x=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const y=d3.scaleLinear().domain([0, d3.max(data,d=>d.pm25_city)*1.12]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    addAxes(g,x,y,innerH,5);
    [15,75].forEach((v,i)=>{
      g.append("line").attr("x1",0).attr("x2",innerW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke",i===0?"#d99b39":"#c95d50").attr("stroke-width",1.5).attr("stroke-dasharray","6 5");
      g.append("text").attr("x",innerW-3).attr("y",y(v)-6).attr("text-anchor","end")
        .attr("fill",i===0?"#b77b22":"#b64c43").attr("font-size",10).text(`${v} µg/m³`);
    });
    g.append("path").datum(data).attr("fill","none").attr("stroke",colors.city).attr("stroke-width",1.8)
      .attr("d",d3.line().x(d=>x(d.date)).y(d=>y(d.pm25_city)));
    g.selectAll(".top-point").data(topTwo).join("circle").attr("cx",d=>x(d.date)).attr("cy",d=>y(d.pm25_city))
      .attr("r",5).attr("fill","#cf5c50").attr("stroke","white").attr("stroke-width",2)
      .on("mousemove",(event,d)=>showTip(event,`${formatDate(d.date)}<br><b>${d.pm25_city} µg/m³</b>`)).on("mouseleave",hideTip);
    g.selectAll(".top-label").data(topTwo).join("text").attr("x",d=>x(d.date)).attr("y",(d,i)=>y(d.pm25_city)+(i===0?-12:18))
      .attr("text-anchor","middle").attr("font-size",10).attr("font-weight",700).attr("fill","#a8433b")
      .text(d=>`${formatDate(d.date)} · ${d.pm25_city}`);
    d3.select("#task2metrics").html(
      `<span class="mini">Above 15 µg/m³: <b>${above15} days (${safePct(above15,data.length)}%)</b></span>
       <span class="mini">Above 75 µg/m³: <b>${above75} days (${safePct(above75,data.length)}%)</b></span>
       <span class="mini">First / last recorded: <b>${formatDate(data[0].date)} – ${formatDate(data[data.length-1].date)}</b></span>`
    );
  }

  // Task 3 — running cumulative total of days above 75, with missing calendar dates retained.
  {
    let running=0;
    const series=allDates.map(date=>{
      const row=data.find(d=>+d.date===+date);
      if(row && row.pm25_city>75) running++;
      return {date, total:running, recorded:!!row};
    });
    const {svg,margin,innerW,innerH}=baseSvg("#chart2",820,310);
    const x=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const y=d3.scaleLinear().domain([0,d3.max(series,d=>d.total)]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    addAxes(g,x,y,innerH);
    g.append("path").datum(series).attr("fill","#b9d8c6").attr("fill-opacity",.8)
      .attr("d",d3.area().x(d=>x(d.date)).y0(innerH).y1(d=>y(d.total)));
    g.append("path").datum(series).attr("fill","none").attr("stroke",colors.city).attr("stroke-width",2.5)
      .attr("d",d3.line().x(d=>x(d.date)).y(d=>y(d.total)));
    g.append("text").attr("x",innerW-4).attr("y",y(running)-9).attr("text-anchor","end")
      .attr("font-size",11).attr("font-weight",700).attr("fill",colors.city).text(`Final total: ${running}`);
  }

  // Task 4 — city and suburb comparison.
  {
    const {svg,margin,innerW,innerH}=baseSvg("#chart3",820,310);
    const x=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const y=d3.scaleLinear().domain([0,d3.max(data,d=>Math.max(d.pm25_city,d.pm25_suburb))*1.08]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    addAxes(g,x,y,innerH);
    [["pm25_city",colors.city],["pm25_suburb",colors.suburb]].forEach(([field,color])=>{
      g.append("path").datum(data).attr("fill","none").attr("stroke",color).attr("stroke-width",1.8)
        .attr("d",d3.line().x(d=>x(d.date)).y(d=>y(d[field])));
    });
    legend("#chart3",[{label:"City centre",color:colors.city},{label:"Suburb",color:colors.suburb}]);
  }

  // Task 5 — monthly stacked columns by city-centre pollution category.
  {
    const categories=["Low","Moderate","High","Severe"];
    const keys=["Low","Moderate","High","Severe"];
    const monthRows=d3.groups(data,d=>d.date.getMonth()).map(([m,rows])=>{
      const obj={month:new Date(2025,m,1)};
      rows.forEach(d=>{
        const v=d.pm25_city;
        const cat=v<=35?"Low":v<=75?"Moderate":v<=150?"High":"Severe";
        obj[cat]=(obj[cat]||0)+1;
      });
      keys.forEach(k=>obj[k]=obj[k]||0);
      obj.days=rows.length;
      return obj;
    }).sort((a,b)=>a.month-b.month);
    const color=d3.scaleOrdinal().domain(keys).range([colors.low,colors.moderate,colors.high,colors.severe]);
    const {svg,margin,innerW,innerH}=baseSvg("#chart4",820,310);
    const x=d3.scaleBand().domain(monthRows.map(d=>formatMonth(d.month))).range([0,innerW]).padding(.18);
    const y=d3.scaleLinear().domain([0,d3.max(monthRows,d=>d.days)]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${innerH})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).ticks(5));
    g.append("g").attr("class","gridline").call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));
    const stack=d3.stack().keys(keys)(monthRows);
    g.selectAll("g.layer").data(stack).join("g").attr("fill",d=>color(d.key))
      .selectAll("rect").data(d=>d.map(v=>Object.assign(v,{key:d.key}))).join("rect")
      .attr("x",d=>x(formatMonth(d.data.month))).attr("y",d=>y(d[1]))
      .attr("height",d=>Math.max(0,y(d[0])-y(d[1]))).attr("width",x.bandwidth())
      .on("mousemove",(event,d)=>showTip(event,`${formatMonth(d.data.month)}<br>${d.key}: <b>${d[1]-d[0]} days</b><br>Recorded days: ${d.data.days}`)).on("mouseleave",hideTip);
    legend("#chart4",keys.map(k=>({label:k,color:color(k)})));
    const shortest=monthRows.reduce((a,b)=>a.days<b.days?a:b);
    d3.select("#chart4").append("div").attr("class","desc").style("margin","8px 0 0 5px")
      .text(`Month lengths differ because calendar months have 28–31 days; March also has 9 unrecorded dates in this dataset.`);
  }

  // Task 6 — month by weekday heatmap.
  {
    const months=d3.range(12).map(m=>new Date(2025,m,1));
    const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const cells=[];
    months.forEach((month,m)=>{
      weekdays.forEach((day,dayIndex)=>{
        const rows=data.filter(d=>d.date.getMonth()===m && d.date.getDay()===dayIndex);
        cells.push({month,monthIndex:m,day,dayIndex,avg:rows.length?d3.mean(rows,d=>d.pm25_city):null,n:rows.length});
      });
    });
    const vals=cells.filter(d=>d.avg!=null).map(d=>d.avg);
    const color=d3.scaleSequential(d3.interpolateYlOrRd).domain(d3.extent(vals));
    const {svg,height,margin,innerW,innerH}=baseSvg("#chart5",820,340,{top:18,right:25,bottom:44,left:55});
    const x=d3.scaleBand().domain(weekdays).range([0,innerW]).padding(.08);
    const y=d3.scaleBand().domain(months.map(formatMonth)).range([0,innerH]).padding(.08);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${innerH})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y));
    g.selectAll("rect").data(cells).join("rect")
      .attr("x",d=>x(d.day)).attr("y",d=>y(formatMonth(d.month)))
      .attr("width",x.bandwidth()).attr("height",y.bandwidth())
      .attr("rx",4).attr("fill",d=>d.avg==null?"#edf0ed":color(d.avg))
      .on("mousemove",(event,d)=>showTip(event,`${formatMonth(d.month)} · ${d.day}<br>Average: <b>${d.avg==null?"No data":d.avg.toFixed(1)+" µg/m³"}</b><br>Readings: ${d.n}`)).on("mouseleave",hideTip);
    const defs=svg.append("defs"), grad=defs.append("linearGradient").attr("id","heatLegend");
    grad.append("stop").attr("offset","0%").attr("stop-color",color(d3.min(vals)));
    grad.append("stop").attr("offset","100%").attr("stop-color",color(d3.max(vals)));
    svg.append("rect").attr("x",margin.left+innerW-170).attr("y",height-18).attr("width",120).attr("height",7).attr("rx",3).attr("fill","url(#heatLegend)");
    svg.append("text").attr("x",margin.left+innerW-175).attr("y",height-11).attr("text-anchor","end").attr("font-size",9).attr("fill","#718078").text(d3.min(vals).toFixed(0));
    svg.append("text").attr("x",margin.left+innerW-43).attr("y",height-11).attr("font-size",9).attr("fill","#718078").text(d3.max(vals).toFixed(0));
  }

  // Task 7 — monthly min/max range band and mean.
  {
    const monthly=d3.groups(data,d=>d.date.getMonth()).map(([m,rows])=>({
      date:new Date(2025,m,15), min:d3.min(rows,d=>d.pm25_city),
      max:d3.max(rows,d=>d.pm25_city), mean:d3.mean(rows,d=>d.pm25_city)
    })).sort((a,b)=>a.date-b.date);
    const {svg,margin,innerW,innerH}=baseSvg("#chart6",820,310);
    const x=d3.scaleTime().domain([new Date(2025,0,1),new Date(2026,0,1)]).range([0,innerW]);
    const y=d3.scaleLinear().domain([0,d3.max(monthly,d=>d.max)*1.08]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    addAxes(g,x,y,innerH);
    g.append("path").datum(monthly).attr("fill",colors.band).attr("fill-opacity",.8)
      .attr("d",d3.area().x(d=>x(d.date)).y0(d=>y(d.min)).y1(d=>y(d.max)));
    g.append("path").datum(monthly).attr("fill","none").attr("stroke",colors.mean).attr("stroke-width",2.7)
      .attr("d",d3.line().x(d=>x(d.date)).y(d=>y(d.mean)));
    g.selectAll("circle").data(monthly).join("circle").attr("cx",d=>x(d.date)).attr("cy",d=>y(d.mean)).attr("r",3.5).attr("fill",colors.mean)
      .on("mousemove",(event,d)=>showTip(event,`${formatMonth(d.date)}<br>Min: ${d.min.toFixed(1)}<br>Mean: <b>${d.mean.toFixed(1)}</b><br>Max: ${d.max.toFixed(1)} µg/m³`)).on("mouseleave",hideTip);
    legend("#chart6",[{label:"Monthly min–max range",color:colors.band},{label:"Monthly mean",color:colors.mean}]);
  }

  // Task 8 — original series and 7-calendar-day moving average.
  {
    const byDate=new Map(data.map(d=>[+d.date,d]));
    const series=allDates.map(date=>({date,row:byDate.get(+date) || null,
      value:byDate.has(+date)?byDate.get(+date).pm25_city:null, average:null}));
    series.forEach((d,i)=>{
      if(!d.row || i<6) return;
      const window=series.slice(i-6,i+1);
      const consecutive=window.every((v,j)=>v.row && (j===0 || d3.timeDay.count(window[j-1].date,v.date)===1));
      if(consecutive) d.average=d3.mean(window,v=>v.value);
    });
    const {svg,margin,innerW,innerH}=baseSvg("#chart7",1000,330,{top:18,right:28,bottom:45,left:60});
    const x=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const y=d3.scaleLinear().domain([0,d3.max(data,d=>d.pm25_city)*1.1]).nice().range([innerH,0]);
    const g=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    addAxes(g,x,y,innerH);
    // Shade the missing-data interval.
    if(missingDates.length){
      const gapStart=missingDates[0], gapEnd=missingDates[missingDates.length-1];
      g.append("rect").attr("x",x(gapStart)).attr("y",0).attr("width",Math.max(4,x(d3.timeDay.offset(gapEnd,1))-x(gapStart)))
        .attr("height",innerH).attr("fill","#e9a23b").attr("opacity",.17);
      g.append("text").attr("x",(x(gapStart)+x(d3.timeDay.offset(gapEnd,1)))/2).attr("y",18)
        .attr("text-anchor","middle").attr("font-size",10).attr("font-weight",700).attr("fill","#a56a1e").text("No data: sensor offline");
    }
    g.append("path").datum(series).attr("fill","none").attr("stroke","#9daaa2").attr("stroke-width",1).attr("opacity",.7)
      .attr("d",d3.line().defined(d=>d.value!=null).x(d=>x(d.date)).y(d=>y(d.value)));
    g.append("path").datum(series).attr("fill","none").attr("stroke",colors.city).attr("stroke-width",3)
      .attr("d",d3.line().defined(d=>d.average!=null).x(d=>x(d.date)).y(d=>y(d.average)));
    legend("#chart7",[{label:"Daily PM2.5",color:"#9daaa2"},{label:"7-day moving average",color:colors.city},{label:"Missing dates",color:"#e9a23b"}]);
    d3.select("#gapnote").html(`<strong>Data gap:</strong> ${missingDates.length} consecutive dates are missing (${formatDate(missingDates[0])} to ${formatDate(missingDates[missingDates.length-1])}). The moving average is not calculated across this gap, and both lines break rather than joining across unavailable readings.`);
  }

  // Task 9 — overview brush controls a zoomed main line chart.
  {
    const {svg,width,height,margin,innerW,innerH}=baseSvg("#chart8",1000,390,{top:20,right:30,bottom:42,left:60});
    const mainH=220, overviewY=275, overviewH=55;
    const xMain=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const xOverview=d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
    const y=d3.scaleLinear().domain([0,d3.max(data,d=>d.pm25_city)*1.08]).nice().range([mainH,0]);
    const main=svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
    const overview=svg.append("g").attr("transform",`translate(${margin.left},${overviewY})`);
    const mainPath=main.append("path").datum(data).attr("fill","none").attr("stroke",colors.city).attr("stroke-width",2.2);
    const mainX=main.append("g").attr("class","axis").attr("transform",`translate(0,${mainH})`);
    main.append("g").attr("class","axis").call(d3.axisLeft(y).ticks(5));
    main.append("g").attr("class","gridline").call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));
    const overviewYScale=d3.scaleLinear().domain(y.domain()).range([overviewH,0]);
    overview.append("path").datum(data).attr("fill","#c9dfd1").attr("stroke",colors.green||"#176b53").attr("stroke-width",1)
      .attr("d",d3.area().x(d=>xOverview(d.date)).y0(overviewH).y1(d=>overviewYScale(d.pm25_city)));
    overview.append("g").attr("class","axis").attr("transform",`translate(0,${overviewH})`).call(d3.axisBottom(xOverview).ticks(7).tickFormat(d3.timeFormat("%b")));
    function update(domain){
      xMain.domain(domain);
      mainPath.attr("d",d3.line().x(d=>xMain(d.date)).y(d=>y(d.pm25_city))(data));
      mainX.call(d3.axisBottom(xMain).ticks(7).tickFormat(d3.timeFormat("%d %b")));
    }
    update(xOverview.domain());
    const brush=d3.brushX().extent([[0,0],[innerW,overviewH]]).on("brush end",event=>{
      if(!event.selection) return;
      const domain=event.selection.map(xOverview.invert);
      update(domain);
    });
    overview.append("g").attr("class","brush").call(brush).call(brush.move,xOverview.range());
    d3.select("#resetZoom").on("click",()=>overview.select(".brush").call(brush.move,xOverview.range()));
  }

  // Director's evidence-based briefing.
  {
    const monthly=d3.groups(data,d=>d.date.getMonth()).map(([m,rows])=>({
      month:new Date(2025,m,1), mean:d3.mean(rows,d=>d.pm25_city),
      min:d3.min(rows,d=>d.pm25_city), max:d3.max(rows,d=>d.pm25_city),
      severe:rows.filter(d=>d.pm25_city>150).length,
      low:rows.filter(d=>d.pm25_city<=35).length
    })).sort((a,b)=>a.month-b.month);
    const worst=[...monthly].sort((a,b)=>b.mean-a.mean)[0];
    const best=[...monthly].sort((a,b)=>a.mean-b.mean)[0];
    const widest=[...monthly].sort((a,b)=>(b.max-b.min)-(a.max-a.min))[0];
    const ratio=best.mean>0?(worst.mean/best.mean).toFixed(1):"—";
    const cityMean=d3.mean(data,d=>d.pm25_city), suburbMean=d3.mean(data,d=>d.pm25_suburb);
    const severeMonths=monthly.filter(d=>d.severe>0).map(d=>formatMonth(d.month)).join(", ") || "None";
    const mostLow=[...monthly].sort((a,b)=>b.low-a.low)[0];
    const fastMonth=monthly.reduce((bestM,m)=>m.severe>bestM.severe?m:bestM,monthly[0]);
    const findings=[
      ["Seasonality",`${formatMonth(worst.month)} has the highest monthly mean (${worst.mean.toFixed(1)} µg/m³); ${formatMonth(best.month)} is lowest (${best.mean.toFixed(1)} µg/m³). The worst month is about ${ratio}× the best.`],
      ["Anomalies",`The two highest city-centre readings are ${formatDate(topTwo[0].date)} (${topTwo[0].pm25_city} µg/m³) and ${formatDate(topTwo[1].date)} (${topTwo[1].pm25_city} µg/m³). The chart alone cannot establish their real-world causes.`],
      ["Guidelines",`${above15} recorded days (${safePct(above15,data.length)}%) were above 15 µg/m³; ${above75} (${safePct(above75,data.length)}%) were above 75 µg/m³.`],
      ["Build-up",`The cumulative curve rises on days above 75 µg/m³ and becomes flat when no new day crosses that threshold. Compare the slope across months in Chart 2.`],
      ["Comparison",`Mean city-centre PM2.5 was ${cityMean.toFixed(1)} µg/m³ and mean suburb PM2.5 was ${suburbMean.toFixed(1)} µg/m³. Compare the two lines in Chart 3 for timing and local differences.`],
      ["Composition",`Months with Severe city-centre days (>150 µg/m³): ${severeMonths}. ${formatMonth(mostLow.month)} has the most Low days (${mostLow.low}).`],
      ["Pattern",`Use the heatmap to compare weekday columns with month rows. A stronger month-to-month contrast suggests seasonality dominates any weekday effect.`],
      ["Spread",`${formatMonth(widest.month)} has the widest monthly range: ${(widest.max-widest.min).toFixed(1)} µg/m³ (min ${widest.min.toFixed(1)}, max ${widest.max.toFixed(1)}). A mean alone hides this within-month variation.`],
      ["Trend & data quality",`${missingDates.length} dates are missing: ${formatDate(missingDates[0])} to ${formatDate(missingDates[missingDates.length-1])}. The annual pattern should be interpreted with this sensor-offline gap in mind.`],
      ["Zoom",`Use the brush in Chart 8 to zoom into ${formatMonth(widest.month)}, the month with the widest min–max spread.`],
      ["Chart choice",`A pie chart cannot show the order of daily observations or when pollution spikes and gaps occur. A time-series line chart preserves chronology and reveals trends.`],
      ["Recommendation",`Use the monthly means, severe-day counts, and daily peaks together to justify two restriction months. The charts provide evidence, but the final policy choice requires context beyond this practice dataset.`]
    ];
    d3.select("#director").selectAll("div").data(findings).join("div").attr("class","finding")
      .html(d=>`<b>${d[0]}</b>${d[1]}`);
  }

}).catch(error => {
  console.error("Could not load or process the dataset:", error);
  d3.select("body").insert("div",":first-child")
    .style("margin","20px").style("padding","16px").style("background","#fee").style("color","#900")
    .text("Dataset loading failed. Start this project using VS Code Live Server and confirm dataset/air_quality_2025.csv exists.");
});
