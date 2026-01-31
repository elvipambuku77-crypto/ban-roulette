// ---------------------------
// Staff Ban Roulette Bot (Funny Edition)
// ---------------------------

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require("discord.js");

// Env variables
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Allowed staff roles
const STAFF_ROLES = [
  "helper",
  "mod",
  "admin",
  "manager",
  "head of staff",
  "co owner",
  "owner",
];

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎲 Randomly ban a staff member from the server!"),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash commands registered ✅");
  } catch (err) {
    console.error(err);
  }
})();

// Handle /roulette
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "roulette") {
    try {
      // Fetch all members
      await interaction.guild.members.fetch();

      // Filter only staff
      const staffMembers = interaction.guild.members.cache.filter(m =>
        !m.user.bot &&
        m.id !== interaction.guild.ownerId &&
        m.id !== interaction.user.id &&
        m.roles.cache.some(r => STAFF_ROLES.includes(r.name.toLowerCase()))
      );

      if (staffMembers.size === 0) {
        return interaction.reply({ content: "😢 No staff members found to ban!", ephemeral: true });
      }

      // Pick random staff
      const randomMember = staffMembers.random();

      // Ban the member
      await randomMember.ban({ reason: `Ban Roulette activated by ${interaction.user.tag}` });

      // Funny embed message
      const embed = new EmbedBuilder()
        .setTitle("🎲 Staff Ban Roulette Activated!")
        .setColor(0xff0000)
        .setDescription(`💥 **${randomMember.user.tag}** got **banned**!\n\n🤣 Better luck next time!`)
        .addFields(
          { name: "Ban Master 🎯", value: `${interaction.user.tag}`, inline: true },
          { name: "Target 😈", value: `${randomMember.user.tag}`, inline: true }
        )
        .setFooter({ text: "Ban Roulette • Powered by chaos 🐒" })
        .setTimestamp();

      // Reply with embed
      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      interaction.reply({ content: "⚠️ Something went wrong! Check logs.", ephemeral: true });
    }
  }
});

// Log in
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag} ✅`);
});

client.login(TOKEN);
