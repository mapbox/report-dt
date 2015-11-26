var osmium = require('osmium');
var os = require('os');
var path = require('path');
var _ = require('underscore');
module.exports = function(arr, users, done) {
	var obj = {
		users: null,
		osmdate: null
	};
	var folder = os.tmpDir();
	var osmfile = arr[1].pad(3) + ".osc"; //completa el nombre a 006
	var fileSrc = path.join(folder, osmfile);

	console.log('Process file :' + fileSrc);


	//var file = new osmium.File(fileSrc);
	var reader = new osmium.Reader(fileSrc);
	var handler = new osmium.Handler();
	//WAY
	handler.on('way', function(way) {
		obj.osmdate = way.timestamp_seconds_since_epoch - way.timestamp_seconds_since_epoch % 1000;
		if (users.hasOwnProperty(way.uid)) {
			++users[way.uid].osm_way;
			users[way.uid].changeset.push(way.changeset);
		}
	});
	//NODE
	handler.on('node', function(node) {
		if (users.hasOwnProperty(node.uid)) {
			++users[node.uid].osm_node;
			users[node.uid].changeset.push(node.changeset);
		}
	});
	//RELATION
	handler.on('relation', function(relation) {
		if (users.hasOwnProperty(relation.uid)) {
			++users[relation.uid].osm_relation;
			users[relation.uid].changeset.push(relation.changeset);
		}
	});
	osmium.apply(reader, handler);
	_.each(users, function(val, key) {
		val.changeset = _.size(_.uniq(val.changeset));
	});
	obj.users = users;
	done(obj);
}

Number.prototype.pad = function(size) {
	var s = String(this);
	while (s.length < (size || 2)) {
		s = "0" + s;
	}
	return s;
}