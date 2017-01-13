'use strict';
var express = require('express');
var cors = require('cors');
var app = express();
var pg = require('pg');
var _ = require('underscore');

module.exports = function() {
	var obj = function() {
		return {
			values: [],
			key: null,
			color: null,
			iduser: 0
		};
	};
	var client = new pg.Client(
		"postgres://" + (process.env.PGUser || 'postgres') +
		":" + (process.env.PGPassword || '1234') +
		"@" + (process.env.PGHost || 'localhost') +
		"/" + (process.env.PGDatabase || 'dbstatistic')
	);
	var url = "http://localhost:8000/";
	var type = {
		'h': 14,
		'd': 11,
		'm': 8,
		'y': 5
	};
	app.use(cors());
	client.connect(function(err) {
		if (err) {
			return console.error('Could not connect to postgres', err);
		}
	});
	app.get('/', function(req, res) {
		res.json({
			status: 'ok'
		});
	});
	app.get('/:date', function(req, res) {
		try {
			var value = value_parameters(req.params.date);
			if (value === 0) {
				res.statusCode = 404;
				res.send('Error 404: Bad parameteres');
				res.end();
			} else if (value === 1) {
				res.statusCode = 200;
				res.send('Successful status');
				res.end();
			} else {
				var date = (req.params.date + '').split('&');
				var array_objs = [];
				var query_obj = {
					text: 'SELECT substring(to_timestamp(osmdate)::text,0,$1) as osm_date',
					values: [type[date[0]]]
				};
				var query_user = {
					text: 'SELECT iduser, osmuser, color, estado FROM osm_user WHERE estado = $1',
					values: [true]
				};
				var main_query = client.query(query_user, function(error, result) {
					if (error) {
						res.statusCode = 404;
						res.send('Error 404: No quote found');
						res.end();
					} else {
						for (var i = 0; i < result.rows.length; i++) {
							var user = new obj();
							var iduser = result.rows[i].iduser;
							query_obj.text += ", SUM(uo_" + iduser + ") as uo_" + iduser + ", SUM(uc_" + iduser + ") as uc_" + iduser;
							user.iduser = iduser;
							user.key = result.rows[i].osmuser;
							user.color = '#' + result.rows[i].color;
							array_objs.push(user);
						}
					}
				});
				main_query.on('end', function(result) {
					query_obj.text += " FROM osm_obj WHERE osmdate >= $2 AND osmdate < $3 GROUP BY osm_date ORDER BY osm_date";
					query_obj.values.push(parseInt(date[1]), parseInt(date[2]));
					client.query(query_obj, function(error, result) {
						if (error) {
							console.log('Error on request parameter: ' + date[1] + ', ' + date[2]);
							res.statusCode = 404;
							res.send('Error 404: No quote found');
							res.end();
						} else {
							for (var i = 0; i < result.rows.length; i++) {
								_.each(array_objs, function(v, k) {
									array_objs[k].values.push({
										x: result.rows[i].osm_date.replace(' ', '-'),
										y: parseInt(result.rows[i]["uo_" + v.iduser]),
										change: parseInt(result.rows[i]["uc_" + v.iduser])
									});
								});
							}
							res.json(array_objs);
							console.log('Successful');
							res.end();
						}
					});
				});
			}
		} catch (e) {
			res.statusCode = 404;
			res.send('Error 404: No quote found');
			res.end();
		}
	});

	app.get('/json/:date', function(req, res) {
		try {
			var date = (req.params.date + '').split('&');
			var array_objs = [];
			var userObj = {};
			var query_obj = {
				text: 'SELECT substring(to_timestamp(osmdate)::text,0,$1) as osm_date',
				values: [type[date[0]]]
			};
			var query_user = {
				text: 'SELECT iduser, osmuser, color, estado FROM osm_user WHERE estado = $1',
				values: [true]
			};
			var main_query = client.query(query_user, function(error, result) {
				if (error) {
					res.send('Error 404: No quote found');
					res.end();
				} else {
					for (var i = 0; i < result.rows.length; i++) {
						var iduser = result.rows[i].iduser;
						userObj[iduser] = {};
						query_obj.text += ", uo_" + iduser;
					}
				}
			});
			main_query.on('end', function(result) {
				query_obj.text += " FROM osm_objjson WHERE osmdate >= $2 AND osmdate < $3 ORDER BY osm_date";
				query_obj.values.push(parseInt(date[1]), parseInt(date[2]));
				client.query(query_obj, function(error, result) {
					if (error) {
						console.log('Error on request parameter: ' + date[1] + ', ' + date[2]);
						res.statusCode = 404;
						res.send('Error 404: No quote found');
						res.end();
					} else {
						res.json(jsonMerge(result, date[0]));
					}
				});
			});

		} catch (e) {
			res.statusCode = 404;
			res.send('Error 404: No quote found');
			res.end();
		}
	});

	function value_parameters(date) {
		console.log('Request Date : ' + new Date() + ' url: ' + url + date);
		var status = 2;
		if (date === 'status') {
			status = 1;
		} else {
			date = (date + '').split('&');
			if (date.length !== 3) {
				status = 0;
			}
			if (Number(date[1]) === NaN || Number(date[2]) === NaN || date[1].match(/^[0-9]+$/) === null || date[2].match(/^[0-9]+$/) === null || type[date[0]] === undefined) {
				status = 0;
			}
			if (parseInt(date[2]) - parseInt(date[1]) < 0) {
				status = 0;
			}
			//we can do a consult per hour when the range of date is less two months
			if (parseInt(date[2]) - parseInt(date[1]) > 60 * 24 * 3600 && date[0] === 'h') {
				status = 0;
			}
		}
		return status;
	}
	app.listen(process.env.PORT || 8000, function() {
		console.log('Running on ' + url);
	});
};

