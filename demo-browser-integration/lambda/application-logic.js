var AWS = require('aws-sdk');
var s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var hashed_vname = event["context"]["authorizer-principal-id"];
    console.log('hvn: ' + hashed_vname);
    var vname = event["context"]["authorizer-property-vname"];
    var statusObject = {};
    var blankStatus = { "status": "not set" };
    var requestAction;
    var requestField;
    var requestValue;

    //validate action
    if (event.params.querystring.action) {
        var availableActions = ['read', 'update', 'reset'];
        if (availableActions.indexOf(event.params.querystring.action) > -1) {
            requestAction = event.params.querystring.action;
            console.log('request Action : ' + requestAction);

        }
        else {
            context.done(null, { "error": "invalid action parameter" });
            return null;
        }
    }
    else {
        context.done(null, { "error": "missing action parameter" });
        return null;
    }

    //validate field
    if (event.params.querystring.field) {
        //you can add more fields by adding more key-array pairs to the json object below
        var fieldOptions = { "status": ["awesome", "happy", "sad", "gloomy", "terrific", "average", "brilliant", "okay", "tba", "fantastic"] };
        if (fieldOptions[event.params.querystring.field]) {
            requestField = event.params.querystring.field;
            console.log('request field : ' + requestField);

            //validate field value
            if (event.params.querystring.value) {
                if (fieldOptions[requestField].indexOf(event.params.querystring.value) > -1) {
                    requestValue = event.params.querystring.value;
                    console.log('request value : ' + requestValue);
                }
                else {
                    context.done(null, { "error": "invalid value parameter" });
                    return null;
                }
            }
        }
        else {
            context.done(null, { "error": "invalid field parameter" });
            return null;
        }
    }




    checkS3ForObject();

    function checkS3ForObject() {
        console.log('starting check of S3');

        var params = {
            Bucket: '', // add an s3 bucket here and give the lambda get, put and list permissions
            Key: hashed_vname + '.json'
        };

        s3.getObject(params, function(err, data) {


            if (err) {
                if (err.code == 'NoSuchKey') {
                    console.log('hashed_vname is not in S3');
                    statusObject = blankStatus;
                }
                else {
                    console.log('already in S3, but some other error occured');
                    context.done(null, { "error": "something went wrong when updating" });
                    return null;
                }
            }
            else {
                statusObject = JSON.parse(data.Body.toString('utf8'));
                statusObject["vname"] = vname;

            }
            if (requestAction == 'read' && statusObject[requestField]) {
                context.done(null, {
                    [requestField]: statusObject[requestField], "vname": vname });
                return null;
            }
            else if (requestAction == 'reset') {
                statusObject = blankStatus;
                addNewData(statusObject);
                return null;
            }
            else if (requestAction == 'update' && requestField && requestValue) {

                statusObject[requestField] = requestValue;
                addNewData(statusObject);
                return null;

            }
            else {
                context.done(null, { "error": "invalid parameters" });
                return null;
            }

        });

    }

    function addNewData(currentObject) {
        var currentObjectStringified = JSON.stringify(currentObject);
        var params = {
            Bucket: '', // add an s3 bucket here and give the lambda get, put and list permissions
            Key: hashed_vname + '.json',
            Body: currentObjectStringified,


        };
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                context.done(null, { "error": "could not update data" });
            }
            else {
                console.log('object updated');

                context.done(null, currentObject);
                return (null);
            }
        });
    }

};
