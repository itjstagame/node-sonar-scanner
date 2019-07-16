#!/usr/bin/env node

'use strict';

var child_process = require('child_process'),
	fs = require('fs'),
	request = require('request'),
	path = require('path'),
	unzip = require('unzip2');

var args = process.argv.slice(2),
	sonar = path.join(__dirname, 'sonar'),
	script = path.join(sonar, 'bin', 'sonar-scanner'),
	command = script;

var _platform = process.platform;
switch (_platform) {
	case 'darwin': _platform = 'macosx'; break;
	case 'win32': 
		_platform = 'windows'; 
		command = 'cmd.exe';
		args = ['/c', (script + '.bat')].concat(args);
		break;
	case 'linux': break;
	default:
		fail('unsupported platform: ' + _platform);
}
const platform = () => _platform;

const run = () => {
	var child = child_process.spawn(command, args, {
		stdio: 'inherit'
	});

	child.on('close', function(code) {
		process.exit(code);
	});
};

if (!fs.existsSync(sonar)) {
		const root = 'sonar-scanner-cli-4.0.0.1744-' + platform();
		const urlStr = 'https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/' + root + '.zip';

		console.log("Downloading from: ", urlStr);
		request
		  .get({
			url: urlStr,
			rejectUnauthorized: false,
			agent: false
		  })
		//   .on('response', res => {
		// 	var len = parseInt(res.headers['content-length'], 10);
		// 	var bar = new ProgressBar('  downloading and preparing JRE [:bar] :percent :etas', {
		// 	  complete: '=',
		// 	  incomplete: ' ',
		// 	  width: 80,
		// 	  total: len
		// 	});
		// 	res.on('data', chunk => bar.tick(chunk.length));
		//   })
		  .on('error', err => {
			console.log(`problem with request: ${err.message}`);
		  })
		  .pipe(unzip.Parse()) //Extract({ path: sonar }))
		  .on('entry', function (entry) {
			var fileName = path.join(sonar,entry.path.substring(entry.path.indexOf('/')));
			var type = entry.type; // 'Directory' or 'File'
			if(type == 'Directory') {
				fs.mkdirSync(fileName);
				entry.autodrain();
			} else {
				entry.pipe(fs.createWriteStream(fileName));
			}
		  })
		  .on('close', () => {
			run();
		  });
} else {
	run();
}

