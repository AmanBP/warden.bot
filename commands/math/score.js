/* eslint-disable no-bitwise */
/* eslint-disable complexity */
const QuickChart = require('quickchart-js');
const Discord = require("discord.js");
const shipData = require("./calc/shipdata.json")

let options = new Discord.SlashCommandBuilder()
.setName('score')
.setDescription('Score your fight based on the revised Ace Scoring System')
.addStringOption(option => option.setName('shiptype')
    .setDescription('Ship you used')
    .setRequired(true)
    .addChoices( 
        { name:'Alliance Challenger', value:'challenger' },
        { name:'Alliance Chieftain', value:'chieftain' },
        { name:'Alliance Crusader', value:'crusader' },
        { name:'Anaconda', value:'anaconda' },
        { name:'Asp Explorer', value:'aspx' },
        { name:'Beluga Liner', value:'beluga' },
        { name:'Diamondback Explorer', value:'dbx' },
        { name:'Diamondback Scout', value:'dbs' },
        { name:'Federal Assault Ship', value:'fas' },
        { name:'Federal Corvette', value:'corvette' },
        { name:'Federal Dropship', value:'fds' },
        { name:'Federal Gunship', value:'fgs' },
        { name:'Fer-de-Lance', value:'fdl' },
        { name:'Hauler', value:'hauler' },
        { name:'Imperial Clipper', value:'clipper' },
        { name:'Imperial Courier', value:'icourier' },
        { name:'Imperial Cutter', value:'cutter' },
        { name:'Krait Mk. II', value:'km2' },
        { name:'Krait Phantom', value:'kph' },
        { name:'Mamba', value:'mamba' },
        { name:'Python', value:'python' },
        { name:'Type-10 Defender', value:'t10' },
        { name:'Viper MK III', value:'vmk3' },
        { name:'Viper MK IV', value:'vmk4' },
        { name:'Vulture', value:'vulture' }
    ))
.addStringOption(option => option.setName('goid')
    .setDescription('Type of goid fought - fixed to Medusa for now; may expand in the future')
    .setRequired(true)
    .addChoices({ name:'Medusa', value:'medusa' }))
.addIntegerOption(option => option.setName('gauss_medium_number')
    .setDescription('Number of MEDIUM gauss cannons outfitted')
    .setRequired(true)
    .addChoices(
        { name: '0', value: 0 },
        { name: '1', value: 1 },
        { name: '2', value: 2 },
        { name: '3', value: 3 },
        { name: '4', value: 4 }
    ))
.addIntegerOption(option => option.setName('gauss_small_number')
    .setDescription('Number of SMALL gauss cannons outfitted')
    .setRequired(true)
    .addChoices(
        { name: '0', value: 0 },
        { name: '1', value: 1 },
        { name: '2', value: 2 },
        { name: '3', value: 3 },
        { name: '4', value: 4 }
    ))
.addStringOption(option => option.setName('ammo')
    .setDescription('Ammo type used')
    .setRequired(true)
    .addChoices(
        { name: 'Basic', value: 'basic' },
        { name: 'Standard', value: 'standard' },
        { name: 'Premium', value: 'premium' }
    ))
.addIntegerOption(option => option.setName('time_in_seconds')
    .setDescription('Time taken in Seconds')
    .setRequired(true))
.addIntegerOption(option => option.setName('shots_medium_fired')
    .setDescription('Total number of MEDIUM gauss ammo rounds fired')
    .setRequired(true))
.addIntegerOption(option => option.setName('shots_small_fired')
    .setDescription('Total number of SMALL gauss ammo rounds fired')
    .setRequired(true))
.addIntegerOption(option => option.setName('percenthulllost')
    .setDescription('Total percentage of hull lost in fight (incl. repaired with limpets)')
    .setRequired(true))
.addBooleanOption(option => option.setName('print_score_breakdown')
    .setDescription('Print a score breakdown, in addition to the overall score')
    .setRequired(false))
.addBooleanOption(option => option.setName('scorelegend')
    .setDescription('Print a description of how to interpret a score')
    .setRequired(false))
.addBooleanOption(option => option.setName('submit')
    .setDescription('Do you want to submit your score for formal evaluation? If so, please also include a video link')
    .setRequired(false))
