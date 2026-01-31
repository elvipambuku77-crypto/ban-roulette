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
  "1388979737174478940"
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
  "💀 Wheel decided your fate",
  "😭 Shouldn’t have logged in today",
  "🧳 Bro got promoted to exile",
  "🚪 Escorting you out respectfully",
  "🫡 Thank you for your service… goodbye",
  "🎯 RNG said YOU",
  "📉 Career ended instantly",
  "💣 Critical hit. Server wins."
];

/* =========================
   🎰 SLASH COMMAND
   ========================= */
const command = new SlashCommandBuilder()
  .setName("roulette")
  .setDescription("🎰 Spin the wheel and ban a random staff member");

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [command.toJSON()] }
  );

  console.log("✅ /roulette registered");
});

/* =========================
   🎯 INTERACTION HANDLER
   ========================= */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "roulette") return;

  /* 🔐 ACCESS CHECK */
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({
      content: "⛔ You are NOT authorized to spin the wheel.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  await guild.members.fetch();

  /* 👔 STAFF ROLES */
  const staffRoles = guild.roles.cache.filter(role =>
    STAFF_KEYWORDS.some(k =>
      role.name.toLowerCase().includes(k)
    )
  );

  if (!staffRoles.size) {
    return interaction.editReply("❌ No staff roles detected.");
  }

  /* 👤 STAFF MEMBERS */
  const staffMembers = guild.members.cache.filter(member =>
    member.roles.cache.some(r => staffRoles.has(r.id)) &&
    member.bannable &&
    !member.user.bot
  );

  if (!staffMembers.size) {
    return interaction.editReply("❌ No bannable staff members found.");
  }

  /* 🎲 RANDOM PICK */
  const victim = staffMembers.random();
  const verdict =
    FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];

  /* 🔨 BAN */
  await victim.ban({ reason: "🎰 Ban Roulette" });

  /* 📦 STYLED EMBED */
  const embed = new EmbedBuilder()
    .setColor(0xFF3B3B)
    .setAuthor({
      name: "BAN ROULETTE",
      iconURL: guild.iconURL()
    })
    .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
    .setDescription("🎰 **The wheel has spoken…**")
    .addFields(
      { name: "👤 Victim", value: `${victim.user}`, inline: true },
      { name: "🛡 Highest Role", value: victim.roles.highest.name, inline: true },
      { name: "🔨 Punishment", value: "PERMANENT BAN", inline: true },
      { name: "😂 Verdict", value: verdict }
    )
    .setFooter({
      text: `Spun by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
});

client.login(process.env.TOKEN);
