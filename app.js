var restify = require('restify');
var builder = require('botbuilder');
var Api = require('./api.js');

//=========================================================
// Bot Setup
//=========================================================

var channels = {};

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: "f26df032-1c1a-4fdf-b457-ea1a55f11c3e",
    appPassword: "6jHgDRj76QTzGhQVHZNYLBR"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=b55961ed-629c-40d8-8257-08b1cf4908ad&subscription-key=0784951bd65d4b3cac6a0fa67d320b9f');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

var guiid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

var criteria = function (session, results) {
    if (!session.userData.share.arrondissement || !session.userData.share.plat || !session.userData.share.photo) {        
        session.beginDialog('/share_' + ((!session.userData.share.plat) ? 'plat' : (!session.userData.share.arrondissement) ? 'arrondissement' : 'photo' ));
    } else {
        Api.share(session.userData.share);
        session.send("Votre plat a etait enregistrer, nous vous préviendrons lorsqu'un utilisateur ... (?)");
        session.endDialog();
    }
};

var criteria_search = function (session, results) {
    if (!session.userData.eat.arrondissement || !session.userData.eat.final) {        
        session.beginDialog('/eat_' + ((!session.userData.eat.arrondissement) ? 'arrondissement' : 'final' ));
    } else {
        session.endDialog();
    }
};

intents.matches('share', [
    function (session, args, next) {
        var plat = builder.EntityRecognizer.findEntity(args.entities, 'plat');
        var arrondissement = builder.EntityRecognizer.findEntity(args.entities, 'arrondissement');
        var spe_gluten = builder.EntityRecognizer.findEntity(args.entities, 'spe::gluten'); 
        var spe_vegan = builder.EntityRecognizer.findEntity(args.entities, 'spe::vegan');        
        var spe_vegetarien = builder.EntityRecognizer.findEntity(args.entities, 'spe::vegetarien');        
        var spe_ogm = builder.EntityRecognizer.findEntity(args.entities, 'spe::ogm');        
        var spe_porc = builder.EntityRecognizer.findEntity(args.entities, 'spe::porc');     
        
        var date = new Date();
        
        session.userData.share = {
            plat: plat ? plat.entity : null,
            arrondissement: arrondissement ? arrondissement.entity : null,
            photo: null,
            guiid: guiid(),
            date: date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " à " + date.getHours() + ":" + date.getMinutes(),
            chief: {
                email: session.userData.user["email"],
                firstname: session.userData.user["firstname"],
            },
            spe: {
                spe_gluten: spe_gluten ? spe_gluten.entity : null,
                spe_vegan: spe_vegan ? spe_vegan.entity : null,
                spe_vegetarien: spe_vegetarien ? spe_vegetarien.entity : null,
                spe_ogm: spe_ogm ? spe_ogm.entity : null,
                spe_porc: spe_porc ? spe_porc.entity : null           
            }
        };
        
        next();              
    },
    criteria
]);

intents.matches('eat', [
    function (session, args, next) {
        var plat = builder.EntityRecognizer.findEntity(args.entities, 'plat');
        var arrondissement = builder.EntityRecognizer.findEntity(args.entities, 'arrondissement');
        session.userData.eat = {
            plat: plat ? plat.entity : null,
            arrondissement: arrondissement ? arrondissement.entity : null,
            final: null
        };
        next();
    },
    criteria_search
]);

//=========================================================
// Bots Dialogs
//=========================================================

bot.use({
    botbuilder: function (session, next) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!session.userData.user) {
            var email = session.message.text;
            if (email && re.test(email)) {
                if (user = Api.login(email)) {
                    session.userData.user = user;
                    if (user.feedbacks_pending.length) {
                        session.beginDialog('feedbacks');
                    } else {
                        session.send("Bienvenue sur MZC " + user["firstname"] + ", Tu veux partager un plat ou tu as faim ?");                                           
                    }
                } else {
                    session.send('L’e-mail ou le numéro de téléphone entré ne correspond à aucun compte.');
                }
            } else {
                session.send("Bonjour, si tu veux partager un plat ou si tu as faim il te faut un compte sur https://meetzechef.com/ \n pour te connecter il te sufit d'ecrire ton email dans la discution.");                
            }
        } else {
            next();
        }
    }
});

bot.dialog('/share_plat', [function(session) {
    builder.Prompts.text(session, "Quelle plat voulez vous partager ?");
}, function(session, results, next) {
    session.userData.share.plat = results.response;
    criteria(session, results); 
}]);

bot.dialog('/share_arrondissement', [function(session) {
    builder.Prompts.text(session, "Dans quelle arrondissement voulez vous partager le plat ?");
}, function(session, results, next) {
    session.userData.share.arrondissement = results.response;
    criteria(session, results);
}]);

bot.dialog('/share_photo', [function(session) {
    builder.Prompts.attachment(session, "Ta proposition est maintenant pris en compte. Tu souhaites l’améliorer avec une photo ?");
}, function(session, results, next) {
    session.userData.share.photo = results.response;
    criteria(session, results);
}]);

bot.dialog('/eat_arrondissement', [function(session) {
    builder.Prompts.text(session, "Dans quelle arrondissement voulez vous rechercher le plat ?");
}, function(session, results, next) {
    session.userData.eat.arrondissement = results.response;
    criteria_search(session, results);
}]);

bot.dialog('/eat_final', [function (session) {
    var plats = Api.search(session.userData.eat.arrondissement);
   
    if (!plats.length) {
        session.send("Il n'y a malheuresement aucun plats disponible dans le " + session.userData.eat.arrondissement.replace ( /[^\d.]/g, '' ) + "ème arrondissement");
        session.endDialog();
        return false;
    }
   
    session.send('Il existe ' + plats.length + ' plats disponible dans le ' + session.userData.eat.arrondissement.replace ( /[^\d.]/g, '' ) + 'ème arrondissement :');

    var cards = [];
    var cards_id = [];

    for (var i = 0, len = plats.length; i < len; i++) {
        cards_id.push(plats[i]["guiid"]);
        cards.push(
            new builder.HeroCard(session)
                .title(plats[i]["plat"])
                .subtitle("Posté par " + plats[i]["chief"]["firstname"] + " le " + plats[i]["date"])
                .images([
                    builder.CardImage.create(session, plats[i]["photo"][0]["contentUrl"])
                        .tap(builder.CardAction.showImage(session, plats[i]["photo"][0]["contentUrl"])),
                ])
                .buttons([
                    builder.CardAction.imBack(session, plats[i]["guiid"], "Meet Ze Chief !")
                ])
        );
    }

    var msg = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
    builder.Prompts.choice(session, msg, cards_id.join("|"));
},
function (session, results) {
    var action, item;
    var kvPair = results.response.entity.split(':');
    var chief = Api.ChiefByPlatId(kvPair[1]);
    session.send('Bonjour ' + chief["firstname"] + ' / Bonjour ' + session.userData.user.firstname + ' Vous pouvez chater pour vous donner rendez vous.');
    Api.FeedBackPending(kvPair[1], session.userData.user.email);
    session.endDialog();
}]);

bot.dialog('feedbacks', [function(session) {
    builder.Prompts.attachment(session, "Bienvenu " + session.userData.user.firstname + ", Le plat que tu as mangé hier était bon ? Tu peux te prendre en photo pour évaluer automatiquement ton appréciation");
}, function(session, results) {
    session.send(results.response[0]["contentUrl"]);
}]);