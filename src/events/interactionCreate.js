import { checkCooldown } from '../utils/cooldown.js';
import { errorEmbed, warnEmbed, successEmbed, createEmbed } from '../utils/embed.js';
import { logger } from '../utils/logger.js';
import { checkSpam, spamEnabled } from '../commands/moderation/spam-filter.js';
import { verifyConfig } from '../commands/utility/verify.js';
import { ticketConfig, openTickets, openTicket, closeTicket } from '../commands/utility/ticket.js';
import { reactionRolesData } from '../commands/utility/reactionroles.js';
import { emitLog } from '../utils/logBus.js';
import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits,
} from 'discord.js';

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {

    // ─── MODAL SUBMIT ──────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const { customId, guild, user } = interaction;

      // Panel: Ban modal
      if (customId === 'modal_ban') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
          return interaction.reply({ embeds: [errorEmbed('Bu işlem için `Ban Members` iznin gerekli.')], ephemeral: true });
        }
        const targetId = interaction.fields.getTextInputValue('ban_target').trim();
        const reason = interaction.fields.getTextInputValue('ban_reason').trim() || 'Sebep belirtilmedi';
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member && !/^\d{17,19}$/.test(targetId)) {
          return interaction.reply({ embeds: [errorEmbed('Geçerli bir kullanıcı ID\'si gir.')], ephemeral: true });
        }
        try {
          await guild.bans.create(targetId, { reason: `${user.username}: ${reason}`, deleteMessageSeconds: 86400 });
          emitLog({ guild: guild.id, user: user.username, action: `Ban: <@${targetId}> — ${reason}`, type: 'mod' });
          return interaction.reply({ embeds: [successEmbed(`<@${targetId}> yasaklandı.\n📝 Sebep: ${reason}`, '🔨 Ban Uygulandı')] });
        } catch (e) {
          return interaction.reply({ embeds: [errorEmbed(`Ban uygulanamadı: ${e.message}`)], ephemeral: true });
        }
      }

      // Panel: Kick modal
      if (customId === 'modal_kick') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
          return interaction.reply({ embeds: [errorEmbed('Bu işlem için `Kick Members` iznin gerekli.')], ephemeral: true });
        }
        const targetId = interaction.fields.getTextInputValue('kick_target').trim();
        const reason = interaction.fields.getTextInputValue('kick_reason').trim() || 'Sebep belirtilmedi';
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı sunucuda bulunamadı.')], ephemeral: true });
        if (!member.kickable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı atamam.')], ephemeral: true });
        await member.kick(`${user.username}: ${reason}`);
        emitLog({ guild: guild.id, user: user.username, action: `Kick: ${member.user.username} — ${reason}`, type: 'mod' });
        return interaction.reply({ embeds: [successEmbed(`**${member.user.username}** sunucudan atıldı.\n📝 Sebep: ${reason}`, '👢 Kick Uygulandı')] });
      }

      // Panel: Mute modal
      if (customId === 'modal_mute') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          return interaction.reply({ embeds: [errorEmbed('Bu işlem için `Moderate Members` iznin gerekli.')], ephemeral: true });
        }
        const targetId = interaction.fields.getTextInputValue('mute_target').trim();
        const mins = parseInt(interaction.fields.getTextInputValue('mute_duration').trim()) || 10;
        const reason = interaction.fields.getTextInputValue('mute_reason').trim() || 'Sebep belirtilmedi';
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
        if (!member.moderatable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı susturamam.')], ephemeral: true });
        await member.timeout(Math.min(mins, 1440) * 60000, `${user.username}: ${reason}`);
        return interaction.reply({ embeds: [successEmbed(`**${member.user.username}** **${mins} dakika** susturuldu.\n📝 Sebep: ${reason}`, '🔇 Mute Uygulandı')] });
      }

      // Panel: Warn modal
      if (customId === 'modal_warn') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          return interaction.reply({ embeds: [errorEmbed('Bu işlem için `Moderate Members` iznin gerekli.')], ephemeral: true });
        }
        const targetId = interaction.fields.getTextInputValue('warn_target').trim();
        const reason = interaction.fields.getTextInputValue('warn_reason').trim() || 'Sebep belirtilmedi';
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
        return interaction.reply({ embeds: [successEmbed(`**${member.user.username}** uyarıldı.\n📝 Sebep: ${reason}\n\n> Uyarıları kaydetmek için \`/warn\` komutunu kullan.`, '⚠️ Uyarı Verildi')] });
      }

      // Panel: Clear modal
      if (customId === 'modal_clear') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ embeds: [errorEmbed('Bu işlem için `Manage Messages` iznin gerekli.')], ephemeral: true });
        }
        const amount = Math.min(parseInt(interaction.fields.getTextInputValue('clear_amount').trim()) || 10, 100);
        const ch = interaction.channel;
        const messages = await ch.messages.fetch({ limit: 100 });
        const toDelete = messages.filter(m => Date.now() - m.createdTimestamp < 12096e5).first(amount);
        if (!toDelete.length) return interaction.reply({ embeds: [errorEmbed('Silinecek uygun mesaj yok.')], ephemeral: true });
        await ch.bulkDelete(toDelete, true);
        return interaction.reply({ embeds: [successEmbed(`**${toDelete.length}** mesaj silindi.`, '🗑️ Temizlendi')], ephemeral: true });
      }

      return;
    }

    // ─── BUTTON HANDLERS ───────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId, guild, user, channel } = interaction;

      // --- Panel: Moderasyon hızlı eylem modalları ---
      if (customId === 'panel_ban') {
        const modal = new ModalBuilder().setCustomId('modal_ban').setTitle('🔨 Kullanıcı Yasakla');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_target').setLabel('Kullanıcı ID veya @mention').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_reason').setLabel('Sebep').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Kural ihlali...')),
        );
        return interaction.showModal(modal);
      }

      if (customId === 'panel_kick') {
        const modal = new ModalBuilder().setCustomId('modal_kick').setTitle('👢 Kullanıcı At');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick_target').setLabel('Kullanıcı ID').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick_reason').setLabel('Sebep').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Spam...')),
        );
        return interaction.showModal(modal);
      }

      if (customId === 'panel_mute') {
        const modal = new ModalBuilder().setCustomId('modal_mute').setTitle('🔇 Kullanıcı Sustur');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mute_target').setLabel('Kullanıcı ID').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mute_duration').setLabel('Süre (dakika, maks 1440)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('30')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mute_reason').setLabel('Sebep').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Küfür...')),
        );
        return interaction.showModal(modal);
      }

      if (customId === 'panel_warn') {
        const modal = new ModalBuilder().setCustomId('modal_warn').setTitle('⚠️ Kullanıcı Uyar');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_target').setLabel('Kullanıcı ID').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_reason').setLabel('Sebep').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Kural ihlali...')),
        );
        return interaction.showModal(modal);
      }

      if (customId === 'panel_clear') {
        const modal = new ModalBuilder().setCustomId('modal_clear').setTitle('🗑️ Mesaj Temizle');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('clear_amount').setLabel('Silinecek mesaj sayısı (1-100)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('10')),
        );
        return interaction.showModal(modal);
      }

      // --- Verify: Doğrula ---
      if (customId === 'verify_accept') {
        const config = verifyConfig.get(guild.id);
        if (!config) {
          return interaction.reply({ embeds: [errorEmbed('Doğrulama sistemi yapılandırılmamış.')], ephemeral: true });
        }
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ embeds: [errorEmbed('Üye bulunamadı.')], ephemeral: true });

        const role = guild.roles.cache.get(config.roleId);
        if (!role) return interaction.reply({ embeds: [errorEmbed('Doğrulama rolü bulunamadı.')], ephemeral: true });

        if (member.roles.cache.has(role.id)) {
          return interaction.reply({ embeds: [warnEmbed('Zaten doğrulanmışsın.')], ephemeral: true });
        }

        await member.roles.add(role, 'Verify butonu ile doğrulandı');
        return interaction.reply({
          embeds: [successEmbed(`Doğrulandın! **${role.name}** rolü verildi.`, '✅ Hoş Geldin')],
          ephemeral: true,
        });
      }

      // --- Ticket: Oluştur (panel butonu) ---
      if (customId === 'ticket_create') {
        return openTicket(interaction, 'Panel üzerinden açıldı');
      }

      // --- Ticket: Üstlen ---
      if (customId === 'ticket_claim') {
        const ticket = openTickets.get(channel.id);
        if (!ticket) {
          return interaction.reply({ embeds: [errorEmbed('Bu kanal bir ticket değil.')], ephemeral: true });
        }
        if (ticket.claimedBy) {
          return interaction.reply({
            embeds: [warnEmbed(`Bu ticket zaten <@${ticket.claimedBy}> tarafından üstlenildi.`)],
            ephemeral: true,
          });
        }

        ticket.claimedBy = user.id;
        openTickets.set(channel.id, ticket);

        await channel.setTopic(`${channel.topic ?? ''} | ✋ ${user.username} üstlendi`).catch(() => null);

        return interaction.reply({
          embeds: [createEmbed({
            type: 'success',
            title: '✋ Ticket Üstlenildi',
            fields: [
              { name: '👮 Yetkili', value: `${user}`, inline: true },
              { name: '🕐 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            ],
          })],
        });
      }

      // --- Ticket: Kapat ---
      if (customId === 'ticket_close') {
        return closeTicket(interaction);
      }

      return;
    }

    // ─── SELECT MENU HANDLERS ──────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      // --- Reaction Roles ---
      if (interaction.customId === 'rr_select') {
        const guildData = reactionRolesData.get(interaction.guild.id);
        if (!guildData) return interaction.reply({ embeds: [errorEmbed('Rol verisi bulunamadı.')], ephemeral: true });

        const allowedRoles = guildData.get(interaction.message.id);
        if (!allowedRoles) return interaction.reply({ embeds: [errorEmbed('Bu panel artık geçerli değil.')], ephemeral: true });

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) return interaction.reply({ embeds: [errorEmbed('Üye bulunamadı.')], ephemeral: true });

        const selected = new Set(interaction.values);
        const added = [], removed = [];

        for (const roleId of allowedRoles) {
          const has = member.roles.cache.has(roleId);
          const wants = selected.has(roleId);
          if (wants && !has) {
            await member.roles.add(roleId).catch(() => null);
            added.push(`<@&${roleId}>`);
          } else if (!wants && has) {
            await member.roles.remove(roleId).catch(() => null);
            removed.push(`<@&${roleId}>`);
          }
        }

        const lines = [];
        if (added.length) lines.push(`✅ Eklendi: ${added.join(', ')}`);
        if (removed.length) lines.push(`❌ Kaldırıldı: ${removed.join(', ')}`);
        if (!lines.length) lines.push('Değişiklik yapılmadı.');

        return interaction.reply({
          embeds: [createEmbed({ type: 'info', title: '🎭 Roller Güncellendi', description: lines.join('\n') })],
          ephemeral: true,
        });
      }
      return;
    }

    // ─── SLASH COMMAND HANDLER ─────────────────────────────────────────────────
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // --- Spam Check ---
    const spamStatus = checkSpam(interaction.user.id);
    if (spamStatus === 'spam') {
      return interaction.reply({
        embeds: [warnEmbed('Çok hızlı komut kullanıyorsun. Biraz bekle.')],
        ephemeral: true,
      });
    }
    if (spamStatus === 'timeout') {
      return interaction.reply({
        embeds: [warnEmbed('Spam nedeniyle 1 dakika timeout\'a alındın.')],
        ephemeral: true,
      });
    }

    // --- Permission Check ---
    if (command.permissions?.length) {
      const missing = interaction.member.permissions.missing(command.permissions);
      if (missing.length) {
        return interaction.reply({
          embeds: [errorEmbed(`Bu komutu kullanmak için şu izinlere ihtiyacın var: \`${missing.join(', ')}\``)],
          ephemeral: true,
        });
      }
    }

    // --- Cooldown Check ---
    const remaining = checkCooldown(command.data.name, interaction.user.id, command.cooldown);
    if (remaining) {
      return interaction.reply({
        embeds: [warnEmbed(`Bu komutu tekrar kullanmak için **${remaining}** saniye bekle.`)],
        ephemeral: true,
      });
    }

    // --- Execute ---
    try {
      await command.execute(interaction);
      emitLog({ guild: interaction.guild?.id, user: interaction.user.username, action: `/${interaction.commandName}`, type: 'cmd' });
      logger.info(`[CMD] ${interaction.user.username} → /${interaction.commandName} (${interaction.guild?.name ?? 'DM'})`);
    } catch (err) {
      logger.error(`[CMD] Error in /${interaction.commandName}: ${err.message}`);
      const reply = { embeds: [errorEmbed('Komut çalıştırılırken bir hata oluştu.')], ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