function jsonMerge(result, type) {
	if (type === 'h') {
		var hourobj = [];
		for (var i = 0; i < result.rows.length; i++) {
			var obj = {};
			obj.date = result.rows[i].osm_date;
			delete result.rows[i].osm_date;
			obj.data = _.values(result.rows[i]);
			hourobj.push(obj);
		}
		return hourobj;
	} else if (type === 'd' || type === 'm' || type === 'y') {
		var dayobj = [];
		var day = {};
		for (var i = 0; i < result.rows.length; i++) {
			if (day[result.rows[i].osm_date]) {
				day[result.rows[i].osm_date].push(result.rows[i]);
			} else {
				day[result.rows[i].osm_date] = [result.rows[i]];
			}
		}
		var dayusers = [];
		_.each(day, function(v, k) {
			dayusers.push({
				date: k,
				data: _.values(countperuser(v)),
			});
		});
		return dayusers;
	}
}

function countperuser(objperday) {
	var objPerUser = {};
	_.each(objperday, function(val, key) {
		_.each(val, function(v, k) {
			if (k !== 'osm_date') {
				if (objPerUser[k]) {
					objPerUser[k] = countTags(objPerUser[k], v);
				} else {
					objPerUser[k] = v;
				}
			}
		});
	});
	return objPerUser;
}

function countTags(a, b) {
	var ab = {};
	a.total = a.total + b.total;
	a.nodes = a.nodes + b.nodes;
	a.ways = a.ways + b.ways;
	a.relations = a.relations + b.relations;
	a.changesets = a.changesets + b.changesets;
	_.each(b.tags, function(val, key) {
		if (a.tags[key]) {
			_.each(val, function(v, k) {
				if (a.tags[key][k]) {
					a.tags[key][k] = a.tags[key][k] + v;
				} else {
					a.tags[key][k] = v;
				}
			});
		} else {
			a.tags[key] = val;
		}
	});
	delete a.file;
	delete a.date;
	return a;
}
