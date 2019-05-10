# Firelastic
[![Docker Build](https://img.shields.io/docker/automated/procoders/firelastic.svg)](https://hub.docker.com/r/procoders/firelastic/)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/procoders/firelastic/master/LICENSE)
[![ProCoders](https://img.shields.io/badge/powered%20by-ProCoders.tech-blue.svg?colorB=484848)](http://procoders.tech/)

It syncs Firebase with Elasticsearch

## Configuration of Firelastic

The firelastic script requires the configuration of a Firebase account and an Elasticsearch cluster.

### Firebase Account

The Firebase account information should be passed into the container via the environment variables.

```
FIREBASE_MESSAGING_SENDER_ID=1111111111
FIREBASE_API_KEY=secret
FIREBASE_AUTH_DOMAIN=example.firebaseapp.com
FIREBASE_DATABASE_URL=https://example.firebaseio.com
FIREBASE_STORAGE_BUCKET=example.appspot.com
```

Finally, the Firebase reference that will be synchronized with Elasticsearch has to be set with the variable.

```
FIREBASE_REF=rooms
```

### Elasticsearch Cluster

The Elasticsearch cluster requires as minimum configuration the hosts, index, and type.

```
ES_HOSTS=localhost:9200
ES_INDEX=rooms
ES_TYPE=room
```

To ensure that the Elasticsearch client is compatible with the version of the Elasticsearch cluster set the variable.

```
ES_VERSION=5.5
```

In case the Elasticsearch cluster requires HTTP Authentication use the variables.

```
ES_USER=admin
ES_PASSWORD=secret
```

> The full reference on the Elasticsearch client can be found on the [website](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html)

## How to use

### Using with docker

To run the container without dotenv and docker-compose use the docker command:

```
docker run \
    -e FIREBASE_API_KEY=<...>  \
    -e FIREBASE_AUTH_DOMAIN=<...> \
    -e FIREBASE_DATABASE_URL=<...> \
    -e FIREBASE_STORAGE_BUCKET=<...> \
    -e FIREBASE_MESSAGING_SENDER_ID=<...> \
    -e FIREBASE_REF=<...> \
    -e ES_ENDPOINT=<...> \
    -e ES_INDEX=<...> \
    -e ES_TYPE=<...> \
    procoders/firelastic
```

### Using with docker-compose

At services section of docker-compose.yml add the firelastic service as follows:

```
  firelastic:
    image: fprocoders/firelastic
    volumes:
      - ./.env:/opt/app/.env
```

## Support

Submit questions or bugs using the issue tracker.
For Firebase-releated questions, try the mailing list.

## License

MIT LICENSE Copyright © 2017

## Authors

[Procoders.TECH](https://procoders.tech)

We gear IT up!

> Procoders mission is to ship meaningful code, all our partners come from referrals, and our pricing model is transparent and fair. Drop us a line and let’s start a conversation right now. 

[![](https://www.procoders.tech/art/pro-powered.png)](http://procoders.tech/)

