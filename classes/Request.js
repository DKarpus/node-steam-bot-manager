const fetch = require('node-fetch');

Request.prototype.__proto__ = require('events').EventEmitter.prototype;

/**
 * A class to handle manual requests to SteamID on behalf of the bot account.
 * @param request
 * @param logger
 * @constructor
 */
function Request() {
    var self = this;
}

/**
 * Send a custom GET request to any url on steam community while logged in as the bot account.
 * @param url
 * @param callback
 */
Request.prototype.getRequest = async function (url, callback) {
    try {
        const response = await fetch(url, {
            method: 'GET',
        });
        const body = await response.json();
        callback(null, body, response);
    } catch (err) {
        callback(err);
    }
};

/**
 * Send a custom POST request to any url on steam community while logged in as the bot account.
 * @param url
 * @param data
 * @param callback
 */
Request.prototype.postRequest = async function (url, data, callback) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const body = await response.json();
        callback(null, body, response);
    } catch (err) {
        callback(err);
    }
};

/**
 * @callback callbackRequestAPI
 * @param {Error} error - An error message if the process failed, undefined if successful
 * @param {Object} body - An object of the parsed response (undefined if failed)
 */

/**
 * Send GET Request to SteamAPI with details
 * @param apiInterface (String) - Interface name
 * @param version (String) - Interface version (v1 or v2 depending on interface)
 * @param method (String) - method to access
 * @param options - Data to attach to request
 * @param callbackRequestAPI -
 */
Request.prototype.getRequestAPI = async function (apiInterface, version, method, options, callbackRequestAPI) {
    var string = '?';
    var x = 0;
    for (var option in options)
        if (options.hasOwnProperty(option))
            string += option + "=" + options[option] + (x++ < Object.keys(options).length - 1 ? "&" : '');
    
    try {
        const response = await fetch(`http://api.steampowered.com/${apiInterface}/${method}/${version}/${string}`);
        const body = await response.json();
        callbackRequestAPI(null, body);
    } catch (err) {
        callbackRequestAPI(err);
    }
};

module.exports = Request;