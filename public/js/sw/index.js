addEventListener('fetch', event => {
    console.log("HELLO MOON!!!");
    console.table(event.request);
});