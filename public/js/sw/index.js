const CACHE_NAME = 'wittr-static-v2';
const urlsToCache = [
    '/',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.info('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', event => {
    // white list examples
    const cacheWhitelist = ['wittr-pages-cache-v1', 'wittr-blog-posts-cache-v1', CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('wittr-') && cacheWhitelist.indexOf(CACHE_NAME) === -1; // Note that the "CACHE_NAME" is the name of the current cache
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

self.addEventListener('message', event => {
    // Perform install steps
    if (event.data.action === 'skipWaiting')
        self.skipWaiting();
});