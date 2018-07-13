import idb from 'idb';

/*
Basic pattern

The basic pattern that IndexedDB encourages is the following:

1- Open a database.
2- Create an object store in the database. 
3- Start a transaction and make a request to do some database operation, like adding or retrieving data.
4- Wait for the operation to complete by listening to the right kind of DOM event.
5- Do something with the results (which can be found on the request object).

*/

// The second param of the open function is the db version. It's relevant because in the open function it will be executed the db upgrade function, this is where we can create new
// objects(tables) and index. To keep the database integrity, each time when is required one of these operations the good practice to avoid errors
// is to bump the db version and react accordingly using the below snippet of code.
var dbPromise = idb.open('test-db', 4, function(upgradeDb) { // 1- Open a database.
    switch (upgradeDb.oldVersion) {
        case 0:
            const keyValStore = upgradeDb.createObjectStore('keyval'); // 2- Create an object store in the database. 
            keyValStore.put("world", "hello");
        case 1:
            upgradeDb.createObjectStore('people', { keyPath: 'name' });
        case 2:
            let peopleStore = upgradeDb.transaction.objectStore('people');
            peopleStore.createIndex('animal', 'favoriteAnimal'); // index creation to queryfy the idb people table by favoriteAnimal
        case 3:
            peopleStore = upgradeDb.transaction.objectStore('people');
            peopleStore.createIndex('age', 'age'); // index creation to queryfy the idb people table by age
    }
});

// read "hello" in "keyval"
dbPromise.then(function(db) {
    var tx = db.transaction('keyval'); // 3- Start a transaction and make a request to do some database operation, like adding or retrieving data.
    var keyValStore = tx.objectStore('keyval');
    return keyValStore.get('hello');
}).then(function(val) { // 4- Wait for the operation to complete by listening to the right kind of DOM event.
    console.log('The value of "hello" is:', val); // 5- Do something with the results (which can be found on the request object).
});

// set "foo" to be "bar" in "keyval"
dbPromise.then(function(db) {
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    keyValStore.put('bar', 'foo');
    return tx.complete;
}).then(function() {
    console.log('Added foo:bar to keyval');
});

dbPromise.then(function(db) {
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    keyValStore.put('leon', 'favoriteAnimal');
    return tx.complete;
}).then(function() {
    console.log('Added favoriteAnimal:leon to keyval');
});

// storing people objects
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');

    peopleStore.put({
        name: 'Raul Proenza',
        age: 32,
        favoriteAnimal: 'tiger'
    });

    peopleStore.put({
        name: 'Derlin Proenza',
        age: 38,
        favoriteAnimal: 'zebra'
    });

    peopleStore.put({
        name: 'Gabby Proenza',
        age: 9,
        favoriteAnimal: 'cat'
    });

    peopleStore.put({
        name: 'Luna Proenza',
        age: 1,
        favoriteAnimal: 'leon'
    });

    return tx.complete;
}).then(function() {
    console.log('People added.');
});

// fetch sorted people db records
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');

    return peopleStore.getAll();
}).then(function(listObject) {
    console.log('People unsort list:', listObject);
});

// fetch sorted people db records
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');
    const animalIndex = peopleStore.index('animal');

    return animalIndex.getAll();
}).then(function(listObject) {
    console.log('People sortList:', listObject);
});

// fetch filtered people db records
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');
    const animalIndex = peopleStore.index('animal');

    return animalIndex.getAll('tiger');
}).then(function(listObject) {
    console.log('People tiger lovers:', listObject);
});

// fetch sorted people db records by age
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');
    const ageIndex = peopleStore.index('age');

    return ageIndex.getAll();
}).then(function(listObject) {
    console.log("People age's sorted: ", listObject);
});

// iterating in a sorted by age people db records list 
dbPromise.then(function(db) {
    const tx = db.transaction('people', 'readwrite');
    const peopleStore = tx.objectStore('people');
    const ageIndex = peopleStore.index('age');

    return ageIndex.openCursor();
}).then(function logPerson(cursor) {
    if (!cursor) return; // Empty case
    console.log("Cursored at", cursor.value.name);
    /**
     * Ex. about how to delete and update a record
     * cursor.delete() to delete this entry
     * cursor.update(newRecord) to change the value, or
     */
    return cursor.continue().then(logPerson);
    /**
     * Also we could do things like:
     * return cursor.advance(2); to skip 2 records
     */
}).then(function() {
    console.log("Done cursoring");
});

// Reference:
// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
// https://github.com/jakearchibald/idb
