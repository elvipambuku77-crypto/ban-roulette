const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================
   🔐 ALLOWED USERS
   ========================= */
const ALLOWED_USERS = [
  "1289624661079883791",
  "1387888341109833906",
  "1171474569299755158",
  "1388979737174478940",
  "1348065997231489066"
];

/* =========================
   👔 STAFF ROLE DETECTION
   ========================= */
const STAFF_KEYWORDS = [
  "help",
  "mod",
  "admin",
  "manager",
  "head",
  "co",
  "owner",
  "founder"
];

/* =========================
   😂 FUNNY VERDICTS
   ========================= */
const FUNNY_MESSAGES = [
  "💀 RNG said it’s over",
  "😭 Logged in just to lose it all",
  "🎯 Perfect unlucky timing",
  "📉 Career ended instantly",
  "🚪 Kindly escorted out",
  "🧳 Promotion to ex-member",
  "💣 Massive L detected"
];

const FAKE_MESSAGES = [
  "😳 Heart attack avoided",
  "🧠 Almost banned but luck clutched",
  "😮‍💨 That was TOO close",
  "🎭 Plot twist: FAKE SPIN",
  "🛡 Protected by plot armor",
  "😂 Chat was ready to mourn"
];

/* =========================
   🎰 COMMANDS
   ========================= */
const commands = [
  new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎰 REAL ban roulette (dangerous)"),

  new SlashCommandBuilder()
    .setName("fakeroulette")
    .setDescription("🎭 FAKE roulette (no ban)")
];

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands.map(c => c.toJSON()) }
  );

  console.log("✅ Commands registered");
});

/* =========================
   🎯 INTERACTION HANDLER
   ========================= */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* 🔐 ACCESS CHECK */
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "⛔ You are NOT allowed to use this command.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  await guild.members.fetch();

  const staffRoles = guild.roles.cache.filter(role =>
    STAFF_KEYWORDS.some(k =>
      role.name.toLowerCase().includes(k)
    )
  );

  if (!staffRoles.size) {
    return interaction.editReply("❌ No staff roles detected.");
  }

  const staffMembers = guild.members.cache.filter(member =>
    member.roles.cache.some(r => staffRoles.has(r.id)) &&
    !member.user.bot
  );

  if (!staffMembers.size) {
    return interaction.editReply("❌ No staff members found.");
  }

  const victim = staffMembers.random();

  /* =========================
     🎭 FAKE ROULETTE
     ========================= */
  if (interaction.commandName === "fakeroulette") {
    const fakeVerdict =
      FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];

    const fakeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: "FAKE BAN ROULETTE",
        iconURL: guild.iconURL()
      })
      .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
      .setDescription("🎭 **The wheel is spinning...**")
      .addFields(
        { name: "👤 Selected", value: `${victim.user}`, inline: true },
        { name: "🛡 Role", value: victim.roles.highest.name, inline: true },
        { name: "⚠ Result", value: "NO BAN (FAKE MODE)", inline: true },
        { name: "😂 Verdict", value: fakeVerdict }
      )
      .setFooter({
        text: `Fake spin by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [fakeEmbed] });
  }

  /* =========================
     🔨 REAL ROULETTE
     ========================= */
  if (!victim.bannable) {
    return interaction.editReply("❌ Selected member cannot be banned.");
  }

  const verdict =
    FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];

  await victim.ban({ reason: "🎰 Ban Roulette" });

  const realEmbed = new EmbedBuilder()
    .setColor(0xFF3131)
    .setAuthor({
      name: "BAN ROULETTE",
      iconURL: guild.iconURL()
    })
    .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
    .setDescription("🎰 **The wheel has decided...**")
    .addFields(
      { name: "👤 Victim", value: `${victim.user}`, inline: true },
      { name: "🛡 Highest Role", value: victim.roles.highest.name, inline: true },
      { name: "🔨 Punishment", value: "PERMANENT BAN", inline: true },
      { name: "💀 Verdict", value: verdict }
    )
    .setFooter({
      text: `Spun by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [realEmbed] });
});

client.login(process.env.TOKEN);
