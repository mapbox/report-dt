(function (settings) {
    var startDateString = '';//startDate
    var endDateString = '';//endDate
    var startTime = 0;//start_time
    var endTime = 0;//end_time
    var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var dateXAxis = [];
    var jsonObject = null;
    var url = document.URL;
    var type = null;
    var dates = [];
    var today = new Date();

    if (url.indexOf('#') !== -1 && url.indexOf('&') !== -1) {
        //Dates selected from 'From' and 'To' -
        //URL eg: http://localhost:3000/#d&2015-07-20&2015-07-28
        dates = url.split('#')[1].split('&'); //=d&2015-07-20&2015-07-28
        type = dates[0]; //=d
        startDateString = dates[1]; //2015-07-20
        endDateString = dates[2]; //2015-07-28
    } else {
        //Dates not selected from 'From' and 'To' -
        //default to 'currentDate' and 'currentDate - 7'
        type = 'd';
        endDateString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        today.setDate(today.getDate() - 7);
        startDateString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        dates.push(type);
        dates.push(startDateString);
        dates.push(endDateString);
    }

  //Get the startTime and endTime
    startTime = (new Date(startDateString + ' 00:00:00').getTime() / 1000);
    endTime = new Date(endDateString + ' 00:00:00').getTime() / 1000 + 24 * 60 * 60 - 1;

    function truncate(str, maxLength, suffix) {
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(' ')));
            str = str + suffix;
        }
        return str;
    }

    function drawGraph(whichGraph, data){
        //SVG margins
        var margin = {
                top: 20,
                right: 200,
                bottom: 0,
                left: 20
            },
            //SVG width and height
            width = 1000,
            height = 600;

        //Map startDate and endDate to the two date strings.
        var startDate = new Date(startDateString),
            endDate = new Date(endDateString);

        //decides colours of the circles
        var c = d3.scale.category20c();

        //define a time scale with the range 0 - width and map the domain startDate,endDate on it
        var noOfTicks = 0;
        var dateTickValues = [];
        var limit;

        switch (type) {
        case 'h':
            noOfTicks = 23;
            //new Date(JSON.parse(JSON.stringify(startDate))) done to shallow copy
            //the startDate value into dateTickValues. If
            //dateTickValues[index] = startDate; is done
            //It amounts to a deep copy. Array elements get overwritten with the
            //latest value of startDate which is pointless.
            limit = 23;
            for (var index = 0; index <= limit; index++) {
            //new Date(JSON.parse(JSON.stringify(startDate))) done to shallow copy
            //the startDate value into dateTickValues. If
            //dateTickValues[index] = startDate; is done
            //It amounts to a deep copy. Array elements get overwritten with the
            //latest value of startDate which is pointless.
                dateTickValues[index] = new Date(JSON.parse(JSON.stringify(startDate)));
                startDate.setHours(startDate.getHours() + 1);
            }
            break;

        case 'd':
            limit = 0;
            for (index = startDate.getTime(); index <= endDate.getTime(); ) {
        //new Date(JSON.parse(JSON.stringify(startDate))) done to shallow copy
        //the startDate value into dateTickValues. If
        //dateTickValues[index] = startDate; is done
        //It amounts to a deep copy. Array elements get overwritten with the
        //latest value of startDate which is pointless.
                dateTickValues[limit] = new Date(JSON.parse(JSON.stringify(startDate)));
                startDate.setDate(startDate.getDate() + 1);
                index = startDate.getTime();
                limit += 1;
            }
            noOfTicks = limit - 1;
            break;

        case 'm':
            noOfTicks = endDate.getMonth() - startDate.getMonth();
            limit = endDate.getMonth() - startDate.getMonth();
            for     (var index = 0; index <= limit; index++) {
                //new Date(JSON.parse(JSON.stringify(startDate))) done to shallow copy
                //the startDate value into dateTickValues. If
                //dateTickValues[index] = startDate; is done
                //It amounts to a deep copy. Array elements get overwritten with the
                //latest value of startDate which is pointless.
                dateTickValues[index] = new Date(JSON.parse(JSON.stringify(startDate)));
                startDate.setMonth(startDate.getMonth() + 1);
            }
            break;
        case 'y':
            noOfTicks = endDate.getFullYear() - startDate.getFullYear();
            limit = endDate.getFullYear() - startDate.getFullYear();
            for (var index = 0; index <= limit; index++) {
                //new Date(JSON.parse(JSON.stringify(startDate))) done to shallow copy
                //the startDate value into dateTickValues. If
                //dateTickValues[index] = startDate; is done
                //It amounts to a deep copy. Array elements get overwritten with the
                //latest value of startDate which is pointless..
                dateTickValues[index] = new Date(JSON.parse(JSON.stringify(startDate)));
                startDate.setYear(startDate.getFullYear() + 1);
            }
            break;
        }

        //If the noOfTicks = 0 for example when startDate = endDate, ensure that
        //at least one tick is present for values to appear under.
        noOfTicks = (noOfTicks < 1) ? 1 : noOfTicks;
        //If the graph has only one tick(when looking at data for just 2015, or when
        //startDate = endDate), then there is only one tick label which means that
        //the right end of the graph has no tick label. To solve this, have two
        //tick labels alone, and push the same value twice into dateTickValues
        dateTickValues[1] = (dateTickValues.length == 1) ? dateTickValues[0] : dateTickValues [1];

        var x = d3.scale.linear()
        .domain([0, noOfTicks])
        .range([0, width]);

        //create axis with the above defined time scale and orient it on top(x axis on top).
        var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(noOfTicks)
        .tickFormat(function (d, i) {
            switch (type) {
            case 'h':
                return d3.time.format.utc('%I%p')(new Date(dateTickValues[i]));
            case 'd':
                return d3.time.format.utc('%a:%d %b')(new Date(dateTickValues[i]));
            case 'm':
                return d3.time.format.utc('%b %Y')(new Date(dateTickValues[i]));
            case 'y':
                return d3.time.format.utc('%Y')(new Date(dateTickValues[i]));
            }
        })
        .orient('top');

        //Append the svg to the body
        var svg = d3.select(whichGraph)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('margin-left', margin.left + 'px')
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //Append the svg axis
        svg.append('g')
        .attr('class', 'x axis')
        .call(xAxis);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append('g');

            var circles = g.selectAll('circle')
                           .data(data[j].values)
                           .enter()
                           .append('circle');

            var text = g.selectAll('text')
                        .data(data[j].values)
                        .enter()
                        .append('text');

            var xScale = d3.time.scale()
                           .domain([startDate, endDate])
                           .range([0, width]);

            var rScale = d3.scale.log()
                           .domain([1, 10])
                           .range([0, 2]);

            circles
            .attr('cx', function (d, i) {
                return (width / noOfTicks) * i;
            })
            .attr('class', function (d, i) {
                // console.log(new Date(d.x));
                // console.log('cx ' + x(new Date(d.x)))
                return 'circleColumn' + i;
            })
            .attr('cy', j * 20 + 20)
            .attr('r', function (d) {
                console.log('rScale ');
                console.log(d);

                switch (whichGraph) {
                case '#chart_line svg':
                        //This is to avoid the -infinity error.
                    if (d.y === 0 || d.y === null){
                        return 1;
                    } else {
                        return rScale(d.y);
                    }
                case '#chart_line_changeset svg':
                    if (d.change === 0 || d.change === null){
                        return 1;
                    } else {
                        return rScale(d.change);
                    }

                }
            })
            .style('fill', function () {
                return c(j);
            });

            text
            .attr('y', j * 20 + 25)
            .attr('x', function (d, i) {
                // console.log('d', d);
                return (width / noOfTicks) * i - 5;
            })
            .attr('class', function(d, i) {
                return 'circleTextColumn' + i + ' value';
            })
            .text(function (d) {
                // console.log(d);
                switch (whichGraph) {
                case '#chart_line svg':
                    return d.y;
                case '#chart_line_changeset svg':
                    return d.change;
                }
            })
            .style('fill', function (d) {
                return c(j);
            })
            .style('display', 'none');

            //Append osm editors names to the right of the SVG=============================
            g.append('text')
             .attr('y', j * 20 + 25)
             .attr('x', width + 60)
             .attr('class', 'label')
             .text(truncate(data[j].key, 30, '...'))
             .style('fill', function (d) {
                 return c(j);
             })
             .on('mouseover', mouseover)
             .on('mouseout', mouseout);

            //Mouseover and Mouseout over ticks============================================
            d3.selectAll('.x')
              .selectAll('.tick.major')
              .on('mouseover', tickMouseover);

            d3.selectAll('.x')
              .selectAll('.tick.major')
              .on('mouseout', tickMouseout);
            //=============================================================================
        }

        $('#chart_line').removeClass('loading');
        $('#chart_line_changeset').removeClass('loading');

        function tickMouseover(p, i) {
            console.log('tickMouseover');
            d3.selectAll('.circleColumn' + i).style('display', 'none');
            d3.selectAll('.circleTextColumn' + i).style('display', 'block');
        }

        function tickMouseout(p, i) {
            console.log('tickMouseout');
            d3.selectAll('.circleColumn' + i).style('display', 'block');
            d3.selectAll('.circleTextColumn' + i).style('display', 'none');
        }

        function mouseover() {
            console.log('mouseover');
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll('circle').style('display', 'none');
            d3.select(g).selectAll('text.value').style('display', 'block');
        }

        function mouseout() {
            console.log('mouseout');
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll('circle').style('display', 'block');
            d3.select(g).selectAll('text.value').style('display', 'none');
        }
    }

    $(document).ready(function() {
        $('.from').val(dates[1]);
        $('.to').val(dates[2]);

        $('.from').datepicker({
            weekStart: 1,
            dateFormat: 'yy-mm-dd',
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true,
            beforeShow: function (input, inst) {
                if (type === 'm') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $('#ui-datepicker-div').removeClass('YearDatePicker');
                } else if (type === 'y') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $('#ui-datepicker-div').addClass('YearDatePicker');
                } else {
                    $('#ui-datepicker-div').removeClass('YearDatePicker');
                    $(inst.dpDiv).removeClass('calendar-off');
              }
            },
            onClose: function (selectedDate) {
                if ($(window.event.srcElement).hasClass('ui-datepicker-close')) {
                    if (type === 'm') {
                        var m = parseInt($('#ui-datepicker-div .ui-datepicker-month :selected').val());
                        var y = parseInt($('#ui-datepicker-div .ui-datepicker-year :selected').val());
                        $(this).datepicker('setDate', new Date(y, m, '01'));
                        draw();
                    } else if (type === 'y') {
                        var y = parseInt($('#ui-datepicker-div .ui-datepicker-year :selected').val());
                        $(this).datepicker('setDate', new Date(y, '01', '01'));
                        draw();
                    }
                }
                $('.to').datepicker('option', 'minDate', startDateString);
            },
            yearRange: '2015:' + today.getFullYear()
        });

        $('.to').datepicker({
            weekStart: 1,
            dateFormat: 'yy-mm-dd',
            //numberOfMonths: 2,
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true,
            beforeShow: function(input, inst) {
                if (type === 'm') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $('#ui-datepicker-div').removeClass('YearDatePicker');
                } else if (type === 'y') {
                    $(inst.dpDiv).addClass('calendar-off');
                    $('#ui-datepicker-div').addClass('YearDatePicker');
                } else {
                    $('#ui-datepicker-div').removeClass('YearDatePicker');
                    $(inst.dpDiv).removeClass('calendar-off');
                }
            },
            onClose: function(selectedDate) {
                if ($(window.event.srcElement).hasClass('ui-datepicker-close')) {
                    if (type === 'm') {
                        var m = parseInt($('#ui-datepicker-div .ui-datepicker-month :selected').val());
                        var y = parseInt($('#ui-datepicker-div .ui-datepicker-year :selected').val());
                        $(this).datepicker('setDate', new Date(y, m, '01'));
                        draw();
                    } else if (type === 'y') {
                        var y = parseInt($('#ui-datepicker-div .ui-datepicker-year :selected').val());
                        $(this).datepicker('setDate', new Date(y, '01', '01'));
                        draw();
                    }
                }
            $('.from').datepicker('option', 'maxDate', endDateString);
            },
            yearRange: '2015:' + today.getFullYear()
        });

        $('.from').datepicker('option', 'maxDate', endDateString);
        $('.to').datepicker('option', 'minDate', startDateString);
        $('.from').on('change', function () {
            draw();
        });
        $('.to').on('change', function () {
            draw();
        });
        $('.dropdown-menu li a').click(function () {
            console.log('drop down menu');
            var selText = $(this).text();
            console.log('selText ' + selText);
            type = $(this).attr('id');
            console.log('type ' + type);
            $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
            draw();
            setTimeout(function () {
                console.log('location.URL startDateString: ' + startDateString + '  type: ' + type + ' endDateString ' + endDateString);
                location.href = document.URL.split('#')[0] + '#' + type + '&' + startDateString + '&' + endDateString;
            }, 200);
        });
        $('.type_label').text($('#' + type).text());
            draw();
    });

    function draw() {
        startDateString = $('.from').val();
        startTime = Date.UTC(parseInt(startDateString.split('-')[0]), parseInt(startDateString.split('-')[1]) - 1, parseInt(startDateString.split('-')[2])) / 1000;
        endDateString = $('.to').val();
        endTime = Date.UTC(parseInt(endDateString.split('-')[0]), parseInt(endDateString.split('-')[1]) - 1, parseInt(endDateString.split('-')[2])) / 1000 + 24 * 60 * 60;

        if (startTime > endTime) {
            alert('Select a range of correct dates');
            return null;
        } else {
            switch (type) {
            case 'h':
                if ((endTime - startTime) > 24 * 3600) {
                    $('#span-warning').text(' Per hour stats are only available for one day. ');
                    $('#error-warning').show();
                    setTimeout(function () {
                        $('#error-warning').hide();
                    }, 8000);
                    return null;
                }
                break;
            case 'd':
                if ((endTime - startTime) > 8 * 24 * 3600) {
                    $('#span-warning').text(' Per day stats are available only for 7 day durations. ');
                    $('#error-warning').show();
                    setTimeout(function () {
                        $('#error-warning').hide();
                    }, 8000);
                    return null;
                }
                break;
            case 'm':
                startDateString = $('.from').val();
                startTime = Date.UTC(parseInt(startDateString.split('-')[0]), parseInt(startDateString.split('-')[1]) - 1, 1) / 1000;
                endDateString = $('.to').val();
                endTime = Date.UTC(parseInt(endDateString.split('-')[0]), parseInt(endDateString.split('-')[1]) - 1, 1) / 1000 + 24 * 60 * 60 * months[parseInt(endDateString.substring(5, 7)) - 1];
                startDateString = startDateString.split('-')[0] + '-' + startDateString.split('-')[1] + '-01';
                endDateString = endDateString.split('-')[0] + '-' + endDateString.split('-')[1] + '-' + months[parseInt(endDateString.substring(5, 7)) - 1];
                $('.from').val(startDateString);
                $('.to').val(endDateString);
                break;
            case 'y':
                startDateString = $('.from').val();
                startTime = Date.UTC(parseInt(startDateString.split('-')[0]), 0, 1) / 1000;
                endDateString = $('.to').val();
                endTime = Date.UTC(parseInt(endDateString.split('-')[0]), 1, 1) / 1000 + 24 * 60 * 60 * 365;
                startDateString = startDateString.split('-')[0] + '-01-01';
                endDateString = endDateString.split('-')[0] + '-12-31'
                $('.from').val(startDateString);
                $('.to').val(endDateString);
                break;
            }
        }
        if (startDateString === endDateString) {
            $('.label_bar').text('Date ' + startDateString);
            $('.label_line').text('Date ' + startDateString);
        } else {
            $('.label_bar').text('Date: From ' + startDateString + ' to ' + endDateString);
            $('.label_line').text('Date: From ' + startDateString + ' to ' + endDateString);
        }

        $('#chart_line').empty();
        $('#chart_line').html('<svg></svg>');
        $('#chart_line_changeset').empty();
        $('#chart_line_changeset').html('<svg></svg>');

        $.ajax({
            dataType: 'json',
            url: settings.host + type + '&' + startTime + '&' + endTime,
            success: function (json) {
                //json - set of JSON values for each user whose name and details({'x':'date','y':'no-of-objects-modified'(for 'OBJECTS MODIFIED' graph - the first graph) ,'change':'no-of-changesets'(for 'CHANGESETS' graph - the second graph)}) are represented in the graph.
                dateXAxis = [];
                jsonObject = [];
                _.each(json, function (val, key) {
                    /*val iterates through each item in the json object(eg: {'values':[{'x':'2015-07-25','y':0,'change':0},{'x':'2015-07-26','y':0,'change':0},{'x':'2015-07-27','y':0,'change':0},{'x':'2015-07-28','y':0,'change':0}],'key':'Rub21','color':'#0171C5','iduser':510836}). key iterates from 0 upwards*/
                    val.values_obj = null; // BUG(?) - is always undefined before this declaration.
                    //type defaults to type global( 'd','h','m','y')
                    switch (type) {
                        //BUG(?) - Hour/Day/Month/Year Values are being pushed for each user for the same time interval?(because of the _.each on line 347 and the _.each for each switch case)
                    case 'h':
                        //per hour
                        _.each(val.values, function (v, k) {
                        //v is each item in val.values( eg of val.values: {'x':'2015-07-25','y':0,'change':0})
                        //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                            var d = val.values[k].x.split('-');
                            var dateTimeStamp = Date.UTC(d[0],
                            parseInt(d[1]) - 1,
                            parseInt(d[2]), parseInt(d[3]), 0);
                            var utc = new Date(dateTimeStamp);
                            val.values[k].x = utc;
                            dateXAxis.push(dateTimeStamp);

                        });
                        break;
                    case 'd':
                        //per day
                        _.each(val.values, function (v, k) {
                            //v is each item in val.values( eg of val.values: {'x':'2015-07-25','y':0,'change':0})
                            //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                            var d = val.values[k].x.split('-');
                            var dateTimeStamp = Date.UTC(parseInt(d[0]),
                            parseInt(d[1]) - 1,
                            parseInt(d[2]));
                            var utc = new Date(dateTimeStamp);
                            val.values[k].x = utc;
                            dateXAxis.push(dateTimeStamp);
                        });
                        break;
                    case 'm':
                        _.each(val.values, function (v, k) {
                            //v is each item in val.values( eg of val.values: {'x':'2015-07-25','y':0,'change':0})
                            //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                            var d = val.values[k].x.split('-');
                            var dateTimeStamp = Date.UTC(d[0],
                            parseInt(d[1]) - 1, 12, 0, 0);
                            var utc = new Date(dateTimeStamp);
                            val.values[k].x = utc;
                            dateXAxis.push(dateTimeStamp);
                        });
                        break;
                    case 'y':
                        _.each(val.values, function(v, k) {
                            //v is each item in val.values( eg of val.values: {'x':'2015-07-25','y':0,'change':0})
                            //split the val.values[0].x by '-', val.values[1].x by '-' and so on. val.values[1].x is the date under process,so the date gets split into date, month and year and store in 'd'
                            var d = val.values[k].x.split('-');
                            var dateTimeStamp = Date.UTC(d[0], 0, 2, 0, 0);
                            var utc = new Date(dateTimeStamp);
                            val.values[k].x = utc;
                            dateXAxis.push(dateTimeStamp);
                        });
                    break;
                  }
                    jsonObject.push(val);
                });
                //first graph
                drawGraph('#chart_line svg', jsonObject);
                //second graph
                drawGraph('#chart_line_changeset svg',JSON.parse(JSON.stringify(jsonObject)));
            }
        });
        $('#chart_line').addClass('loading');
        $('#chart_line_changeset').addClass('loading');
        location.href = document.URL.split('#')[0] + '#' + type + '&' + startDateString + '&' + endDateString;
    }
})(settings);
