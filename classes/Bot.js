Bot.prototype.__proto__ = require('events').EventEmitter.prototype;
const Auth = require('./Auth.js');
const Trade = require('./Trade.js');
const Request = require('./Request.js');
const Friends = require('./Friends.js');
const Community = require('./Community.js');
const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user');
const SteamStore = require('steamstore');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamID = TradeOfferManager.SteamID;

/**
 * Create a new bot instance
 *
 * @param username
 * @param password
 * @param details
 * @param settings
 * @param logger
 * @constructor
 */
function Bot(username, password, details, settings, logger) {
    // Ensure account values are valid
    var self = this;
    // Init all required variables
    if (typeof username != "string" || typeof password != "string")
        if (!details.hasOwnProperty("steamguard") || !(details.hasOwnProperty("oAuthToken")))
            throw Error("Invalid username/password or missing oAuthToken/Steamguard code");

    if (typeof details == "object") {
        if (details.hasOwnProperty("displayName"))
            self.displayName = details.displayName;
    }
    self.username = username;
    self.password = password;
    self.settings = settings || {
            api_key: "",
            tradeCancelTime: 60 * 60 * 24,
            tradePendingCancelTime: 60 * 60 * 24,
            language: "en",
            tradePollInterval: 5000,
            tradeCancelOfferCount: 30,
            tradeCancelOfferCountMinAge: 60 * 60,
            cancelTradeOnOverflow: true
        };
    self.logger = logger;
    self.community = new SteamCommunity();
    self.client = new SteamUser();

    self.TradeOfferManager = new TradeOfferManager({
        "steam": self.client,
        "community": self.community,
        "cancelTime": self.settings.tradeCancelTime, // Keep offers upto 1 day, and then just cancel them.
        "pendingCancelTime": self.settings.tradePendingCancelTime, // Keep offers upto 30 mins, and then cancel them if they still need confirmation
        "cancelOfferCount": self.settings.tradeCancelOfferCount,// Cancel offers once we hit 7 day threshold
        "cancelOfferCountMinAge": self.settings.tradeCancelOfferCountMinAge,// Keep offers until 7 days old
        "language": self.settings.language, // We want English item descriptions
        "pollInterval": 5000 // We want to poll every 5 seconds since we don't have Steam notifying us of offers
    });
    self.SteamID = TradeOfferManager.SteamID;
    self.request = self.community.request;
    self.store = new SteamStore();
    self.loggedIn = false;
    self.rateLimited = true;
    self.delayedTasks = [];
    self.details = details;
    self.Auth = new Auth(self, logger);
    self.Request = new Request(self.request, logger);
    self.Auth.on('updatedAccountDetails', function () {
        self.emit('updatedAccountDetails');
    });

    self.Friends = new Friends(self, self.Request, logger);
    self.Trade = new Trade(self.TradeOfferManager, self.Auth, self.settings, logger);
    self.Community = new Community(self.community, self.Auth, logger);

};

/**
 * @callback callbackErrorOnly
 * @param {Error} error - An error message if the process failed, undefined if successful
 */





/**
 * Get the account's username, used to login to Steam
 * @returns {String} username
 */
Bot.prototype.getAccountName = function () {
    var self = this;
    return self.username;
};

/**
 * Get if the API/account is rate limited by SteamAPI
 * @returns {Boolean} rateLimited
 */
Bot.prototype.getRateLimited = function () {
    var self = this;
    return self.rateLimited;
};

/**
 * Get if the API/account is rate limited by SteamAPI
 * @returns {Boolean} rateLimited
 */
Bot.prototype.setRateLimited = function (rateLimited) {
    var self = this;
    return self.rateLimited = rateLimited;
};



/**
 * Set the user we are chatting with
 * @param {*|{username: *, sid: *}} chattingUserInfo
 */
Bot.prototype.setChatting = function (chattingUserInfo) {
    var self = this;
    self.currentChatting = chattingUserInfo;
};


/**
 * Fetch SteamID Object from the SteamID2, SteamID3, SteamID64 or Tradeurl.
 * @returns {Error | String}
 * @deprecated
 */
Bot.prototype.fromIndividualAccountID = function (id) {
    var self = this;
    var SteamID = TradeOfferManager.SteamID;
    return new self.SteamID(id);
};


