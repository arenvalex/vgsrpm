const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

function mainMenu(ctx) {
  return ctx.reply(
    "🏦 VGSPRM Yönetim Paneli",
    Markup.keyboard([
      ["🎰 VEGAS", "👑 PRIME"],
      ["💵 TAKVİYE", "📊 RAPORLAR"]
    ]).resize()
  );
}

bot.start(async (ctx) => {
  await mainMenu(ctx);
});

bot.hears("🎰 VEGAS", async (ctx) => {
  await ctx.reply(
    "🎰 VEGAS",
    Markup.keyboard([
      ["💰 Crypto Yatırım"],
      ["💸 Crypto Çekim"],
      ["📦 Teslimat"],
      ["🔙 Ana Menü"]
    ]).resize()
  );
});

bot.hears("👑 PRIME", async (ctx) => {
  await ctx.reply(
    "👑 PRIME",
    Markup.keyboard([
      ["💰 Crypto Yatırım"],
      ["💸 Crypto Çekim"],
      ["📦 Teslimat"],
      ["🔙 Ana Menü"]
    ]).resize()
  );
});

bot.hears("🔙 Ana Menü", async (ctx) => {
  await mainMenu(ctx);
});

bot.launch();

console.log("VGSPRM Bot Aktif");
