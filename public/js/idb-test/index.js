import idb from 'idb';

var dbPromise = idb.open('test-db', 4, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
        case 0:
            const keyValStore = upgradeDb.createObjectStore('keyval');
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
    var tx = db.transaction('keyval');
    var keyValStore = tx.objectStore('keyval');
    return keyValStore.get('hello');
}).then(function(val) {
    console.log('The value of "hello" is:', val);
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