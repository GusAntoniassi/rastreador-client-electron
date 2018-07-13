'use strict';

const firebase = require('firebase/app');
	require('firebase/database');

const credentials = require('./firebase-credentials');

// Initialize Firebase
const config = {
	apiKey: credentials.apiKey,
	authDomain: credentials.authDomain,
	databaseURL: credentials.databaseURL,
	projectId: credentials.projectId,
	storageBucket: credentials.storageBucket,
	messagingSenderId: credentials.messagingSenderId
};

firebase.initializeApp(config);

const database = firebase.database();

let idPercurso = '-LHGMgCxRouSZebU7W9d';

/*
Estrutura dos dados:
	"rotas": {
		"gazin-arida-macoto-victor": {
			"status": 1,
			"data": "12-07-2018",
			"veiculo": "ABC-1234"
		}
	},

	"jsonRota": {
		"gazin-arida-macoto-victor": {
			"j1": { "lat": -23.747473, "lng": -53.3095479 },
			"j2": { "lat": -23.7488969, "lng": -53.3089578 },
		}
	}

	"percurso": {
		"-LHGMgCxRouSZebU7W9d": {
			"rota": "gazin-arida-macoto-victor",
			"dados": {
				"-LHGO4t4JbFJ2rmVPs74": {
					"lat": "123",
					"lon": "123",
					"vel": "60",
					"ts": "2018-07-12 22:32:00"
				},
				"-LHGOA9TO4VJKY2MCx4y": {
					"lat": "124",
					"lon": "124",
					"vel": "90",
					"ts": "2018-07-12 22:32:05"
				},
			}
		}
	}
 */

function writeRotaData(idRota, dados) {
	return database.ref('rotas/' + idRota).set({
		status: dados.status,
		data: dados.data,
		veiculo: dados.veiculo
	});
}

function readRotaData(idRota) {
	return new Promise((resolve, reject) => {
		let rotas = firebase.database().ref('rotas/' + idRota);
		rotas.on('value', function (dados) {
			resolve(dados.val());
		});
	});
}


function writePercursoData(idPercurso, dados) {
	let novoRegistroPercurso = database.ref('percurso/' + idPercurso + '/dados').push();
	novoRegistroPercurso.set({
		lat: dados.lat,
		lon: dados.lon,
		vel: dados.vel,
		ts: dados.ts
	});

	return novoRegistroPercurso;
}

function readPercursoData(idPercurso) {
	return new Promise((resolve, reject) => {
		let percurso = firebase.database().ref('percurso/' + idPercurso);
		percurso.on('value', function (dados) {
			resolve(dados.val());
		});
	});
}

// auth;
// 	https://firebase.google.com/docs/auth/admin/create-custom-tokens?hl=pt-br
//  https://firebase.google.com/docs/auth/web/custom-auth?hl=pt-br

// realtime:
//  https://firebase.google.com/docs/database/web/read-and-write?hl=pt-br
//

module.exports = {
	writeRotaData,
	writePercursoData,
	readRotaData,
	readPercursoData,
	idPercurso,
	database // debug
};
