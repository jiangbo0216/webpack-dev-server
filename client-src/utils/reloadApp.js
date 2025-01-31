/* global __webpack_hash__ */

import hotEmitter from "webpack/hot/emitter.js";
import { log } from "./log.js";

function reloadApp({ hot, liveReload }, status) {
  if (status.isUnloading) {
    return;
  }

  // TODO Workaround for webpack v4, `__webpack_hash__` is not replaced without HotModuleReplacement plugin
  const webpackHash =
    // eslint-disable-next-line camelcase
    typeof __webpack_hash__ !== "undefined"
      ? // eslint-disable-next-line camelcase
        __webpack_hash__
      : status.previousHash || "";
  const isInitial = status.currentHash.indexOf(webpackHash) === 0;

  if (isInitial) {
    const isLegacyInitial =
      webpackHash === "" && hot === false && liveReload === true;

    if (isLegacyInitial) {
      status.previousHash = status.currentHash;
    }

    return;
  }

  function applyReload(rootWindow, intervalId) {
    clearInterval(intervalId);

    log.info("App updated. Reloading...");

    rootWindow.location.reload();
  }

  const search = self.location.search.toLowerCase();
  const allowToHot = search.indexOf("webpack-dev-server-hot=false") === -1;
  const allowToLiveReload =
    search.indexOf("webpack-dev-server-live-reload=false") === -1;

  if (hot && allowToHot) {
    log.info("App hot update...");
    //# webpackHotUpdate 发出事件
    hotEmitter.emit("webpackHotUpdate", status.currentHash);

    if (typeof self !== "undefined" && self.window) {
      // broadcast update to window
      self.postMessage(`webpackHotUpdate${status.currentHash}`, "*");
    }
  }
  // allow refreshing the page only if liveReload isn't disabled
  else if (liveReload && allowToLiveReload) {
    let rootWindow = self;

    // use parent window for reload (in case we're in an iframe with no valid src)
    const intervalId = self.setInterval(() => {
      if (rootWindow.location.protocol !== "about:") {
        // reload immediately if protocol is valid
        applyReload(rootWindow, intervalId);
      } else {
        rootWindow = rootWindow.parent;

        if (rootWindow.parent === rootWindow) {
          // if parent equals current window we've reached the root which would continue forever, so trigger a reload anyways
          applyReload(rootWindow, intervalId);
        }
      }
    });
  }
}

export default reloadApp;
