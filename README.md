# BDX Integration

Makes an FTP connection to a customers BDX ftp account, pulls the XML files, and imports them into a specific content model.

This Zesty.io integration writes a file to the ftp named `zesty-sync.txt` with a timestamp of the sync. The system will sync once a day.

## The BDX XML file

The BDX file is a large XML file that contains a lot of data in a child parent format.

... = has one or many children

* Builders (one of many children)
    * Corporations... (owning organiztion)
        * Builder... (represents the contractor), contains info on the builder contact info etc.
            * Subdivision... (a project developement) container info liek area, name etc.
                * Plan... (an architectual plan with information on the home, images, and other data)
                    * Plan Images... (images associated with the Plan)
                    * Spec... (home listings) info on price, movein, and unit info associated with the plan etc.
                        * Spec Images... (images associate with the spec)



## Function Flow Breakdown

* function is posted to with the instance zuid
* function looks for secret credentials associated with instance, makes zesty authentication and get token
* makes connection to zesty api
* bdx details are pull from the instance settings
* FTP connecton is made with BDX credentials from zesty settings
* BDX XML file id downloaded to a temporary folder
* BDX file is read and converted into a Javascript Object
* bdx javascript object is parsed to prepare into post bodies and write to the zesty api, this is the order
    * Builders are 
* post bodies are iterated through to create content
    * Item is check if it is unique by looking it up by URL, if exists skip
    * Item is entered into the system
    * Item is published
* Process completes, sync file is written to the ftp


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


## NPM Deployment Commands

Note: for local developer you need to paste in values, remove before commits.

- Local: `npm run deploy:dev`
- Dev: `npm run deploy:dev`
- Stage: `npm run deploy:stage`
- Prod: `npm run deploy:prod`
