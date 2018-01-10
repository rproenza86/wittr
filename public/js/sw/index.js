addEventListener('fetch', event => {
    // Let the browser do its default thing
    // for non-GET requests.
    if (event.request.method != 'GET') return;

    if (event.request.url.indexOf('jpg') != -1) {
        event.respondWith(function() {
            // return new Response('<div class="a-winner-is-me"> And the winner is Raul!</div>', {
            //     headers: { 'Content-Type': 'text/html' }
            // });
            return fetch('/imgs/dr-evil.gif');
        }());
    }

    // Prevent the default, and handle the request ourselves.
    // event.respondWith(async function() {
    //     // Try to get the response from a cache.
    //     const cache = await caches.open('dynamic-v1');
    //     const cachedResponse = await cache.match(event.request);

    //     if (cachedResponse) {
    //         // If we found a match in the cache, return it, but also
    //         // update the entry in the cache in the background.
    //         event.waitUntil(cache.add(event.request));
    //         return cachedResponse;
    //     }

    //     // If we didn't find a match in the cache, use the network.
    //     return fetch(event.request);
    // }());
});