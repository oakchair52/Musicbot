//type racing game
const { PermissionsBitField, } = require('discord.js');
const Discord = require('discord.js');
const { createCanvas, loadImage } = require('canvas')

const typeraceCommand = async (interaction) => {
    const guild = interaction.guild;
    let channelDeleted = false;
    const raceString = generateRandomString();
    console.log(raceString);

    //typeracr kanavan checkkaus
    const existingChannels = guild.channels.cache.filter(
        (channel) => channel.name === 'typerace-channel' && channel.type === 0
    );

    if (existingChannels.size > 0) {
        await interaction.reply('A type race competition is already in progress. Please wait for it to finish.');
        return;
    }

    const channelOptions = {
        name: 'typerace-channel',
        type: 0,
        topic: 'Type race competition channel!',
    };


    try {
        const textChannel = await guild.channels.create(channelOptions);
        await textChannel.permissionOverwrites.set([
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.SendMessages],
            }
        ]);



        
        const raceImageBuffer = await generateRandomStringImage(raceString);

        const rulesMessage = await textChannel.send(`
            

            **RULES**: You have only 1 message.  
            Who types and sends the correct text first, wins.
            Each character error will result in +2 second penalty.

            **Type the following string:**
            
        `);

        await interaction.reply(`Type /join and enter: ${textChannel}`);

        const scoreboard = {};


        let scoreboardMessageId = null;

        //funktio jolla päivitetää scoreboard ja lähetetää viesti
        const updateScoreboardAndSendMessage = async () => {

            const sortedEntries = Object.entries(scoreboard).sort((a, b) => a[1] - b[1]);
        
            let scoreboardContent = 'Scoreboard:\n';

            for (const [user, time] of sortedEntries) {
                scoreboardContent += `${user} - ${time / 1000} seconds\n`;
            }
            
            try {
                if (scoreboardMessageId) {

                    const scoreboardMessage = await textChannel.messages.fetch(scoreboardMessageId);
                    await scoreboardMessage.edit(scoreboardContent);
                } else {

                    const newScoreboardMessage = await textChannel.send(scoreboardContent);
                    scoreboardMessageId = newScoreboardMessage.id;
                }
            } catch (error) {
                console.error('Error updating scoreboard message:', error);
            }
        };

        const messageListener = async (message, initialTime) => {

            if (message.channel.id === textChannel.id && !message.author.bot) {
                //typeracist rolen poisto
                const typeracistRole = guild.roles.cache.find(role => role.name === 'typeracist');
                if (typeracistRole && message.member.roles.cache.has(typeracistRole.id)) {
                    try {
                        await message.member.roles.remove(typeracistRole);
                        console.log(`Removed "typeracist" role from ${message.author.username}.`);
                    } catch (error) {
                        console.error('Error removing "typeracist" role:', error);
                    }
                }
        
                //viestien poisto
                try {
                    await message.delete();
                    console.log(`Deleted message from ${message.author.username}.`);
                } catch (error) {
                    console.error('Error deleting message:', error);
                }
        
                const userMessage = message.content.toLowerCase();
        

                const similarity = calculateSimilarity(userMessage, raceString);
        
                const similarityThreshold = 0.8;
        
                console.log(`User message: ${userMessage}`);
                console.log(`Race string: ${raceString}`);
                console.log(`Similarity: ${similarity}`);
        
                //samaanvertaisuuden checkkaus
                if (similarity >= similarityThreshold) {
                    const elapsedTime = new Date() - initialTime;
                    const timeWithPenalty = elapsedTime + calculatePenalty(userMessage, raceString);
                
                    console.log(`${message.author.username} won the type race in ${timeWithPenalty / 1000} seconds!`);
                
                    try {
                        //scoreboard update
                        scoreboard[message.author.username] = timeWithPenalty;
                        //voittaja viesti
                        const winnerMessage = await textChannel.send(`${message.author} won the type race in ${timeWithPenalty / 1000} seconds!`);
                
                        setTimeout(async () => {
                            try {
                                await winnerMessage.delete();
                            } catch (deleteError) {
                                console.error('Error deleting winner message:', deleteError);
                            }
                        }, 1000);
                
                        //scoreboard update ja sit lähetys
                        await updateScoreboardAndSendMessage();
                    } catch (error) {
                        console.error('Error sending winner message or updating scoreboard:', error);
                    }
                }
            }
        };

        //funktio jolla lasketaan 2 välisen stringin samaanvertaisuus
        function calculateSimilarity(str1, str2) {

            if (!str1 || !str2) {
                return 0;
            }

            const len1 = str1.length + 1;
            const len2 = str2.length + 1;
            const matrix = [];

            for (let i = 0; i < len1; i++) {
                matrix[i] = [i];
            }

            for (let j = 0; j < len2; j++) {
                matrix[0][j] = j;
            }

            for (let i = 1; i < len1; i++) {
                for (let j = 1; j < len2; j++) {
                    const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + cost
                    );
                }
            }

            return 1 - matrix[len1 - 1][len2 - 1] / Math.max(len1 - 1, len2 - 1);
        }
        //funktio jolla lasketaan virheet
        function calculatePenalty(str1, str2) {
            let penalty = 0;

            str1 = str1.toLowerCase();
            str2 = str2.toLowerCase();

            for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
                if (str1.charAt(i) !== str2.charAt(i)) {
                    penalty += 2000; //jokasesta virheestä tulee +2 sekunttia
                }
            }

            return penalty;
        }

        guild.client.on('messageCreate', messageListener);

        setTimeout(async () => {
            try {
                //typeracist role hankkimine
                const typeracistRole = guild.roles.cache.find(role => role.name === 'typeracist');

                //channel oikeudet update
                await textChannel.permissionOverwrites.set([
                    {
                        id: typeracistRole,
                        allow: [PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                ]);

                console.log(`Channel permissions updated after 30 seconds.`);
                const initialTime=new Date();

                await rulesMessage.edit(`
                   Here:
                    
                `);
                const { AttachmentBuilder } = require('discord.js')
                const raceImageAttachment = new AttachmentBuilder(raceImageBuffer, 'raceImage.png')
                textChannel.send({ files: [raceImageAttachment] });

                guild.client.removeListener('messageCreate', messageListener); 
                const newMessageListener = (message) => messageListener(message, initialTime); 
                guild.client.on('messageCreate', newMessageListener);




            } catch (updateError) {
                console.error('Error updating channel permissions:', updateError);
            }
        }, 30000);

        setTimeout(async () => {
            try {
                if (!channelDeleted) {
                    channelDeleted = true;

                    let winner = null;
                    let winningTime = Infinity;
                    for (const [user, time] of Object.entries(scoreboard)) {
                        if (time < winningTime) {
                            winner = user;
                            winningTime = time;
                        }
                    }
                    if (winner) {
                        // voittajan julistamis viesti
                        //const generalChat = guild.channels.cache.find(channel => channel.name === 'general' && channel.type === 0);
                        const channel = interaction.channel;
                        //if (generalChat) {
                            await channel.send(`The winner of the type race is ${winner} with ${winningTime / 1000} seconds!`);
                        //}
                    } else {
                        console.log('No winner found.');
                    }
                    await textChannel.delete();
                    console.log(`Channel ${textChannel.name} deleted after 2 minute.`);
                    guild.client.removeListener('messageCreate', messageListener);
                }
            } catch (deleteError) {
                console.error('Error deleting text channel:', deleteError);
            }
        }, 60000);

    } catch (error) {
        console.error('Error creating text channel:', error);
        await interaction.reply('Error creating text channel. Check bot permissions.');
    }
};

