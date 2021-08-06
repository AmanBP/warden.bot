const Discord = require("discord.js");
const { response } = require("express");

const data = [
    {
        "argument": "dps",
        "title": "Effective SDPS for AX Weapons @ 1.5km",
        "description": "Here is a full breakdown of the DPS of AX weapons at a standard range of 1.5km.",
        "link": "https://cdn.discordapp.com/attachments/470703244864126979/711920117306622002/Effective_Sustained_AX_DPS__1.5km_2.png",
        "type": "embed"
    },
    {
        "argument": "ally",
        "title": "Thargoid Ally Reference Image",
        "description": "Thargoid Ally Reference Image",
        "link": "https://cdn.discordapp.com/attachments/625989888432537611/843025142912385024/thargoid_ally_report.png",
        "type": "text"
    },
    {
        "argument": "clog",
        "title": "Combat Log Reference Image",
        "description": "Combat Log Reference Image",
        "link": "https://cdn.discordapp.com/attachments/625989888432537611/843025142648274984/Combat_log_report2.png",
        "type": "text"
    },
    {
        "argument": "flak",
        "title": "Using Multiple Flak Launchers",
        "description": "Multiple flak launchers is a waste *IF* the flak are not spread out very far, flak have a limited explosion radius and if that radius overlaps it is not more effective, by spreading flak out as far as possible (like the wing-tips of a cutter) it becomes beneficial. **This is most effective for Medusa and Hydra where the swarm spreads out into a wide circle** *'If convergence is wack, then it's good for flak'* - Shwinky, 2k20",
        "link": "https://cdn.discordapp.com/attachments/625989888432537611/674485116604776448/Flak.png",
        "type": "embed"
    },
]

module.exports = {
    name: 'graphic',
    description: 'Request a graphic, diagram or resource from a repository, use "-graphic" to get a list.',
    permlvl: 0,
    format: '"graphic name"',
    restricted: false,
    execute(message, args) {
        let response;
        for (i=0;i < data.length; i++) {
            if (args == data[i].title) {
                response = data[i];
            }
        }

        if (response.type == "text") {
            message.channel.send(data.link);
        } else if (response.type == "embed") {
            const returnEmbed = new Discord.MessageEmbed()
            .setColor('#FF7100')
            .setAuthor('The Anti-Xeno Initiative', "https://cdn.discordapp.com/attachments/860453324959645726/865330887213842482/AXI_Insignia_Hypen_512.png")
            .setTitle(response.title)
            .setDescription(response.description)
            .setImage(response.link)
            message.channel.send(returnEmbed.setTimestamp());
        } else {
            message.channel.send("Please use a valid argument");
        }
    }
};