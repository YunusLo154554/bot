import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Komut başına detaylı açıklama + kullanım kılavuzu
const CMD_DETAIL = {
  // ── Moderasyon ──────────────────────────────────────────────────────────────
  ban:           { usage: '/ban kullanici:@kişi [sebep] [mesaj_sil:0-7]',    perm: 'Ban Members',       example: '/ban kullanici:@Ali sebep:Kural ihlali mesaj_sil:1' },
  kick:          { usage: '/kick kullanici:@kişi [sebep]',                   perm: 'Kick Members',      example: '/kick kullanici:@Ali sebep:Spam' },
  mute:          { usage: '/mute kullanici:@kişi dakika:N [sebep]',          perm: 'Moderate Members',  example: '/mute kullanici:@Ali dakika:30' },
  unmute:        { usage: '/unmute kullanici:@kişi',                         perm: 'Moderate Members',  example: '/unmute kullanici:@Ali' },

  warn:          { usage: '/warn kullanici:@kişi sebep:metin',               perm: 'Moderate Members',  example: '/warn kullanici:@Ali sebep:Reklam' },
  warnings:      { usage: '/warnings kullanici:@kişi',                       perm: 'Herkes',            example: '/warnings kullanici:@Ali' },
  clearwarnings: { usage: '/clearwarnings kullanici:@kişi',                  perm: 'Moderate Members',  example: '/clearwarnings kullanici:@Ali' },
  unban:         { usage: '/unban kullanici_id:ID [sebep]',                  perm: 'Ban Members',       example: '/unban kullanici_id:123456789' },
  clear:         { usage: '/clear adet:N [kullanici:@kişi]',                 perm: 'Manage Messages',   example: '/clear adet:50' },
  lock:          { usage: '/lock [sebep]',                                   perm: 'Manage Channels',   example: '/lock sebep:Tartışma' },
  unlock:        { usage: '/unlock',                                         perm: 'Manage Channels',   example: '/unlock' },
  lockdown:      { usage: '/lockdown aç|kapat [sebep]',                      perm: 'Manage Guild',      example: '/lockdown aç sebep:Raid' },
  slowmode:      { usage: '/slowmode saniye:N',                              perm: 'Manage Channels',   example: '/slowmode saniye:5' },
  nick:          { usage: '/nick kullanici:@kişi [ad]',                      perm: 'Manage Nicknames',  example: '/nick kullanici:@Ali ad:YeniAd' },
  nuke:          { usage: '/nuke',                                           perm: 'Manage Channels',   example: '/nuke' },
  softban:       { usage: '/softban kullanici:@kişi [sebep]',                perm: 'Ban Members',       example: '/softban kullanici:@Ali' },
  massban:       { usage: '/massban kullanicilar:ID1,ID2 [sebep]',           perm: 'Ban Members',       example: '/massban kullanicilar:111,222' },
  jail:          { usage: '/jail kullanici:@kişi [sebep]',                   perm: 'Moderate Members',  example: '/jail kullanici:@Ali' },
  unjail:        { usage: '/unjail kullanici:@kişi',                         perm: 'Moderate Members',  example: '/unjail kullanici:@Ali' },
  chatmute:      { usage: '/chatmute kullanici:@kişi [sebep]',               perm: 'Manage Messages',   example: '/chatmute kullanici:@Ali' },
  unchatmute:    { usage: '/unchatmute kullanici:@kişi',                     perm: 'Manage Messages',   example: '/unchatmute kullanici:@Ali' },
  karantina:     { usage: '/karantina kullanici:@kişi [sebep]',              perm: 'Moderate Members',  example: '/karantina kullanici:@Ali' },
  report:        { usage: '/report gonder kullanici:@kişi sebep:metin',      perm: 'Herkes',            example: '/report gonder kullanici:@Ali sebep:Hakaret' },
  antilink:      { usage: '/antilink aç|kapat|whitelist',                    perm: 'Manage Guild',      example: '/antilink aç' },
  anticaps:      { usage: '/anticaps aç|kapat|ayarla',                       perm: 'Manage Guild',      example: '/anticaps aç' },
  antiraid:      { usage: '/antiraid aç|kapat|ayarla',                       perm: 'Manage Guild',      example: '/antiraid aç' },
  automod:       { usage: '/automod ayarla|durum',                           perm: 'Manage Guild',      example: '/automod ayarla' },
  blacklist:     { usage: '/blacklist ekle|sil|liste kelime:metin',          perm: 'Manage Guild',      example: '/blacklist ekle kelime:küfür' },
  whitelist:     { usage: '/whitelist ekle|sil|liste',                       perm: 'Manage Guild',      example: '/whitelist ekle' },
  audit:         { usage: '/audit [kullanici:@kişi]',                        perm: 'View Audit Log',    example: '/audit kullanici:@Ali' },
  ceza:          { usage: '/ceza ver|iptal|liste|detay ...',                 perm: 'Moderate Members',  example: '/ceza ver kullanici:@Ali puan:10' },
  af:            { usage: '/af kullanici:@kişi [sebep]',                     perm: 'Moderate Members',  example: '/af kullanici:@Ali' },
  setrole:       { usage: '/setrole admin|mod|mute rol:@rol',                perm: 'Manage Guild',      example: '/setrole mod rol:@Moderatör' },
  // ── Utility ─────────────────────────────────────────────────────────────────
  ticket:        { usage: '/ticket kur|panel|aç|kapat|ekle',                 perm: 'Manage Guild (kur/panel)', example: '/ticket aç konu:Yardım lazım' },
  verify:        { usage: '/verify kur|panel|durum',                         perm: 'Manage Roles (kur)',       example: '/verify kur rol:@Üye' },
  welcome:       { usage: '/welcome kur|kapat|test|durum',                   perm: 'Manage Guild',      example: '/welcome kur kanal:#hoşgeldin' },
  goodbye:       { usage: '/goodbye kur|kapat|test|durum',                   perm: 'Manage Guild',      example: '/goodbye kur kanal:#gülegüle' },
  level:         { usage: '/level aç|kapat|bak|top|rolodulu',                perm: 'Manage Guild (aç/kapat)', example: '/level bak kullanici:@Ali' },
  economy:       { usage: '/economy bakiye|gunluk|calis|transfer|top',       perm: 'Herkes',            example: '/economy gunluk' },
  reactionroles: { usage: '/reactionroles panel|liste',                      perm: 'Manage Roles',      example: '/reactionroles panel baslik:Roller roller:ID1,ID2' },
  giveaway:      { usage: '/giveaway başlat|bitir|iptal',                    perm: 'Manage Guild',      example: '/giveaway başlat süre:60 ödül:Nitro' },
  poll:          { usage: '/poll soru:metin seçenekler:A,B,C',               perm: 'Herkes',            example: '/poll soru:Renk? seçenekler:Kırmızı,Mavi' },
  announce:      { usage: '/announce başlık:metin içerik:metin [kanal]',     perm: 'Manage Messages',   example: '/announce başlık:Duyuru içerik:Merhaba' },
  backup:        { usage: '/backup al|geri-yukle|liste',                     perm: 'Administrator',     example: '/backup al' },
  autorole:      { usage: '/autorole ayarla|kapat|durum',                    perm: 'Manage Roles',      example: '/autorole ayarla rol:@Üye' },
  customcommands:{ usage: '/customcommands ekle|sil|liste',                  perm: 'Manage Guild',      example: '/customcommands ekle tetikleyici:!merhaba yanit:Merhaba!' },
  membercount:   { usage: '/membercount kur|guncelle|sil',                   perm: 'Manage Channels',   example: '/membercount kur' },
  remind:        { usage: '/remind mesaj:metin dakika:N',                    perm: 'Herkes',            example: '/remind mesaj:Toplantı dakika:30' },
  translate:     { usage: '/translate metin:metin dil:kod',                  perm: 'Herkes',            example: '/translate metin:Hello dil:tr' },
  weather:       { usage: '/weather sehir:metin',                            perm: 'Herkes',            example: '/weather sehir:İstanbul' },
  qr:            { usage: '/qr metin:metin',                                 perm: 'Herkes',            example: '/qr metin:https://discord.gg/...' },
  embed:         { usage: '/embed başlık:metin içerik:metin [renk] [kanal]', perm: 'Manage Messages',   example: '/embed başlık:Duyuru içerik:Merhaba renk:success' },
  say:           { usage: '/say mesaj:metin [kanal]',                        perm: 'Manage Messages',   example: '/say mesaj:Merhaba herkes!' },
  webhook:       { usage: '/webhook olustur|liste|sil|gonder',               perm: 'Manage Webhooks',   example: '/webhook olustur isim:Logger' },
  status:        { usage: '/status durum:online|idle|dnd [aktivite] [metin]',perm: 'Administrator',     example: '/status durum:online aktivite:playing metin:Sunucu' },
};

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Komut yardımını gösterir')
    .addStringOption(opt =>
      opt.setName('komut').setDescription('Belirli bir komutun detayını gör').setRequired(false)
    ),

  async execute(interaction) {
    const commands = interaction.client.commands;
    const cmdName = interaction.options.getString('komut')?.toLowerCase().replace(/^\//, '');

    // ── Belirli komut detayı ──────────────────────────────────────────────────
    if (cmdName) {
      const cmd = commands.get(cmdName);
      if (!cmd) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('❌ Komut Bulunamadı')
            .setDescription(`\`/${cmdName}\` adında bir komut yok.\n\`/help\` ile tüm komutları listele.`)],
          ephemeral: true,
        });
      }

      const detail = CMD_DETAIL[cmdName];
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📖 /${cmd.data.name}`)
        .setDescription(cmd.data.description)
        .addFields(
          { name: '📂 Kategori', value: cmd.category ?? '⚙️ Yönetim', inline: true },
          { name: '⏱️ Cooldown', value: `${cmd.cooldown ?? 3} saniye`, inline: true },
          { name: '🔐 İzin', value: detail?.perm ?? 'Belirtilmedi', inline: true },
        );

      if (detail?.usage) {
        embed.addFields({ name: '📋 Kullanım', value: `\`\`\`${detail.usage}\`\`\``, inline: false });
      }
      if (detail?.example) {
        embed.addFields({ name: '💡 Örnek', value: `\`\`\`${detail.example}\`\`\``, inline: false });
      }

      embed.setFooter({ text: '/yardim ile interaktif paneli aç' }).setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── Tüm komutlar listesi ──────────────────────────────────────────────────
    const grouped = {};
    for (const [, cmd] of commands) {
      const cat = cmd.category ?? '⚙️ Yönetim';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(cmd);
    }

    const fields = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, cmds]) => ({
        name: `${cat} (${cmds.length})`,
        value: cmds
          .sort((a, b) => a.data.name.localeCompare(b.data.name))
          .map(c => `\`/${c.data.name}\``)
          .join(' '),
        inline: false,
      }));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: `${interaction.client.user.username} — Komut Listesi`, iconURL: interaction.client.user.displayAvatarURL() })
      .setDescription(
        `Toplam **${commands.size}** komut mevcut.\n` +
        `Detay için: \`/help komut:komutadı\`\n` +
        `İnteraktif panel için: \`/yardim\``
      )
      .addFields(fields)
      .setFooter({ text: '/help komut:ban → ban komutunun detayını gösterir' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