/**
 * Fetch SteamID Object from the SteamID2, SteamID3, SteamID64 or Tradeurl.
 * @returns {Error | String}
 */
Bot.prototype.getUser = function (id) {
    var self = this;
    var SteamID = TradeOfferManager.SteamID;
    return new self.SteamID(id);
};



/**
 * Get the display name of the account
 * @returns {String|undefined} displayName - Display name of the account
 */
Bot.prototype.getDisplayName = function () {
    var self = this;
    return (self.displayName ? self.displayName : undefined);
};

/**
 * Function wrapper used to delay function calls by name and paramters
 * @param fn - function reference
 * @param context - Context to use for call
 * @param params - Parameters in arraylist to send with function
 * @returns {Function}
 */
Bot.prototype.wrapFunction = function (fn, context, params) {
    return function () {
        fn.apply(context, params);
    };
};
/**
 * Add a function to the queue which runs when we login usually.
 * @param functionV
 * @param functionData
 */
Bot.prototype.addToQueue = function (queueName, functionV, functionData) {
    var self = this;
    var functionVal = self.wrapFunction(functionV, self, functionData);
    if (!self.delayedTasks.hasOwnProperty(queueName))
        self.delayedTasks[queueName] = [];
    self.delayedTasks[queueName].push(functionVal);
};
/**
 * Process the queue to run tasks that were delayed.
 * @param queueName
 * @param callback
 */
Bot.prototype.processQueue = function (queueName, callback) {
    var self = this;
    if (self.delayedTasks.hasOwnProperty(queueName)) {
        while (self.delayedTasks[queueName].length > 0) {
            (self.delayedTasks[queueName].shift())();
        }
    }
    callback(undefined);
};



/**
 * Change the display name of the account (with prefix)
 * @param {String} newName - The new display name
 * @param {String} namePrefix - The prefix if there is one (Nullable)
 * @param {callbackErrorOnly} callbackErrorOnly - A callback returned with possible errors
 */
Bot.prototype.changeName = function (newName, namePrefix, callbackErrorOnly) {
    var self = this;
    if (!self.loggedIn) {
        self.addToQueue('login', self.changeName, [newName, namePrefix, callbackErrorOnly]);
    }
    else {
        if (namePrefix == undefined) namePrefix = '';

        self.community.editProfile({name: namePrefix + newName}, function (err) {
            if (err)
                return callbackErrorOnly(err.Error);
            self.displayName = newName;
            self.emit('updatedAccountDetails');
            callbackErrorOnly(undefined);
        });
    }
};

/**
 * @callback inventoryCallback
 * @param {Error} error - An error message if the process failed, undefined if successful
 * @param {Array} inventory - An array of Items returned via fetch (if undefined, then game is not owned by user)
 * @param {Array} currencies - An array of currencies (Only a few games use this) - (if undefined, then game is not owned by user)
 */

/**
 * Retrieve account inventory based on filters
 * @param {Integer} appid - appid by-which to fetch inventory based on.
 * @param {Integer} contextid - contextid of lookup (1 - Gifts, 2 - In-game Items, 3 - Coupons, 6 - Game Cards, Profile Backgrounds & Emoticons)
 * @param {Boolean} tradableOnly - Items retrieved must be tradable
 * @param {inventoryCallback} inventoryCallback - Inventory details (refer to inventoryCallback for more info.)
 */
Bot.prototype.getInventory = function (appid, contextid, tradableOnly, inventoryCallback) {
    var self = this;
    if (!self.loggedIn) {
        self.addToQueue('login', self.getInventory, [appid, contextid, tradableOnly, inventoryCallback]);
    }
    else
        self.TradeOfferManager.loadInventory(appid, contextid, tradableOnly, inventoryCallback);
};

/**
 * Retrieve account inventory based on filters and provided steamID
 * @param {SteamID} steamID - SteamID to use for lookup of inventory
 * @param {Integer} appid - appid by-which to fetch inventory based on.
 * @param {Integer} contextid - contextid of lookup (1 - Gifts, 2 - In-game Items, 3 - Coupons, 6 - Game Cards, Profile Backgrounds & Emoticons)
 * @param {Boolean} tradableOnly - Items retrieved must be tradableOnly
 * @param {inventoryCallback} inventoryCallback - Inventory details (refer to inventoryCallback for more info.)
 */
