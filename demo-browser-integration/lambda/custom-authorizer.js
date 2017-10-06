var https = require('https');

exports.handler = (event, context, callback) => {

    console.log(JSON.stringify(event));
    var accessToken = 'undefined';
    //please refine the resource to your API base ARN e.g. "Resource": 'arn:aws:execute-api:us-east-1:'...'
    var doneDenyJson = {
        "principalId": "invalid",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "execute-api:Invoke",
                "Effect": "Deny",
                "Resource": '*'
            }]
        },
        "context": {}
    };



    var accessTokenFormat = /^([0-9]|[a-f]|\.)+$/;
    if (event.authorizationToken.match(accessTokenFormat)) {
        accessToken = event.authorizationToken;
        getRequestDetails(accessToken);
    }
    else {
        context.done(null, 'doneDenyJson');
        return null;
    }

    function getRequestDetails(token) {
        var tokenParts = token.split('.');
        var hashed_vname = tokenParts[1];
        var request_id = tokenParts[0];

        var path = '/status?request_id=' + request_id + '&hashed_vname=' + hashed_vname;
        console.log('attempted: https://api.voicesignin.com' + path);
        //*******************************
        var voicesigninApiKey = ''; //add your API key here
        //*******************************    
        const options = {
            hostname: 'api.voicesignin.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': voicesigninApiKey

            }
        };

        const req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            console.log('data:', res.data);
            var rawData = '';

            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                console.log(rawData);
                var connectionStatus = JSON.parse(rawData);
                console.log(connectionStatus);

                if (connectionStatus.request_status) {
                    if (connectionStatus.request_status == 'accepted') {
                        var vname = connectionStatus.vname;
                        var vnameValidationFilter = /^([a-z]|[A-Z]| |-|[0-9])+$/;
                        if (vnameValidationFilter.test(vname)) {
                            allowTheRequest(hashed_vname, vname);
                            return null;
                        }
                    }
                    else {
                        console.log('not allowed, must have an expired request id');
                        context.done(null, doneDenyJson);
                        return null;
                    }

                }
                else {
                    console.log('not allowed, invalid request');
                    context.done(null, doneDenyJson);
                    return null;
                }

            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.end();
    }

    function allowTheRequest(hashed_vname, vname) {
    //please refine the resource to your API base ARN e.g. "Resource": 'arn:aws:execute-api:us-east-1:'...'
        var doneAllowJson = {
            "principalId": hashed_vname,
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": "*"

                }]
            },
            "context": {
                "vname": vname
            }
        };
        console.log(doneAllowJson);
        console.log(doneAllowJson.policyDocument.Statement[0]);

        context.done(null, doneAllowJson);
    }

};
