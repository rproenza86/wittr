const CACHE_NAME = 'wittr-static-v1';
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

self.addEventListener('fetch', event => {
    // Let the browser do its default thing
    // for non-GET requests.
    if (event.request.method != 'GET') return;

    event.respondWith(
        fetch(event.request).then(response => {
            if (response.status === 404) {
                return fetch('/imgs/dr-evil.gif');
            }
            return response;
        }).catch(err => {
            console.error(err);
            return new Response("Resource request failed");
        })
    );
});