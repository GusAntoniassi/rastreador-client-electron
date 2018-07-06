'use strict';

let gulp = require('gulp'),
	electron = require('electron-connect').server.create(),
	sh = require('shelljs'),
	node_ssh = require('node-ssh'),
	Rsync = require('rsync');

function doRsync() {
	console.log('rsyncing');
	rsync.execute(function(error, code, cmd) {
		console.log(error, code, cmd);
	});
}

let rsync = new Rsync()
	.shell('/usr/bin/sshpass -p 1234 ssh')
	.flags('avzr')
	.exclude('.git')
	.exclude('node_modules')
	.source(__dirname)
	.destination('gus@10.42.0.27:/home/gus/rastreador');

gulp.task('serve', function () {
	// Start browser process
	electron.start();

	// Restart browser process
	// gulp.watch('app.js', electron.restart);

	// Reload renderer process
	gulp.watch(['index.js', 'gps.js', 'index.html'], function() {
		electron.reload();

		doRsync();
	});

	doRsync();
});

gulp.task('reload:browser', function () {
	// Restart main process
	electron.restart();
});

gulp.task('reload:renderer', function () {
	// Reload renderer process
	electron.reload();
});

gulp.task('default', ['serve']);
