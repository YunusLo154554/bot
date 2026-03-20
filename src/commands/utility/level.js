import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { enabled, xpPerMessage: [min,max], cooldown(ms), roleRewards: Map<level, roleId> }
export const levelConfig = new Map();
// userId_guildId -> { xp, level, lastMsg }
export const levelData = new Map();

export function addXP(userId, guildId, client) {
  const cfg = levelConfig.get(guildId);
  if (!cfg?.enabled) return null;

  const key = `${userId}_${guildId}`;
  const now = Date.now();
  const entry = levelData.get(key) ?? { xp: 0, level: 0, lastMsg: 0 };

  if (now - entry.lastMsg < (cfg.cooldown ?? 15000)) return null;

  const [min, max] = cfg.xpPerMessage ?? [10, 25];
  entry.xp += Math.floor(Math.random() * (max - min + 1)) + min;
  entry.lastMsg = now;

  const xpNeeded = entry.level * 100 + 100;
  let leveledUp = false;

  if (entry.xp >= xpNeeded) {
    entry.xp -= xpNeeded;
    entry.level++;
    leveledUp = true;

    // Rol ödülü
    const reward = cfg.roleRewards?.get(entry.level);
    if (reward) {
      const guild = client.guilds.cache.get(guildId);
      guild?.members.fetch(userId).then(m => m.roles.add(reward)).catch(() => null);
    }
  }

  levelData.set(key, entry);
  return leveledUp ? entry.level : null;
}

export default {
  category: '⭐ Seviye',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Seviye sistemini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('aç')
        .setDescription('Seviye sistemini etkinleştir')
        .addIntegerOption(o => o.setName('minxp').setDescription('Mesaj başına min XP (varsayılan: 10)').setMinValue(1).setRequired(false))
        .addIntegerOption(o => o.setName('maxxp').setDescription('Mesaj başına max XP (varsayılan: 25)').setMinValue(1).setRequired(false))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Seviye sistemini devre dışı bırak'))
    .addSubcommand(s =>
      s.setName('bak')
        .setDescription('Seviyeni veya başka birinin seviyesini gör')
        .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = sen)').setRequired(false))
    )
    .addSubcommand(s => s.setName('top').setDescription('Seviye liderlik tablosu'))
    .addSubcommand(s =>
      s.setName('rolodulu')
        .setDescription('Seviye rol ödülü ekle')
        .addIntegerOption(o => o.setName('seviye').setDescription('Seviye').setRequired(true).setMinValue(1))
        .addRoleOption(o => o.setName('rol').setDescription('Verilecek rol').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'aç') {
      const min = interaction.options.getInteger('minxp') ?? 10;
      const max = interaction.options.getInteger('maxxp') ?? 25;
      const existing = levelConfig.get(gid) ?? {};
      levelConfig.set(gid, { ...existing, enabled: true, xpPerMessage: [min, max], cooldown: 15000, roleRewards: existing.roleRewards ?? new Map() });
      return interaction.reply({ embeds: [successEmbed(`Seviye sistemi etkinleştirildi!\n📊 XP/mesaj: **${min}–${max}**`, '⭐ Level Açık')] });
    }

    if (sub === 'kapat') {
      const cfg = levelConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Seviye sistemi devre dışı bırakıldı.')] });
    }

    if (sub === 'bak') {
      const target = interaction.options.getUser('kullanici') ?? interaction.user;
      const key = `${target.id}_${gid}`;
      const data = levelData.get(key) ?? { xp: 0, level: 0 };
      const xpNeeded = data.level * 100 + 100;
      const bar = '█'.repeat(Math.floor((data.xp / xpNeeded) * 10)) + '░'.repeat(10 - Math.floor((data.xp / xpNeeded) * 10));

      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: `⭐ ${target.username} — Seviye Bilgisi`,
          thumbnail: target.displayAvatarURL(),
          fields: [
            { name: '🏆 Seviye', value: `${data.level}`, inline: true },
            { name: '✨ XP', value: `${data.xp} / ${xpNeeded}`, inline: true },
            { name: '📊 İlerleme', value: `\`[${bar}]\``, inline: false },
          ],
        })],
      });
    }

    if (sub === 'top') {
      const entries = [...levelData.entries()]
        .filter(([k]) => k.endsWith(`_${gid}`))
        .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
        .slice(0, 10);

      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Henüz veri yok.', '🏆 Liderlik Tablosu')] });

      const medals = ['🥇', '🥈', '🥉'];
      const list = entries.map(([key, d], i) => {
        const uid = key.split('_')[0];
        return `${medals[i] ?? `**${i + 1}.**`} <@${uid}> — Seviye **${d.level}** (${d.xp} XP)`;
      }).join('\n');

      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '🏆 Seviye Liderlik Tablosu', description: list })] });
    }

    if (sub === 'rolodulu') {
      const lvl = interaction.options.getInteger('seviye');
      const role = interaction.options.getRole('rol');
      const cfg = levelConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Önce `/level aç` ile sistemi etkinleştir.')], ephemeral: true });
      cfg.roleRewards.set(lvl, role.id);
      return interaction.reply({ embeds: [successEmbed(`Seviye **${lvl}** için ${role} rolü ödülü ayarlandı.`)] });
    }
  },
};
