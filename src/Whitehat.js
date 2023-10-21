import React, { useRef, useMemo } from "react";
import useSVGCanvas from "./useSVGCanvas.js";
import * as d3 from "d3";

export default function Whitehat(props) {
  //this is a generic component for plotting a d3 plot
  const d3Container = useRef(null);
  //this automatically constructs an svg canvas the size of the parent container (height and width)
  //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
  //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
  const [svg, height, width, tTip] = useSVGCanvas(d3Container);
  var isZoomed = false;

  //TODO: change the line below to change the size of the white-hat maximum bubble size
  const maxRadius = width / 100;

  //albers usa projection puts alaska in the corner
  //this automatically convert latitude and longitude to coordinates on the svg canvas
  const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]);

  //set up the path generator to draw the states
  const geoGenerator = d3.geoPath().projection(projection);

  //we need to use this function to convert state names into ids so we can select individual states by name using javascript selectors
  //since spaces makes it not work correctly
  function cleanString(string) {
    return string.replace(" ", "_").replace(" ", "_");
  }

  //This is the main loop that renders the code once the data loads
  //TODO: edit or replace this code to create your white-hat version of the map view; for example, change the color map based on colorbrewer2,
  const mapGroupSelection = useMemo(() => {
    //wait until the svg is rendered and data is loaded
    if (
      (svg !== undefined) &
      (props.map !== undefined) &
      (props.data !== undefined)
    ) {
      const stateData = props.data.states;

      const populationData = props.populationData;

      console.log("pop  ", populationData);

      const statePopulations = populationData.map((entry) => {
        const stateName = entry.stateName;
        const abbreviation = entry.abbreviation;
        const population = entry.population;
        return { stateName, abbreviation, population };
      });

      //console.log("State Population   :", statePopulations);

      //EDIT THIS TO CHANGE WHAT IS USED TO ENCODE COLOR
      const getEncodedFeature = (d) => d.count;

      //this section of code sets up the colormap
      const stateCounts = Object.values(stateData).map(getEncodedFeature);
      const getEncodedFeature2 = (d) => d.population;

      console.log("State Counts   :", stateCounts);

      const getDeathsPer100K = (d) => (d.count * 100000) / d.population;

      const stateDeathsPer100K = Object.values(stateData).map(getDeathsPer100K);

      //get color extends for the color legend
      const [stateMin, stateMax] = d3.extent(stateCounts);

      const [stateMin2, stateMax2] = d3.extent(stateDeathsPer100K);

      //color map scale, scales numbers to a smaller range to use with a d3 color scale
      //we're using 1-0 to invert the red-yellow-green color scale
      //so red is bad (p.s. this is not a good color scheme still)
      const stateScale = d3
        .scaleLinear()
        .domain([stateMin2, stateMax2])
        .range([stateMin2, stateMax2]);

      //TODO: EDIT HERE TO CHANGE THE COLOR SCHEME
      //this function takes a number 0-1 and returns a color
      /*
      const colorMap = d3
        .scaleSequential(d3.interpolateRgbBasis(["#1f78b4", "#b2df8a"]))
        .domain([0, 1]);
      */
      const colorMap = d3
        .scaleQuantize()
        .domain([0, 16])
        .range([
          "#1f77b4",
          "#ff7f0e",
          "#2ca02c",
          "#d62728",
          "#9467bd",
          "#8c564b",
        ]);

      function customColorMap(value) {
        const colorRanges = [
          { range: [0, 0.99], color: "#fef0d9" },
          { range: [1, 1.99], color: "#fdd49e" },
          { range: [2, 2.99], color: "#fdbb84" },
          { range: [3, 3.99], color: "#fc8d59" },
          { range: [4, 4.99], color: "#ef6548" },
          { range: [5, 9.99], color: "#d7301f" },
          { range: [10, 16], color: "#990000" },
        ];

        for (const range of colorRanges) {
          if (value >= range.range[0] && value <= range.range[1] + 0.009) {
            return range.color;
          }
        }

        // Return a default color (if needed)
        return "#000000";
      }
      //edited d3.interpolateRdYlGn;

      //this set of functions extracts the features given the state name from the geojson
      function getCount(name) {
        //map uses full name, dataset uses abreviations
        name = cleanString(name);
        let entry = stateData.filter((d) => d.state === name);
        if ((entry === undefined) | (entry.length < 1)) {
          return 0;
        }
        return getEncodedFeature(entry[0]);
      }

      function getPopulation(name) {
        //map uses full name, dataset uses abreviations
        name = cleanString(name);
        let entry = stateData.filter((d) => d.state === name);
        if ((entry === undefined) | (entry.length < 1)) {
          return 0;
        }
        return getEncodedFeature2(entry[0]);
      }

      function getStateVal(name) {
        let count = getCount(name);
        let population = getPopulation(name);
        let val = stateScale((count * 100000) / population);
        return val;
      }

      function getStateColor(d) {
        return customColorMap(stateScale(getStateVal(d.properties.NAME)));
      }

      //clear earlier drawings
      svg.selectAll("g").remove();

      //OPTIONAL: EDIT THIS TO CHANGE THE DETAILS OF HOW THE MAP IS DRAWN
      //draw borders from map and add tooltip

      console.log("props Data    :", props["populationData"]);

      let mapGroup = svg.append("g").attr("class", "mapbox");
      mapGroup
        .selectAll("path")
        .filter(".state")
        .data(props.map.features)
        .enter()
        .append("path")
        .attr("class", "state")
        //ID is useful if you want to do brushing as it gives you a way to select the path
        .attr("id", (d) => cleanString(d.properties.NAME))
        .attr("d", geoGenerator)
        .attr("fill", getStateColor)
        .attr("stroke", "black")
        .attr("stroke-width", 0.1)
        .on("mouseover", (e, d) => {
          let state = cleanString(d.properties.NAME);
          //this updates the brushed state
          if (props.brushedState !== state) {
            props.setBrushedState(state);
          }
          console.log("d 112", d);
          let sname = d.properties.NAME;
          let count = getCount(sname);

          let gunDeathsPer100K = (count * 100000) / getPopulation(sname);

          let text =
            sname +
            "</br>" +
            "Gun Deaths: " +
            count +
            "</br>" +
            "Gun Deaths per 100K:" +
            gunDeathsPer100K.toFixed(2);

          tTip.html(text);
        })
        .on("mousemove", (e) => {
          //see app.js for the helper function that makes this easier
          props.ToolTip.moveTTipEvent(tTip, e);
        })
        .on("mouseout", (e, d) => {
          props.setBrushedState();
          props.ToolTip.hideTTip(tTip);
        });

      //TODO: replace or edit the code below to change the city marker being used. Hint: think of the cityScale range (perhaps use area rather than radius).
      //draw markers for each city

      const maxArea = Math.PI * Math.pow(maxRadius, 2);
      const cityData = props.data.cities;
      const cityMax = d3.max(cityData.map((d) => d.count));
      const cityScale = d3
        .scaleLinear()
        .domain([0, cityMax])
        .range([maxArea / 800, maxArea / 40]);

      mapGroup.selectAll(".city").remove();

      //TODO: Add code for a tooltip when you mouse over the city (hint: use the same code for the state tooltip events .on... and modify what is used for the tTip.html)
      //OPTIONAL: change the color or opacity
      mapGroup
        .selectAll(".city")
        .data(cityData)
        .enter()
        .append("circle")
        .attr("class", "city")
        .attr("id", (d) => d.key)
        .attr("cx", (d) => projection([d.lng, d.lat])[0])
        .attr("cy", (d) => projection([d.lng, d.lat])[1])
        .attr("r", (d) => cityScale(d.count))
        .attr("opacity", 0.8)
        .on("mouseover", (e, d) => {
          let city = d.city + ", " + d.state; // Get city and state name
          let count = d.count;
          let text = city + "<br/>" + "Gun Deaths: " + count;

          // Show tooltip
          tTip
            .html(text)
            .style("visibility", "visible")
            .style("left", e.pageX + "px")
            .style("top", e.pageY + "px");
        })
        .on("mousemove", (e) => {
          // Update tooltip position as mouse moves
          tTip.style("left", e.pageX + "px").style("top", e.pageY + "px");
        })
        .on("mouseout", (e) => {
          // Hide tooltip on mouseout
          tTip.style("visibility", "hidden");
        });
      //draw a color legend, automatically scaled based on data extents
      function drawLegend() {
        const legendData = [
          { range: [0, 0.99], text: "0 - 0.99" },
          { range: [1, 1.99], text: "1 - 1.99" },
          { range: [2, 2.99], text: "2 - 2.99" },
          { range: [3, 3.99], text: "3 - 3.99" },
          { range: [4, 4.99], text: "4 - 4.99" },
          { range: [5, 10], text: "5 - 10" },
          { range: [11, 16], text: "11 - 16" },
        ];

        const legendGroup = svg.append("g").attr("class", "legend");

        const legendRectSize = 18;
        const legendSpacing = 4;
        const legendX = 50;
        let legendY = height - 200;

        const legend = legendGroup
          .selectAll(".legend")
          .data(legendData)
          .enter()
          .append("g")
          .attr("class", "legend")
          .attr("transform", (d, i) => {
            return (
              "translate(" +
              legendX +
              "," +
              (i * (legendRectSize + legendSpacing) + legendY) +
              ")"
            );
          });

        svg
          .select(".legend")
          .append("text")
          .attr("class", "legend-title")
          .attr("x", legendX)
          .attr("y", legendY + 175)
          .attr("text-anchor", "start")
          .attr("font-size", "20px")
          .text("Deaths per 100K Population");

        legend
          .append("rect")
          .attr("width", legendRectSize)
          .attr("height", legendRectSize)
          .style("fill", (d) => customColorMap((d.range[0] + d.range[1]) / 2));

        legend
          .append("text")
          .attr("x", legendRectSize + legendSpacing)
          .attr("y", legendRectSize - legendSpacing)
          .text((d) => d.text);
      }

      drawLegend();
      return mapGroup;
    }
  }, [svg, props.map, props.data]);

  //This adds zooming. Triggers whenever the function above finishes
  //this section can be included in the main body but is here as an example
  //of how to do multiple hooks so updates don't have to occur in every state
  useMemo(() => {
    if (mapGroupSelection === undefined) {
      return;
    }

    //set up zooming
    function zoomed(event) {
      const { transform } = event;
      mapGroupSelection
        .attr("transform", transform)
        .attr("stroke-width", 1 / transform.k);
    }

    const zoom = d3.zoom().on("zoom", zoomed);

    //OPTIONAL: EDIT THIS CODE TO CHANGE WHAT HAPPENS WHEN YOU CLICK A STATE
    //useful if you want to add brushing
    function clicked(event, d) {
      event.stopPropagation();
      if (isZoomed) {
        mapGroupSelection
          .transition()
          .duration(300)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(0, 0),
            d3.pointer(event, svg.node())
          );
      } else {
        //get bounds of path from map
        const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
        //zoom to bounds
        mapGroupSelection
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(
                Math.min(
                  8,
                  0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)
                )
              )
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
          );
      }
      //sets the zoomed state property in the main app when we click on something
      //if we are zoomed in, unzoom instead
      isZoomed = !isZoomed;
      if (isZoomed) {
        props.setZoomedState(d.properties.NAME);
      } else {
        props.setZoomedState(undefined);
      }
    }

    mapGroupSelection
      .selectAll(".state")
      .attr("cursor", "pointer") //so we know the states are clickable
      .on("click", clicked);
  }, [mapGroupSelection]);

  //OPTIONAL: EDIT HERE TO CHANGE THE BRUSHING BEHAVIOUR IN THE MAP WHEN MOUSING OVER A STATE
  //WILL UPDATE WHEN THE "BRUSHEDSTATE" VARIABLE CHANGES
  //brush the state by altering it's opacity when the property changes
  //brushed state can be on the same level but that makes it harder to use in linked views
  //so its in the parent app to simplify the "whitehat" part which uses linked views.
  useMemo(() => {
    if (mapGroupSelection !== undefined) {
      const isBrushed = props.brushedState !== undefined;
      mapGroupSelection
        .selectAll(".state")
        .attr("opacity", isBrushed ? 0.4 : 0.8)
        .attr("strokeWidth", isBrushed ? 1 : 2);
      if (isBrushed) {
        mapGroupSelection
          .select("#" + props.brushedState)
          .attr("opacity", 1)
          .attr("strokeWidth", 3);
      }
    }
  }, [mapGroupSelection, props.brushedState]);

  return (
    <div
      className={"d3-component"}
      style={{ height: "99%", width: "99%" }}
      ref={d3Container}
    ></div>
  );
}
