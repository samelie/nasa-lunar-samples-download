/*
DOWNLOAD THE TILES OF THE MOON
*/
var fs = require('fs');
var _ = require('lodash');
var r = require('request');
var Q = require('bluebird');
var path = require('path');
var R = Q.promisify(r);
var ç = require('colors');

var rows = 46;
var startTileGroup = 2;
var endTileGroup = 13;

var tileGroups = [];

var URL = "http://www.lpi.usra.edu/lunar/rilles/img/zoom/wac_nearside/";
var ZOOM = 6;

12, 46, 0, 93

var urlInfo = {
  six: {
    zoom: 6,
    rows: 46,
    tileStart: 2,
    tileEnd: 13
  },
  seven: {
    zoom: 7,
    rows: 93,
    tileStart: 12,
    tileEnd: 46
  }
};

var counter = -1;

var choice = urlInfo['seven'];

for (var i = choice.tileStart; i <= choice.tileEnd; i++) {
  tileGroups.push(`TileGroup${i}`);
}

var urls = [];

var total = Math.pow(choice.rows, 2);
var row = 0;
var col = 0;
var tileGroupIndex = 0;
var imageIndex = 0;
var imageYIndex = 0;

for (var i = 0; i < total; i++) {
  if (col > choice.rows) {
    col = 0;
  }
  if (i % choice.rows === 0) {
    row++;
  }
  urls.push(`${URL}****/${choice.zoom}-${col}-${row}.jpg`);
  col++;
}

function pad(num, size) {
  return ('000000000' + num).substr(-size);
}

var previousTileGroupWasSuccess = false;

function doTileGroup(url) {
  return new Q((resolve, reject) => {
    var tileG = tileGroups[tileGroupIndex];
    console.log(tileG);
    var replaced = url.replace('****', tileG);
    console.log(replaced);
    return R(replaced).then(resp => {
      var exists = resp.body.indexOf('HTTP 404');
      if (exists < 0) {
        previousTileGroupWasSuccess = true;
        counter++;
        var name = pad(counter, 5);
        var out = path.join(process.cwd(), 'moon', `${name}.jpg`);
        var write_stream = fs.createWriteStream(out)
        write_stream.on('finish', function() {
          console.log(ç.green("Wrote", out, "URL: ", replaced));
          resolve();
        });
        r(replaced).pipe(write_stream);
      } else {
        //tileGroupIndex++;
        console.log(ç.red("Failed URL: ", replaced));
        reject();
        // if (previousTileGroupWasSuccess) {
        //   previousTileGroupWasSuccess = false;
        //   tileGroupIndex++;
        //   console.log(ç.red("Failed URL: ", replaced));
        // } else {
        //   resolve();
        // }
      }
    });
  });
}

function doImage(url) {
  return new Q((resolve, reject) => {
    return R(url).then(resp => {
      var exists = resp.body.indexOf('HTTP 404');
      if (exists < 0) {
        counter++;
        var name = pad(counter, 5);
        var out = path.join(process.cwd(), 'moon', `${name}.jpg`);
        var write_stream = fs.createWriteStream(out)
        write_stream.on('finish', function() {
          console.log(ç.green("Wrote", out, "URL: ", url));
          resolve();
        });
        r(url).pipe(write_stream);
      } else {
        //console.log(ç.red("Failed URL: ", url));
        reject(`Failed on ${tileGroups[tileGroupIndex]} ${url}`);
      }
    });
  });
}

function doRow() {
  var urls = [];
  console.log(choice);
  var tileG = tileGroups[tileGroupIndex];
  for (var i = 0; i <= choice.rows; i++) {
    urls.push(`${URL}${tileG}/${choice.zoom}-${i}-${imageYIndex}.jpg`);
  }
  console.log(urls);
  return Q.map(urls, (url) => {
    return doImage(url);
  }, {concurrency:1}).then((results) => {
    console.log(results);
  }).catch((err) => {
    console.log(err);
    tileGroupIndex++;
    doRow();
  });
}

function _doTileGroups() {
  return doRow();
}

_doTileGroups();

// function doImage() {
//   var url = urls[imageIndex];
//   doTileGroup(url).then(() => {
//     imageIndex++;
//     doImage();
//   }).catch(() => {
//     //do it again
//     doImage();
//   }).done();
// }

// doImage();