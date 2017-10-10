var https = require('https');

exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));
  //*************************
  var voicesigninApiKey = ''; // add your API key here
  //*************************
  var reponseMessage = {};
  if (event.request.intent.name == 'voicesigninVersionOne') {
    sendRequestToVoiceSignin();

  }
  else if (event.request.intent.name == 'voicesigninConfirmAcceptance') {
    var requestId = event.session.attributes.requestId;
    var hashedVname = event.session.attributes.hashedVname;
    checkStatusOfRequestId(requestId, hashedVname);
  }
  else {
    var responseMessage = {
      "version": "string",
      "sessionAttributes": {},
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "I didn't get that"
        },

        "shouldEndSession": true
      }
    };
    context.done(null, responseMessage);
  }

  function sendRequestToVoiceSignin() {

    var tryAgainResponse = {
      "version": "string",
      "sessionAttributes": {},
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "I'm having trouble understanding, please try again"
        },

        "shouldEndSession": false
      }
    };


    var color = event.request.intent.slots.color.value;
    var city = event.request.intent.slots.city.value;
    var animal = event.request.intent.slots.animal.value;
    var sessionExpiry = 3600;
    var vname_components = [color, animal, city];


    var blockingString = event.context.System.device.deviceId;
    var payload = { "vname_version": "v1", "vname_components": vname_components, "blocking_string": blockingString, "session_expiry_sec": sessionExpiry };
    payload = JSON.stringify(payload);
    console.log(payload);
    const options = {
      hostname: 'api.voicesignin.com',
      port: 443,
      path: '/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': voicesigninApiKey

      }
    };

    const req = https.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      var rawData = '';

      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {

        var requestResponse = JSON.parse(rawData);
        console.log('reqresp: ' + JSON.stringify(requestResponse));
        if (requestResponse.request_id !== undefined) {


          var vname = 'The ' + color + ' ' + animal + ' of ' + city;
          var responseWords = 'I sent a ' + requestResponse.color + ' button to ' + vname + ', let me know when you have accepted';

          responseMessage = {
            "version": "string",
            "sessionAttributes": {
              "requestId": requestResponse.request_id,
              "hashedVname": requestResponse.hashed_vname
            },
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": responseWords
              },
              "reprompt": {
                "outputSpeech": {
                  "type": "PlainText",
                  "text": "How did you go?"
                }
              },

              "shouldEndSession": false
            }
          };
          context.done(null, responseMessage);


        }
        else {
          console.log('request failed'); {
            var responseMessage = tryAgainResponse;
            if (requestResponse.error) {
              responseMessage.response.outputSpeech.text = requestResponse.error + ', please have another go';
              responseMessage.response.shouldEndSession = false;
            }
            context.done(null, responseMessage);

          }
        }


        return null;
      });
    });
    req.on('error', (e) => {
      console.error(e);
    });
    req.write(payload);
    req.end();
  }


  function checkStatusOfRequestId(requestId, hashedVname) {
    var queryString = '/status?request_id=' + requestId + '&hashed_vname=' + hashedVname;
    console.log('string :' + queryString);
    const options = {
      hostname: 'api.voicesignin.com',
      port: 443,
      path: queryString,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': voicesigninApiKey


      }
    };

    const req = https.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      var rawData = '';

      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {

        var requestResponse = JSON.parse(rawData);
        console.log('reqresp: ' + JSON.stringify(requestResponse));
        if (requestResponse.request_status == 'pending' || requestResponse.request_status == 'expired') {



          var responseWords = 'The request was ' + requestResponse.request_status + ' when I checked';

          responseMessage = {
            "version": "string",
            "sessionAttributes": requestResponse,
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": responseWords
              },

              "shouldEndSession": true
            }
          };
          context.done(null, responseMessage);


        }
        else if (requestResponse.request_status == 'accepted') {
          getStatusFromBrowserDemo(requestId, hashedVname, 'read', 'status');
          return null;
        }
        else {
          console.log('request failed');

          var responseMessage = {
            "version": "string",
            "sessionAttributes": {},
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": "That didn't work out, lets try again shall we"
              },

              "shouldEndSession": true
            }
          };
          context.done(null, responseMessage);
        }



        return null;
      });
    });
    req.on('error', (e) => {
      console.error(e);
    });

    req.end();
  }
  //you can create your own API based on the structure below or you could mock out this step
  function getStatusFromBrowserDemo(request_id, hashed_vname, action, field) {
    var queryString = '/browserdemo/crud?action=' + action + '&field=' + field + '&value=';
    var appToken = request_id + '.' + hashed_vname;
    console.log('string :' + queryString);
    const options = {
      hostname: 'api.voicesignin.com',
      port: 443,
      path: queryString,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': appToken


      }
    };

    const req = https.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      var rawData = '';

      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {

        var requestResponse = JSON.parse(rawData);
        console.log('reqresp: ' + JSON.stringify(requestResponse));
        if (requestResponse.status) {
          var responseWords = 'Thanks for accepting the request, ' + requestResponse.vname + ' was feeling ' + requestResponse.status + ' when I checked';

          responseMessage = {
            "version": "string",
            "sessionAttributes": { "app_token": appToken },
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": responseWords
              },

              "shouldEndSession": true
            }
          };
          context.done(null, responseMessage);


        }

        else {

          var responseWords = 'Thanks for accepting the request, however I coudn\'t get any status information';

          responseMessage = {
            "version": "string",
            "sessionAttributes": { "app_token": appToken },
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": responseWords
              },

              "shouldEndSession": true
            }
          };
          context.done(null, responseMessage);

        }



        return null;
      });
    });
    req.on('error', (e) => {
      console.error(e);
    });

    req.end();
  }


};