.addStringOption(option => option.setName('video_link')
    .setDescription('Link to a video of the fight, for submission purposes')
    .setRequired(false))

module.exports = {
    data: options,
	permissions: 0,
    execute(interaction) {

        // Scoring Factors
        let targetRun = 100
        let roundPenalty = 0.125
        let hullPenalty = 0.2
        let standardPenalty = 12.5
        let premiumPenalty = 25
        let vanguardOver40Penalty = 0.25

        // Managing Inputs
        let args = {}
        for (let key of interaction.options.data) {
            args[key.name] = key.value
        }

        // Sanitize inputs
        if (args.scorelegend === undefined) { args.scorelegend = false }
        if (args.print_score_breakdown === undefined) { args.print_score_breakdown = false }
        if (args.submit === undefined) { args.submit = false }
        
        if ((args.gauss_small_number + args.gauss_medium_number) > 4) {
            interaction.reply(`More than 4 gauss? Very funny ${interaction.member} ...`);
            return(-1);
        }

        if ((args.gauss_small_number + args.gauss_medium_number) < 1) {
            interaction.reply(`While trying to kill a Medusa with less than 1 gauss cannons is a noble attempt dear ${interaction.member} ... it kind of defeats the purpose of this calculator`);
            return(-1);
        }

        if (args.time_in_seconds < 120) {
            interaction.reply(`Mhhh ... I sincerely doubt that you killed a Medusa alone in less than two minutes ${interaction.member} ... maybe you mixed up minutes and seconds as an input?`);
            return(-1);
        }

        if (args.time_in_seconds > 7200) {
            interaction.reply(`Oh my sweet summer child ${interaction.member} ... if you truly took more than 2 hours to kill a Medusa, you shouldn't be using an Ace score calculator to rate it ...`);
            return(-1);
        }

        if ((args.shots_small_fired + args.shots_medium_fired) < 105) {
            interaction.reply(`Since the very absolute minimum number of gauss shots to kill a Medusa in any configuration is 105, my dear ${interaction.member} you either need to check your inputs or stop trying to be funny`);
            return(-1);
        }

        if ((args.shots_small_fired + args.shots_medium_fired) > 1000) {
            interaction.reply(`Oh innocent puppy-eyed ${interaction.member} ... if you truly took more than 1,000 ammo rounds to kill a Medusa, you shouldn't be using an Ace score calculator to rate it ...`);
            return(-1);
        }

        if (args.percenthulllost < 0) {
            interaction.reply(`Unfortunately, ${interaction.member}, it's not possible to lose a NEGATIVE number of hull in a fight. Please check your inputs and try again`);
            return(-1);
        }

        if (args.percenthulllost > 500) {
            interaction.reply(`Oh wonderful ${interaction.member} padawan ... if you truly lost a total of more than 500% hull while killing a Medusa, you shouldn't be using an Ace score calculator to rate it ...`);
            return(-1);
        }

        if (args.shots_small_fired > 0 && args.gauss_small_number === 0) {
            interaction.reply(`Hey ${interaction.member} ... it appears you have small gauss shots fired, but no small gauss outfitted on your ship. Please check your inputs and try again.`);
            return(-1);
        }

        if (args.shots_medium_fired > 0 && args.gauss_medium_number === 0) {
            interaction.reply(`Hey ${interaction.member} ... it appears you have medium gauss shots fired, but no small gauss outfitted on your ship. Please check your inputs and try again.`);
            return(-1);
        }
        
        // Decide ammo type and penalty
        let ammoPenalty;
        switch (args.ammo) {
            case "premium":
                ammoPenalty = premiumPenalty;
                break;
            case "standard":
                ammoPenalty = standardPenalty;
                break;
            case "basic":
                ammoPenalty = 0
                break;
        }

        // Decode SLEF data (to use later)
        
        // let totalSmallGauss;
        // let totalMediumGauss;
        // let slefJSON = JSON.parse(args.json)
        // let slef = slefJSON[0]

        // for (let module of slef.data.Modules) {
        //     let moduleString = module.Item
        //     if (moduleString.includes("gausscannon_fixed_small")) { totalSmallGauss++ }
        //     if (moduleString.includes("gausscannon_fixed_medium")) { totalMediumGauss++ }
        // }

        let myrmThreshold;
        let vanguardScore;

        let shipInfo = shipData.find(ship => ship.ShortName == args.shiptype)
        vanguardScore = shipInfo.Score
        switch (shipInfo.Size) {
            case ("small"):
                myrmThreshold = 1440
                break
            case ("medium"):
                myrmThreshold = 720
                break
            case ("large"):
                myrmThreshold = 360
                break
        }

        // Calculate the minimum amount of ammo needed for the gauss config
        // This comes from Mechan's & Orodruin's google sheet
        // It is INTENTIONALLY not a mix of small and medium as that makes everything unmanageable - either medium or small is used
        // THIS IS NOW DEPRECATED IN FAVOR OF THE DAMAGE METHOD, WHICH INSTEAD ALLOWS TO COMPARE ALSO A MIX OF WEAPONS
//        let ammo_threshold;
//       switch (args.gauss_type) {
//            case "small":
//               switch (args.gauss_number) {
//                    case 1:
//                        switch (args.ammo) {
//                            case "basic":
//                                interaction.reply(`Sorry, a ${args.goid} run with ${args.gauss_number} ${args.gauss_type} gauss with ${args.ammo} ammo isn't possible.`);
//                                return(-1);
//                            case "standard":
//                                interaction.reply(`Sorry, a ${args.goid} run with ${args.gauss_number} ${args.gauss_type} gauss with ${args.ammo} ammo isn't possible.`);
//                                return(-1);
//                            case "premium":
//                                ammo_threshold = 3816;
//                                break;
//                        }
//                        break;
//                    case 2:
//                        switch (args.ammo) {
//                            case "basic":
//                                ammo_threshold = 417;
//                                return(-1);
//                            case "standard":
//                                ammo_threshold = 317;
//                                return(-1);
//                            case "premium":
//                                ammo_threshold = 255;
//                                break;
//                        }
//                        break;
//                    case 3:
//                        switch (args.ammo) {
//                            case "basic":
//                                ammo_threshold = 300;
//                                break;
//                            case "standard":
//                                ammo_threshold = 251;
//                                break;
//                            case "premium":
//                                ammo_threshold = 210;
//                                break;
//                        }
//                        break;
//                    case 4:
//                        switch (args.ammo) {
//                            case "basic":
//                                ammo_threshold = 266;
//                                break;
//                            case "standard":
//                                ammo_threshold = 229;
//                                break;
//                            case "premium":
//                                ammo_threshold = 195;
//                                break;
//                        }
//                        break;
//               }
//                break;
//                case "medium":
//                    switch (args.gauss_number) {
//                        case 1:
//                            switch (args.ammo) {
//                                case "basic":
//                                    ammo_threshold = 296;
//                                    break;
//                                case "standard":
//                                    ammo_threshold = 211;
//                                    break;
//                                case "premium":
//                                    ammo_threshold = 159;
//                                    break;
//                            }
//                            break;
//                        case 2:
//                            switch (args.ammo) {
//                                case "basic":
//                                    ammo_threshold = 161;
//                                    break;
//                                case "standard":
//                                    ammo_threshold = 139;
//                                    break;
//                                case "premium":
//                                    ammo_threshold = 115;
//                                    break;
//                            }
//                            break;
//                        case 3:
//                            switch (args.ammo) {
//                                case "basic":
//                                    ammo_threshold = 143;
//                                    break;
//                                case "standard":
//                                    ammo_threshold = 129;
//                                    break;
//                                case "premium":
//                                    ammo_threshold = 107;
//                                    break;
//                            }
//                            break;
//                        case 4:
//                            switch (args.ammo) {
//                                case "basic":
//                                    ammo_threshold = 137;
//                                    break;
//                                case "standard":
//                                    ammo_threshold = 125;
//                                    break;
//                                case "premium":
//                                    ammo_threshold = 105;
//                                    break;
//                            }
//                            break;
//                    }
//                    break;
//
//        }


        // Calculate the minimum damage required for the given gauss config
        // This comes from Mechan's & Orodruin's google sheet
        let damage_threshold;
        switch (args.gauss_medium_number) {
            case 0:
                switch (args.gauss_small_number) {
                    case 1:
                        switch (args.ammo) {
                            case "basic":
                                interaction.reply(`Sorry, a ${args.goid} run with ${args.gauss_number} ${args.gauss_type} gauss with ${args.ammo} ammo isn't possible.`);
                                return(-1);
                            case "standard":
                                interaction.reply(`Sorry, a ${args.goid} run with ${args.gauss_number} ${args.gauss_type} gauss with ${args.ammo} ammo isn't possible.`);
                                return(-1);
                            case "premium":
                                damage_threshold = 80166.53;
                                break;
                        }
                        break;
                    case 2:
                        switch (args.ammo) {
                            case "basic":
                                damage_threshold = 6771.04;
                                break;
                            case "standard":
                                damage_threshold = 5798.21;
                                break;
                            case "premium":
                                damage_threshold = 5357.04;
                                break;
                        }
                        break;
                    case 3:
                        switch (args.ammo) {
                            case "basic":
                                damage_threshold = 4848.00;
                                break;
                            case "standard":
                                damage_threshold = 4571.66;
                                break;
                            case "premium":
                                damage_threshold = 4411.68;
                                break;
                        }
                        break;
                    case 4:
                        switch (args.ammo) {
                            case "basic":
                                damage_threshold = 4298.56;
                                break;
                            case "standard":
                                damage_threshold = 4181.40;
                                break;
                            case "premium":
                                damage_threshold = 4096.56;
                                break;
                        }
                        break;
                    }
                    break;
            case 1:
                switch (args.gauss_small_number) {
                    case 0:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 8399.16;
                                break;
                            case "standard":
                                damage_threshold = 6764.58;
                                break;
                            case "premium":
                                damage_threshold = 5845.48;
                                break;
                        }
                        break;
                    case 1:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 5041.92;
                                break;
                            case "standard":
                                damage_threshold = 4734.27;
                                break;
                            case "premium":
                                damage_threshold = 4458.95;
                                break;
                        }
                        break;
                    case 2:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4367.24;
                                break;
                            case "standard":
                                damage_threshold = 4232.51;
                                break;
                            case "premium":
                                damage_threshold = 4075.55;
                                break;
                        }
                        break;     
                    case 3:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4112.72;
                                break;
                            case "standard":
                                damage_threshold = 4023.44;
                                break;
                            case "premium":
                                damage_threshold = 3912.74;
                                break;
                        }
                        break;
                }
                break;
            case 2:
                switch (args.gauss_small_number) {
                    case 0:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4553.08;
                                break;
                            case "standard":
                                damage_threshold = 4455.51;
                                break;
                            case "premium":
                                damage_threshold = 4227.86;
                                break;
                        }
                        break;  
                    case 1:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4153.12;
                                break;
                            case "standard":
                                damage_threshold = 4037.37;
                                break;
                            case "premium":
                                damage_threshold = 3933.75;
                                break;
                        }
                        break;  
                    case 2:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4007.68;
                                break;
                            case "standard":
                                damage_threshold = 3897.99;
                                break;
                            case "premium":
                                damage_threshold = 3823.46;
                                break;
                        }
                        break;
                }
                break;
            case 3:
                switch (args.gauss_small_number) {
                    case 0:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 4044.04;
                                break;
                            case "standard":
                                damage_threshold = 4097.77;
                                break;
                            case "premium":
                                damage_threshold = 3933.75;
                                break;
                        }
                        break;
                    
                    case 1:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 3882.44;
                                break;
                            case "standard":
                                damage_threshold = 3823.66;
                                break;
                            case "premium":
                                damage_threshold = 3765.68;
                                break;
                        }
                    break;
                    }
                    break;
            case 4:
                switch (args.gauss_small_number) {
                    case 0:
                        switch (args.ammo) {
                            case "basic":  
                                damage_threshold = 3874.36;
                                break;
                            case "standard":
                                damage_threshold = 3967.68;
                                break;
                            case "premium":
                                damage_threshold = 3860.22;
                                break;
                        }
                        break;
                }
            break;
            }
                
        // Medium gauss does 28.28 damage on a Dusa, small gauss does 16.16 per round
        let shot_damage_fired = args.shots_medium_fired * 28.28 + args.shots_small_fired * 16.16;

        // Avoid funnies with >100% accuracy fake submissions
        // Allow funnies if Aran is involved
        if (shot_damage_fired.toFixed(2) < damage_threshold) {
            if(interaction.member.id === "346415786505666560"){ // 346415786505666560 - Aran
                interaction.reply(`Thank you ${interaction.member} for breaking my accuracy calculations again! Please let me know where I have failed, and I will fix it - CMDR Mechan`);
            } else {
                interaction.reply(`Comrade ${interaction.member} ... It appears your entry results (${shot_damage_fired}) vs (${damage_threshold}) in greater than 100% accuracy. Unfortunately [PC] CMDR Aranionros Stormrage is the only one allowed to achieve >100% accuracy. Since you are not [PC] CMDR Aranionros Stormrage, please check your inputs and try again.`);
            }
            return(-1);
        }

        // Set accuracy threshold
        // 82% is the current setting for Astraea's Clarity, which is 175 rounds for a 3m basic config, which in turn is 143 rounds minimum
        // So, for now, applying 82% as the ratio ... which is multiplying by 1.223 and rounding up
        let accuracy_required;
        accuracy_required = Math.ceil(damage_threshold * 1.223);

        // Set myrm_factor based on myrm_threshold - this is done as the basis to calculate a penalty that is consistent across ship sizes, and not punishing for large ships (as the absolute # of seconds used to be)
        let myrm_factor;
        myrm_factor = args.time_in_seconds / myrmThreshold;

        // Calculations
        let roundPenaltyTotal = 0;
        if (shot_damage_fired > accuracy_required) { roundPenaltyTotal = (shot_damage_fired - accuracy_required)/accuracy_required * roundPenalty }

        // Factor of -0.108 was obtained by matching penalties from old system with a 30m medium run to new system, as follows
        // (1800 - 720) * -0.025 = 27; Old system
        // 1800/720 * 100x = 27 --> x = 27 * 720 / 1800 / 100 -> x = 0.108; New system
        let timePenaltyTotal = 0;
        if (args.time_in_seconds > myrmThreshold) { timePenaltyTotal = (myrm_factor) * 10.8 }

        let vangPenaltyTotal = 0;
        if (vanguardScore > 40) { vangPenaltyTotal = (vanguardScore - 40) * vanguardOver40Penalty }

        let hullPenaltyTotal = args.percenthulllost * hullPenalty

        let penaltyTotal = ammoPenalty + timePenaltyTotal + roundPenaltyTotal + vangPenaltyTotal + hullPenaltyTotal

        let finalScore = targetRun - penaltyTotal
        
        // Chart creation

        const chart = new QuickChart();
        chart.setWidth(400)
        chart.setHeight(400);
        chart.setBackgroundColor('transparent');
        
        chart.setConfig({
            "type": "radar",
            "data": {
              "labels": [
                "Vanguard Score",
                "Ammo Type",
                "Ammo Used",
                "Time Taken",
                "Damage Taken"
              ],
              "datasets": [
                {
                  "backgroundColor": "rgba(228, 107, 26, 0.2)",
                  "borderColor": "rgb(228, 107, 26)",
                  "data": [
                    100 - vangPenaltyTotal,
                    100 - ammoPenalty,
                    100 - roundPenaltyTotal,
                    100 - timePenaltyTotal,
                    100 - hullPenaltyTotal
                    
                  ],
                  "label": "Your Run"
                }
// At some point want to add an optional parameter to compare to "best run" - here for that purpose
//                ,
//                {
//                    "backgroundColor": "rgba(255, 159, 64, 0.5)",
//                    "borderColor": "rgb(255, 159, 64)",
//                    "data": [
//                      100,
//                      100,
//                      100-1.75,
//                      100,
//                      100-0.5,
//                    ],
//                    "label": "Current Best",
//                    "fill": "-1"
//                }
            ]
          },
            "options": {

                "maintainAspectRatio": true,
                "spanGaps": false,

                "legend": {
                    "display": true,
                    "labels": {
                        "fontColor": "rgb(255, 255, 255)",
                        // Somehow chart doesn't like font size setting for both labels and pointLabels
                        //"fontSize": "18"
                    }
                },
        
                "scale": {
                    
                    "pointLabels": {
                        "fontColor": "rgba(228, 107, 26, 1)",
                        "fontSize": "16"
                    },

                    "angleLines": {
                        "color": "rgba(255 , 255, 255, 0.2)",
                        "borderDash": [10,10]
                    },

                    "ticks": {
                        "max": 100,
                        "min": 0,
                        "stepSize": 20,
                        "backdropColor": "transparent"
                    },
                },

                "elements": {
                    "line": {
                        "tension": 0.000001
                    }
                },

                "plugins": {
                    "filler": {
                        "propagate": false
                    },
                    "samples-filler-analyser": {
                        "target": "chart-analyser"
                    }
                }
            }
          });

        // Print reply

        let outputString = `**__Thank you for submitting a New Ace score request!__**

            This score has been calculated for ${interaction.member}'s solo fight of a ${args.shiptype} against a ${args.goid}, taking a total of ${args.percenthulllost.toFixed(0)}% hull damage (including damage repaired with limpets, if any), in ${~~(args.time_in_seconds / 60)} minutes and ${args.time_in_seconds % 60} seconds.
            
            With ${args.gauss_medium_number.toFixed(0)} medium gauss and ${args.gauss_small_number.toFixed(0)} small gauss, and using ${args.ammo} ammo, the minimum required damage done would have been ${damage_threshold.toFixed(0)}hp, which entails a maximum of ${accuracy_required.toFixed(0)}hp in damage-of-shots-fired for an 82% firing efficiency level (Astraea's Clarity level).
            
            ${interaction.member}'s use of ${shot_damage_fired.toFixed(0)}hp damage-of-shots-fired (${args.shots_medium_fired.toFixed(0)} medium rounds @ 28.28hp each and ${args.shots_small_fired.toFixed(0)} small rounds @ 16.16hp each) represents a **__${((damage_threshold / shot_damage_fired ).toFixed(4)*(100)).toFixed(2)}%__** overall firing efficiency.`
 
        if (args.shots_medium_fired === 0 && args.gauss_medium_number > 0) {
                outputString += `\n\n**__WARNING__**: It appears you have medium gauss outfitted, but no medium gauss shots fired. Please make sure this is intended.`
        }

        if (args.shots_small_fired === 0 && args.gauss_small_number > 0) {
            outputString += `\n\n**__WARNING__**: It appears you have small gauss outfitted, but no small gauss shots fired. Please make sure this is intended.`
        }
            
        if(args.print_score_breakdown == true) {
                outputString += `
                ---
                **Base Score:** ${targetRun} Ace points
                ---
                **Vanguard Score Penalty:** -${vangPenaltyTotal.toFixed(2)} Ace points
                **Ammo Type Penalty:** -${ammoPenalty.toFixed(2)} Ace points
                **Ammo Used Penalty:** -${roundPenaltyTotal.toFixed(2)} Ace points
                **Time Taken Penalty:** -${timePenaltyTotal.toFixed(2)} Ace points
                **Damage Taken Penalty:** -${hullPenaltyTotal.toFixed(2)} Ace points
                ---`
        }

        outputString += `\n**Your Fight Score:** **__${finalScore.toFixed(2)}__** Ace points.`
        
        if(args.scorelegend == true) {
            outputString += `
                ---
                *Interpret as follows:*
                *- CMDRs at their first Medusa fight will typically score 0-10 pts (and will occasionally score well into the negative for fights that go sideways);*
                *- A collector-level CMDR will typically score about 25-45 pts;*
                *- A Herculean Conqueror / early-challenge-rank CMDR will typically score about 45-65 (on a good run);* 
                *- An advanced challenge-level CMDR will typically score about 65-85 (on a good run);*
                *- The very best score is presently 99.80 AXI points.*`
        }
        const url = chart.getUrl();

        const returnEmbed = new Discord.EmbedBuilder()
        .setColor('#FF7100')
        .setTitle("**Ace Score Calculation**")
        .setDescription(`${outputString}`)
        .setImage(url)

		const buttonRow = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setLabel('Learn more about the Ace Score Calculator').setStyle(Discord.ButtonStyle.Link).setURL('https://wiki.antixenoinitiative.com/en/Ace-Score-Calculator'),)

        interaction.reply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
    },
};