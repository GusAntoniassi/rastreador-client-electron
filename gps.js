module.exports = {
	init: init,
	setGpsCallback: setGpsCallback,
	restartAdbServer: restartAdbServer
};

var gpsCallback = null;
var cmd = require('node-cmd');
const portaAdb = 20175;
const senhaRoot = 1234; // 100% errado mas

function restartAdbServer(window) {
	// Quando conecta o celular em modo tethering é necessário iniciar o servidor do adb como root pra funcionar
	cmd.get('adb kill-server && echo ' + senhaRoot + ' | /usr/bin/sudo -S adb start-server', function(data) {
		console.log('Servidor ADB iniciado', data ? data : '');
		window.location.reload();
	});
}

function initAdb() {
	var Promise = require('bluebird');
	var client = require('adbkit').createClient();

	return new Promise(function (resolve, reject) {
		var doReject = function () {
			reject();
		};

		client
			.listDevices()
			.then(function (devices) {
				console.log('Dispositivos encontrados: ', devices);
				return Promise.map(devices, function (device) {
					console.log('Device: ', device.id);
					client.forward(device.id, 'tcp:' + portaAdb, 'tcp:50000').then(function () {
						console.log('ADB Server iniciado no dispositivo', device.id);
						resolve();
					}, doReject);
				});
			}, doReject);
	});
}

function init() {
	initAdb().then(function () {
		console.log('init gps');

		var Netcat = require('node-netcat');

		var client = Netcat.client(20175, '127.0.0.1');

		client.on('open', function () {
			console.log('connect');
		});

		client.on('data', function (data) {
			var strings = data.toString('ascii').split(/\r?\n/);
			console.log(strings);
			var len = strings.length;
			var gpgga, gprmc;

			for (var i = 0; i < len; i++) {
				var string = strings[i];

				var nmeaPrefix = string.substring(0, 6);
				if (nmeaPrefix === '$GPGGA') { // fix data
					gpgga = parseGPGGAData(string);
				} else if (nmeaPrefix === '$GPRMC') { // minimum recommended data
					gprmc = parseGPRMCData(string);
				}
			}

			var returnData = {
				gpgga: gpgga,
				gprmc: gprmc
			};
			gpsCallback(returnData);
		});

		function parseLatLon(latLon, negative) {
			var regex = /(\d{2,3})(\d{2})(\.\d+)$/g
			var values = regex.exec(latLon);
			var degrees = parseInt(values[1], 10);
			var minutes = parseFloat(values[2] + values[3], 10);

			var latitude = (degrees + (minutes / 60));

			if (negative) {
				latitude *= -1;
			}

			return latitude;
		};

		// Referência: http://aprs.gids.nl/nmea/
		function parseGPGGAData(string) {
			// String exemplo: $GPGGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx
			var args = string.split(',');
			var data = {
				identifier: args[0], // $GPGAA
				time: args[1], // hhmmss.ss = UTC of position
				lat: args[2], // llll.ll = latitude of position
				cardinalDirLat: args[3], // a = N or S
				lon: args[4], // yyyyy.yy = Longitude of position
				cardinalDirLon: args[5], // a = E or W
				quality: args[6], // x = GPS Quality indicator (0=no fix, 1=GPS fix, 2=Dif. GPS fix)
				numSatellites: args[7], // xx = number of satellites in use
				hdop: args[8], // x.x = horizontal dilution of precision
				alt: args[9], // x.x = Antenna altitude above mean-sea-level
				altUnit: args[10], // M = units of antenna altitude, meters
				geoidSeparation: args[11], // x.x = Geoidal separation
				geoidSeparationUnit: args[12], // M = units of geoidal separation, meters
				timeSinceLastDGPSUpdate: args[13], // x.x = Age of Differential GPS data (seconds)
				// DGPSReferenceStationId: args[14], // xxxx = Differential reference station ID // Aparentemente não está vindo, o checksum é o parâmetro 14
				checksum: args[14] // *hh = checksum
			}

			// Tratar latitude
			if (data.lat) {
				data.latFloat = parseLatLon(data.lat, data.cardinalDirLat == 'S');
			} else {
				data.latFloat = 0;
			}

			if (data.lon) {
				// Tratar longitude
				data.lonFloat = parseLatLon(data.lon, data.cardinalDirLon == 'W');
			} else {
				data.lonFloat = 0;
			}

			if (data.quality === "0" || parseInt(data.numSatellites, 10) <= 0) {
				data.lonFloat = 0;
				data.latFloat = 0;
			}

			console.log(data);
			return data;
		}

		function parseGPRMCData(string) {
			// String exemplo: $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh
			var args = string.split(',');
			var data = {
				identifier: args[0], // $GPRMC
				time: args[1], // hhmmss.ss = UTC of position
				validity: args[2], // A = validity - A-ok, V-invalid
				lat: args[3], // llll.ll = latitude of position
				cardinalDirLat: args[4], // a = N or S
				lon: args[5], // yyyyy.yy = Longitude of position
				cardinalDirLon: args[6], // a = E or W
				speed: args[7], // x.x = speed in knots
				courseGood: args[8], // track made good in degrees true
				date: args[9], // utDate
				variationDeg: args[10], // magnetic variation degrees
				cardinalDirVariationDeg: args[11], // a = E or W
				checksum: args[12], // *hh = checksum
			};

			// Tratar velocidade (vem em knots por padrão)
			if (data.speed) {
				data.speedKmH = parseFloat(data.speed, 10) * 1.852;
			}

			// Tratar latitude
			if (data.lat) {
				data.latFloat = parseLatLon(data.lat, data.cardinalDirLat == 'S');
			} else {
				data.latFloat = 0;
			}

			if (data.lon) {
				// Tratar longitude
				data.lonFloat = parseLatLon(data.lon, data.cardinalDirLon == 'W');
			} else {
				data.lonFloat = 0;
			}

			if (data.validity === "V") {
				data.lonFloat = 0;
				data.latFloat = 0;
			}

			console.log(data);
			return data;
		}

		client.on('error', function (err) {
			console.log(err);
			gpsCallback({});
		});

		client.on('close', function () {
			console.log('close');
			setTimeout(() => {
				client.start();
			}, 1000)
		});

		client.start();
	});
}

function setGpsCallback(callback) {
	gpsCallback = callback;
}

