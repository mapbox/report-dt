var dataTeam = require('mapbox-data-team');
var fs = require('fs');

var team = dataTeam.getEverything();
var query;
team.forEach(function(member) {
    query = 'select add_user(' + member.uid + ', "' + member.username + '", "0171C5",true);\n';
    fs.appendFileSync(__dirname + '/add_user.sql', query, encoding='utf8');
});
