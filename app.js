var path = require('path');
var fs = require('fs');
var FirebaseSearch = require('quiver-firebase-search');
var firebase = require('firebase');

require('dotenv').config()

var firebaseConfig = {};

if (fs.existsSync('./service-account.json')){
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        serviceAccount: './service-account.json'
    }
} else {
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        apiKey:  process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    }
}

firebase.initializeApp(firebaseConfig);

var elasticsearchConfig = {
    host: process.env.ES_ENDPOINT,
    index: process.env.ES_INDEX
  };

var firebaseSearch = new FirebaseSearch( firebase.database().ref(process.env.FIREBASE_REF) , {
  elasticsearch: elasticsearchConfig,
});

/**
 * Monkey path to FirebaseSearch package
 * increase the timeout to 5s
 * it's reuired for muking build() function work
 */
firebaseSearch.getLastKey = function() {
return new Promise(function(resolve, reject) {
    var ref = firebaseSearch.ref.orderByKey().limitToLast(1);
    var handler = function(snap) {
        ref.off('child_added', handler);
        resolve(snap.key);
    };
    var timer = setTimeout(
        function() {
            // Must be empty if no response in 1000 millis
            ref.off('child_added', handler);
            reject('Timeout! Could be an empty Firebase collection.');
        },
        5000
    );
    ref.on('child_added', handler);
});
};

console.log('Launch sync microservice from ' + firebaseConfig.databaseURL + '/' + process.env.FIREBASE_REF + ' to ' + elasticsearchConfig.host + '/' + elasticsearchConfig.index);

firebaseSearch.elasticsearch.indices.exists().then(function(exists) {
    if (exists) {
        firebaseSearch.elasticsearch.firebase.start().then(function () {
            console.log('Syncing Elasticsearch with Firebase is ON-AIR ...');
        })
    } else {
        console.log('ElasticSearch collection does not exists, I need to create it first and rebuild');
        firebaseSearch.elasticsearch.indices.create().then( function () {
            firebaseSearch.elasticsearch.firebase.build().then(function () {
                console.log('Index has been created, built and synced with current Firebase state.');
            })
        });
    }
});
