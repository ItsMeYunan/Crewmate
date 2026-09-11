const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, screen, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let isMiniMode = false;
let normalBounds = { width: 1020, height: 740 };

// Konfigurasi logger auto-updater (opsional tapi membantu debug)
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Pastikan App ID terdaftar di Windows agar notifikasi muncul dengan baik
if (process.platform === 'win32') {
  app.setAppUserModelId('com.crewmate.manager');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: normalBounds.width,
    height: normalBounds.height,
    minWidth: 320,
    minHeight: 140,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Saat tombol close (X) ditekan, sembunyikan ke Tray alih-alih keluar
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      showTrayBalloon('Crewmate Berjalan di Background', 'Aplikasi tetap memantau jadwal stream & notifikasi.');
    }
  });

  mainWindow.on('resize', () => {
    if (!isMiniMode) {
      normalBounds = mainWindow.getBounds();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  tray = new Tray(iconPath);

  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Buka Crewmate',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        label: isMiniMode ? 'Mode Penuh' : 'Mode Mini Widget (Sticky)',
        click: () => {
          toggleMiniMode(!isMiniMode);
        }
      },
      { type: 'separator' },
      {
        label: 'Cek Pembaruan...',
        click: () => {
          if (app.isPackaged) {
            autoUpdater.checkForUpdates();
            showTrayBalloon('Memeriksa Pembaruan', 'Crewmate sedang mencari versi terbaru...');
          } else {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Mode Developer',
              message: 'Pengecekan update hanya aktif saat aplikasi sudah menjadi .exe.'
            });
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Keluar Sepenuhnya',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();
  tray.setToolTip('Crewmate — VTuber Manager Helper');

  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });
}

function showTrayBalloon(title, content) {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: content,
      icon: path.join(__dirname, 'build', 'icon.ico')
    }).show();
  }
}

// Logika Beralih ke Mode Mini Floating (Sticky)
function toggleMiniMode(enableMini) {
  isMiniMode = enableMini;
  if (isMiniMode) {
    normalBounds = mainWindow.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setResizable(false);
    mainWindow.setSize(330, 165);
    mainWindow.setPosition(width - 350, 40);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setBounds(normalBounds);
  }

  mainWindow.webContents.send('mode-changed', isMiniMode);
}

// =========================================================
// AUTO-UPDATER EVENTS
// =========================================================
autoUpdater.on('update-available', (info) => {
  showTrayBalloon('Update Tersedia!', `Versi ${info.version} ditemukan. Mengunduh di background...`);
});

autoUpdater.on('update-not-available', () => {
  // Hanya notifikasi jika pengguna mengecek secara manual
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Siap Dipasang',
    message: `Versi baru (${info.version}) telah selesai diunduh. Restart Crewmate sekarang untuk memasang pembaruan?`,
    buttons: ['Restart Sekarang', 'Nanti']
  }).then((result) => {
    if (result.response === 0) {
      isQuitting = true; // Set true agar tidak dicegat oleh tray close event
      autoUpdater.quitAndInstall(false, true);
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});

// IPC Handlers
ipcMain.on('toggle-mini-mode', (event, targetState) => {
  toggleMiniMode(targetState !== undefined ? targetState : !isMiniMode);
});

ipcMain.on('send-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'Crewmate Reminder',
      body: body || '',
      icon: path.join(__dirname, 'build', 'icon.ico')
    }).show();
  }
});

// Single Instance Lock: Hanya buka 1 aplikasi sekaligus
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    // Cek update otomatis saat pertama kali dibuka (khusus versi .exe)
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});