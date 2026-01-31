const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  PermissionFlagsBits 
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
  .setDescription("🎰 Ban a random staff member (RISKY)");

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

  // 1️⃣ Find staff roles by NAME
  const staffRoles = guild.roles.cache.filter(role =>
    STAFF_KEYWORDS.some(keyword =>
      role.name.toLowerCase().includes(keyword)
    )
  );

  if (staffRoles.size === 0) {
    return interaction.editReply("❌ No staff roles detected.");
  }

  // 2️⃣ Get members with those roles
  const staffMembers = guild.members.cache.filter(member =>
    member.roles.cache.some(role => staffRoles.has(role.id)) &&
    member.bannable &&
    !member.user.bot
  );

  if (staffMembers.size === 0) {
    return interaction.editReply("❌ No bannable staff members found.");
  }

  // 3️⃣ Pick random victim
  const victim = staffMembers.random();

  // 4️⃣ Funny messages
  const messages = [
    `🎰 **BAN ROULETTE SPINNING...**`,
    `💀 The wheel stopped.`,
    `😈 **${victim.user.tag}** got absolutely COOKED.`,
    `🪦 Rest in peace.`,
    `🔥 Better luck next server.`
  ];

  // 5️⃣ Ban
  await victim.ban({ reason: "🎰 Ban Roulette" });

  // 6️⃣ Reply
  await interaction.editReply(
    `${messages.join("\n")}\n\n💥 **BANNED:** ${victim.user}`
  );
});

client.login(process.env.TOKEN);
