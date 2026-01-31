const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// 🔐 Allowed users only
const ALLOWED_USERS = [
  "1289624661079883791",
  "1387888341109833906",
  "1171474569299755158",
  "1388979737174478940",
  "1348065997231489066"
];

// Staff detection keywords
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

// Fun messages for roulette
const FUNNY_VERDICTS = [
  "💀 RNG said goodbye",
  "🎰 Spin landed on BAN",
  "⚡ Executed by the council",
  "🔥 Skill issue detected",
  "☠️ Massive L detected"
];

const FAKE_VERDICTS = [
  "😳 Heart attack avoided",
  "🧠 Almost banned but luck clutched",
  "😮‍💨 That was TOO close",
  "🎭 Plot twist: FAKE SPIN",
  "🛡 Protected by plot armor",
  "😂 Chat was ready to mourn"
];

let CHAOS_MODE = false;
let HALL_OF_SHAME = [];

// ─── COMMANDS ─────────────────────────────
const commands = [
  new SlashCommandBuilder().setName("roulette").setDescription("🎰 Ban roulette (REAL)"),
  new SlashCommandBuilder().setName("fakeroulette").setDescription("🎭 Fake roulette"),
  new SlashCommandBuilder().setName("kickroulette").setDescription("🥾 Kick roulette"),
  new SlashCommandBuilder().setName("punishroulette").setDescription("🎯 Punishment roulette"),
  new SlashCommandBuilder().setName("impostor").setDescription("🎭 Impostor roulette"),
  new SlashCommandBuilder().setName("luck").setDescription("🧠 Check your luck"),
  new SlashCommandBuilder().setName("godmode").setDescription("👑 Make someone immune").addUserOption(o => o.setName("user").setDescription("User to godmode")),
  new SlashCommandBuilder().setName("hallofshame").setDescription("📜 Show recent roulette victims"),
  new SlashCommandBuilder().setName("duelroulette").setDescription("🎮 1v1 roulette"),
  new SlashCommandBuilder().setName("chaos").setDescription("🧨 Toggle chaos mode").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)),
  new SlashCommandBuilder().setName("snitch").setDescription("🕵️ Check snitch chance").addUserOption(o => o.setName("user").setDescription("User to check")),
  new SlashCommandBuilder().setName("staffstats").setDescription("🏆 Show staff stats"),
  new SlashCommandBuilder().setName("goat").setDescription("🐐 GOAT detector").addUserOption(o => o.setName("user").setDescription("User to check"))
].map(c => c.toJSON());

// ─── REGISTER COMMANDS ─────────────────────
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ All commands registered");
  } catch (err) { console.error(err); }
})();

// ─── HELPERS ───────────────────────────────
function isStaff(member) {
  return member.roles.cache.some(r => STAFF_KEYS.some(k => r.name.toLowerCase().includes(k)));
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function permissionCheck(interaction) {
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    interaction.reply({ content: "❌ You are not authorized.", ephemeral: true });
    return false;
  }
  return true;
}

