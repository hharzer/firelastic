const intel = require('intel');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const FirebaseSearch = require('quiver-firebase-search');
const firebase = require('firebase');
const elasticsearch = require('elasticsearch');

require('dotenv').config();
intel.setLevel(intel.INFO);

var firebaseConfig = {};

if (fs.existsSync('./service-account.json')) {
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        serviceAccount: './service-account.json'
    };
    intel.debug('Firebase configuration from service-account.json.');
} else {
    firebaseConfig = {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        apiKey:  process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    };
    intel.debug('Firebase configuration from process environment.');
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
    intel.debug('Elasticsearch client version is "%s".', elasticsearchConfig.appVersion);
} else {
    intel.warn('The Elasticsearch API version is not given via ES_VERSION! The script will default to some random version of Elasticsearch.');
}

if (process.env.ES_USER && process.env.ES_PASSWORD) {
    elasticsearchConfig.httpAuth = process.env.ES_USER+':'+process.env.ES_PASSWORD;
    intel.debug('Elasticsearch client will provide httpAuth credentials.');
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
    intel.info('Record added to Elasticsearch: %O', record);
});
firebaseSearch.on('elasticsearch_child_changed', function(record) {
    intel.info('Record changed in Firebase: %O', record);
});
firebaseSearch.on('elasticsearch_child_removed', function(record) {
    intel.info('Record removed in Elasticsearch: %O', record);
});

var startMonitoredSync = function () {
    firebaseSearch.elasticsearch.firebase.start().then(function () {
        intel.info('FIREBASE SEARCH Syncing Elasticsearch with Firebase is ON-AIR ...');
    }, function(rejection) {
        intel.error('FIREBASE SEARCH START FAILED: %O', rejection);
    }).catch(function (error) {
        intel.error('FIREBASE SEARCH SYNC ERROR: %O', error);
    });
}

/**
 * Main application function runs firebaseSearch against the index after resync!
 */
intel.info('Launch sync microservice from ' + firebaseConfig.databaseURL + '/' + process.env.FIREBASE_REF + ' to ' + elasticsearchConfig.host + '/' + elasticsearchConfig.index);
firebaseSearch.elasticsearch.indices.ensure().then(function () {
    firebaseSearch.elasticsearch.client.count({index: elasticsearchConfig.index}).then(function(response) {
            if (response.count > 0) {
                startMonitoredSync();
            } else {
                intel.info('The ElasticSearch collection does not contain data.');
                firebaseSearch.elasticsearch.firebase.build().then(function () {
                    intel.info('Collection has been synced with current Firebase state.');
                    startMonitoredSync();
                }, function(rejection) {
                    intel.error('ELASTICSEARCH FIREBASE BUILD FAILED: %O', rejection);
                });
            }
    }, function(rejection) {
        intel.error('ELASTICSEARCH COUNT QUERY FAILED: %O', rejection);
    });
}, function(rejection) {
    intel.error('ELASTICSEARCH EXISTS QUERY OR CREATE FAILED: %O', rejection);
});
