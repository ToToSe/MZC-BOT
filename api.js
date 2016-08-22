var fs = require('fs');
var Api = function () {};

Api.prototype.login = function (email) {
    var users = JSON.parse(fs.readFileSync('datas/users.json'));
    if (typeof users[email] !== "undefined") {
        return users[email];
    } else {
        return false;
    }
};

Api.prototype.search = function (arrondissement) {
    var plats = JSON.parse(fs.readFileSync('datas/plats.json'));
    var plats_found = [];
    arrondissement = arrondissement.replace ( /[^\d.]/g, '' );
    for (var key in plats) {
        arrondissement_loop = plats[key]["arrondissement"].replace ( /[^\d.]/g, '' );
        if (arrondissement_loop == arrondissement) {
            plats_found.push(plats[key]);
        }
    }
    
    return plats_found;
};

Api.prototype.ChiefByPlatId = function (guiid) {
    var plats = JSON.parse(fs.readFileSync('datas/plats.json'));
    for (var key in plats) {
        if (guiid == plats[key]["guiid"]) {
            return plats[key]["chief"]
        }
    }
    return false;
};

Api.prototype.share = function (share) {
    var plats = JSON.parse(fs.readFileSync('datas/plats.json'));
    var plat = share;
    plats.push(plat);
    fs.writeFileSync('datas/plats.json', JSON.stringify(plats));
};

Api.prototype.FeedBackPending = function (id, email) {
   var plats = JSON.parse(fs.readFileSync('datas/plats.json'));
   var users = JSON.parse(fs.readFileSync('datas/users.json'));
   var plat_key = null;
   users[email].feedbacks_pending.push(id);
    for (var key in plats) {
        if (id == plats[key]["guiid"]) {
            plat_key = key;
        }
    }
    plats.splice(plat_key,1);
    fs.writeFileSync('datas/users.json', JSON.stringify(users));
    fs.writeFileSync('datas/plats.json', JSON.stringify(plats));
};

Api.prototype.emptyFeedback = function (email) {
   var users = JSON.parse(fs.readFileSync('datas/users.json'));
   users[email].feedbacks_pending = [];
   fs.writeFileSync('datas/users.json', JSON.stringify(users));
};

Api.prototype.debug = function(text) {
    var logs = JSON.parse(fs.readFileSync('datas/logs.json'));
    logs.push(text);
    fs.writeFileSync('datas/logs.json', JSON.stringify(logs));
};

module.exports = new Api();