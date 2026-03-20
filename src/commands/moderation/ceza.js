import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, infoEmbed, warnEmbed } from '../../utils/embed.js';

// guildId -> Map<cezaId, { userId, type, reason, mod, createdAt, expiresAt, frozen, points }>
export const cezaDB = new Map();
let cezaCounter = 1;

function getGuildCezalar(gid) {
  if (!cezaDB.has(gid)) cezaDB.set(gid, new Map());
  return cezaDB.get(gid);
}

function nextId() { return `C${String(cezaCounter++).padStart(4, '0')}`; }

function isActive(c) {
  if (c.frozen) return false;
  if (!c.expiresAt) return true;
  return Date.now() < c.expiresAt;
}

export default {
  category: '🔨 Moderasyon',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('ceza')
    .setDescription('Gelişmiş ceza yönetim sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

    // cezaver
    .addSubcommand(s => s.setName('ver')
      .setDescription('Kullanıcıya ceza puanı ver')
      .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
      .addIntegerOption(o => o.setName('puan').setDescription('Ceza puanı').setRequired(true).setMinValue(1).setMaxValue(100))
      .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false))
      .addStringOption(o => o.setName('sure').setDescription('Süre (örn: 7g, 24s, 30d)').setRequired(false))
    )
    // cezaiptal
    .addSubcommand(s => s.setName('iptal')
      .setDescription('Aktif cezayı iptal et')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('İptal sebebi').setRequired(false))
    )
    // cezalar
    .addSubcommand(s => s.setName('listele')
      .setDescription('Tüm cezaları listele')
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı filtresi').setRequired(false))
    )
    // cezam
    .addSubcommand(s => s.setName('benim').setDescription('Kendi ceza geçmişini gör'))
    // cezadetay
    .addSubcommand(s => s.setName('detay')
      .setDescription('Ceza detaylarını göster')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
    )
    // cezaindir
    .addSubcommand(s => s.setName('indir')
      .setDescription('Ceza süresini kısalt')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
      .addStringOption(o => o.setName('sure').setDescription('Kısaltılacak süre (örn: 2g)').setRequired(true))
    )
    // cezadondur
    .addSubcommand(s => s.setName('dondur')
      .setDescription('Cezayı dondur (süre saymayı durdur)')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
    )
    // cezadevam
    .addSubcommand(s => s.setName('devam')
      .setDescription('Dondurulmuş cezayı devam ettir')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
    )
    // cezacek
    .addSubcommand(s => s.setName('cek')
      .setDescription('Ceza puanını azalt')
      .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
      .addIntegerOption(o => o.setName('puan').setDescription('Azaltılacak puan').setRequired(true).setMinValue(1))
    )
    // cezabildir
    .addSubcommand(s => s.setName('bildir')
      .setDescription('Ceza ihlali bildir')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
      .addStringOption(o => o.setName('aciklama').setDescription('İhlal açıklaması').setRequired(true))
    )
    // cezalarama
    .addSubcommand(s => s.setName('ara')
      .setDescription('Cezaları ara')
      .addStringOption(o => o.setName('sorgu').setDescription('Sebep veya kullanıcı adı').setRequired(true))
    )
    // cezarekor
    .addSubcommand(s => s.setName('rekor').setDescription('En çok ceza alan kullanıcılar'))
    // cezatransfer
    .addSubcommand(s => s.setName('transfer')
      .setDescription('Ceza bilgilerini başka kanala gönder')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
      .addChannelOption(o => o.setName('kanal').setDescription('Hedef kanal').setRequired(true))
    )
    // aktifceza
    .addSubcommand(s => s.setName('aktif')
      .setDescription('Aktif cezaları göster')
      .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı filtresi').setRequired(false))
    )
    // temyiz
    .addSubcommand(s => s.setName('temyiz')
      .setDescription('Ceza temyiz başvurusu yap')
      .addStringOption(o => o.setName('id').setDescription('Ceza ID').setRequired(true))
      .addStringOption(o => o.setName('gerekce').setDescription('Temyiz gerekçesi').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    const db = getGuildCezalar(gid);

    // ── VER ──────────────────────────────────────────────────────────────────
    if (sub === 'ver') {
      const target = interaction.options.getUser('kullanici');
      const points = interaction.options.getInteger('puan');
      const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
      const sureStr = interaction.options.getString('sure');

      let expiresAt = null;
      if (sureStr) {
        const match = sureStr.match(/^(\d+)([gsmd])$/i);
        if (match) {
          const n = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const ms = { g: 86400000, s: 3600000, m: 60000, d: 86400000 }[unit];
          expiresAt = Date.now() + n * ms;
        }
      }

      const id = nextId();
      db.set(id, {
        id, userId: target.id, type: 'puan', reason,
        mod: interaction.user.id, createdAt: Date.now(),
        expiresAt, frozen: false, points,
      });

      return interaction.reply({
        embeds: [successEmbed(
          `**${target.username}**'e **${points}** ceza puanı verildi.\n🆔 ID: \`${id}\`\n📝 Sebep: ${reason}${expiresAt ? `\n⏰ Bitiş: <t:${Math.floor(expiresAt / 1000)}:R>` : ''}`,
          '⚠️ Ceza Verildi'
        )],
      });
    }

    // ── İPTAL ────────────────────────────────────────────────────────────────
    if (sub === 'iptal') {
      const id = interaction.options.getString('id').toUpperCase();
      const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
      if (!db.has(id)) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });
      const c = db.get(id);
      db.delete(id);
      return interaction.reply({ embeds: [successEmbed(`Ceza \`${id}\` iptal edildi.\n📝 Sebep: ${reason}\n👤 Kullanıcı: <@${c.userId}>`, '✅ Ceza İptal')] });
    }

    // ── LİSTELE ──────────────────────────────────────────────────────────────
    if (sub === 'listele') {
      const filterUser = interaction.options.getUser('kullanici');
      let entries = [...db.values()];
      if (filterUser) entries = entries.filter(c => c.userId === filterUser.id);
      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Ceza bulunamadı.', '📋 Cezalar')] });

      const list = entries.slice(0, 15).map(c =>
        `\`${c.id}\` <@${c.userId}> — ${c.points}p — ${c.reason.slice(0, 40)} ${isActive(c) ? '🟢' : '🔴'}`
      ).join('\n');

      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: `📋 Cezalar (${entries.length})`, description: list })] });
    }

    // ── BENİM ────────────────────────────────────────────────────────────────
    if (sub === 'benim') {
      const entries = [...db.values()].filter(c => c.userId === interaction.user.id);
      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Ceza geçmişin temiz! 🎉', '📋 Ceza Geçmişim')], ephemeral: true });
      const list = entries.map(c => `\`${c.id}\` — ${c.points}p — ${c.reason.slice(0, 50)} ${isActive(c) ? '🟢' : '🔴'}`).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '📋 Ceza Geçmişim', description: list })], ephemeral: true });
    }

    // ── DETAY ────────────────────────────────────────────────────────────────
    if (sub === 'detay') {
      const id = interaction.options.getString('id').toUpperCase();
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });

      return interaction.reply({
        embeds: [createEmbed({
          type: isActive(c) ? 'warning' : 'neutral',
          title: `📋 Ceza Detayı — ${id}`,
          fields: [
            { name: '👤 Kullanıcı', value: `<@${c.userId}>`, inline: true },
            { name: '👮 Yetkili', value: `<@${c.mod}>`, inline: true },
            { name: '⚠️ Puan', value: `${c.points}`, inline: true },
            { name: '📝 Sebep', value: c.reason, inline: false },
            { name: '📅 Tarih', value: `<t:${Math.floor(c.createdAt / 1000)}:F>`, inline: true },
            { name: '⏰ Bitiş', value: c.expiresAt ? `<t:${Math.floor(c.expiresAt / 1000)}:R>` : 'Süresiz', inline: true },
            { name: '🔒 Durum', value: c.frozen ? '❄️ Dondurulmuş' : isActive(c) ? '🟢 Aktif' : '🔴 Sona Erdi', inline: true },
          ],
        })],
      });
    }

    // ── İNDİR ────────────────────────────────────────────────────────────────
    if (sub === 'indir') {
      const id = interaction.options.getString('id').toUpperCase();
      const sureStr = interaction.options.getString('sure');
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });
      if (!c.expiresAt) return interaction.reply({ embeds: [warnEmbed('Bu cezanın süresi yok.')], ephemeral: true });

      const match = sureStr.match(/^(\d+)([gsmd])$/i);
      if (!match) return interaction.reply({ embeds: [errorEmbed('Geçersiz süre formatı. Örn: `2g`, `12s`')], ephemeral: true });
      const n = parseInt(match[1]);
      const ms = { g: 86400000, s: 3600000, m: 60000, d: 86400000 }[match[2].toLowerCase()];
      c.expiresAt = Math.max(Date.now(), c.expiresAt - n * ms);

      return interaction.reply({ embeds: [successEmbed(`\`${id}\` cezasının süresi kısaltıldı.\nYeni bitiş: <t:${Math.floor(c.expiresAt / 1000)}:R>`, '✅ Süre Kısaltıldı')] });
    }

    // ── DONDUR ───────────────────────────────────────────────────────────────
    if (sub === 'dondur') {
      const id = interaction.options.getString('id').toUpperCase();
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });
      if (c.frozen) return interaction.reply({ embeds: [warnEmbed('Bu ceza zaten dondurulmuş.')], ephemeral: true });
      c.frozen = true;
      return interaction.reply({ embeds: [successEmbed(`\`${id}\` cezası donduruldu. ❄️`, '❄️ Ceza Donduruldu')] });
    }

    // ── DEVAM ────────────────────────────────────────────────────────────────
    if (sub === 'devam') {
      const id = interaction.options.getString('id').toUpperCase();
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });
      if (!c.frozen) return interaction.reply({ embeds: [warnEmbed('Bu ceza dondurulmuş değil.')], ephemeral: true });
      c.frozen = false;
      return interaction.reply({ embeds: [successEmbed(`\`${id}\` cezası devam ettiriliyor. ▶️`, '▶️ Ceza Devam')] });
    }

    // ── ÇEK ──────────────────────────────────────────────────────────────────
    if (sub === 'cek') {
      const target = interaction.options.getUser('kullanici');
      const puan = interaction.options.getInteger('puan');
      const userCezalar = [...db.values()].filter(c => c.userId === target.id && isActive(c));
      if (!userCezalar.length) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcının aktif cezası yok.')], ephemeral: true });

      let remaining = puan;
      for (const c of userCezalar.sort((a, b) => a.createdAt - b.createdAt)) {
        if (remaining <= 0) break;
        const reduce = Math.min(c.points, remaining);
        c.points -= reduce;
        remaining -= reduce;
        if (c.points <= 0) db.delete(c.id);
      }

      return interaction.reply({ embeds: [successEmbed(`**${target.username}**'den **${puan}** ceza puanı düşüldü.`, '✅ Puan Düşüldü')] });
    }

    // ── BİLDİR ───────────────────────────────────────────────────────────────
    if (sub === 'bildir') {
      const id = interaction.options.getString('id').toUpperCase();
      const aciklama = interaction.options.getString('aciklama');
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });

      return interaction.reply({
        embeds: [createEmbed({
          type: 'warning',
          title: '🚨 Ceza İhlali Bildirimi',
          fields: [
            { name: '🆔 Ceza ID', value: id, inline: true },
            { name: '👤 Kullanıcı', value: `<@${c.userId}>`, inline: true },
            { name: '📢 Bildiren', value: `${interaction.user}`, inline: true },
            { name: '📝 İhlal', value: aciklama, inline: false },
          ],
        })],
      });
    }

    // ── ARA ──────────────────────────────────────────────────────────────────
    if (sub === 'ara') {
      const sorgu = interaction.options.getString('sorgu').toLowerCase();
      const results = [...db.values()].filter(c =>
        c.reason.toLowerCase().includes(sorgu) || c.id.toLowerCase().includes(sorgu)
      ).slice(0, 10);

      if (!results.length) return interaction.reply({ embeds: [infoEmbed('Sonuç bulunamadı.', '🔍 Arama')] });
      const list = results.map(c => `\`${c.id}\` <@${c.userId}> — ${c.reason.slice(0, 50)}`).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: `🔍 Arama Sonuçları (${results.length})`, description: list })] });
    }

    // ── REKOR ────────────────────────────────────────────────────────────────
    if (sub === 'rekor') {
      const counts = new Map();
      for (const c of db.values()) {
        counts.set(c.userId, (counts.get(c.userId) ?? 0) + c.points);
      }
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (!sorted.length) return interaction.reply({ embeds: [infoEmbed('Henüz ceza verisi yok.', '🏆 Ceza Rekoru')] });
      const list = sorted.map(([uid, pts], i) => `**${i + 1}.** <@${uid}> — **${pts}** puan`).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'warning', title: '🏆 En Çok Ceza Alanlar', description: list })] });
    }

    // ── TRANSFER ─────────────────────────────────────────────────────────────
    if (sub === 'transfer') {
      const id = interaction.options.getString('id').toUpperCase();
      const ch = interaction.options.getChannel('kanal');
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });

      await ch.send({
        embeds: [createEmbed({
          type: 'warning',
          title: `📋 Ceza Transferi — ${id}`,
          fields: [
            { name: '👤 Kullanıcı', value: `<@${c.userId}>`, inline: true },
            { name: '⚠️ Puan', value: `${c.points}`, inline: true },
            { name: '📝 Sebep', value: c.reason, inline: false },
            { name: '👮 Yetkili', value: `<@${c.mod}>`, inline: true },
            { name: '📅 Tarih', value: `<t:${Math.floor(c.createdAt / 1000)}:D>`, inline: true },
          ],
        })],
      });

      return interaction.reply({ embeds: [successEmbed(`Ceza \`${id}\` ${ch}'a gönderildi.`)], ephemeral: true });
    }

    // ── AKTİF ────────────────────────────────────────────────────────────────
    if (sub === 'aktif') {
      const filterUser = interaction.options.getUser('kullanici');
      let entries = [...db.values()].filter(isActive);
      if (filterUser) entries = entries.filter(c => c.userId === filterUser.id);
      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Aktif ceza yok. 🎉', '✅ Aktif Cezalar')] });
      const list = entries.slice(0, 15).map(c =>
        `\`${c.id}\` <@${c.userId}> — ${c.points}p — ${c.reason.slice(0, 40)}`
      ).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'warning', title: `⚠️ Aktif Cezalar (${entries.length})`, description: list })] });
    }

    // ── TEMYİZ ───────────────────────────────────────────────────────────────
    if (sub === 'temyiz') {
      const id = interaction.options.getString('id').toUpperCase();
      const gerekce = interaction.options.getString('gerekce');
      const c = db.get(id);
      if (!c) return interaction.reply({ embeds: [errorEmbed(`\`${id}\` bulunamadı.`)], ephemeral: true });
      if (c.userId !== interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Sadece kendi cezana temyiz başvurabilirsin.')], ephemeral: true });

      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '⚖️ Temyiz Başvurusu',
          fields: [
            { name: '🆔 Ceza ID', value: id, inline: true },
            { name: '👤 Başvuran', value: `${interaction.user}`, inline: true },
            { name: '📝 Gerekçe', value: gerekce, inline: false },
          ],
          footer: 'Yetkililer inceleyecek',
        })],
      });
    }
  },
};
