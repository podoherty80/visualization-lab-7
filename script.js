Promise.all([
    d3.json("airports.json"),
    d3.json("world.json")
]).then(([airports, worldmap]) => {

  let visType = d3.select("input[name=type]:checked").node().value;

  console.log(airports);
  console.log(worldmap)

  const width = 650
  const height = 650
  const svg = d3.select('.chart')
    .attr("width", width)
    .attr("height", height)
    .append('svg')
    .attr("viewBox", [-width/2, -height/2, width, height])
  
  let sizeScale = d3
    .scaleLinear()
    .domain(d3.extent(airports.nodes, d => d.passengers))
    .range([5, 15])

  airports.nodes.forEach(d => {
        d.r = sizeScale(d.passengers);
   });

  const force = d3
    .forceSimulation(airports.nodes)
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter())
    .force("link", d3.forceLink(airports.links))
    .force("x", d3.forceX(width/2))
    .force("y", d3.forceY(width/2))

   // create a geo path generator using the projection
   const projection = d3
    .geoMercator()
    .fitExtent(
        [[-width/2, -height/2], [width/2, height/2]], // available screen space
        topojson.feature(worldmap, worldmap.objects.countries) // geoJSON object
    );
  
   const path = d3.geoPath().projection(projection);

   const features = topojson.feature(worldmap, worldmap.objects.countries).features;

   const maps = svg
        .selectAll("path")
        .data(features)
        .join("path")

   svg.append("path")
	.datum(topojson.mesh(worldmap, worldmap.objects.countries))
	.attr("d", path)
	.attr('fill', 'none')
  	.attr('stroke', 'white')
	.attr("class", "subunit-boundary");

  const links = svg
    .selectAll("line")
    .data(airports.links)
    .join("line")
    .attr("stroke", "steelblue")

  const nodes = svg   
    .selectAll("circle")
    .data(airports.nodes)
    .join("circle")
    .attr("r", d => d.r)
    .attr("stroke", "black")
    .attr("fill", "orange")

 nodes.append("title")
    .text(d=>d.name);

 force.on("tick", function() {
    // update positions
    links
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodes
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
 });

 function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag().filter(event => visType === "force")
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  nodes.call(drag(force));

    function switchLayout() {
        if (visType === "map") {
              // stop the simulation
              force.stop();
              maps.attr("d", path);
              maps.attr("stroke", "white");
              maps.attr("fill", "black");


              // set the positions of links and nodes based on geo-coordinates
              nodes.transition().duration(500)
                .attr("cx", d => d.x = projection([d.longitude, d.latitude])[0])
                .attr("cy", d => d.y = projection([d.longitude, d.latitude])[1])

              maps.transition().duration(500).attr("opacity", 1);

              links.transition().duration(500)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

              drag(force).filter(event => visType === "force")
              // set the map opacity to 1 
              
          } else { // force layout
              // restart the simulation
              // set the map opacity to 0
              force.alpha(1.0).restart();
              maps.transition().duration(500).attr("opacity", 0);        
          }
      }

      d3.selectAll("input[name=type]").on("change", event=>{
        visType = event.target.value;// selected button
        switchLayout();
    });

})