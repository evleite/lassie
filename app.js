let Botkit = require("botkit"),
    JiraClient = require("jira-connector"),
    env = process.env.NODE_ENV || "dev";

// Setup

if (env == "dev") {
  dotenv = require("dotenv").config();
}

let jira = new JiraClient({
  host: process.env.JIRA_HOST,
  basic_auth: {
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD
  }
});

var controller = Botkit.slackbot({});
controller.spawn({
  token: process.env.SLACK_TOKEN
}).startRTM();

// Controller

// Simple test
controller.hears("WOOF", ['direct_message','ambient'], function(bot, message) {
  bot.reply(message, "ARF");
});

// Answer to mentions of string formatted like Jira issue ID
// Responds in DM or participating channel
controller.hears([/[A-Z][A-Z0-9]+-[0-9]+/g], ['direct_message','ambient'], function(bot, message) {
  if(message.match.length > 1) {
    bot.reply(message, "You mentioned more than one issue. I'm not smart enough to handle that yet.");
  }

  let issueID = message.match[0];
  jira.issue.getIssue({
    issueKey: issueID
  }, function(error, issue) {
    if(issue) {
      var issueURL = issueID;
      var attmessage = {
        'username': 'Lassie',
        'text': 'It looks like you mentioned ' + issueURL,
        'attachments': [
          {
            'color': '#205081'
          }
        ],
        'icon_emoji': ':dog:',
        'parse': 'full'
      };
      attmessage.attachments[0].title = issueID + " " + issue.fields.summary;
      attmessage.attachments[0].title_link = 'https://' + process.env.JIRA_HOST + '/issues/' + issueID;
      attmessage.attachments[0].text = issue.fields.description;
      bot.reply(message, attmessage);
    } else {
      bot.reply(message, "Woof. You mentioned " + issueID + " but there's no ticket for that.");
    }
  });
});
