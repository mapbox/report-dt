'use strict';
var argv = require('optimist').argv;
var pg = require('pg');
var download = require('./src/download');
var downloadTags = require('./src/downloadTags');
var database = require('./src/database');
var count = require('./src/count');
var removefiles = require('./src/removefiles');
var crontab = require('node-crontab');


module.exports = function() {
	// Initialize parameters
	var flag = true;
	var numFile = process.env.Numfile || 0;
	var numDirectory = process.env.Numdirectory || 1;
	var db_conf = {
		pguser: process.env.PGUser,
		pgpassword: process.env.PGPassword,
		pghost: process.env.PGHost,
		pgdatabase: process.env.PGDatabase
	};
	var client = new pg.Client(
		"postgres://" + (db_conf.pguser || 'postgres') +
		":" + (db_conf.pgpassword || '1234') +
		"@" + (db_conf.pghost || 'localhost') +
		"/" + (db_conf.pgdatabase || 'dbstatistic')
	);
	var number_obj = {
		prev: [],
		current: [parseInt(numDirectory), parseInt(numFile)],
		next: []
	};

	client.connect(function(err) {
		if (err) {
			return console.error('could not connect to postgres', err);
		}
	});
	//inicio
	function init() {
		download(number_obj.current, select_users);
	}
	//fecth users
	function select_users(b) {
		if (b) {
			database.select_users(client, process_files);
		} else {
			if (flag) {
				flag = false;
				crontab.scheduleJob("*/10 * * * *", function() {
					init();
				});
			}
		}
	}
	//count number of edition
	function process_files(users) {
		downloadTags(function(tags) {
			if (tags) {
				count(number_obj.current, users, tags, save);
			} else {
				init();
			}
		});
	}
	//save on db
	function save(obj) {
		database.insert(client, obj, number_obj.current);
		removefiles(number_obj.current);
		get_num(number_obj.next);
		init();
	}

	function get_num(arr) {
		number_obj = {
			prev: [],
			current: arr,
			next: []
		};
		if (arr[1] === 0) {
			number_obj.prev.push(arr[0] - 1);
			number_obj.prev.push(999);
		} else {
			number_obj.prev.push(arr[0]);
			number_obj.prev.push(arr[1] - 1);
		}
		if (arr[1] === 999) {
			number_obj.next.push(arr[0] + 1);
			number_obj.next.push(0);
		} else {
			number_obj.next.push(arr[0]);
			number_obj.next.push(arr[1] + 1);
		}
	}
	get_num(number_obj.current);
	init();
};