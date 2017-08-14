const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const FirebaseSearch = require('quiver-firebase-search');
const firebase = require('firebase');
const elasticsearch = require('elasticsearch');

require('dotenv').config();

var firebaseConfig = {};

if (fs.existsSync('./service-account.json')) {
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        serviceAccount: './service-account.json'
    };
} else {
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        apiKey:  process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    };
}

firebase.initializeApp(firebaseConfig);

// The firebaseSearch code has firebaseSearch.options.elasticsearch hardcoded for configuration of index value
var elasticsearchConfig = {
    host: process.env.ES_HOSTS,
    index: process.env.ES_INDEX
};

// Initialize firebaseSearch with elasticsearch enabled, so that the correct functions are present on the elasticsearch object.
var firebaseSearch = new FirebaseSearch(firebase.database().ref(process.env.FIREBASE_REF), {
    elasticsearch: _.clone(elasticsearchConfig)
}, process.env.ES_TYPE);

/**
 * Elasticsearch settings that throw an error in firebaseSearch initialization code follow.
 * For example Elasticsearch API version throws an error, when it is not supported.
 * The reason is that the elasticsearch client has to be patched to support Elasticsearch 5.
 */
if (process.env.ES_VERSION) {
    elasticsearchConfig.apiVersion = process.env.ES_VERSION;
} else {
    console.warn('The Elasticsearch API version is not given via ES_VERSION! The script will default to some random version of Elasticsearch.');
}

if (process.env.ES_USER && process.env.ES_PASSWORD) {
    elasticsearchConfig.httpAuth = process.env.ES_USER+':'+process.env.ES_PASSWORD;
    console.log('Elasticsearch client will provide httpAuth credentials.');
}

firebaseSearch.elasticsearch.client = elasticsearch.Client(elasticsearchConfig);

/**
 * Monkey patch to FirebaseSearch package
 * increase the timeout to 5s
 * it's required to make build() function work
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
            // Must be empty if no response in 5000 millis
            ref.off('child_added', handler);
            reject('Timeout! Could be an empty Firebase collection.');
        },
        5000
    );
    ref.on('child_added', handler);
});
};

/**
 * Setup log events for each elasticsearch event emmited by firebaseSearch.
 */
firebaseSearch.on('elasticsearch_child_added', function(record) {
    console.log('Record added to Elasticsearch', record);
});
firebaseSearch.on('elasticsearch_child_changed', function(record) {
    console.log('Record changed in Firebase', record);
});
firebaseSearch.on('elasticsearch_child_removed', function(record) {
    console.log('Record removed in Elasticsearch', record);
});

/**
 * Main application function runs firebaseSearch against the index after resync!
 */
console.log('Launch sync microservice from ' + firebaseConfig.databaseURL + '/' + process.env.FIREBASE_REF + ' to ' + elasticsearchConfig.host + '/' + elasticsearchConfig.index);
firebaseSearch.elasticsearch.indices.exists().then(function(exists) {
    var countCheck = exists ? firebaseSearch.elasticsearch.client.count({index: elasticsearchConfig.index}) : new Promise(function(resolve, reject) { resolve( {count: 0} ), reject( {reason: 'no index'} ) } );
    countCheck.then(function(res) {
        if (exists && res.count > 0) {
            firebaseSearch.elasticsearch.firebase.start().then(function () {
                console.log('Syncing Elasticsearch with Firebase is ON-AIR ...');
            });
        } else {
            console.log('The ElasticSearch collection does not exists.');
            console.log('I need to create it first and rebuild.');
            buildCollection = function() {
                firebaseSearch.elasticsearch.firebase.build().then(function () {
                    console.log('Index has been created, built, and synced with current Firebase state.');
                }, function(reject) {
                    console.log('################################################################################')
                    console.log('#                    ELASTIC SEARCH FIREBASE BUILD FAILED                      #')
                    console.log('################################################################################')
                    console.log('' + JSON.stringify(reject));
                });
            };
            if (exists) {
                buildCollection();
            } else {
                firebaseSearch.elasticsearch.indices.create().then(function() {
                    buildCollection();
                }, function(reject) {
                    console.log('################################################################################')
                    console.log('#                     ELASTIC SEARCH CREATE INDEX FAILED                       #')
                    console.log('################################################################################')
                    console.log('' + JSON.stringify(reject));
                });
            }
        }
    }, function(reject) {
        console.log('################################################################################')
        console.log('#                     ELASTIC SEARCH COUNT QUERY FAILED                        #')
        console.log('################################################################################')
        console.log('' + JSON.stringify(reject));
    });
}, function(reject) {
    console.log('################################################################################')
    console.log('#                    ELASTIC SEARCH EXISTS QUERY FAILED                        #')
    console.log('################################################################################')
    console.log('' + JSON.stringify(reject));
});
