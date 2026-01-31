const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  REST, 
  Routes 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

/* ---------- REGISTER COMMAND ---------- */
const commands = [
  new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎰 Ban roulette… a random staff member gets cooked 💀")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash command registered");
  } catch (err) {
    console.error(err);
  }
});

/* ---------- COMMAND LOGIC ---------- */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "roulette") return;

  await interaction.deferReply();

  const guild = interaction.guild;

  // Fetch ALL members properly
  await guild.members.fetch();

  const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
  if (!staffRole) {
    return interaction.editReply("❌ Staff role not found 💀");
  }

  // Get staff members (NO BOTS)
  const staffMembers = staffRole.members.filter(m => !m.user.bot);

  if (staffMembers.size === 0) {
    return interaction.editReply("😭 No staff members found… everyone escaped.");
  }

  // Pick random victim
  const victim = staffMembers.random();

  // Try banning
  try {
    await victim.ban({ reason: "🎰 Ban Roulette — unlucky spin 💀" });

    await interaction.editReply(
      `🎰 **BAN ROULETTE SPINNING...**\n\n` +
      `💥 **BOOM!**\n` +
      `😈 **${victim.user.tag}** just got **SMOKED**\n\n` +
      `🪦 Rest in peace + ratio`
    );
  } catch (err) {
    console.error(err);
    interaction.editReply(
      `❌ I tried banning **${victim.user.tag}** but failed 😭\n` +
      `Probably higher role than me or missing perms 💀`
    );
  }
});

client.login(TOKEN);
