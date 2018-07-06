'use strict';

const electron = require('electron'),
	client = require('electron-connect').client;

const app = electron.app;

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// Prevent window being garbage collected
let mainWindow;

function onClosed() {
	// Dereference the window
	// For multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	mainWindow = new electron.BrowserWindow({
		width: 480,
		height: 320,
		fullscreen: true
	});
	console.log(`file://${__dirname}/index.html`);

	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.on('closed', onClosed);

	// Connect to server process
	client.create(mainWindow);

	return mainWindow;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});

