'use strict';
var pg = require('pg');
var _ = require('underscore');
var obj_user = require('./user');
var database = {};

database.select_users = function(client, done) {
	var users = {};
	var query_user = {
		text: 'SELECT iduser,osmuser FROM osm_user WHERE estado = $1;',
		values: [true]
	};
	var select_users = client.query(query_user, function(err, result) {
		if (err) return err;
		for (var i = 0; i < result.rows.length; i++) {
			users[result.rows[i].iduser] = new obj_user();
			users[result.rows[i].iduser].osm_user = result.rows[i].osmuser;
		}
	});
	select_users.on('end', function(result) {
		done(users);
	});
};

database.insert = function(client, obj, numfile) {
	var flag = true;
	var query_exists = {
		text: 'SELECT EXISTS(SELECT osmdate FROM osm_obj where osmdate = $1);',
		values: [obj.osmdate]
	};
	client.query(query_exists, function(err, result) {
		flag = result.rows[0].exists;
		_.each(obj.users, function(val, key) {
			var num_obj = (val.osm_node + val.osm_way + val.osm_relation);
			var query_insert = {
				text: "",
				values: []
			};
			var query_insertJSON = {
				text: "",
				values: []
			};

			var jsonobj = {
				tags: val.tags,
				ways: val.osm_way,
				date: obj.osmdate,
				nodes: val.osm_node,
				user: val.osm_user,
				changesets: val.changeset,
				relations: val.osm_relation,
				total: num_obj,
				file: 'hour/000/' + numfile.join().replace(',', '/')
			};

			// JSON.parse(JSON.stringify(val));
			if (flag) {
				query_insert.text = "UPDATE osm_obj SET uo_" + key + " = $1 , uc_" + key + " = $2 WHERE osmdate = $3";
				query_insert.values.push(num_obj, val.changeset, obj.osmdate);
				//update json
				query_insertJSON.text = "UPDATE osm_objjson SET uo_" + key + " = ($1::JSONB) WHERE osmdate = $2";
				query_insertJSON.values.push(JSON.stringify(jsonobj), obj.osmdate);
			} else {
				query_insert.text = "INSERT INTO osm_obj(osmdate, uo_" + key + ", uc_" + key + ") VALUES ($1,$2,$3)";
				query_insert.values.push(obj.osmdate, num_obj, val.changeset);
				//insert json
				query_insertJSON.text = "INSERT INTO osm_objjson(osmdate, uo_" + key + ") VALUES ($1,$2::JSONB)";
				query_insertJSON.values.push(obj.osmdate, JSON.stringify(jsonobj));
				flag = true;
			}
			// console.log('==========================================');
			// console.log(query_insertJSON);
			client.query(query_insert, function(err, result) {
				if (err) {
					console.log("error en insertar" + err);
				}
				client.query(query_insertJSON, function(err, result) {
					if (err) {
						console.log("error en insertar JOSN" + err);
					}
				});
			});
		});
	});
};

module.exports = database;