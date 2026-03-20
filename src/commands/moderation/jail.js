import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

// guildId -> { roleId, channelId }
export const jailConfig = new Map();
// userId -> [roleId, ...] (jail öncesi roller)
export const jailedUsers = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Kullanıcıyı hapse at / çıkar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('kur')
        .setDescription('Jail sistemini kur (jail rolü + kanalı oluşturur)')
    )
    .addSubcommand(sub =>
      sub.setName('at')
        .setDescription('Kullanıcıyı hapse at')
        .addUserOption(opt =>
          opt.setName('kullanici').setDescription('Hapsedilecek kullanıcı').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('sebep').setDescription('Sebep').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('çıkar')
        .setDescription('Kullanıcıyı hapisten çıkar')
        .addUserOption(opt =>
          opt.setName('kullanici').setDescription('Çıkarılacak kullanıcı').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // --- KUR ---
    if (sub === 'kur') {
      await interaction.deferReply({ ephemeral: true });

      // Jail rolü oluştur
      let jailRole = guild.roles.cache.find(r => r.name === '🔒 Jail');
      if (!jailRole) {
        jailRole = await guild.roles.create({
          name: '🔒 Jail',
          color: 0x808080,
          reason: 'Jail sistemi kurulumu',
        });
      }

      // Tüm kanallardan jail rolünü engelle
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased() || channel.isVoiceBased()) {
          await channel.permissionOverwrites.edit(jailRole, {
            SendMessages: false,
            ViewChannel: false,
            Connect: false,
          }).catch(() => null);
        }
      }

      // Jail kanalı oluştur
      let jailChannel = guild.channels.cache.find(c => c.name === '🔒-jail');
      if (!jailChannel) {
        jailChannel = await guild.channels.create({
          name: '🔒-jail',
          type: ChannelType.GuildText,
          topic: 'Hapsedilen kullanıcılar buradadır.',
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: jailRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ],
        });
      }

      jailConfig.set(guild.id, { roleId: jailRole.id, channelId: jailChannel.id });

      await interaction.editReply({
        embeds: [successEmbed(
          `Jail sistemi kuruldu!\n🎭 Rol: **${jailRole.name}**\n📢 Kanal: ${jailChannel}`,
          '✅ Jail Kuruldu'
        )],
      });
    }

    // --- AT ---
    if (sub === 'at') {
      const config = jailConfig.get(guild.id);
      if (!config) {
        return interaction.reply({
          embeds: [errorEmbed('Jail sistemi kurulmamış. Önce `/jail kur` komutunu çalıştır.')],
          ephemeral: true,
        });
      }

      const target = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
      const member = await guild.members.fetch(target.id).catch(() => null);

      if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
      if (!member.manageable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı yönetemem.')], ephemeral: true });
      if (jailedUsers.has(target.id)) return interaction.reply({ embeds: [errorEmbed('Kullanıcı zaten hapiste.')], ephemeral: true });

      // Mevcut rolleri kaydet (managed ve @everyone hariç)
      const savedRoles = member.roles.cache
        .filter(r => !r.managed && r.id !== guild.id)
        .map(r => r.id);

      jailedUsers.set(target.id, savedRoles);

      // Tüm rolleri al, jail rolü ver
      await member.roles.set([config.roleId], `Jail: ${reason}`);

      // Jail kanalına bildir
      const jailChannel = guild.channels.cache.get(config.channelId);
      await jailChannel?.send({
        embeds: [createEmbed({
          type: 'error',
          title: '🔒 Hapsedildi',
          fields: [
            { name: '👤 Kullanıcı', value: `${target}`, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
            { name: '📝 Sebep', value: reason, inline: false },
          ],
        })],
      });

      await interaction.reply({
        embeds: [successEmbed(
          `**${target.username}** hapsedildi.\n📝 Sebep: ${reason}`,
          '🔒 Jail'
        )], 
      });
    }

    // --- ÇIKAR ---
    if (sub === 'çıkar') {
      const config = jailConfig.get(guild.id);
      if (!config) {
        return interaction.reply({
          embeds: [errorEmbed('Jail sistemi kurulmamış.')],
          ephemeral: true,
        });
      }

      const target = interaction.options.getUser('kullanici');
      const member = await guild.members.fetch(target.id).catch(() => null);

      if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
      if (!jailedUsers.has(target.id)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı hapiste değil.')], ephemeral: true });

      const savedRoles = jailedUsers.get(target.id);
      jailedUsers.delete(target.id);

      // Eski rolleri geri ver
      const validRoles = savedRoles.filter(id => guild.roles.cache.has(id));
      await member.roles.set(validRoles, 'Jail serbest bırakıldı');

      const jailChannel = guild.channels.cache.get(config.channelId);
      await jailChannel?.send({
        embeds: [createEmbed({
          type: 'success',
          title: '🔓 Serbest Bırakıldı',
          fields: [
            { name: '👤 Kullanıcı', value: `${target}`, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          ],
        })],
      });

      await interaction.reply({
        embeds: [successEmbed(`**${target.username}** hapisten çıkarıldı.`, '🔓 Serbest')],
      });
    }
  },
};
