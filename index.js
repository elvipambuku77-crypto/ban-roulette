const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const STAFF_KEYS = [
  "helper",
  "mod",
  "admin",
  "manager",
  "head",
  "owner",
  "founder"
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎰 Randomly bans ONE staff member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
].map(c => c.toJSON());

// Register command
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash command registered");
})();

// Check if member is staff
function isStaff(member) {
  return member.roles.cache.some(role =>
    STAFF_KEYS.some(key => role.name.toLowerCase().includes(key))
  );
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "roulette") return;

  await interaction.deferReply();

  await interaction.guild.members.fetch({ force: true });

  const staffMembers = interaction.guild.members.cache.filter(m =>
    !m.user.bot &&
    m.id !== interaction.user.id &&
    m.id !== interaction.guild.ownerId &&
    m.bannable &&
    isStaff(m)
  );

  if (!staffMembers.size) {
    return interaction.editReply("❌ No staff members available to ban.");
  }

  const unlucky = staffMembers.random();

  await unlucky.ban({ reason: "🎰 Staff Ban Roulette" });

  await interaction.editReply(
    `🎰 **STAFF BAN ROULETTE** 🎰\n\n💀 **${unlucky.user.tag}** was chosen and **BANNED**`
  );
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(TOKEN);