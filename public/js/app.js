(function(settings) {
    var start_str = '';//start_date
    var end_str = '';//end_date
    var start_times = 0;//start_time
    var end_times = 0;//end_time
    var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var date_xaxis = [];
    var json_obj = null;
    var url = document.URL;
    var type = null;
    var dates = [];
    var today = new Date();

    //Dates selected from "From" and "To" - URL eg: http://localhost:3000/#d&2015-07-20&2015-07-28
    if (url.indexOf("#") != -1 && url.indexOf("&") != -1) {
        dates = url.split('#')[1].split('&'); //=d&2015-07-20&2015-07-28
        type = dates[0]; //=d
        start_str = dates[1]; //2015-07-20
        end_str = dates[2]; //2015-07-28
    }
    //Dates not selected from "From" and "To" - default to "currentDate" and "currentDate - 8"
    else {
        type = 'd';
        end_str = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        today.setDate(today.getDate() - 8);
        start_str = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        dates.push(type);
        dates.push(start_str);
        dates.push(end_str);
    }

    //Get the start_times and end_times
    start_times = (new Date(start_str + " 00:00:00").getTime() / 1000);
    end_times = new Date(end_str + " 00:00:00").getTime() / 1000 + 24 * 60 * 60 - 1;

        function truncate(str, maxLength, suffix) {
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
            str = str + suffix;
        }
        return str;
    }

    Date.prototype.addDays = function(days) {
        var dat = new Date(this.valueOf())
        dat.setDate(dat.getDate() + days);
        return dat;
    }

    function draw_line(data) {
    var margin = {
            top: 20,
            right: 200,
            bottom: 0,
            left: 20
        },
        width = 1000;
        height = 500;

    //Map start_date and end_date to the two date strings.
    var start_date = new Date(start_str),
        end_date = new Date(end_str);

    //decides colours of the circles.
    var c = d3.scale.category20c();

    //define a time scale with the range 0 - width and map the domain start_date,end_date on it
    var x = d3.time.scale.utc()
        .domain([start_date, end_date])
        .range([0, width]);

    //create axis with the above defined time scale and orient it on top(x axis on top).
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(7)
        .orient("top");

    xAxis.tickFormat(date_format());

    //Append the svg to the body
    var svg = d3.select("#chart_line svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Append the svg axis
        svg.append("g")
            .attr("class", "x axis")
            // .attr("transform", "translate(0," + top + ")")
            .call(xAxis);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g").attr("class", "journal");

            var circles = g.selectAll("circle")
                .data(data[j].values)
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j].values)
                .enter()
                .append("text");

            var xScale = d3.time.scale()
            .domain([start_date, end_date])
            .range([0, width]);

            var rScale = d3.scale.log()
            .domain([1, 10])
            .range([0, 2]);

            circles
                .attr("cx", function(d, i) {
                    // console.log(new Date(d.x));
                    return x(new Date(d.x));
                })
                .attr("cy", j * 20 + 20)
                .attr("r", function(d) {
                    // console.log(d);
                    //This is to avoid the -infinity error.
                    if(d.change == 0)
                        return 1;
                    else
                        return rScale(d.y);
                })
                .style("fill", function(d) {
                    return c(j);
                });

            text
                .attr("y", j * 20 + 25)
                .attr("x", function(d, i) {
                    // console.log('d', d);
                    return x(new Date(d.x)) - 5;
                })
                .attr("class", "value")
                .text(function(d) {
                    // console.log(d);
                    return d.change;
                })
                .style("fill", function(d) {
                    return c(j);
                })
                .style("display", "none");

            g.append("text")
                .attr("y", j * 20 + 25)
                .attr("x", width + 20)
                .attr("class", "label")
                .text(truncate(data[j].key, 30, "..."))
                .style("fill", function(d) {
                    return c(j);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        };

        function mouseover(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "none");
            d3.select(g).selectAll("text.value").style("display", "block");
        }

        function mouseout(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "block");
            d3.select(g).selectAll("text.value").style("display", "none");
        }
        $('#chart_line').removeClass("loading");
    }

    function draw_line_changeset(data) {
        // console.log(data);
        _.each(data, function(val, key) {
            _.each(val.values, function(v) {
                v.y = v.change;
                v.x = new Date(v.x);
            });
        });
        var chart;
        var nv_line = nv;
        nv_line.addGraph(function() {
            var chart;
            chart = nv_line.models.lineChart().useInteractiveGuideline(true);
            chart
                .x(function(d, i) {
                    return d.x;
                });
            chart.margin({
                right: 63,
                left: 35
            });
            chart.xAxis
                .axisLabel('Date')
                .tickFormat(
                    date_format()
                );
            date_xaxis = _.uniq(date_xaxis);
            if (date_xaxis.length > 10) {
                date_xaxis = _.each(date_xaxis, function(v, k) {
                    return k % 2 == 0;
                });
            }
            chart.xAxis.tickValues(date_xaxis);
            chart.yAxis.tickFormat(d3.format(',.H'));
            d3.select('#chart_line_changeset svg')
                .datum(data)
                .transition().duration(500)
                .call(chart);
            nv_line.utils.windowResize(chart.update);
            return chart;
        });
        $('#chart_line_changeset').removeClass("loading");
    }

    function date_format() {
        var formatter;
        switch (type) {
            case 'h':
                //per hour
                formatter = function(d, i) {
                    if (typeof d === 'object') {
                        var date = new Date(d);
                        return d3.time.format.utc('%a %d %H%p')(date);
                    } else {
                        var date = new Date(d);
                        return d3.time.format.utc('%H%p')(date);
                    }
                }
                break;
            case 'd':
                //per day
                formatter = function(d, i) {
                    if (typeof d === 'object') {
                        var date = new Date(d);
                        return d3.time.format.utc('%a:%d %b')(date);
                    } else {
                        var date = new Date(d);
                        return d3.time.format.utc('%a:%d-%b')(date);
                    }
                }
                break;
            case 'm':
                // per month
                formatter = function(d, i) {
                    if (typeof d === 'object') {
                        var date = new Date(d);
                        return d3.time.format.utc('%b %Y')(date);
                    } else {
                        var date = new Date(d);
                        return d3.time.format.utc('%b %Y')(date);
                    }
                }
                break;
            case 'y':
                // per year
                formatter = function(d, i) {
                    if (typeof d === 'object') {
                        var date = new Date(d);
                        return d3.time.format.utc('%Y')(date);
                    } else {
                        var date = new Date(d);
                        return d3.time.format.utc('%Y')(date);
                    }
                }
                break;
        }
        return formatter;
    }

    $(document).ready(function() {
        $('.from').val(dates[1]);
        $('.to').val(dates[2]);
        $(".from").datepicker({
            weekStart: 1,
            dateFormat: 'yy-mm-dd',
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true,
            beforeShow: function(input, inst) {
                if (type === 'm') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $("#ui-datepicker-div").removeClass('YearDatePicker');
                } else if (type === 'y') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $("#ui-datepicker-div").addClass('YearDatePicker');
                } else {
                    $("#ui-datepicker-div").removeClass('YearDatePicker');
                    $(inst.dpDiv).removeClass('calendar-off');
                }
            },
            onClose: function(selectedDate) {
                if ($(window.event.srcElement).hasClass('ui-datepicker-close')) {
                    if (type === 'm') {
                        var m = parseInt($("#ui-datepicker-div .ui-datepicker-month :selected").val());
                        var y = parseInt($("#ui-datepicker-div .ui-datepicker-year :selected").val());
                        $(this).datepicker("setDate", new Date(y, m, '01'));
                        draw();
                    } else if (type === 'y') {
                        var y = parseInt($("#ui-datepicker-div .ui-datepicker-year :selected").val());
                        $(this).datepicker("setDate", new Date(y, '01', '01'));
                        draw();
                    } else {

                    }
                }
                $(".to").datepicker("option", "minDate", start_str);
            },
            yearRange: '2015:' + today.getFullYear()
        });
        $(".to").datepicker({
            weekStart: 1,
            dateFormat: 'yy-mm-dd',
            //numberOfMonths: 2,
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true,
            beforeShow: function(input, inst) {
                if (type === 'm') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $("#ui-datepicker-div").removeClass('YearDatePicker');
                } else if (type === 'y') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $("#ui-datepicker-div").addClass('YearDatePicker');
                } else {
                    $("#ui-datepicker-div").removeClass('YearDatePicker');
                    $(inst.dpDiv).removeClass('calendar-off');
                }
            },
            onClose: function(selectedDate) {
                if ($(window.event.srcElement).hasClass('ui-datepicker-close')) {
                    if (type === 'm') {
                        var m = parseInt($("#ui-datepicker-div .ui-datepicker-month :selected").val());
                        var y = parseInt($("#ui-datepicker-div .ui-datepicker-year :selected").val());
                        $(this).datepicker("setDate", new Date(y, m, '01'));
                        draw();
                    } else if (type === 'y') {
                        var y = parseInt($("#ui-datepicker-div .ui-datepicker-year :selected").val());
                        $(this).datepicker("setDate", new Date(y, '01', '01'));
                        draw();
                    } else {

                    }
                }
                $(".from").datepicker("option", "maxDate", end_str);
            },
            yearRange: '2015:' + today.getFullYear()
        });

        $(".from").datepicker("option", "maxDate", end_str);
        $(".to").datepicker("option", "minDate", start_str);
        $(".from").on("change", function() {
            draw();
        });
        $(".to").on("change", function() {
            draw();
        });
        $(".dropdown-menu li a").click(function() {
            var selText = $(this).text();
            type = $(this).attr("id");
            $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
            draw();
            setTimeout(function() {
                location.href = document.URL.split('#')[0] + '#' + type + '&' + start_str + '&' + end_str;
            }, 200);
        });
        $('.type_label').text($('#' + type).text());
        draw();
    });

    function todate(timestamp) {
        var date = new Date(timestamp * 1000);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return year + '-' + month + '-' + day;
    }

    function draw() {
        start_str = $('.from').val();
        start_times = Date.UTC(parseInt(start_str.split('-')[0]), parseInt(start_str.split('-')[1]) - 1, parseInt(start_str.split('-')[2])) / 1000;
        end_str = $('.to').val();
        end_times = Date.UTC(parseInt(end_str.split('-')[0]), parseInt(end_str.split('-')[1]) - 1, parseInt(end_str.split('-')[2])) / 1000 + 24 * 60 * 60;
        if (start_times > end_times) {
            alert('Select a range of correct dates');
            return null;
        } else {
            switch (type) {
                case 'h':
                    if ((end_times - start_times) > 8 * 24 * 3600) {
                        $("#span-warning").text(' This is a weekly edit report. Please select a 7 day duration or lesser.');
                        $('#error-warning').show();
                        setTimeout(function() {
                            $('#error-warning').hide();
                        }, 8000);
                        return null;
                    }
                    break;
                case 'd':
                    if ((end_times - start_times) > 8 * 24 * 3600) {
                        $("#span-warning").text(' This is a weekly edit report. Please select a 7 day duration or lesser.');
                        $('#error-warning').show();
                        setTimeout(function() {
                            $('#error-warning').hide();
                        }, 8000);
                        return null;
                    }
                    // if ((end_times - start_times) > 24 * 60 * 60 * 30 * 3) {
                    //     return null;
                    // }
                    break;
                case 'm':
                    start_str = $('.from').val();
                    start_times = Date.UTC(parseInt(start_str.split('-')[0]), parseInt(start_str.split('-')[1]) - 1, 1) / 1000;
                    end_str = $('.to').val();
                    end_times = Date.UTC(parseInt(end_str.split('-')[0]), parseInt(end_str.split('-')[1]) - 1, 1) / 1000 + 24 * 60 * 60 * months[parseInt(end_str.substring(5, 7)) - 1];
                    start_str = start_str.split('-')[0] + '-' + start_str.split('-')[1] + '-01';
                    end_str = end_str.split('-')[0] + '-' + end_str.split('-')[1] + '-' + months[parseInt(end_str.substring(5, 7)) - 1];
                    $('.from').val(start_str);
                    $('.to').val(end_str);
                    break;
                case 'y':
                    start_str = $('.from').val();
                    start_times = Date.UTC(parseInt(start_str.split('-')[0]), 0, 1) / 1000;
                    end_str = $('.to').val();
                    end_times = Date.UTC(parseInt(end_str.split('-')[0]), 1, 1) / 1000 + 24 * 60 * 60 * 365;
                    start_str = start_str.split('-')[0] + '-01-01';
                    end_str = end_str.split('-')[0] + '-12-31'
                    $('.from').val(start_str);
                    $('.to').val(end_str);
                    break;
            }
        }
        if (start_str === end_str) {
            $('.label_bar').text('Date ' + start_str);
            $('.label_line').text('Date ' + start_str);
        } else {
            $('.label_bar').text('Date: From ' + start_str + ' to ' + end_str);
            $('.label_line').text('Date: From ' + start_str + ' to ' + end_str);
        }
        $('#chart_line').empty();
        $('#chart_line').html('<svg></svg>');
        $('#chart_line_changeset').empty();
        $('#chart_line_changeset').html('<svg></svg>');

        $.ajax({
            dataType: "json",
            url: settings.host + type + '&' + start_times + '&' + end_times,
            success: function(json) {
                //json - set of JSON values for each user whose name and details({"x":"date","y":"no-of-objects-modified"(for "OBJECTS MODIFIED" graph - the first graph) ,"change":"no-of-changesets"(for "CHANGESETS" graph - the second graph)}) are represented in the graph.
                date_xaxis = [];
                json_obj = [];
                _.each(json, function(val, key) {
                    /*val iterates through each item in the json object(eg: {"values":[{"x":"2015-07-25","y":0,"change":0},{"x":"2015-07-26","y":0,"change":0},{"x":"2015-07-27","y":0,"change":0},{"x":"2015-07-28","y":0,"change":0}],"key":"Rub21","color":"#0171C5","iduser":510836}). key iterates from 0 upwards*/
                    val.values_obj = null; // BUG(?) - is always undefined before this declaration.
                    //type defaults to type global( 'd','h','m','y')
                    switch (type) {
                            //BUG(?) - Hour/Day/Month/Year Values are being pushed for each user for the same time interval?(because of the _.each on line 347 and the _.each for each switch case)
                        case 'h':
                            //per hour
                            _.each(val.values, function(v, k) {
                                //v is each item in val.values( eg of val.values: {"x":"2015-07-25","y":0,"change":0})
                                //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                                var d = val.values[k].x.split('-');
                                var date_timestamp = Date.UTC(d[0],
                                    parseInt(d[1]) - 1,
                                    parseInt(d[2]), parseInt(d[3]), 0);
                                var utc = new Date(date_timestamp);
                                val.values[k].x = utc;
                                date_xaxis.push(date_timestamp);

                            });
                            break;
                        case 'd':
                            //per day
                            _.each(val.values, function(v, k) {
                                //v is each item in val.values( eg of val.values: {"x":"2015-07-25","y":0,"change":0})
                                //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                                var d = val.values[k].x.split('-');
                                var date_timestamp = Date.UTC(parseInt(d[0]),
                                    parseInt(d[1]) - 1,
                                    parseInt(d[2]));
                                var utc = new Date(date_timestamp);
                                val.values[k].x = utc;
                                date_xaxis.push(date_timestamp);
                            });
                            break;
                        case 'm':
                            _.each(val.values, function(v, k) {
                                //v is each item in val.values( eg of val.values: {"x":"2015-07-25","y":0,"change":0})
                                //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                                var d = val.values[k].x.split('-');
                                var date_timestamp = Date.UTC(d[0],
                                    parseInt(d[1]) - 1, 12, 0, 0);
                                var utc = new Date(date_timestamp);
                                val.values[k].x = utc;
                                date_xaxis.push(date_timestamp);
                            });
                            break;
                        case 'y':
                            _.each(val.values, function(v, k) {
                                //v is each item in val.values( eg of val.values: {"x":"2015-07-25","y":0,"change":0})
                                //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                                var d = val.values[k].x.split('-');
                                var date_timestamp = Date.UTC(d[0], 0, 2, 0, 0);
                                var utc = new Date(date_timestamp);
                                val.values[k].x = utc;
                                date_xaxis.push(date_timestamp);
                            });
                            break;
                    }
                    json_obj.push(val);
                });
                //first graph
                draw_line(json_obj);
                //second graph
                draw_line_changeset(JSON.parse(JSON.stringify(json_obj)));
            }
        });
        $('#chart_line').addClass("loading");
        $('#chart_line_changeset').addClass("loading");
        location.href = document.URL.split('#')[0] + '#' + type + '&' + start_str + '&' + end_str;
    }
})(settings);