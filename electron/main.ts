/**
 * Electron Main Process
 * Handles window creation, app lifecycle, and IPC communication for Briefly Desktop
 */

import { app, BrowserWindow, ipcMain, Menu, shell, WebContents } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import path from 'path'

// Get the directory name for the current module
const currentDir = __dirname || path.dirname(require.main?.filename || '')

// Load environment variables from .env file
try {
  const dotenv = require('dotenv')
  
  // Load .env file from the project root
  const envPath = path.join(currentDir, '..', '.env')
  const result = dotenv.config({ path: envPath })
  
  if (result.error) {
    console.log('Error loading .env file:', result.error)
  } else {
    console.log('Successfully loaded .env file from:', envPath)
  }
  
  console.log('Environment variables loaded:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    DEV_USER_ID: process.env.DEV_USER_ID ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'undefined'
  })
} catch (error) {
  console.log('Could not load dotenv, environment variables may not be available:', error)
}

// Initialize electron store for app settings
const store = new Store()

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
}

class BrieflyApp {
  private mainWindow: BrowserWindow | null = null
  private isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  constructor() {
    this.initializeApp()
  }

  /**
   * Initialize the Electron application with event handlers
   */
  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow()
      this.setupMenu()
      this.setupIPC()
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow()
        }
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('web-contents-created', (_event: Electron.Event, contents: WebContents) => {
      contents.setWindowOpenHandler(({ url }: { url: string }) => {
        shell.openExternal(url)
        return { action: 'deny' }
      })

      // Handle permission requests for media content
      contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'audioCapture', 'videoCapture', 'fullscreen']
        
        if (allowedPermissions.includes(permission)) {
          callback(true)
        } else {
          callback(false)
        }
      })

      // Set additional headers for YouTube compatibility
      contents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.url.includes('youtube.com') || details.url.includes('youtubei.googleapis.com')) {
          details.requestHeaders['Referer'] = 'https://www.youtube.com/'
        }
        callback({ requestHeaders: details.requestHeaders })
      })
    })
  }

  /**
   * Create the main application window with security settings
   */
  private createMainWindow(): void {
    const defaultWindowState: WindowState = {
      width: 1200,
      height: 800,
      x: undefined,
      y: undefined,
    }
    
    const windowState = store.get('windowState', defaultWindowState) as WindowState

    this.mainWindow = new BrowserWindow({
      width: windowState.width,
      height: windowState.height,
      x: windowState.x,
      y: windowState.y,
      minWidth: 900,
      minHeight: 600,
      show: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Allows YouTube embeds to work
        allowRunningInsecureContent: true, // Helps with mixed content
        experimentalFeatures: true, // Enables modern web features
        preload: join(currentDir, 'preload.cjs'),
      },
    })

    // Set user agent to avoid YouTube blocking
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    this.mainWindow.webContents.setUserAgent(userAgent)

    // Load the app
    if (this.isDev) {
      console.log('Loading from development server: http://localhost:5173')
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      console.log('Loading from file system')
      // In production, load from the dist-renderer directory
      this.mainWindow.loadFile(join(currentDir, '../dist-renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    // Handle load errors
    this.mainWindow.webContents.on('did-fail-load', (
      _event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string
    ) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL)
      
      // If development server fails, show an error page
      if (this.isDev && validatedURL.includes('localhost:5173')) {
        console.log('Development server not available, check if Vite is running')
      }
    })

    // Save window state on close
    this.mainWindow.on('close', () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        store.set('windowState', bounds)
      }
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  /**
   * Setup application menu
   */
  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Sync Now',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow?.webContents.send('trigger-sync')
            }
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('open-preferences')
            }
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  /**
   * Setup IPC communication handlers
   */
  private setupIPC(): void {
    // Handle app settings
    ipcMain.handle('get-app-setting', (_event: Electron.IpcMainInvokeEvent, key: string) => {
      return store.get(key)
    })

    ipcMain.handle('set-app-setting', (_event: Electron.IpcMainInvokeEvent, key: string, value: any) => {
      store.set(key, value)
      return true
    })

    // Handle external link opening
    ipcMain.handle('open-external', (_event: Electron.IpcMainInvokeEvent, url: string) => {
      shell.openExternal(url)
    })

    // Handle window controls
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize()
    })

    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize()
      } else {
        this.mainWindow?.maximize()
      }
    })

    ipcMain.handle('close-window', () => {
      this.mainWindow?.close()
    })

    // Handle app refresh (useful after credentials update)
    ipcMain.handle('refresh-app', () => {
      this.mainWindow?.reload()
    })
  }
}

// Initialize the app
new BrieflyApp() 