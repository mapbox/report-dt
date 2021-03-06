var currentSelection = 'objects';
var durationType = 'D';

$(document).ready(function () {

    init();

    var type, from, to;

    //Call queryAPI() when from and to change.
    $('.from, .to').on('change', function () {

        from = $('.from').val();
        to = $('.to').val();
        type = getDuration(from, to);

        queryAPI(from, to, type);
    });


    $('#objectsButton').click(function () {

        $('#objectsButton').prop('checked', true);
        $('#changesetsButton').prop('checked', false);

        currentSelection = 'objects';

        from = $('.from').val();
        to = $('.to').val();
        type = getDuration(from, to);

        queryAPI(from, to, type);
    });

    $('#changesetsButton').click(function () {
        $('#changesetsButton').prop('checked', true);
        $('#objectsButton').prop('checked', false);
        currentSelection = 'changesets';

        from = $('.from').val();
        to = $('.to').val();
        type = getDuration(from, to);

        queryAPI(from, to, type);
    });

});

function getDuration(from, to) {
    var timeDifference = moment.utc(to).diff(moment.utc(from), 'days');
    var type;

    if (timeDifference === 0) {
        type = 'h';
        durationType = 'h';
    } else if (timeDifference >= 1 && timeDifference <= 14) {
        type = 'd';
        durationType = 'd';
    } else if (timeDifference >= 15 && timeDifference <= 30) {
        type = 'd';
        durationType = 'w';
    } else {
        type = 'm';
        durationType = 'm';
    }

    return type;
}

function parseURL() {
    var result = {};

    switch (document.location.href.split('#')[1]) {
    case undefined:
        result.from = moment.utc().subtract(8, 'days');
        result.to = moment.utc().subtract(1, 'days');
        result.stats = 'objects';
        break;
    default :
        result.from = document.location.href.split('&from=')[1].split('&to=')[0];
        result.to = document.location.href.split('&to=')[1].split('&stats=')[0];
        result.stats = document.location.href.split('&stats=')[1];
    }
    return result;
}

function init() {

    var urlObjects = parseURL();

    var from = urlObjects.from,
        to = urlObjects.to;

    currentSelection = urlObjects.stats;
    var type  = getDuration(from, to);

    //invalid date/range selection error handling.
    //Should this be moved?
    if ((!moment.utc(from) && !moment.utc(to)) || moment.utc(from).diff(moment.utc(to)) > 0) {
        alert('Please enter a valid date range');
    }

    //Fix which button appears clicked.
    if (currentSelection === 'changesets') {
        $('#changesetsButton').prop('checked', true);
    } else {
        $('#objectsButton').prop('checked', true);
    }

    //Add the dates in the from/to boxes.
    $('.from').val(moment.utc(from).format('YYYY-MM-DD'));
    $('.to').val(moment.utc(to).format('YYYY-MM-DD'));

    //Call queryAPI with default dates.
    queryAPI($('.from').val(), $('.to').val(), type);
}

function truncate(str, maxLength, suffix) {
    if (str.length > maxLength) {
        str = str.slice(0, maxLength + 1);
        str = str.slice(0, Math.min(str.length, str.lastIndexOf(' ')));
        str = str + suffix;
    }
    return str;
}

function queryAPI(from, to, type) {

    //this superfluous variable can be removed once we can
    //query the backend for weekly stats
    var startTime = moment.utc(from) / 1000;
    var endTime = moment.utc(to).add(1, 'days') / 1000;


    document.location.href = document.location.href.split('#')[0] +
                            '#' + durationType + '&from=' + from + '&to=' +
                            to + '&stats=' + currentSelection;

    $.ajax({
        dataType: 'json',
        url: settings.host + type + '&' + startTime + '&' + endTime,
        success: function (json) {
            draw(json, from, to);
        }
    });
}

function preProcess(data) {
    var i, j;

    var totalObject = {
        'key': 'TOTAL',
        'color': '#FFFF00',
        'iduser': 'NaN',
        'total_changesets': 0,
        'total_objects': 0,
        'values': []
    };

    var timeLength = data[0].values.length;

    for (i = 0; i < timeLength; i++) {
        totalObject.values[i] = {};
        totalObject.values[i].change = 0;
        totalObject.values[i].y = 0;
        for (j = 0; j < data.length; j++) {
            totalObject.values[i].x = data[j].values[i].x;
            totalObject.values[i].change += data[j].values[i].change;
            totalObject.values[i].y += data[j].values[i].y;
        }
    }
    data.push(totalObject);

    //Calculate total changesets and objects per user
    for (i = 0; i < data.length; i++) {
        data[i].total_changesets = 0;
        data[i].total_objects = 0;
        for (j = 0; j < data[i].values.length; j++) {
            data[i].total_changesets += data[i].values[j].change;
            data[i].total_objects += data[i].values[j].y;
        }
    }

    return data;
}

