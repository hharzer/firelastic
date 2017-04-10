# Firelastic  
[![Docker Build](https://img.shields.io/docker/automated/procoders/firelastic.svg)](https://hub.docker.com/r/procoders/firelastic/)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/procoders/firelastic/master/LICENSE)
[![ProCoders](https://img.shields.io/badge/powered%20by-ProCoders.tech-blue.svg?colorB=484848)](http://procoders.tech/)

It syncs Firebase with Elasticsearch

## How to use 


### Using with docker
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
    procoders/firelastic
```

### Using with docker-compose

At services section of docker-compose.yml
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
