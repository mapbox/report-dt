# Data Team Report

Reports editing activity for a number of users on OpenStreetMap.

![](https://cloud.githubusercontent.com/assets/126868/11736531/80103dba-9ff5-11e5-8455-5756326d5555.png)

## Installation

For installing and running the Data Team Report, you need to:

1. Install data server
2. Configure users
3. Load data
4. Run data server
5. Configure and serve web UI

System requirements:

- Node 0.10.x
- PostGreSQL

### 1. Set up data server

    ## Install data server
    npm install

    # Set up database
    createdb dbstatistic
    psql dbstatistic -f query/tables.sql

### 2. Configure users

Add each user whose OpenStreetMap edits you'd like to track to the `osm_user` table like so:


``` sql 
SELECT add_user(589596,'lxbarth','FFFF00',true);

```

- **589596** : user id on OpenStreetMap
- **lxbarth** : name of user
- **FFFF00**: color of user for to show in line graph
- **true** : state of user: if you don’t want to show one user on line graph , just update the user using state as false

Or use Mapbox data team users included in the project:

    npm run addUsers

### 3. Load data

You can start loading data starting with any replication file found in http://planet.openstreetmap.org/replication/hour/

For instance, to start loading with [2015-03-22](https://s3.amazonaws.com/osm-changesets/hour/000/022/117.osc.gz) run:

    node load/load.js --num_file=117 --num_directory=22 --user=<dbuser> --password=<dbpassword> --database=dbstatistic

Or to start loading with [2016-01-26](https://s3.amazonaws.com/osm-changesets/hour/000/029/551.osc.gz) run:

    node load/load.js --num_file=551 --num_directory=29 --user=<dbuser> --password=<dbpassword> --database=dbstatistic

### 4. Run data server

    node server/server.js --user=<dbuser> --password=<dbpassword> --database=dbstatistic

This will run the server at port 3021. Use [forever](http://labs.telasocial.com/nodejs-forever-daemon/) to run as a daemon.

### 5. Configure and serve web UI

Copy `settings-example.js` to `settings.js` and enter the host information under which you started the data server.

For instance run [serve](https://www.npmjs.com/package/serve) from project root:

    serve