function sortData(data) {
    var i, j;
    switch (currentSelection) {
        case 'changesets':
            for (i = 0; i < (data.length - 1); i++) {
                for (j = 0; j < (data.length - i - 1); j++) {
                    if (data[j].total_changesets < data[j+1].total_changesets) {
                        var swap  = data[j];
                        data[j]   = data[j+1];
                        data[j+1] = swap;
                    }
                }
            }
        return data;

        case 'objects':
            for (i = 0; i < (data.length - 1); i++) {
                for (j = 0; j < (data.length - i - 1); j++) {
                    if (data[j].total_objects < data[j+1].total_objects) {
                        var swap = data[j];
                        data[j]   = data[j+1];
                        data[j+1] = swap;
                    }
                }
            }
        return data;
    }
}

function returnMax(data) {
    var i, j;
    switch (currentSelection) {
    case 'changesets':
        var changesets = [];
        for (i = 1; i < data.length; i++) {
            for (j = 0; j < data[i].values.length; j++) {
                changesets.push(data[i].values[j].change);
            }
        }
        return _.max(changesets);
    case 'objects':
        var objectsModified = [];
        for (i = 1; i < data.length; i++) {
            for (j = 0; j < data[i].values.length; j++) {
                objectsModified.push(data[i].values[j].y);
            }
        }
        return _.max(objectsModified);
    }
}

function generateWeeklyStats(data, from, to) {
    var weeklyData = [],
        i, j,
        weekBeginnings = [];

    var noOfWeeks = Math.floor((moment.utc(to).diff(moment.utc(from), 'days')) / 7);

    for (i = 0; i <= noOfWeeks; i++) {
        weekBeginnings[i] = [moment.utc(from).add(i * 7, 'days'), moment.utc(from).add((i + 1) * 7, 'days')];
    }

    data.forEach(function (dataRow, index) {
        weeklyData[index] = {};
        weeklyData[index].values = [];
        weeklyData[index].key = dataRow.key;
        weeklyData[index].color = dataRow.color;
        weeklyData[index].iduser = dataRow.iduser;
        for (i = 0; i <= noOfWeeks; i++) {
            weeklyData[index].values[i] = {};
            weeklyData[index].values[i].x = d3.time.format.utc('%d/%m')(new Date(weekBeginnings[i][0])) +
                                            '-' + d3.time.format.utc('%d/%m')(new Date(weekBeginnings[i][1]));
            weeklyData[index].values[i].y = 0;
            weeklyData[index].values[i].change = 0;

            for (j = 0; j < data[index].values.length; j++) {
                if ((moment.utc(data[index].values[j].x).diff(moment.utc(weekBeginnings[i][0]), 'days') >= 0) && (moment.utc(data[index].values[j].x).diff(moment.utc(weekBeginnings[i][1]), 'days') <= 0)) {
                    weeklyData[index].values[i].y += data[index].values[j].y;
                    weeklyData[index].values[i].change += data[index].values[j].change;
                }
            }
        }
    });

    return weeklyData;
}

function getTicks(from, to) {
    var ticks = [], index, length;

    switch (durationType) {
    case 'h':
        length = 24;
        for (index = 0; index <= length; index++) {
            ticks[index] = moment.utc(from).add(index, 'hours');
        }
        break;
    case 'd':
        length = moment.utc(to).diff(moment.utc(from), 'days');
        for (index = 0; index <= length; index++) {
            ticks[index] = moment.utc(from).add(index, 'days');
        }
        break;
    case 'm':
        length = moment.utc(to).diff(moment.utc(from), 'months');
        for (index = 0; index <= length; index++) {
            ticks[index] = moment.utc(from).add(index, 'months');
        }
        break;
    case 'w':
        length = moment.utc(to).diff(moment.utc(from), 'weeks');
        for (index = 0; index <= length; index++) {
            ticks[index] = [moment.utc(from).add(index, 'weeks'),
                            moment.utc(from).add((index + 1), 'weeks')];
        }
    }

    return ticks;
}


