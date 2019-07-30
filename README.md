# BDX Integration

Makes an FTP connection to a customers BDX ftp account, pulls the XML files, and imports them into a specific content model.


**Endpoints**

- zesty-dev: https://us-central1-zesty-dev.cloudfunctions.net/bdxIntegration
- zesty-stage: https://us-central1-zesty-stage.cloudfunctions.net/bdxIntegration
- zesty-prod: https://us-central1-zesty-prod.cloudfunctions.net/bdxIntegration

# local deployment

install functions (google's test package)

`npm install`

NPM deploy scripts

`npm run deploy:local`
`npm run deploy:dev`
`npm run deploy:stage`
`npm run deploy:prod`



### Testing Remote Project

Provide a Project ID as shown below before starting the Emulator:

```
functions config set projectId zesty-dev
```

Before you can deploy a function, you need to start the Emulator as follows:

```
functions start
```

You stop the Emulator by calling stop:

```
functions stop
```

Deploy an HTTP function to the Emulator as follows:

```
functions deploy bdxIntegration --env-vars-file .env.yaml --trigger-http --timeout=240s
```

Read the last 50 lines of the log from the Emulator:

```
functions logs read --limit=50
```


## Deployment

Note: for local developer you need to paste in values, remove before commits.

- Local: `npm run deploy:dev`
- Dev: `npm run deploy:dev`
- Stage: `npm run deploy:stage`
- Prod: `npm run deploy:prod`
