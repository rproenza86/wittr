addEventListener('fetch', event => {
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