// ─── INTERACTION HANDLER ───────────────────
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!permissionCheck(interaction)) return;

  await interaction.guild.members.fetch();
  const staffMembers = interaction.guild.members.cache.filter(m => !m.user.bot && isStaff(m));
  if (!staffMembers.size) return interaction.reply({ content: "❌ No staff members found.", ephemeral: true });

  const command = interaction.commandName;

  // Random staff target
  const victim = randomItem([...staffMembers.values()]);

  switch (command) {

    case "roulette":
      {
        const verdict = randomItem(FUNNY_VERDICTS);
        const embed = new EmbedBuilder()
          .setTitle("🎰 BAN ROULETTE")
          .setColor(0xff0000)
          .setDescription(`🎯 **Selected:** ${victim}\n📜 **Verdict:** ${verdict}`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        HALL_OF_SHAME.push({ user: victim.user.tag, type: "BAN", time: new Date() });
        setTimeout(async () => { try { await victim.ban({ reason: "Ban Roulette" }); } catch {} }, 2000);
      } break;

    case "fakeroulette":
      {
        const verdict = randomItem(FAKE_VERDICTS);
        const embed = new EmbedBuilder()
          .setTitle("🎭 FAKE ROULETTE")
          .setColor(0x5865f2)
          .setDescription(`🎯 **Selected:** ${victim}\n📜 **Verdict:** ${verdict}`)
          .setFooter({ text: "This was a prank 😭" })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "kickroulette":
      {
        const embed = new EmbedBuilder()
          .setTitle("🥾 KICK ROULETTE")
          .setColor(0xffa500)
          .setDescription(`🎯 **Victim:** ${victim}\n💨 Outcome: **KICKED**`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        HALL_OF_SHAME.push({ user: victim.user.tag, type: "KICK", time: new Date() });
        setTimeout(async () => { try { await victim.kick("Kick Roulette 🥾"); } catch {} }, 2000);
      } break;

    case "punishroulette":
      {
        const punishments = ["Timeout 5 min", "Timeout 10 min", "Nickname change", "Move to AFK", "Nothing"];
        const result = randomItem(punishments);
        const embed = new EmbedBuilder()
          .setTitle("🎯 PUNISHMENT ROULETTE")
          .setColor(0xffff00)
          .setDescription(`🎯 **Selected:** ${victim}\n📜 **Punishment:** ${result}`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "impostor":
      {
        const embed = new EmbedBuilder()
          .setTitle("🎭 IMPOSTOR ALERT")
          .setColor(0xff00ff)
          .setDescription(`🚨 **Accused:** ${victim}\n🕵️‍♂️ Reason: Suspected betrayal\n📜 Verdict: FALSE ALARM!`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "luck":
      {
        const luck = Math.floor(Math.random() * 101);
        const embed = new EmbedBuilder()
          .setTitle("🧠 LUCK CHECK")
          .setColor(0x00ff00)
          .setDescription(`🎲 **${interaction.user.username}** Luck: **${luck}%**`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "godmode":
      {
        const user = interaction.options.getUser("user");
        const embed = new EmbedBuilder()
          .setTitle("👑 GODMODE")
          .setColor(0x00ffff)
          .setDescription(`🔱 **${user.username}** is now IMMUNE to roulette!`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "hallofshame":
      {
        if (!HALL_OF_SHAME.length) return interaction.reply("📜 Hall of shame is empty.");
        const list = HALL_OF_SHAME.slice(-10).map(x => `• ${x.user} → ${x.type}`).join("\n");
        const embed = new EmbedBuilder()
          .setTitle("📜 HALL OF SHAME")
          .setColor(0xff0000)
          .setDescription(list)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "duelroulette":
      {
        const [p1, p2] = [...staffMembers.values()].sort(() => 0.5 - Math.random()).slice(0,2);
        const loser = randomItem([p1, p2]);
        const embed = new EmbedBuilder()
          .setTitle("🎮 1v1 DUEL ROULETTE")
          .setColor(0xff69b4)
          .setDescription(`🎯 Duel between ${p1} and ${p2}\n💀 Loser: ${loser}`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "chaos":
      {
        const state = interaction.options.getString("state").toLowerCase();
        if (state === "on") { CHAOS_MODE = true; await interaction.reply("🔥 Chaos mode is ON!"); }
        else { CHAOS_MODE = false; await interaction.reply("🛡 Chaos mode is OFF!"); }
      } break;

    case "snitch":
      {
        const user = interaction.options.getUser("user");
        const chance = Math.floor(Math.random() * 101);
        const embed = new EmbedBuilder()
          .setTitle("🕵️ SNITCH DETECTOR")
          .setColor(0xffa500)
          .setDescription(`🎯 **${user.username}** Snitch chance: **${chance}%**`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "staffstats":
      {
        const total = staffMembers.size;
        const embed = new EmbedBuilder()
          .setTitle("🏆 STAFF STATS")
          .setColor(0x00ffff)
          .setDescription(`👥 Total Staff: ${total}\n⚡ Chaos Mode: ${CHAOS_MODE ? "ON" : "OFF"}`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;

    case "goat":
      {
        const user = interaction.options.getUser("user");
        const aura = Math.floor(Math.random()*101);
        const clutch = Math.floor(Math.random()*101);
        const npc = Math.floor(Math.random()*101);
        const total = Math.floor((aura + clutch + npc)/3);
        const embed = new EmbedBuilder()
          .setTitle("🐐 GOAT DETECTOR")
          .setColor(0xffd700)
          .setDescription(`🎯 **${user.username}** stats:\n• Aura: ${aura}\n• Clutch: ${clutch}\n• NPC Energy: ${npc}\n🏆 Total GOAT: ${total}`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } break;
  }
});

client.login(TOKEN);
