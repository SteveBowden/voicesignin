//you will need an API key from https://developer.voicesignin.com

var https = require('https');

exports.handler = (event, context, callback) => {
    
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    console.log(JSON.stringify(event));
    configureParams();


    //validate input
    function configureParams() {
        var nameRequest = event["body-json"];
        hash.update(event["context"]["source-ip"]);
        var hashedIpAddress = hash.digest('hex');
        var blocking_string = hashedIpAddress;
        var session_expiry = 3600;

        if (nameRequest.vname) {
            var v1ValidationFilter = /^The ([a-z]|[A-Z])+ ([a-z]|[A-Z])+ of ([a-z]|[A-Z]|[0-9]|-| )+([a-z]|[A-Z]|[0-9])$/i;
            if (v1ValidationFilter.test(nameRequest.vname)) {
                var vname_components = [];
                var vname_version = 'v1';
                var vnameMacroParts = nameRequest.vname.split(' of ');
                var vnameCity = vnameMacroParts[1];
                var vnameColorAndAnimal = vnameMacroParts[0];
                var vnameMicroParts = vnameColorAndAnimal.split(' ');
                var vnameColor = vnameMicroParts[1];
                var vnameAnimal = vnameMicroParts[2];
                vname_components = [vnameColor, vnameAnimal, vnameCity];

            }
            else {
                context.done(null, { "error": "vname doesn't match current versions" });
                return null;
            }
            /* SAMPLE DATA, uncomment if you want to use it
            vname_version = 'v1';
            vname_components = ['brown','bear','Chicago'];
            blocking_string = 0383176601762cf74cb95607034b9c7712a431325074396e073d7eb4e5206edc; //just a hash of the user's IP address, you could use a cookie or deviceId as well
            session_expiry = 600; // 10 minute connection
            */
            
            sendRequestToVoiceSignin(vname_version, vname_components, blocking_string, session_expiry);
        }
        else {
            return null;
        }
        return null;
    }


    function sendRequestToVoiceSignin(vname_version, vname_components, blocking_string, session_expiry) {

        var payload = { "vname_version": vname_version, "vname_components": vname_components, "blocking_string": blocking_string, "session_expiry_sec": session_expiry };
        payload = JSON.stringify(payload);
        console.log(payload);
        const options = {
            hostname: 'api.voicesignin.com',
            port: 443,
            path: '/ask',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
  //********************************************************************
                'Authorization': '' // add your API key here
  //********************************************************************
            }
        };

        const req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            //      console.log('data:',res.data);
            var rawData = '';

            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {

                var requestResponse = JSON.parse(rawData);
                console.log('reqresp: ' + JSON.stringify(requestResponse));
                if (requestResponse.request_id !== undefined) {

                    context.done(null, requestResponse);
                    return null;

                }
                else {
                    context.done(null, { "error": "invalid request" });
                    return null;
                }

            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.write(payload);
        req.end();
    }

};
