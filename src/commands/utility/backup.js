import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, warnEmbed } from '../../utils/embed.js';

// guildId -> [{ id, createdAt, channels, roles, name }]
export const backupStore = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 60,
  permissions: [PermissionFlagsBits.Administrator],
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Sunucu yedeği yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('al').setDescription('Sunucu yedeği al'))
    .addSubcommand(s =>
      s.setName('yukle')
        .setDescription('Yedeği geri yükle (DİKKAT: Kanallar/roller silinip yeniden oluşturulur!)')
        .addStringOption(o => o.setName('id').setDescription('Yedek ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Mevcut yedekleri listele'))
    .addSubcommand(s =>
      s.setName('sil')
        .setDescription('Yedeği sil')
        .addStringOption(o => o.setName('id').setDescription('Yedek ID').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const gid = guild.id;

    if (sub === 'al') {
      await interaction.deferReply({ ephemeral: true });

      const channels = guild.channels.cache
        .filter(c => c.type !== ChannelType.GuildCategory)
        .map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          parentId: c.parentId,
          position: c.position,
          topic: c.topic ?? null,
          nsfw: c.nsfw ?? false,
          rateLimitPerUser: c.rateLimitPerUser ?? 0,
        }));

      const categories = guild.channels.cache
        .filter(c => c.type === ChannelType.GuildCategory)
        .map(c => ({ id: c.id, name: c.name, position: c.position }));

      const roles = guild.roles.cache
        .filter(r => !r.managed && r.id !== guild.id)
        .map(r => ({
          id: r.id,
          name: r.name,
          color: r.color,
          hoist: r.hoist,
          mentionable: r.mentionable,
          permissions: r.permissions.bitfield.toString(),
          position: r.position,
        }));

      const backupId = Date.now().toString(36).toUpperCase();
      if (!backupStore.has(gid)) backupStore.set(gid, []);
      const store = backupStore.get(gid);

      // Max 5 yedek tut
      if (store.length >= 5) store.shift();

      store.push({
        id: backupId,
        createdAt: Date.now(),
        name: guild.name,
        channels,
        categories,
        roles,
      });

      return interaction.editReply({
        embeds: [successEmbed(
          `Yedek alındı!\n🆔 ID: \`${backupId}\`\n📁 ${categories.length} kategori, ${channels.length} kanal, ${roles.length} rol`,
          '💾 Yedek Alındı'
        )],
      });
    }

    if (sub === 'liste') {
      const store = backupStore.get(gid);
      if (!store?.length) return interaction.reply({ embeds: [errorEmbed('Yedek bulunamadı.')], ephemeral: true });

      const list = store.map(b =>
        `\`${b.id}\` — <t:${Math.floor(b.createdAt / 1000)}:R> — ${b.channels.length} kanal, ${b.roles.length} rol`
      ).join('\n');

      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '💾 Yedekler', description: list })], ephemeral: true });
    }

    if (sub === 'sil') {
      const id = interaction.options.getString('id');
      const store = backupStore.get(gid);
      const idx = store?.findIndex(b => b.id === id);
      if (!store || idx === -1 || idx === undefined) return interaction.reply({ embeds: [errorEmbed('Yedek bulunamadı.')], ephemeral: true });
      store.splice(idx, 1);
      return interaction.reply({ embeds: [successEmbed(`Yedek \`${id}\` silindi.`)], ephemeral: true });
    }

    if (sub === 'yukle') {
      const id = interaction.options.getString('id');
      const store = backupStore.get(gid);
      const backup = store?.find(b => b.id === id);
      if (!backup) return interaction.reply({ embeds: [errorEmbed('Yedek bulunamadı.')], ephemeral: true });

      await interaction.reply({
        embeds: [warnEmbed(
          `⚠️ Bu işlem geri alınamaz!\n\`${backup.channels.length}\` kanal ve \`${backup.roles.length}\` rol yeniden oluşturulacak.\n\n**10 saniye içinde otomatik başlar...**`,
          '⚠️ Yedek Yükleniyor'
        )],
      });

      await new Promise(r => setTimeout(r, 10000));
      await interaction.followUp({ embeds: [createEmbed({ type: 'warning', title: '🔄 Yedek yükleniyor...', description: 'Lütfen bekleyin.' })], ephemeral: true });

      // Rolleri yeniden oluştur (yönetilen ve @everyone hariç)
      const roleMap = new Map(); // oldId -> newRole
      const sortedRoles = [...backup.roles].sort((a, b) => a.position - b.position);
      for (const r of sortedRoles) {
        try {
          const newRole = await guild.roles.create({
            name: r.name,
            color: r.color,
            hoist: r.hoist,
            mentionable: r.mentionable,
            permissions: BigInt(r.permissions),
            reason: `Yedek yükleme: ${id}`,
          });
          roleMap.set(r.id, newRole.id);
        } catch { /* skip */ }
      }

      // Kategorileri oluştur
      const catMap = new Map();
      for (const cat of backup.categories) {
        try {
          const newCat = await guild.channels.create({
            name: cat.name,
            type: ChannelType.GuildCategory,
            reason: `Yedek yükleme: ${id}`,
          });
          catMap.set(cat.id, newCat.id);
        } catch { /* skip */ }
      }

      // Kanalları oluştur
      for (const ch of backup.channels) {
        try {
          await guild.channels.create({
            name: ch.name,
            type: ch.type,
            parent: ch.parentId ? catMap.get(ch.parentId) : undefined,
            topic: ch.topic ?? undefined,
            nsfw: ch.nsfw,
            rateLimitPerUser: ch.rateLimitPerUser,
            reason: `Yedek yükleme: ${id}`,
          });
        } catch { /* skip */ }
      }

      await interaction.followUp({
        embeds: [successEmbed(`Yedek \`${id}\` başarıyla yüklendi!`, '✅ Yedek Yüklendi')],
        ephemeral: true,
      });
    }
  },
};
