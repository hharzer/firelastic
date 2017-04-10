# Firelastic

It syncs Firebase with Elasticsearch

## How to use via 

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
  flashlight:
    image: fprocoders/firelastic
    volumes:
      - ./.env:/opt/app/.env
```

## Support

Submit questions or bugs using the issue tracker.
For Firebase-releated questions, try the mailing list.

## License

MIT LICENSE Copyright © 2017 Firebase opensource@firebase.com