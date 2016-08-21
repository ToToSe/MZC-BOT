var fs = require('fs');
var users = JSON.parse(fs.readFileSync('datas/users.json'));
var plats = JSON.parse(fs.readFileSync('datas/plats.json'));
var Api = function () {};

Api.prototype.login = function (email) {
    if (typeof users[email] !== "undefined") {
        return users[email];
    } else {
        return false;
    }
};

Api.prototype.search = function (arrondissement) {
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
    for (var key in plats) {
        if (guiid == plats[key]["guiid"]) {
            return plats[key]["chief"]
        }
    }
    return false;
};

Api.prototype.share = function (share) {
    var plat = share;
    plats.push(plat);
    fs.writeFileSync('datas/plats.json', JSON.stringify(plats));
};

Api.prototype.FeedBackPending = function (id, email) {
   users[email].feedbacks_pending.push(id);
   fs.writeFileSync('datas/users.json', JSON.stringify(users));
};

module.exports = new Api();