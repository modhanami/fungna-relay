import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import server from './server';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setPosition(400, 400);

  win.loadFile('index.html');
  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

server.listen(30033, () => {
  console.log('Server listening on port 30033');
});
