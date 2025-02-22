Community.prototype.__proto__ = require('events').EventEmitter.prototype;
const EResult = require("../enums/EResult");
const SteamID = require('steam-tradeoffer-manager').SteamID;
const fetch = require('node-fetch');

/**
 * A class to handle all community functions
 * @param community
 * @param Auth
 * @param logger
 * @constructor
 */
function Community(community, Auth) {
    // Ensure account values are valid
    var self = this;
    self.community = community;
    self.Auth = Auth;
}

// Helper method for HTTP requests
Community.prototype._makeRequest = async function(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(options.form)
    });
    
    const body = await response.json();
    return { response, body };
};

/**
 * Upvote an attachement file on SteamCommunity
 * @param sharedFileId
 * @param callbackErrorOnly
 */
Community.prototype.upvoteSharedFile = async function (sharedFileId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('https://steamcommunity.com/sharedfiles/voteup', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Downvote an attachement file on SteamCommunity.
 * @param sharedFileId
 * @param callbackErrorOnly
 */
Community.prototype.downvoteSharedFile = async function (sharedFileId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('https://steamcommunity.com/sharedfiles/votedown', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Preview an attachement file on SteamCommunity to increase the unique views of a certain attachment
 * @param sharedFileId
 * @param callbackErrorOnly
 */
Community.prototype.previewSharedFile = async function (sharedFileId, callbackErrorOnly) {
    var self = this;
    try {
        const { response } = await self._makeRequest('http://steamcommunity.com/sharedfiles/filedetails/?id=' + sharedFileId, {
            method: 'GET'
        });
        
        if (response.status === 200) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(new Error('Failed to preview shared file'));
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Favourite an attachement file on SteamCommunity.
 * @param sharedFileId
 * @param sharedFileAppId
 * @param callbackErrorOnly
 */
Community.prototype.favouriteSharedFile = async function (sharedFileId, sharedFileAppId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/sharedfiles/favorite', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId,
                'appid': sharedFileAppId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Subscribe to an attachement file on SteamCommunity.
 * @param sharedFileId
 * @param sharedFileAppId
 * @param callbackErrorOnly
 */
Community.prototype.subscribeSharedFile = async function (sharedFileId, sharedFileAppId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/sharedfiles/subscribe', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId,
                'appid': sharedFileAppId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Unsubscribe to an attachement file on SteamCommunity.
 * @param sharedFileId
 * @param sharedFileAppId
 * @param callbackErrorOnly
 */
Community.prototype.unsubscribeSharedFile = async function (sharedFileId, sharedFileAppId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/sharedfiles/unsubscribe', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId,
                'appid': sharedFileAppId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Unfavourite an attachement file on SteamCommunity.
 * @param sharedFileId
 * @param sharedFileAppId
 * @param callbackErrorOnly
 */
Community.prototype.unfavouriteSharedFile = async function (sharedFileId, sharedFileAppId, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/sharedfiles/unfavorite', {
            form: {
                'sessionid': self.Auth.sessionid,
                'id': sharedFileId,
                'appid': sharedFileAppId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Comment on an attachement file on SteamCommunity.
 * @param comment
 * @param sharedFileId
 * @param fileIdOwner
 * @param callbackErrorOnly
 */
Community.prototype.commentSharedFile = async function (comment, sharedFileId, fileIdOwner, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/comment/PublishedFile_Public/post/' + fileIdOwner + '/' + sharedFileId + '/', {
            form: {
                'sessionid': self.Auth.sessionid,
                'comment': comment
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Delete comment on an attachement file on SteamCommunity.
 * @param comment
 * @param sharedFileId
 * @param fileIdOwner
 * @param callbackErrorOnly
 */
Community.prototype.deleteCommentSharedFile = async function (commentId, sharedFileId, fileIdOwner, callbackErrorOnly) {
    var self = this;
    try {
        const { response, body } = await self._makeRequest('http://steamcommunity.com/comment/PublishedFile_Public/delete/' + fileIdOwner + '/' + sharedFileId + '/', {
            form: {
                'sessionid': self.Auth.sessionid,
                'gidcomment': commentId
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Follow a user on SteamCommunity.
 * @param steamid | profile name or steamid2, steamid3, steamid64
 * @param callbackErrorOnly
 */
Community.prototype.followPublisher = async function (steamid, callbackErrorOnly) {
    var self = this;
    var user = null;
    try {
        var steamID = new SteamID(steamid);
        user = 'profiles/' + steamID.getSteamID64();
    } catch (e) {
        user = 'id/' + steamid;
    }

    try {
        const { response, body } = await self._makeRequest(`https://steamcommunity.com/${user}/followuser/`, {
            form: {
                'sessionid': self.Auth.sessionid
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Unfollow a user on SteamCommunity.
 * @param steamid | SteamID object or profile name
 * @param callbackErrorOnly
 */
Community.prototype.unfollowPublisher = async function (steamid, callbackErrorOnly) {
    var self = this;
    var user = null;
    try {
        var steamID = new SteamID(steamid);
        user = 'profiles/' + steamID.getSteamID64();
    } catch (e) {
        user = 'id/' + steamid;
    }

    try {
        const { response, body } = await self._makeRequest(`https://steamcommunity.com/${user}/unfollowuser/`, {
            form: {
                'sessionid': self.Auth.sessionid
            }
        });
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Invite a user on SteamCommunity to a group.
 * @param groupID
 * @param steamIDInvitee | Either an array list of steamid's or a single steamid. Must be an array object if list.
 * @param callbackErrorOnly
 */
Community.prototype.inviteToGroup = async function (groupID, steamIDInvitee, callbackErrorOnly) {
    var self = this;
    var options = {
        form: {
            json: 1,
            type: 'groupInvite',
            group: groupID,
            sessionID: self.Auth.sessionid
        }
    };
    if (steamIDInvitee instanceof Array) {
        options.form.invitee_list = JSON.stringify(steamIDInvitee);
    } else {
        options.form.invitee = steamIDInvitee;
    }

    try {
        const { response, body } = await self._makeRequest('https://steamcommunity.com/actions/GroupInvite', options);
        
        if (response.status === 200 && body.success === 1) {
            callbackErrorOnly(undefined);
        } else if (response.status === 200 && body.duplicate) {
            callbackErrorOnly("Failed to send one or more invites due to a user being already invited or in the group by " + self.Auth.accountName);
        } else if (response.status === 403) {
            callbackErrorOnly(self.Auth.accountName + " is not part of the group, therefore unable to invite users.");
        } else {
            callbackErrorOnly(EResult[body.success]);
        }
    } catch (error) {
        callbackErrorOnly(error);
    }
};

/**
 * Join a group
 * @param groupID
 * @param callbackErrorOnly
 */
Community.prototype.joinGroup = function (groupID, callbackErrorOnly) {
    var self = this;

    self.community.getSteamGroup(groupID, function(err, group){
        if (err)
            return callbackErrorOnly(err);
        group.join(function(err){
            return callbackErrorOnly(err);
        })
    });
};

/**
 * Leave a group
 * @param groupID
 * @param callbackErrorOnly
 */
Community.prototype.leaveGroup = function (groupID, callbackErrorOnly) {
    var self = this;

    self.community.getSteamGroup(groupID, function(err, group){
        if (err)
            return callbackErrorOnly(err);
        group.leave(function(err){
            return callbackErrorOnly(err);
        })
    });
};

/**
 * Kick user from group
 * @param groupID
 * @param {SteamID} steamID
 * @param callbackErrorOnly
 */
Community.prototype.kickFromGroup = function (groupID, steamID, callbackErrorOnly) {
    var self = this;

    self.community.getSteamGroup(groupID, function(err, group){
        if (err)
            return callbackErrorOnly(err);
        group.kick(steamID, function(err){
            return callbackErrorOnly(err);
        })
    });
};

/**
 * Get Group info...
 * @param groupID
 * @param callbackGroup
 */
Community.prototype.getGroup = function (groupID, callbackGroup) {
    var self = this;

    self.community.getSteamGroup(groupID, function(err, group){
        if (err)
            return callbackGroup(err, null);
        return callbackGroup(null, group);
    });
};

/**
 * Set-up a profile if the account is new and profile is not set-up yet.
 * @param callbackErrorOnly
 */
Community.prototype.setupProfile = function (callbackErrorOnly) {
    var self = this;
    self.community.setupProfile(callbackErrorOnly);
};

/**
 * Fetch API Key from Steam Community
 * @param callbackErrorOnly
 */
Community.prototype.getWebApiKey = function (domain, callbackApiKey) {
    var self = this;
    if (callbackApiKey == null){
        callbackApiKey = domain;
        domain = "localhost";
    }

    self.community.getWebApiKey(domain, function(err, apiKey){
        callbackApiKey(err, apiKey);
    });
};

module.exports = Community;
