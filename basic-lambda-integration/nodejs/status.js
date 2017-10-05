//you will need an API key from https://developer.voicesignin.com
var https = require('https');

exports.handler = (event, context, callback) => {

    console.log(JSON.stringify(event));
    //you can only check the status of requests made by your API key
    //the request_id and hashed_vname can be passed to the client side and used as secret session access token (ensure you are using https for transmission and verify the status as 'accepted' for each request), e.g var access_token = request_id + '.' + hashed_vname;

    var requestId = ''; // this parameter are supplied when making a connection request
    var hashedVname = ''; // this parameter is supplied when making a connection request
    getRequestDetails(requestId, requestId);

    function getRequestDetails(request_id, hashed_vname) {

        var path = '/status?request_id=' + request_id + '&hashed_vname=' + hashed_vname;
        console.log('attempted: https://api.voicesignin.com' + path);

        const options = {
            hostname: 'api.voicesignin.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                //***************************************************************************************************          
                'Authorization': '' //add your API key here
                //***************************************************************************************************
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
                context.done(null, connectionStatus);
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.end();
    }
};
