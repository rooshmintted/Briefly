/**
 * Electron Builder Configuration
 */
export default {
  appId: "com.briefly.desktop",
  productName: "Briefly Desktop",
  directories: {
    output: "build"
  },
  files: [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  mac: {
    category: "public.app-category.news",
    icon: "assets/icon.icns"
  },
  win: {
    icon: "assets/icon.ico"
  },
  linux: {
    icon: "assets/icon.png",
    category: "News"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
} 