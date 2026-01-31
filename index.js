const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits
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
  new SlashCommandBuilder().setName("roulette").setDescription("Ban a random staff member"),
  new SlashCommandBuilder().setName("fakeroulette").setDescription("Fake ban a staff member"),
  new SlashCommandBuilder().setName("kickroulette").setDescription("Kick a random staff member"),
  new SlashCommandBuilder().setName("punishroulette").setDescription("Randomly punish a staff member"),
  new SlashCommandBuilder().setName("impostor").setDescription("Fake impostor alert"),
  new SlashCommandBuilder().setName("luck").setDescription("Check your luck %"),
  new SlashCommandBuilder().setName("godmode").setDescription("Make a user immune").addUserOption(opt => opt.setName("target").setDescription("Target user")),
  new SlashCommandBuilder().setName("hallofshame").setDescription("Shows last punished staff"),
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

// Punish roulette
async function punishMember(member) {
  const punishments = [
    async () => { await member.timeout(5 * 60 * 1000, "Punish Roulette"); return "⏱ Timed out 5 minutes"; },
    async () => { const afkRole = member.guild.roles.cache.find(r => r.name.toLowerCase().includes("afk")); if (afkRole) await member.roles.add(afkRole); return "🛡 Moved to AFK"; },
    async () => { const oldName = member.displayName; await member.setNickname("🤡 Punished"); return `📝 Nickname changed from ${oldName}`; },
    async () => "⚡ Lucky, nothing happened"
  ];

  const action = getRandom(punishments);
  const result = await action();
  return result;
}

// Duel roulette
async function duelMembers(members) {
  const [player1, player2] = members.sort(() => 0.5 - Math.random()).slice(0, 2);
  const loser = getRandom([player1, player2]);
  await loser.timeout(5 * 60 * 1000, "Duel Roulette"); // Mute loser 5 min
  return { player1, player2, loser };
}

// Handle commands
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!ALLOWED_USERS.includes(interaction.user.id)) return interaction.reply({ content: "❌ You are not authorized.", ephemeral: true });

  await interaction.guild.members.fetch();

  const staffMembers = interaction.guild.members.cache.filter(m => getHighestStaff(m));
  if (!staffMembers.size) return interaction.reply({ content: "❌ No staff members found", ephemeral: true });

  const channel = interaction.guild.channels.cache.get(STAFF_CHANNEL_ID);
  if (!channel) return interaction.reply({ content: "❌ Staff channel not found", ephemeral: true });

  if (interaction.commandName === "roulette") {
    const victim = getRandom([...staffMembers.values()]);
    await victim.ban({ reason: "Ban Roulette" }).catch(() => {});
    const embed = new EmbedBuilder()
      .setTitle("🎰 Ban Roulette")
      .setDescription(`💀 <@${victim.id}> got banned!`)
      .setColor(0xff0000)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: `✅ <@${victim.id}> has been banned!`, ephemeral: true });
  }

  if (interaction.commandName === "fakeroulette") {
    const victim = getRandom([...staffMembers.values()]);
    const embed = new EmbedBuilder()
      .setTitle("🎭 Fake Ban Roulette")
      .setDescription(`🤡 <@${victim.id}> almost got banned!`)
      .setColor(0xffff00)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Fake roulette ran!", ephemeral: true });
  }

  if (interaction.commandName === "kickroulette") {
    const victim = getRandom([...staffMembers.values()]);
    await victim.kick("Kick Roulette").catch(() => {});
    const embed = new EmbedBuilder()
      .setTitle("🥾 Kick Roulette")
      .setDescription(`💨 <@${victim.id}> got kicked!`)
      .setColor(0xff8800)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: `✅ <@${victim.id}> has been kicked!`, ephemeral: true });
  }

  if (interaction.commandName === "punishroulette") {
    const victim = getRandom([...staffMembers.values()]);
    const result = await punishMember(victim);
    const embed = new EmbedBuilder()
      .setTitle("🎯 Punish Roulette")
      .setDescription(`💀 <@${victim.id}> punishment: ${result}`)
      .setColor(0x00ff00)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Punish roulette ran!", ephemeral: true });
  }

  if (interaction.commandName === "impostor") {
    const victim = getRandom([...staffMembers.values()]);
    const embed = new EmbedBuilder()
      .setTitle("🚨 Impostor Alert!")
      .setDescription(`🕵️ <@${victim.id}> is sus!`)
      .setColor(0xff00ff)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Impostor roulette ran!", ephemeral: true });
  }

  if (interaction.commandName === "luck") {
    const luck = Math.floor(Math.random() * 101);
    const embed = new EmbedBuilder()
      .setTitle("🍀 Luck Check")
      .setDescription(`🧠 <@${interaction.user.id}> has ${luck}% luck!`)
      .setColor(0x00ffff)
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.commandName === "godmode") {
    const target = interaction.options.getUser("target");
    if (!target) return interaction.reply({ content: "❌ Please specify a user.", ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle("👑 Godmode")
      .setDescription(`🛡 <@${target.id}> is now IMMUNE to all roulettes!`)
      .setColor(0x9900ff)
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.commandName === "hallofshame") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Hall of Shame")
      .setDescription("Last punished staff members")
      .setColor(0xff5555)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Hall of Shame displayed!", ephemeral: true });
  }

  if (interaction.commandName === "duelroulette") {
    const { player1, player2, loser } = await duelMembers([...staffMembers.values()]);
    const embed = new EmbedBuilder()
      .setTitle("⚔️ Duel Roulette")
      .setDescription(`🎮 ${player1} vs ${player2}\n💀 <@${loser.id}> lost and got muted for 5 min!`)
      .setColor(0xffaa00)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Duel roulette ran!", ephemeral: true });
  }

  // Update staff table
  const embed = buildEmbed(interaction.guild);
  const msgs = await channel.messages.fetch({ limit: 10 });
  const old = msgs.find(m => m.author.id === client.user.id);
  if (old) await old.edit({ embeds: [embed] });
  else await channel.send({ embeds: [embed] });
});

client.login(TOKEN);
