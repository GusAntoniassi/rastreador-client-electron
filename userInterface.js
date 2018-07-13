'use strict';

// @TODO: Passar todas as funções do index.html pra cá

let document, toggleDark;
let googleMap = require('./googleMap');

function bindMap(map, rotaPoly) {
	googleMap.construct(map, rotaPoly);

	return this;
}

function setTheme(theme) {
	let tema = require('./themes/' + theme);

	googleMap.setTheme(tema);

	toggleDark.style.color = tema.darkButtonColor;
	toggleDark.style.backgroundColor = tema.darkButtonBackgroundColor;
}

function initialize(window) {
	if (!document) document = window.document;

	toggleDark = document.getElementById('toggle-dark');
	toggleDark.addEventListener('click', function(e) {
		let temaAplicar = tema === 'default' ? 'dark' : 'default';
		setTheme(temaAplicar);
		toggleDark.classList.remove(tema);
		toggleDark.classList.add(temaAplicar);
		tema = temaAplicar;
	});

	return this;
}

module.exports = {
	initialize,
	bindMap,
	setTheme
}
