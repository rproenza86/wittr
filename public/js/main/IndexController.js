import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

function openDatabase() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('wittr', 1, function(upgradeDb) {
        var store = upgradeDb.createObjectStore('wittrs', {
            keyPath: 'id'
        });
        store.createIndex('by-date', 'time');
    });
}

export default function IndexController(container) {
    this._container = container;
    this._postsView = new PostsView(this._container);
    this._toastsView = new ToastsView(this._container);
    this._lostConnectionToast = null;
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
    this._cleanImageCache();

    var indexController = this;

    setInterval(function() {
        indexController._cleanImageCache();
    }, 1000 * 60 * 5);

    this._showCachedMessages().then(function() {
        indexController._openSocket();
    });
}

IndexController.prototype._registerServiceWorker = function() {
    if ('serviceWorker' in navigator) {
        const indexController = this;

        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            if (!navigator.serviceWorker.controller) {
                return;
            }

            if (registration.waiting) {
                indexController._updateReady(registration.waiting);
                return;
            }

            if (registration.installing) {
                indexController._onSwInstallingHandler(registration.installing);
                return;
            }

            registration.addEventListener('updatefound', function() {
                indexController._onSwInstallingHandler(registration.installing);
            });
        });

        // Ensure refresh is only called once.
        // This works around a bug in "force update on reload".
        var refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    } else console.log('ServiceWorker not supported.');


};

IndexController.prototype._showCachedMessages = function() {
    var indexController = this;

    return this._dbPromise.then(function(db) {
        // if we're already showing posts, eg shift-refresh
        // or the very first load, there's no point fetching
        // posts from IDB
        if (!db || indexController._postsView.showingPosts()) return;

        // const tx = db.transaction('wittr');
        // const wittrStore = tx.objectStore('wittr');
        // const dateIndex = wittrStore.index('by-date');

        // Refactored due the next error: https://files.slack.com/files-pri/T8700H3B7-F8S8U1N7M/image.png

        const dateIndex = db.transaction('wittrs')
            .objectStore('wittrs').index('by-date');

        return dateIndex.getAll().then(function(messages) {
            indexController._postsView.addPosts(messages.reverse());
        });
    });
};

IndexController.prototype._onSwInstallingHandler = function(worker) {
    var indexController = this;
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            indexController._updateReady(worker);
        }
    });
};

IndexController.prototype._updateReady = function(worker) {
    var toast = this._toastsView.show("New version available", {
        buttons: ['refresh', 'dismiss']
    });

    toast.answer.then(function(answer) {
        if (answer != 'refresh') return;
        worker.postMessage({ action: 'skipWaiting' });
    });
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
    var indexController = this;
    var latestPostDate = this._postsView.getLatestPostDate();

    // create a url pointing to /updates with the ws protocol
    var socketUrl = new URL('/updates', window.location);
    socketUrl.protocol = 'ws';

    if (latestPostDate) {
        socketUrl.search = 'since=' + latestPostDate.valueOf();
    }

    // this is a little hack for the settings page's tests,
    // it isn't needed for Wittr
    socketUrl.search += '&' + location.search.slice(1);

    var ws = new WebSocket(socketUrl.href);

    // add listeners
    ws.addEventListener('open', function() {
        if (indexController._lostConnectionToast) {
            indexController._lostConnectionToast.hide();
        }
    });

    ws.addEventListener('message', function(event) {
        requestAnimationFrame(function() {
            indexController._onSocketMessage(event.data);
        });
    });

    ws.addEventListener('close', function() {
        // tell the user
        if (!indexController._lostConnectionToast) {
            indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
        }

        // try and reconnect in 5 seconds
        setTimeout(function() {
            indexController._openSocket();
        }, 5000);
    });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
    var messages = JSON.parse(data);

    this._dbPromise.then(function(db) {
        if (!db) return;

        var tx = db.transaction('wittrs', 'readwrite');
        var store = tx.objectStore('wittrs');
        messages.forEach(function(message) {
            store.put(message);
        });

        /**
         * Keep the IDB limit store to 30 items.
         * The "openCursor(null, "prev")" causes the cursor to be opened at the end of the source, "next" cause the opposite.
         * Ref: https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor/direction
         */
        store.index('by-date').openCursor(null, "prev").then(function(cursor) {
            return cursor.advance(30);
        }).then(function cleanDB(cursor) {
            if (!cursor) return;
            cursor.delete();
            return cursor.continue().then(cleanDB);
        }).then(function() {
            console.log("IDB clean up done!");
        });
    });

    this._postsView.addPosts(messages);
};

IndexController.prototype._cleanImageCache = function() {
    return this._dbPromise.then(function(db) {
        if (!db) return;

        const tx = db.transaction('wittrs', 'readonly');
        const store = tx.objectStore('wittrs');

        return store.getAll().then(function(messages) {
            let msgPhotosUrls = [];
            messages.map(msg => msg.photo && msgPhotosUrls.push(msg.photo));

            return caches.open('wittr-content-imgs').then(function(cache) {
                cache.keys().then(function(keys) {
                    keys.forEach(function(request) {
                        const requestPhoto = `photos${request.url.split('photos')[1]}`;
                        if (!msgPhotosUrls.includes(requestPhoto))
                            cache.delete(request);
                    });
                });
            });
        });
    });
};