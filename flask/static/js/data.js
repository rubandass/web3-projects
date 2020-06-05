$(document).ready(function () {

    d3.selectAll("svg").remove();
    getValue($("#ddlCountry").val(), $('#year').val(), true);

    $(function () {
        $("#ddlCountry").change(function (event) {
            let selected_country = $(this).val();
            // Clearing the existing svg div element
            d3.selectAll("svg").remove();
            getValue(selected_country, $('#year').val(), true);
            // Resetting the slider bar year.
            $("#selected_year").val(1960);
            // Move back the slider bar cursor to 0th position
            $("#year").val(0);
        });
    });

    // Slider, onchange event
    let slider = d3.select('#year');
    slider.on('input', function () {
        // $("#selected_year").innerText = this.value;
        $('#selected_year').val(this.value);
    });
    slider.on('change', function () {
        let selected_country = $("#ddlCountry").val();
        $('#selected_year').val(this.value);
        d3.selectAll("svg").remove();
        getValue(selected_country, $('#year').val(), false);
    });

    // Get values for all the selected country by AJAX call method
    function getValue(selected_country, slider_year, filterByCountry) {
        $.get("/countries/".concat(selected_country), function (response) {
            let responseObj = JSON.parse(response);

            let industry_gdp = responseObj['data']['industry_percent_of_gdp'];
            let agriculture_gdp = responseObj['data']['agriculture_percent_of_gdp'];
            let services_gdp = responseObj['data']['services_percent_of_gdp'];

            let gdp_models = [];

            // Else part will be executed if the slider year is clicked.
            if (filterByCountry) {
                for (key in industry_gdp) {
                    // To reduce the x axis bandwidth, datas will be provided for every 4 years
                    if (key % 4 == 0) {
                        gdp_models.push({
                            "year": key,
                            "field1": parseFloat(industry_gdp[key]),
                            "field2": parseFloat(agriculture_gdp[key]),
                            "field3": parseFloat(services_gdp[key])
                        });
                    }
                };
            } else {
                gdp_models.push({
                    "year": slider_year,
                    "field1": parseFloat(industry_gdp[slider_year]),
                    "field2": parseFloat(agriculture_gdp[slider_year]),
                    "field3": parseFloat(services_gdp[slider_year])
                });
            }

            // set the dimensions and margins of the graph
            let container = d3.select('#svgcontainer'),
                width = 900,
                height = 400,
                margin = { top: 40, right: 20, bottom: 40, left: 50 },
                barPadding = .2,
                axisTicks = { qty: 10, outerSize: 0, dateFormat: '%m-%d' };

            let tooltip = d3.select("body").append("div").attr("class", "toolTip");

            let svg = container
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top - 10})`);

            // set the ranges
            let xScale0 = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(barPadding);
            let xScale1 = d3.scaleBand();
            let yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

            // gridlines in y axis function
            function make_y_gridlines() {
                return d3.axisLeft(yScale)
                    .ticks(10)
            }

            // Partitioning range of data
            let xAxis = d3.axisBottom(xScale0).tickSizeOuter(axisTicks.outerSize);
            let yAxis = d3.axisLeft(yScale).ticks(axisTicks.qty).tickSizeOuter(axisTicks.outerSize);

            // Scale the range of the data
            xScale0.domain(gdp_models.map(d => d.year));
            xScale1.domain(['field1', 'field2', 'field3']).range([0, xScale0.bandwidth()]);
            yScale.domain([0, d3.max(gdp_models, d => d.field1 > d.field2 && d.field1 > d.field3 ? d.field1 : d.field2 > d.field1 && d.field2 > d.field3 ? d.field2 : d.field3)]);

            // add the Y gridlines
            svg.append("g")
                .attr("class", "grid")
                .call(make_y_gridlines()
                    .tickSize(-width)
                    .tickFormat("")
                );

            // Mapping bars
            let year = svg.selectAll(".year")
                .data(gdp_models)
                .enter().append("g")
                .attr("class", "year")
                .attr("transform", d => `translate(${xScale0(d.year)}, 0)`);

            /* Add field1 bars */
            year.selectAll(".bar.field1")
                .data(d => [d])
                .enter()
                .append("rect")
                .attr("class", "bar field1")
                .style("fill", "blue")
                .attr("x", d => xScale1('field1'))
                .attr("y", d => yScale(d.field1))
                .attr("width", xScale1.bandwidth())
                .attr("height", d => {
                    return height - margin.top - margin.bottom - yScale(d.field1)
                })
                .on("mousemove", function (d) {
                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(("Industry gdp") + "<br>" + (d.field1) + "%");
                })
                .on("mouseout", function (d) { tooltip.style("display", "none"); });

            /* Add field2 bars */
            year.selectAll(".bar.field2")
                .data(d => [d])
                .enter()
                .append("rect")
                .attr("class", "bar field2")
                .style("fill", "green")
                .attr("x", d => xScale1('field2'))
                .attr("y", d => yScale(d.field2))
                .attr("width", xScale1.bandwidth())
                .attr("height", d => {
                    return height - margin.top - margin.bottom - yScale(d.field2)
                })
                .on("mousemove", function (d) {
                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(("Agriculture gdp") + "<br>" + (d.field2) + "%");
                })
                .on("mouseout", function (d) { tooltip.style("display", "none"); });

            /* Add field3 bars */
            year.selectAll(".bar.field3")
                .data(d => [d])
                .enter()
                .append("rect")
                .attr("class", "bar field3")
                .style("fill", "red")
                .attr("x", d => xScale1('field3'))
                .attr("y", d => yScale(d.field3))
                .attr("width", xScale1.bandwidth())
                .attr("height", d => {
                    return height - margin.top - margin.bottom - yScale(d.field3)
                })
                .on("mousemove", function (d) {
                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(("Services gdp") + "<br>" + (d.field3) + "%");
                })
                .on("mouseout", function (d) { tooltip.style("display", "none"); });

            // Add the X Axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
                .call(xAxis);


            // Add the Y Axis
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            // text label for the x axis
            svg.append("text")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height - margin.top ) + ")")
                .style("text-anchor", "middle")
                .style('font-weight', 'bold')
                .text("Year");


            // text label for the y axis
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2) + margin.bottom)
                .attr("dy", "1em")
                .style('font-weight', 'bold')
                .style("text-anchor", "middle")
                .text("GDP in %");

            //Legend
            let legend_name = ["Industry gdp", "Agriculture gdp", "Services gdp"];
            let legend_color = d3.scaleOrdinal()
                .range(["blue", "green", "red"]);

            let legend = svg.selectAll(".legend")
                .data(legend_name)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

            legend.append("rect")
                .attr("x", width / 2 - 190)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", legend_color);

            legend.append("text")
                .attr("x", width / 2 - 200)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) { return d; });

            // Position the legend at top of svg(-20 from the svg)
            legend.attr("transform", function (d, i) { return "translate(" + i * (width / 4) + ", -20)"; });

        });
    }

});