const generateRandomStringImage = async (raceString) => {
    const canvas = createCanvas(500, 200);
    const ctx = canvas.getContext('2d');

    const maxWidth = 480; // maksimi leveys
    const lineHeight = 25; // rivin korkeus 

    // Function jolla kirjotettaa teksti canvassii
    function drawWrappedText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let yPos = y;
        for (const word of words) {
            const testLine = line + word + ' ';
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth) {
                ctx.fillText(line, x, yPos);
                line = word + ' ';
                yPos += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, yPos);
    }

    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    drawWrappedText(raceString, 10, 50, maxWidth, lineHeight);

    const buffer = canvas.toBuffer();

    return buffer;
};

// Function jolla generoijaa randomi stringi
const generateRandomString = () => {
    const strings = [
        'Why did the chicken join a band? Because it had the drumsticks!',
        'Why did the tomato turn red? Because it saw the salad dressing!',
        'Why was the math book sad? Because it had too many problems!',
        'Why was the broom late? It overswept!',
        'Why did the golfer bring two pairs of pants? In case he got a hole in one!',
        'Why don’t skeletons fight each other? They don’t have the guts!'
    ];
    const randomIndex = Math.floor(Math.random() * strings.length);
    return strings[randomIndex];
};

module.exports = typeraceCommand;
