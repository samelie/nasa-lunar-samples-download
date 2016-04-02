var fs = require('fs.extra');
var _ = require('lodash');
var Q = require('bluebird');
var path = require('path');
var readDir = require('readdir');
var ç = require('colors');

require('shelljs/global');

var PATH = path.join(process.cwd(), 'lunar-samples', 'downloads', 'apollo12');

var TYPES = {
  MINERIALS: 'minerals',
  MACRO: 'macro',
  MACHINE: 'machine'
};

var GROUPS = [{
  name: '_JSC',
  exclude: ['-r'],
  type: TYPES.MINERIALS,
  maxWidth:4000
},{
  name: '_osullivan',
  exclude: ['-r'],
  type: TYPES.MINERIALS,
  maxWidth:4000
}];

// var SIZES = [{
//   w: 2088,
//   h: 1550,
//   name:''
//   type: TYPES.MINERIALS
// }, {
//   w: 1600,
//   h: 1200,
//   type: TYPES.MINERIALS
// }, {
//   w: 3000,
//   h: 2100,
//   type: TYPES.MINERIALS
// }, {
//   w: 3000,
//   h: 1720,
//   type: TYPES.MACRO
// }, {
//   w: 3000,
//   h: 1985,
//   type: TYPES.MACRO
// }, {
//   w: 1963,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1949,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1926,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1942,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1956,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1955,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1912,
//   h: 3000,
//   type: TYPES.MACRO
// }, {
//   w: 1940,
//   h: 3000,
//   type: TYPES.MACRO
// }];

var files = readDir.readSync(PATH, ['**.jpg'], readDir.ABSOLUTE_PATHS);

//files = files.splice(0, 3);

function move(src, dest) {
  fs.move(src, dest);
}


_.each(files, (file) => {
  var o = exec(`identify ${file}`).output;
  var parsed = path.parse(file);
  var size = o.split(' ')[2];
  var split = size.split('x');
  var w = Number(split[0]);
  var h = Number(split[1]);
  for (var i = 0; i < GROUPS.length; i++) {
    var group = GROUPS[i];
    if (parsed.base.indexOf(group.name) > -1 &&
    	w < group.maxWidth) {
      var d = path.join(parsed.dir, group.type);
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
      }

      for (var j = 0; j < group.exclude.length; j++) {
        if (parsed.base.indexOf(group.exclude) > -1) {
          var exD = path.join(d, 'excluded');
          if (!fs.existsSync(exD)) {
            fs.mkdirSync(exD);
          }
          d = exD;
          break;
        }
      }
      var dest = path.join(d, parsed.base);
      console.log(ç.cyan(dest));
      mv(file, dest);
      break;
    }
  }
});



return;

_.each(files, (file) => {
  var o = exec(`identify ${file}`).output;
  var parsed = path.parse(file);
  var size = o.split(' ')[2];
  var split = size.split('x');
  var w = Number(split[0]);
  var h = Number(split[1]);
  for (var i = 0; i < SIZES.length; i++) {
    var sizes = SIZES[i];
    console.log(ç.green(w, sizes.w));

    if (w === sizes.w && h === sizes.h && file.indexOf(sizes.type) < 0) {
      var d = path.join(parsed.dir, sizes.type);
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
      }
      var dest = path.join(d, parsed.base);
      console.log(ç.cyan(dest));
      mv(file, dest);
      break;
    }

  }
});