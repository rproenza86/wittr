const CACHE_STATIC_ASSETS = 'wittr-static-v5';
const CACHE_POSTS_IMAGES = 'wittr-content-imgs';

const cacheWhitelist = [CACHE_POSTS_IMAGES, CACHE_STATIC_ASSETS];

const urlsToCache = [
    '/skeleton',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_STATIC_ASSETS)
        .then(cache => {
            console.info('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('wittr-') && !cacheWhitelist.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Let the browser do its default thing
    // for non-GET requests.
    if (event.request.method != 'GET') return;

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/skeleton'));
            return;
        }
        if (requestUrl.pathname.startsWith('/photos/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request).then(response => {
                if (response.status === 404) {
                    return fetch('/imgs/dr-evil.gif');
                }
                return response;
            }).catch(err => {
                console.error(err);
                return new Response("Resource request failed");
            });
        })
    );
});

function servePhoto(request) {
    const storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

    return caches.open(CACHE_POSTS_IMAGES).then(function(cache) {
        return cache.match(storageUrl)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(request).then(function(networkResponse) {
                    console.info('Opened photos cache');
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                }).catch(err => {
                    console.error(err);
                    return new Response("Resource photo request failed");
                });
            });
    });
}

self.addEventListener('message', event => {
    // Perform install steps
    if (event.data.action === 'skipWaiting')
        self.skipWaiting();
});