Bot.prototype.getUserInventory = function (steamID, appid, contextid, tradableOnly, inventoryCallback) {
    var self = this;
    if (!self.loggedIn) {
        self.addToQueue('login', self.getUserInventory, [steamID, appid, contextid, tradableOnly, inventoryCallback]);
    }
    else
        self.TradeOfferManager.loadUserInventory(steamID, appid, contextid, tradableOnly, inventoryCallback);
};
/**
 * Add a phone-number to the account (For example before setting up 2-factor authentication)
 * @param phoneNumber - Certain format must be followed
 * @param {callbackErrorOnly} callbackErrorOnly - A callback returned with possible errors
 */
Bot.prototype.addPhoneNumber = function (phoneNumber, callbackErrorOnly) {
    var self = this;
    self.store.addPhoneNumber(phoneNumber, true, function (err) {
        callbackErrorOnly(err);
    });
};


/**
 * Enter the code to verify the phone number.
 * @param code
 * @param {callbackErrorOnly} callbackErrorOnly - A callback returned with possible errors
 */
Bot.prototype.verifyPhoneNumber = function (code, callbackErrorOnly) {
    var self = this;
    self.store.verifyPhoneNumber(code, function (err) {
        if (err) {
            callbackErrorOnly(err);
        }
        else {
            callbackErrorOnly(undefined);
        }
    });
};







/**
 * This is a private method - but incase you would like to edit it for your own usage...
 * @param cookies - Cookies sent by Steam when logged in
 * @param sessionID - Session ID as sent by Steam
 * @param {callbackErrorOnly} callbackErrorOnly - If encountered error (optional)
 */
