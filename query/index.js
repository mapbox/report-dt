var mbxtd = require('mapbox-data-team').getEverything();
var exitincolors = {
  'Rub21': '0171C5',
  'ediyes': 'FFFF00',
  'Luis36995': '00FF00',
  'RichRico': 'EE3344',
  'dannykath': '662289',
  'andygol': '3E8380',
  'ruthmaben': 'FA58F4',
  'calfarome': '800000',
  'samely': '66CCCC',
  'srividya_c': '7B68EE',
  'PlaneMad': 'ADFF2F',
  'karitotp': '00BFFF',
  'Chetan_Gowda': '336699',
  'ramyaragupathy': '996633',
  'lxbarth': '333366',
  'shvrm': '000000',
  'Aaron Lidman': '330066',
  'geohacker': '666600',
  'pratikyadav': '00f2ff',
  'jinalfoflia': 'ff6a6a',
  'nikhilprabhakar': 'FF8A00',
  'oini': 'FFCC99',
  'Jothirnadh': 'CC6699',
  'manings': '666633',
  'Arunasank': '000066',
  'sanjayb': '996600',
  'saikabhi': '003300',
  'aarthy': '666699',
  'bkowshik': '666699',
  'nammala': '668629',
  'poornibadrinath': '363699',
  'ajithranka': '666600',
  'manoharuss': '000000',
  'BharataHS': '00BFFF',
  'ridixcr': '00BFFF',
  'yurasi': '00BFFF',
  'piligab': '00BFFF'
};
// --UPDATE osm_user
// --   SET color= '666600'
// -- WHERE iduser=0000;

for (var i = 0; i < mbxtd.length; i++) {
  var txt = "select add_user(" + mbxtd[i].uid + ",'" + mbxtd[i].username + "','" + (exitincolors[mbxtd[i].username] ? exitincolors[mbxtd[i].username] : '363699') + "',true);";
  console.log(txt);
}