const fileOps = require('../util/updateJSON.js')
const config = require('../config.json')
const channelTracker = require('../util/channelTracker.js')

module.exports = function (message, rssIndex) {
  var guildRss = require(`../sources/${message.guild.id}.json`)
  var rssList = guildRss.sources

  let currentMsg = "```Markdown\n"
  if (rssList[rssIndex].message == "" || rssList[rssIndex].message == null) currentMsg += "None has been set. Currently using default message below:\n\n``````\n" + config.feedSettings.defaultMessage;
  else currentMsg += rssList[rssIndex].message;

  message.channel.sendMessage(`The current message for ${rssList[rssIndex].link} is: \n${currentMsg + "```"}\nType your new customized message now, type \`reset\` to use the default message, or type \`exit\` to cancel. \n\nRemember that you can use the tags \`{title}\`, \`{description}\`, \`{link}\`, and etc. Regular formatting such as **bold** and etc. is also available. To find other tags, type \`exit\` then \`${config.botSettings.prefix}rsstest\`.\n\n`)

  const filter = m => m.author.id == message.author.id
  const customCollect = message.channel.createCollector(filter,{time:240000})
  channelTracker.addCollector(message.channel.id)

  customCollect.on('message', function (m) {
    if (m.content.toLowerCase() == "exit") return customCollect.stop("RSS Feed Message customization menu closed.");
    else if (m.content.toLowerCase() == "reset") {
      let resetMsg = message.channel.sendMessage(`Resetting message...`);
      customCollect.stop();
      delete rssList[rssIndex].message;
      fileOps.updateFile(message.guild.id, guildRss, `../sources/${message.guild.id}.json`);
      console.log(`RSS Customization: (${message.guild.id}, ${message.guild.name}) => Message reset for ${rssList[rssIndex].link}.`);
      return resetMsg.then(m => m.edit(`Message reset and using default message:\n \`\`\`Markdown\n${config.feedSettings.defaultMessage}\`\`\` \nfor feed ${rssList[rssIndex].link}`));
    }
    else {
      let editing = message.channel.sendMessage(`Updating message...`);
      customCollect.stop();
      rssList[rssIndex].message = m.content;
      fileOps.updateFile(message.guild.id, guildRss, `../sources/${message.guild.id}.json`);
      console.log(`RSS Customization: (${message.guild.id}, ${message.guild.name}) => New message recorded for ${rssList[rssIndex].link}.`);
      return editing.then(final => final.edit(`Message recorded:\n \`\`\`Markdown\n${m.content}\`\`\` \nfor feed ${rssList[rssIndex].link}You may use \`${config.botSettings.prefix}rsstest\` to see your new message format.`));
    }
  });

  customCollect.on('end', (collected, reason) => {
    channelTracker.removeCollector(message.channel.id)
    if (reason == "time") return message.channel.sendMessage(`I have closed the menu due to inactivity.`).catch(err => {});
    else if (reason !== "user") return message.channel.sendMessage(reason);
  });

 }