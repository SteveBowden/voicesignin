'use strict';
var https = require('https');
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library

const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // An action is a string used to identify what needs to be done in fulfillment
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters

  // Parameters are any entites that Dialogflow has extracted from the request.
  const parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters

  // Contexts are objects used to track and store conversation state
  const inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts

  // Get the request source (Google Assistant, Slack, API, etc) and initialize DialogflowApp
  const requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const app = new DialogflowApp({request: request, response: response});

  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON

        sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON

        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
    },
  
   // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.request_connection': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON

        configureParams(); // Send simple response to user
    },
       // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.check_status': () => {
        console.log('contexts : ' + JSON.stringify(request.body.result.contexts));
        if (app.data.request_details)
        {
        var requestId = app.data.request_details.request_id;
        var hashedVname = app.data.request_details.hashed_vname;
        getRequestDetails(requestId, hashedVname);   
        }
        else
        {
            console.log('app data on next intent: ' + JSON.stringify(app.data));
            sendResponse('I haven\'t tried connecting yet');
        }

    },
    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
        let responseToUser = {
          speech: 'This message vcheck norm is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          displayText: 'This  vcheck norm is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
      
    }
  };

  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();

 function configureParams() {
        var v_color = request.body.result.parameters.v_color;
        var v_animal = request.body.result.parameters.v_animal;
        var v_city = request.body.result.parameters.v_city;
        var blocking_string = Math.random();
        var session_expiry = 3600;


            var vname_version = 'v1';
            var vname_components = [v_color,v_animal,v_city];
            blocking_string = blocking_string; //just a hash of the user's IP address, you could use a cookie or deviceId as well
            session_expiry = 600; // 10 minute connection
         
            
            sendRequestToVoiceSignin(vname_version, vname_components, blocking_string, session_expiry);

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
            var rawData = '';

            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {

                var requestResponse = JSON.parse(rawData);
                console.log('reqresp: ' + JSON.stringify(requestResponse));
                if (requestResponse.request_id !== undefined) {
                    var responseObject = {};
                    var responseWords = 'I sent you a ' + requestResponse.color.toLowerCase() + ' button, please let me know when you have accepted';
                    responseObject["speech"] = responseWords;
                    responseObject["displayText"] = responseWords;
                    app.data.request_details = {'hashed_vname': requestResponse.hashed_vname,'request_id':requestResponse.request_id,'color':requestResponse.color};
                    sendResponse(responseObject);
                    return null;

                }
                else {
                    sendResponse('id didn\'t work');
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
    
//function to check status of requesst
function getRequestDetails(request_id, hashed_vname) {
    

    //you can only check the status of requests made by your API key
    //the request_id and hashed_vname can be passed to the client side and used as secret session access token (ensure you are using https for transmission and verify the status as 'accepted' for each request), e.g var access_token = request_id + '.' + hashed_vname;

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
                var responseObject = {};
                var responseWords = 'The request was ' + connectionStatus.request_status + ' when I checked';
                responseObject["speech"] = responseWords;
                responseObject["displayText"] = responseWords;
                app["data"]["request_status"] = connectionStatus.request_status;
                sendResponse(responseObject);
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.end();
    }

  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
        console.log('was string');
    console.log(responseToUser);
      app.ask(responseToUser); // Google Assistant response
    } else {
                console.log('was object');
    console.log(JSON.stringify(responseToUser));
  
      // If speech or displayText is defined use it to respond
      
     let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech,
        displayText: responseToUser.displayText
      });

console.log(JSON.stringify(googleResponse));



      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }

  function sendResponse (responseToUser) {
    if (requestSource === googleAssistantRequest) {
        sendGoogleResponse(responseToUser); // Send simple response to user
        return null;
      }
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {

    let responseJson = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech,
        displayText: responseToUser.displayText
      });
      app.ask(responseJson)
    }
  }
});
