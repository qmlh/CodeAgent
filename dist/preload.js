/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/electron/preload/preload.ts":
/*!*****************************************!*\
  !*** ./src/electron/preload/preload.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n/**\n * Preload script for Electron\n * Provides secure API bridge between main and renderer processes\n */\n\n// Define the API that will be exposed to the renderer process\nconst electronAPI = {\n    // Window operations\n    window: {\n        minimize: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('window:minimize'),\n        maximize: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('window:maximize'),\n        close: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('window:close-current'),\n        create: (config) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('window:create', config),\n        // Window events\n        onStateChanged: (callback) => {\n            electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('window-state-changed', (event, state) => callback(state));\n        },\n        onFocusChanged: (callback) => {\n            electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('window-focus-changed', (event, data) => callback(data.focused));\n        }\n    },\n    // File system operations\n    fs: {\n        readFile: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:read-file', filePath),\n        writeFile: (filePath, content) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:write-file', filePath, content),\n        deleteFile: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:delete-file', filePath),\n        createDirectory: (dirPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:create-directory', dirPath),\n        listDirectory: (dirPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:list-directory', dirPath),\n        getStats: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:get-stats', filePath),\n        watchDirectory: (dirPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:watch-directory', dirPath),\n        unwatchDirectory: (watcherId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:unwatch-directory', watcherId),\n        // Extended file operations\n        copy: (sourcePath, destinationPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:copy', sourcePath, destinationPath),\n        move: (sourcePath, destinationPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:move', sourcePath, destinationPath),\n        rename: (oldPath, newPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:rename', oldPath, newPath),\n        exists: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:exists', filePath),\n        getPreview: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:get-preview', filePath),\n        search: (dirPath, pattern, options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:search', dirPath, pattern, options),\n        validateName: (fileName) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:validate-name', fileName),\n        createUniqueName: (dirPath, baseName, extension) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:create-unique-name', dirPath, baseName, extension),\n        // Path utilities\n        joinPath: (...paths) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:join-path', ...paths),\n        getFileName: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:get-file-name', filePath),\n        getDirectoryName: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:get-directory-name', filePath),\n        getExtension: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('fs:get-extension', filePath),\n        // File system events\n        onDirectoryChanged: (callback) => {\n            electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('fs:directory-changed', (event, data) => callback(data));\n        }\n    },\n    // Application operations\n    app: {\n        showOpenDialog: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:show-open-dialog', options),\n        showSaveDialog: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:show-save-dialog', options),\n        showMessageBox: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:show-message-box', options),\n        openExternal: (url) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:open-external', url),\n        showItemInFolder: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:show-item-in-folder', filePath),\n        getVersion: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:get-version'),\n        getPath: (name) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('app:get-path', name)\n    },\n    // Agent operations\n    agent: {\n        create: (config) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('agent:create', config),\n        start: (agentId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('agent:start', agentId),\n        stop: (agentId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('agent:stop', agentId),\n        getStatus: (agentId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('agent:get-status', agentId),\n        list: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('agent:list')\n    },\n    // Task operations\n    task: {\n        create: (taskData) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('task:create', taskData),\n        assign: (taskId, agentId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('task:assign', taskId, agentId),\n        getStatus: (taskId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('task:get-status', taskId),\n        list: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('task:list')\n    },\n    // System operations\n    system: {\n        getInfo: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('system:get-info'),\n        executeCommand: (command, options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('system:execute-command', command, options),\n        getEnv: (key) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('system:get-env', key)\n    },\n    // Settings operations\n    settings: {\n        load: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:load'),\n        save: (settings) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:save', settings),\n        export: (filePath, settings) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:export', filePath, settings),\n        import: (filePath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:import', filePath),\n        createBackup: (name) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:create-backup', name),\n        restoreBackup: (backupId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:restore-backup', backupId),\n        listBackups: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:list-backups'),\n        deleteBackup: (backupId) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:delete-backup', backupId)\n    },\n    // Update operations\n    updates: {\n        check: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('updates:check'),\n        download: (updateInfo) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('updates:download', updateInfo),\n        install: (updateInfo) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('updates:install', updateInfo)\n    },\n    // Dialog operations\n    dialog: {\n        showOpenDialog: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('dialog:show-open-dialog', options),\n        showSaveDialog: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('dialog:show-save-dialog', options),\n        showMessageBox: (options) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('dialog:show-message-box', options)\n    },\n    // Menu and tray events\n    onMenuAction: (callback) => {\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('menu-action', (event, action) => callback(action));\n    },\n    onTrayAction: (callback) => {\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('tray-action', (event, action) => callback(action));\n    },\n    // Utility functions\n    removeAllListeners: (channel) => {\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.removeAllListeners(channel);\n    },\n    // Development helpers\n    isDevelopment: \"production\" === 'development'\n};\n// Expose the API to the renderer process\nelectron__WEBPACK_IMPORTED_MODULE_0__.contextBridge.exposeInMainWorld('electronAPI', electronAPI);\n\n\n//# sourceURL=webpack://multi-agent-ide/./src/electron/preload/preload.ts?\n}");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/electron/preload/preload.ts");
/******/ 	
/******/ })()
;