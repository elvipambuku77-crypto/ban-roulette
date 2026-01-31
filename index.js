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

const command = new SlashCommandBuilder()
  .setName("roulette")
  .setDescription("🎰 Ban a random staff member (DANGEROUS)");

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [command.toJSON()] }
  );

  console.log("✅ Slash command registered");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "roulette") return;

  await interaction.deferReply();

  const guild = interaction.guild;
  await guild.members.fetch();

  // Detect staff roles by NAME
  const staffRoles = guild.roles.cache.filter(role =>
    STAFF_KEYWORDS.some(keyword =>
      role.name.toLowerCase().includes(keyword)
    )
  );

  if (staffRoles.size === 0) {
    return interaction.editReply("❌ No staff roles detected.");
  }

  // Get staff members
  const staffMembers = guild.members.cache.filter(member =>
    member.roles.cache.some(role => staffRoles.has(role.id)) &&
    member.bannable &&
    !member.user.bot
  );

  if (staffMembers.size === 0) {
    return interaction.editReply("❌ No bannable staff members found.");
  }

  // Pick random victim
  const victim = staffMembers.random();

  // Ban the victim
  await victim.ban({ reason: "🎰 Ban Roulette" });

  // Create embed (THE TABLE THING 😎)
  const embed = new EmbedBuilder()
    .setTitle("🎰 BAN ROULETTE RESULT")
    .setColor(0xff0000)
    .setThumbnail(victim.user.displayAvatarURL())
    .addFields(
      { name: "🎯 Victim", value: `${victim.user}`, inline: true },
      { name: "💼 Role", value: victim.roles.highest.name, inline: true },
      { name: "💀 Status", value: "BANNED", inline: true },
      { name: "🔥 Message", value: "The wheel has spoken. No mercy." }
    )
    .setFooter({ text: "Ban Roulette • Good luck next time" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
});

client.login(process.env.TOKEN);
