const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const STAFF_CHANNEL_ID = "1427692088614719628";

// Allowed users
const ALLOWED_USERS = [
  "1289624661079883791",
  "1387888341109833906",
  "1171474569299755158",
  "1388979737174478940",
  "1348065997231489066"
];

// Staff role mapping
const ROLE_MAP = [
  { key: "main founder", label: "👑 Main Founder" },
  { key: "co founder", label: "💜 Founder" },
  { key: "own┇", label: "🖤 Owner" },
  { key: "co┇", label: "💙 Co Owner" },
  { key: "hos┇", label: "🔥 Head of Staff" },
  { key: "man┇", label: "💎 Manager" },
  { key: "adm┇", label: "🛡️ Admin" },
  { key: "mod┇", label: "⚔️ Moderator" },
  { key: "hel┇", label: "🌟 Helper" }
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration]
});

// Register slash commands
const commands = [
  new SlashCommandBuilder().setName("put").setDescription("Create staff team"),
  new SlashCommandBuilder().setName("update").setDescription("Update staff team"),
  new SlashCommandBuilder().setName("roulette").setDescription("Ban a random staff member"),
  new SlashCommandBuilder().setName("punishroulette").setDescription("Randomly punish a staff member"),
  new SlashCommandBuilder().setName("duelroulette").setDescription("Random 1v1 duel")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

// Get highest staff role
function getHighestStaff(member) {
  for (const roleDef of ROLE_MAP) {
    const role = member.roles.cache.find(r => r.name.toLowerCase().includes(roleDef.key));
    if (role) return roleDef;
  }
  return null;
}

// Build staff embed
function buildEmbed(guild) {
  const embed = new EmbedBuilder()
    .setTitle("📜 Staff Team")
    .setColor(0x5865f2)
    .setTimestamp();

  ROLE_MAP.forEach(roleDef => {
    const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(roleDef.key));
    if (!role) return;

    const members = guild.members.cache.filter(m => {
      const highest = getHighestStaff(m);
      return highest && highest.key === roleDef.key;
    });

    if (!members.size) return;

    embed.addFields({
      name: `${roleDef.label} — ${role.name}`,
      value: members.map(m => `• <@${m.id}>`).join("\n"),
      inline: false
    });
  });

  return embed;
}

// Random helper functions
function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// BAN ROULETTE FUNNY MESSAGES
const banMessages = [
  `💀 <@{victim}> got yeeted into the void!`,
  `🎰 Spin complete! <@{victim}> didn’t survive the spin!`,
  `🪓 Oops! <@{victim}> met the mighty ban hammer!`,
  `⚡ Shocked! <@{victim}> got struck by bad luck!`,
  `🚀 <@{victim}> has been launched into another dimension!`,
  `🦖 Jurassic time! <@{victim}> got eaten by a T-Rex!`,
  `🍕 Pizza delivery fail! <@{victim}> vanished into thin air!`,
  `👻 Boo! <@{victim}> got spooked straight outta Discord!`,
  `🥶 Cold as ice! <@{victim}> frozen by the Ban Gods!`,
  `🧨 Boom! <@{victim}> exploded into confetti!`,
  `🦄 Magical unicorn stomp! <@{victim}> didn't survive!`,
  `🎩 Hat trick! <@{victim}> got a magic mute!`,
  `🥳 Party time! <@{victim}> got kicked but the party continues!`
];

// PUNISH ROULETTE FUNNY MESSAGES
const punishMessages = [
  `⏱ Timed out 5 min! <@{victim}> now has time to rethink life choices!`,
  `📝 Nickname changed! <@{victim}> is now 🤡 Punished!`,
  `🛡 Moved to AFK! <@{victim}> go chill somewhere…`,
  `🍌 Slipped on a banana! <@{victim}> narrowly escaped disaster…`,
  `🐸 Frogged! <@{victim}> turned into a frog temporarily!`,
  `🦄 Unicorn attack! <@{victim}> got magically punished!`,
  `🍕 Pizza rage! <@{victim}> must now eat 5 imaginary pizzas!`,
  `🎩 Hat trick! <@{victim}> got a magical hat — mute included!`,
  `⚡ Shocked! <@{victim}> learns the meaning of chaos!`,
  `🦖 Dinosaur stomp! <@{victim}> was slightly flattened… for 5 minutes!`,
  `💥 Exploded into confetti! <@{victim}> regrets life choices!`,
  `🤡 Clown alert! <@{victim}> is now the main circus act!`
];

