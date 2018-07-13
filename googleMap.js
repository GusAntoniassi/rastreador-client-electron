'use strict';

let map, rotaPoly;

function construct(_map, _rotaPoly) {
	map = _map;
	rotaPoly = _rotaPoly;
}

function setTheme(tema) {
	try {
		map.setOptions({
			styles: tema.googleMaps
		});

		rotaPoly.setOptions({
			strokeColor: tema.strokeColor
		});
	} catch (e) {
		console.error(e);
	}
}

module.exports = {
	construct,
	setTheme
}