function draw(data, from, to) {

    $('#chart svg').empty();

    // Generate weekly stats on client side. Remove once backend returns weekly data.
    if (durationType === 'w') {
        data = generateWeeklyStats(data, from, to);
    }

    data = sortData(preProcess(data));

    // Decides colours of the circles
    var c = d3.scale.category10();

    // For scaling circle radii,
    // take max of all data being shown and scale accordingly.
    var domainMax = returnMax(data);

    var axisTicks = getTicks(from, to);
    var totalTicks = axisTicks.length - 1;

    // SVG styling
    var svgMargin = {top: 50, right: 200, bottom: 0, left: 45}, svgWidth, rangeMax, svgHeight;

    if (totalTicks > 11) {
        svgWidth = (totalTicks * 50);
        rangeMax = 25;
        svgHeight = data.length * 62;
    } else {
        svgWidth = totalTicks * 100;
        rangeMax = 40;
        svgHeight = data.length * 82;
    }

    if ((totalTicks * 100) < $('body').innerWidth()) {
        $('#chart').css({'text-align': 'center'});
    }

    $('#chart svg').each(function () { $(this)[0].setAttribute('viewBox', '0 0 ' + (svgWidth) + ' ' + svgHeight); });

    var xScale = d3.scale.linear()
    .domain([0, totalTicks])
    .range([0, svgWidth]);

    var xAxis = d3.svg.axis()
    .scale(xScale)
    .ticks(totalTicks)
    .tickFormat(function (d, i) {
        switch (durationType) {
        case 'h':
            return d3.time.format.utc('%I%p')(new Date(axisTicks[i]));
        case 'd':
            return d3.time.format.utc('%d %b')(new Date(axisTicks[i]));
        case 'm':
            return d3.time.format.utc('%b %Y')(new Date(axisTicks[i]));
        case 'w':
            return d3.time.format.utc('%d/%m')(new Date(axisTicks[i][0])) + '-' +
                   d3.time.format.utc('%d/%m')(new Date(axisTicks[i][1]));
        }
    })
    .orient('top');

    // Append the svg to the body
    var svg = d3.select('#chart svg')
    .attr('width', svgWidth + svgMargin.left + svgMargin.right)
    .attr('height', svgHeight + svgMargin.top + svgMargin.bottom)
    .style('margin-left', svgMargin.left + 'px')
    .append('g')
    .attr('transform', 'translate(' + svgMargin.left + ',' + svgMargin.top + ')');

    // Append the svg axis
    svg.append('g')
    .attr('class', 'axis')
    .call(xAxis);

    var rScale = d3.scale.linear()
                   .domain([0, domainMax])
                   .range([2, rangeMax]);

    var osmUserURL = 'http://www.openstreetmap.org/user/';


    for (var i = 0; i < data.length; i++) {
        var g = svg.append('g');
        var commaFormat = d3.format(',');

        for (var j = 0; j < data[j].values.length; j++) {

            var gChild = g.append('g');
            var nodeData = getStats(i, j);

            if (i === 0) {
                gChild.append('circle')
                      .attr('cy', i * rangeMax * 2 + 55)
                      .attr('cx', j * (svgWidth / totalTicks))
                      .attr('r', 1)
                      .transition().duration(1000)
                      .attr('r', 0)
                      .style('fill', c(i))
                      .style('opacity', 0.5);

                nodeData = (nodeData === '') ? '' : commaFormat(nodeData);

                gChild.append('text')
                      .attr('y', i * rangeMax * 2 + 60)
                      .attr('x', j * (svgWidth / totalTicks))
                      .attr('text-anchor', 'middle')
                      .attr('font-weight', 'bold')
                      .text(nodeData)
                      .style('fill', '#25383C');
            } else {
                gChild.append('circle')
                      .attr('cy', i * rangeMax * 2 + 55)
                      .attr('cx', j * (svgWidth / totalTicks))
                      .attr('r', 0)
                      .transition().duration(1000)
                      .attr('r', rScale(nodeData))
                      .style('fill', c(i))
                      .style('opacity', 0.5);

                nodeData = (nodeData === '') ? '' : commaFormat(nodeData);

                gChild.append('text')
                      .attr('y', i * rangeMax * 2 + 60)
                      .attr('x', j * (svgWidth / totalTicks))
                      .attr('text-anchor', 'middle')
                      .text(nodeData)
                      .style('fill', '#25383C');
            }

        }

        // Append osm editors names to the right of the SVG
        if (i === 0) {
            g.append('text')
             .attr('y', i * rangeMax * 2 + 60)
             .attr('x', svgWidth + rangeMax + 1)
             .text(truncate(data[i].key, 5, '..') + ' (' + getTotalStats(i) + ')')
             .style('fill', c(i));
        } else {
            g.append('a')
             .attr('xlink:href', osmUserURL + data[i].key)
             .attr('target', '_blank')
             .append('text')
             .attr('y', i * rangeMax * 2 + 60)
             .attr('x', svgWidth + rangeMax + 1)
             .attr('text-decoration', 'underline')
             .text(truncate(data[i].key, 5, '..') + ' (' + getTotalStats(i) + ')')
             .style('fill', c(i));
        }
    }

    function getStats(i, j) {
        switch (currentSelection) {
        case 'objects':
            return (data[i].values[j].y > 0) ? data[i].values[j].y : '';
        case 'changesets':
            return (data[i].values[j].change > 0) ? data[i].values[j].change : '';
        }
    }

    function getTotalStats(i) {
        var commaFormat = d3.format(',');

        switch (currentSelection) {
        case 'objects':
            return commaFormat(data[i].total_objects);
        case 'changesets':
            return commaFormat(data[i].total_changesets);
        }
    }

}
