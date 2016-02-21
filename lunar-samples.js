var xray = require('x-ray');
var fs = require('fs');
var _ = require('lodash');
var r = require('request');
var Q = require('bluebird');
var path = require('path');
var readDir = require('readdir');
var rimraf = require('rimraf');
var argv = require('yargs').argv;
var x = new xray();
var X = Q.promisify(x);

var urls = [];

var PATH = path.join(process.cwd(), 'lunar-samples');
if (!fs.existsSync(PATH)) {
  fs.mkdirSync(PATH);
}
var APOLLO_MISSIONS = [{
  name: 'apollo11',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2011&sample=",
  start: 10000,
  end: 10119
}, {
  name: 'apollo12',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2012&sample=",
  start: 12001,
  end: 12077
}, {
  name: 'apollo14',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2014&sample=",
  start: 14006,
  end: 14453
}, {
  name: 'apollo15',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2015&sample=",
  start: 15000,
  end: 15952
}, {
  name: 'apollo16',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2016&sample=",
  start: 60001,
  end: 69965
}, {
  name: 'apollo17',
  url: "http://www.lpi.usra.edu/lunar/samples/atlas/detail/?mission=Apollo%2017&sample=",
  start: 70001,
  end: 79537
}];

//download all missions by default
var apolloMissions = APOLLO_MISSIONS;

//make sample groups for each mission
_.each(APOLLO_MISSIONS, (mission) => {
  mission.samples = [];
  mission.jsonSamplePaths = [];
  mission.samplesGroups = {};
  for (var i = mission.start; i <= mission.end; i++) {
    mission.samples.push(i);
  }
});

if (argv.reset) {
  rimraf.sync(path.join(PATH, 'downloads'));
  rimraf.sync(path.join(PATH, 'jsons'));
}

function jsonMission(mission) {
  console.log(mission);
  return Q.map(mission.samples, (sample) => {
    return new Q((resolve, reject) => {
      var url = `${mission.url}${sample}`;
      x(url, 'img', [{
        img: '@src'
      }])((err, info) => {
        var f = false;
        var imgs = [];
        _.each(info, (tag) => {
          if (tag.img.indexOf('thumbs') >= 0) {
            imgs.push({
              url: tag.img.replace('thumbs', 'hires')
            });
          }
        });
        if (imgs.length) {
          mission.samplesGroups[sample] = imgs;
          var p = path.join(`${mission.jsonFolder}`, `${sample}.json`);
          mission.jsonSamplePaths.push(p);
          fs.writeFileSync(p, JSON.stringify(imgs), null, 4);
          resolve();
        } else {
          resolve();
        }
      })
    });
  }, {
    concurrency: 1
  });
}

function getJsons() {
  var downloadFolder = path.join(PATH, 'downloads');
  var jsonFolder = path.join(PATH, 'jsons');
  if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
  }
  if (!fs.existsSync(jsonFolder)) {
    fs.mkdirSync(jsonFolder);
  }
  _.each(apolloMissions, (mission) => {
    var dl = path.join(downloadFolder, mission.name);
    var js = path.join(jsonFolder, mission.name);
    mission.downloadFolder = dl;
    mission.jsonFolder = js;
    try {
      fs.mkdirSync(js);
    } catch (e) {

    }
    try {
      fs.mkdirSync(dl);
    } catch (e) {

    }
  });

  Q.map(apolloMissions, (mission) => {
    return jsonMission(mission);
  }, {
    concurrency: 1
  }).then(() => {
    downloadMission();
  });
}

if (argv.mission) {
  apolloMissions = [APOLLO_MISSIONS[Number(argv.mission)]];
}

//scrape all mission pages and download img jsons for each sample
getJsons();


function downloadImage(folder, url) {
  return new Q((resolve, reject) => {
    var name = path.parse(url).name;
    var out = path.join(folder, name + '.jpg');
    var s = fs.createWriteStream(out);
    s.on('finish', () => {
      resolve();
    })
    r(url).pipe(s);
  });
}

function downloadSample(folder, urls) {

  return Q.map(urls, (obj) => {
    return new Q((resolve, reject) => {
      var url = obj.url;
      var name = path.parse(url).name;
      var out = path.join(folder, name + '.jpg');
      var s = fs.createWriteStream(out);
      s.on('finish', () => {
        console.log(url);
        resolve();
      })
      r(url).pipe(s);
    });
  }, {
    concurrency: 1
  });
}


function downloadSampleGroups(mission) {
  var samples = _.keys(mission.samplesGroups);
  console.log(samples);
  var samplFolders
  _.each(samples, (sample) => {
    fs.mkdirSync(path.join(mission.downloadFolder, sample));
  });

  return Q.map(samples, (sample) => {
    var sampleFolder = path.join(mission.downloadFolder, sample);
    return downloadSample(sampleFolder, mission.samplesGroups[sample]);
  }, {
    concurrency: 1
  });
}


function downloadMission() {
  Q.map(APOLLO_MISSIONS, (mission) => {
    return downloadSampleGroups(mission, mission.samplesGroups);
  }, {
    concurrency: 1
  }).then(() => {
    console.log("DONE oenlaod");
  });
}