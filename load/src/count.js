'use strict';
var osmium = require('osmium');
var os = require('os');
var path = require('path');
var _ = require('underscore');

var tags = {};
module.exports = function(arr, users, osmtags, done) {
	tags = osmtags;
	var obj = {
		users: null,
		osmdate: null
	};
	var folder = os.tmpDir();
	var osmfile = arr[1].pad(3) + ".osc";
	var fileSrc = path.join(folder, osmfile);
	console.log('Process file :' + fileSrc);
	var reader = new osmium.Reader(fileSrc);
	var handler = new osmium.Handler();
	//WAY	
	handler.on('way', function(way) {
		obj.osmdate = way.timestamp_seconds_since_epoch - way.timestamp_seconds_since_epoch % 1000;
		if (users.hasOwnProperty(way.uid)) {
			++users[way.uid].osm_way;
			users[way.uid].changeset.push(way.changeset);
			users = counttags(users, way);
		}
	});
	//NODE
	handler.on('node', function(node) {
		if (users.hasOwnProperty(node.uid)) {
			++users[node.uid].osm_node;
			users[node.uid].changeset.push(node.changeset);
			users = counttags(users, node);
		}
	});
	//RELATION
	handler.on('relation', function(relation) {
		if (users.hasOwnProperty(relation.uid)) {
			++users[relation.uid].osm_relation;
			users[relation.uid].changeset.push(relation.changeset);
			users = counttags(users, relation);
		}
	});
	osmium.apply(reader, handler);
	_.each(users, function(val, key) {
		val.changeset = _.size(_.uniq(val.changeset));
		_.each(val.tags, function(v, k) {
			val.tags[k] = sortObject(val.tags[k]);
		});
	});
	obj.users = users;
	done(obj);
};

Number.prototype.pad = function(size) {
	var s = String(this);
	while (s.length < (size || 2)) {
		s = "0" + s;
	}
	return s;
};

function counttags(users, obj) {
	_.each(obj.tags(), function(v, k) {
		if (tags[k] && (tags[k][v] || tags[k].all)) {
			if (users[obj.uid].tags[k]) {
				if (users[obj.uid].tags[k][v]) {
					users[obj.uid].tags[k][v] = users[obj.uid].tags[k][v] + 1;
				} else {
					users[obj.uid].tags[k][v] = 1;
				}
			} else {
				users[obj.uid].tags[k] = {};
				users[obj.uid].tags[k][v] = 1;
			}
		}
	});
	return users;
}

function sortObject(obj) {
	var arr = [];
	var prop;
	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			arr.push({
				key: prop,
				value: obj[prop]
			});
		}
	}
	arr.sort(function(a, b) {
		return a.value - b.value;
	}).reverse();
	var sortTags = {};
	for (var i = 0; i < arr.length; i++) {
		sortTags[arr[i].key] = arr[i].value;
	}
	return sortTags;
}