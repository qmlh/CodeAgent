const { app, BrowserWindow } = require('electron');
const path = require('path');

// GPU crash prevention
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-hardware-acceleration');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// Handle child process crashes
app.on('child-process-gone', (event, details) => {
  console.log('Child process gone:', details);
});

// Handle renderer process crashes
app.on('render-process-gone', (event, webContents, details) => {
  console.log('Renderer process gone:', details);
});

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      preload: path.join(__dirname, 'dist', 'preload.js')
    }
  });

  // In development, try to load from dev server first, then fallback to built files
  if (process.env.NODE_ENV === 'development') {
    const ports = [8081, 8080, 8082, 8083, 3000];
    let loaded = false;
    
    for (const port of ports) {
      try {
        const url = `http://localhost:${port}`;
        console.log(`Trying to load dev server: ${url}`);
        await mainWindow.loadURL(url);
        console.log(`Successfully loaded dev server: ${url}`);
        loaded = true;
        break;
      } catch (error) {
        console.log(`Failed to load dev server port ${port}:`, error.message);
      }
    }
    
    if (!loaded) {
      console.log('Dev server not available, loading built files...');
      const htmlPath = path.join(__dirname, 'dist', 'renderer', 'index.html');
      console.log(`Loading file: ${htmlPath}`);
      await mainWindow.loadFile(htmlPath);
    }
  } else {
    // In production, load built files
    const htmlPath = path.join(__dirname, 'dist', 'renderer', 'index.html');
    await mainWindow.loadFile(htmlPath);
  }
  
  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.log('Renderer process crashed:', killed);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Console [${level}]:`, message);
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Prevent window from closing immediately
  mainWindow.on('close', (event) => {
    console.log('Window is closing...');
  });
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('Electron main process started');