Bot.prototype.loggedInAccount = function (cookies, sessionID, callbackErrorOnly) {
    var self = this;
    self.Friends.login(500, 'web');
    self.logger.log('debug', 'Logged into %j', self.getAccountName());
    if (self.sessionID != sessionID || self.cookies != cookies) {
        self.sessionID = sessionID;
        self.cookies = cookies;
    }

    self.emit('loggedIn', self);

    if (self.cookies) {
        self.community.setCookies(cookies);
        self.store.setCookies(cookies);
        self.TradeOfferManager.setCookies(cookies, function (err) {
            if (err) {
                self.logger.log("debug", "Failed to get API Key - TradeOverflowChecking disabled for %j & getOffers call disabled.", self.getAccountName(), err.Error);
                if (err.Error == "Access Denied")
                    self.api_access = false;
            }
            else
                self.api_access = true;

            self.Trade.setAPIAccess(self.api_access);
        });
    }

    self.loggedIn = true;
    self.processQueue('login', function (err) {
        if (err) {
            self.logger.log('error', err);
            return loginCallback(err);
        }
        self.community.on('chatTyping', function (senderID) {
            self.emit('chatTyping', senderID);
        });
        self.community.on('chatLoggedOn', function () {
            self.emit('chatLoggedOn');
        });
        self.community.on('chatLogOnFailed', function (err, fatal) {
            self.emit('chatLogOnFailed', err, fatal);
        });
        self.community.on('chatMessage', function (senderID, message) {
            if (self.currentChatting != undefined && senderID == self.currentChatting.sid) {
                console.log(("\n" + self.currentChatting.username + ": " + message).green);
            }
            /**
             * Emitted when a friend message or chat room message is received.
             *
             * @event Bot#chatMessage
             * @type {object}
             * @property {SteamID} senderID - The message sender, as a SteamID object
             * @property {String} message - The message text
             */
            self.emit('chatMessage', senderID, message);
        });
        self.community.on('sessionExpired', function (err) {
            self.logger.log('debug', "Login session expired due to " + err);
            self.emit('sessionExpired', err);
        });
        self.TradeOfferManager.on('sentOfferChanged', function (offer, oldState) {
            /**
             * Emitted when a trade offer changes state (Ex. accepted, pending, escrow, etc...)
             *
             * @event Bot#offerChanged
             * @type {object}
             * @property {TradeOffer} offer - The new offer's details
             * @property {TradeOffer} oldState - The old offer's details
             */
            self.emit('offerChanged', offer, oldState);
        });

        self.TradeOfferManager.on('receivedOfferChanged', function (offer, oldState) {
            self.emit('receivedOfferChanged', offer, oldState);
        });

        self.TradeOfferManager.on('offerList', function (filter, sent, received) {
            /**
             * Emitted when we fetch the offerList
             *
             * @event Bot#offerList
             * @type {object}
             */
            self.emit('offerList', filter, sent, received);
        });
        self.TradeOfferManager.on('newOffer', function (offer) {
            /**
             * Emitted when we receive a new trade offer
             *
             * @event Bot#newOffer
             * @type {object}
             * @property {TradeOffer} offer - The offer's details
             */
            self.emit('newOffer', offer);
        });

        self.TradeOfferManager.on('sentOfferChanged', function (offer) {
            /**
             * Emitted when we receive a new trade offer notification (only provides amount of offers and no other details)
             *
             * @event Bot#tradeOffers
             * @type {object}
             * @property {Integer} count - The amount of active trade offers (can be 0).
             */
            self.emit('sentOfferChanged', offer);
        });
        self.TradeOfferManager.on('realTimeTradeConfirmationRequired', function (offer) {
            /**
             * Emitted when a trade offer is cancelled
             *
             * @event Bot#tradeOffers
             * @type {object}
             * @property {Integer} count - The amount of active trade offers (can be 0).
             */
            self.emit('realTimeTradeConfirmationRequired', offer);
        });
        self.TradeOfferManager.on('realTimeTradeCompleted', function (offer) {
            /**
             * Emitted when a trade offer is cancelled
             *
             * @event Bot#tradeOffers
             * @type {object}
             * @property {Integer} count - The amount of active trade offers (can be 0).
             */
            self.emit('realTimeTradeCompleted', offer);
        });
        self.TradeOfferManager.on('sentOfferCanceled', function (offer) {
            /**
             * Emitted when a trade offer is cancelled
             *
             * @event Bot#tradeOffers
             * @type {object}
             * @property {Integer} count - The amount of active trade offers (can be 0).
             */
            self.emit('sentOfferCanceled', offer);
        });

        /**
         * Emitted when we fully sign into Steam and all functions are usable.
         *
         * @event Bot#loggedIn
         */
        if (callbackErrorOnly)
            return callbackErrorOnly(undefined);
    });
}


Bot.prototype.hasPhone = function (callback) {
    var self = this;
    self.store.hasPhone(function (err, hasPhone, lastDigits) {
        callback(err, hasPhone, lastDigits);
    });
};


Bot.prototype.setSetting = function (settingName, tempSettingValusettingName) {
    var self = this;
    self.settings[tempSetting] = tempSettingValue;
};
Bot.prototype.getSetting = function (tempSetting) {
    var self = this;
    if (self.settings.hasOwnProperty(tempSetting))
        return self.settings[tempSetting];
    return undefined;
};
Bot.prototype.deleteSetting = function (tempSetting) {
    var self = this;
    if (self.settings.hasOwnProperty(tempSetting))
        delete self.settings[tempSetting];
};

Bot.prototype.logoutAccount = function () {
    var self = this;
    self.Friends.logout();

    self.community = new SteamCommunity();
    self.client = new SteamUser();
    self.TradeOfferManager = new TradeOfferManager({
        "steam": self.client,
        "community": self.community,
        "cancelTime": self.settings.tradeCancelTime, // Keep offers upto 1 day, and then just cancel them.
        "pendingCancelTime": self.settings.tradePendingCancelTime, // Keep offers upto 30 mins, and then cancel them if they still need confirmation
        "cancelOfferCount": self.settings.tradeCancelOfferCount,// Cancel offers once we hit 7 day threshold
        "cancelOfferCountMinAge": self.settings.tradeCancelOfferCountMinAge,// Keep offers until 7 days old
        "language": self.settings.language, // We want English item descriptions
        "pollInterval": 5000 // We want to poll every 5 seconds since we don't have Steam notifying us of offers
    });
    self.request = self.community.request;
    self.store = new SteamStore();
    self.loggedIn = false;
};


module.exports = Bot;