// Punish roulette
async function punishMember(victim, executor, guild) {
  const punishments = [
    async () => { 
      await victim.timeout(5 * 60 * 1000, "Punish Roulette"); 
      return getRandom(punishMessages).replace("{victim}", victim.id);
    },
    async () => { 
      const oldName = victim.displayName;
      await victim.setNickname(`🤡 Punished`); 
      return `📝 Nickname changed from **${oldName}** to 🤡 Punished!`;
    },
    async () => { 
      const afkRole = guild.roles.cache.find(r => r.name.toLowerCase().includes("afk")); 
      if (afkRole) await victim.roles.add(afkRole); 
      return `🛡 Moved to AFK by <@${executor.id}>`;
    },
    async () => `⚡ Lucky! <@${executor.id}> spared <@${victim.id}>`
  ];

  const action = getRandom(punishments);
  const result = await action();
  return result;
}

// Duel roulette
async function duelMembers(staffMembers) {
  const [player1, player2] = getRandomTwo(staffMembers);
  const loser = getRandom([player1, player2]);
  await loser.timeout(5 * 60 * 1000, "Duel Roulette"); // Mute loser 5 min
  return { player1, player2, loser };
}

// Helper: pick 2 random members
function getRandomTwo(members) {
  const shuffled = [...members].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Handle commands
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!ALLOWED_USERS.includes(interaction.user.id)) 
    return interaction.reply({ content: "❌ You are not authorized.", ephemeral: true });

  await interaction.guild.members.fetch();
  const staffMembers = interaction.guild.members.cache.filter(m => getHighestStaff(m));
  const channel = interaction.channel; // Send roulette results here
  const staffChannel = interaction.guild.channels.cache.get(STAFF_CHANNEL_ID);

  if (!staffMembers.size && !["put","update"].includes(interaction.commandName))
    return interaction.reply({ content: "❌ No staff members found", ephemeral: true });

  // STAFF TABLE
  if (["put","update"].includes(interaction.commandName)) {
    if (!staffChannel) return interaction.reply({ content: "Staff channel not found", ephemeral: true });
    const embed = buildEmbed(interaction.guild);
    const msgs = await staffChannel.messages.fetch({ limit: 10 });
    const old = msgs.find(m => m.author.id === client.user.id);
    if (old) await old.edit({ embeds: [embed] });
    else await staffChannel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Staff table updated!", ephemeral: true });
  }

  // /roulette ban
  if (interaction.commandName === "roulette") {
    const victim = getRandom([...staffMembers.values()]);
    const embed = new EmbedBuilder()
      .setTitle("🎰 Ban Roulette")
      .setDescription(getRandom(banMessages).replace("{victim}", victim.id))
      .setColor(0xff0000)
      .setTimestamp();
    await victim.ban({ reason: `Ban Roulette by ${interaction.user.tag}` }).catch(() => {});
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: `✅ Ban roulette executed by <@${interaction.user.id}>!`, ephemeral: true });
  }

  // /punishroulette
  if (interaction.commandName === "punishroulette") {
    const victim = getRandom([...staffMembers.values()]);
    const result = await punishMember(victim, interaction.user, interaction.guild);
    const embed = new EmbedBuilder()
      .setTitle("🎯 Punish Roulette")
      .setDescription(`💀 Result: **${result}**`)
      .setColor(0x00ff00)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: `✅ Punish roulette ran by <@${interaction.user.id}>!`, ephemeral: true });
  }

  // /duelroulette
  if (interaction.commandName === "duelroulette") {
    const { player1, player2, loser } = await duelMembers([...staffMembers.values()]);
    const embed = new EmbedBuilder()
      .setTitle("⚔️ Duel Roulette")
      .setDescription(`🎮 <@${player1.id}> vs <@${player2.id}>\n💀 <@${loser.id}> lost and got muted for 5 min!\nExecuted by <@${interaction.user.id}>`)
      .setColor(0xffaa00)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Duel roulette ran!", ephemeral: true });
  }
});

client.login(TOKEN);
