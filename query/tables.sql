--DROP TABLE osm_user
--DROP TABLE osm_obj
CREATE TABLE osm_user(
	iduser INTEGER NOT NULL PRIMARY KEY,
	osmuser varchar(50),
	color varchar(6),
	estado boolean not null
);

CREATE TABLE osm_obj(
	osmdate INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE osm_objjson(
	osmdate INTEGER NOT NULL PRIMARY KEY
);


CREATE OR REPLACE FUNCTION addcol_user(_columname varchar)
RETURNS VOID
AS $$
declare 
    _flag varchar ;
    _uo varchar;
    _uc varchar;
begin 
	_uo = 'uo_'||_columname;
	_uc = 'uc_'||_columname;
	_flag = (SELECT attname FROM pg_attribute WHERE attrelid = (SELECT oid FROM pg_class WHERE relname = 'osm_obj') AND attname = _uo);
	if(_flag is null ) then 
		EXECUTE 'ALTER TABLE osm_obj ADD COLUMN ' || _uo || ' SMALLINT;';
		EXECUTE 'ALTER TABLE osm_obj ADD COLUMN ' || _uc || ' SMALLINT;';
		--Create new colum
		EXECUTE 'ALTER TABLE osm_objjson ADD COLUMN ' || _uo || ' jsonb;';
		
		_flag = _columname ||' Was created';
	else
		_flag = _columname ||' Already exist';
	end if;

end;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_user( _iduser integer, _osmuser varchar, _color varchar, _estado boolean)
returns varchar 
AS $$
declare 
    _user varchar ;
    _flag varchar; 
begin 
	_user = (SELECT _osmuser FROM osm_user WHERE iduser = _iduser);
	if(_user is null ) then 
		INSERT INTO osm_user(iduser, osmuser, color, estado) VALUES (_iduser, _osmuser, _color, _estado);
		PERFORM addcol_user(_iduser::text);
		_flag = 'User ' || _osmuser ||' Was created';
	else
		_flag = 'User ' || _user ||' Already exist';
	end if;
return _flag;
end;
$$ LANGUAGE plpgsql;