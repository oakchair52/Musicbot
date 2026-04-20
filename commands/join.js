const joinCommand = async (interaction) => {
 
    const member = interaction.member;


    const guild = interaction.guild;


    const textChannel = guild.channels.cache.find(channel => channel.name === 'typerace-channel');


    if (!textChannel) {
        return interaction.reply('The typerace channel does not exist. It might not have been created yet.');
    }

    let typeracistRole = guild.roles.cache.find(role => role.name === 'typeracist');
    if (!typeracistRole) {
        try {
            typeracistRole = await guild.roles.create({
                name: 'typeracist',
                color: 3447003, 
                permissions: [], 
                reason: 'Role for typerace participants',
            });
        } catch (roleError) {
            console.error('Error creating typeracist role:', roleError);
            return interaction.reply('Error creating typeracist role. Check bot permissions.');
        }
    }

   
    try {
        await member.roles.add(typeracistRole);
        interaction.reply(`**${member.user.username}** has joined the typerace!`);


    
        const removeRoleOnChannelDelete = async () => {
            try {
                await member.roles.remove(typeracistRole);
                console.log(`Role ${typeracistRole.name} removed from ${member.user.tag} after channel deletion.`);
            } catch (removeError) {
                console.error('Error removing typeracist role:', removeError);
            }
        };

        
        interaction.client.on('channelDelete', removeRoleOnChannelDelete);

    
        setTimeout(() => {
       
            interaction.client.off('channelDelete', removeRoleOnChannelDelete);
        }, 60000); 
    } catch (addRoleError) {
        console.error('Error adding typeracist role:', addRoleError);
        interaction.reply('Error adding typeracist role. Check bot permissions.');
    }
};

module.exports = joinCommand;
