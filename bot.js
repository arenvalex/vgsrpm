const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

const userState = {};

const VEGAS_PROVIDERS = [
  "Easy Pay 2",
  "Fast Pay",
  "Master Banka Havalesi",
  "UltraPay Havale Fast",
  "JorPay Banka Havalesi",
  "Cryptobox",
  "Şahin",
  "Payhera Kredi Kartı",
  "NextPay Kredi Kartı"
];

const PRIME_PROVIDERS = [
  "Easy Havale",
  "FastPay",
  "Ödenet Havale",
  "Cryptobox",
  "NextPay Kredi Kartı",
  "Kartal Havale",
  "Payhera Kredi Kartı",
  "Atlas Banka Havalesi",
  "Paykolik Havale"
];
let currentId = 1;

async function saveToSheet(data) {
  try {
    const result = await axios.post(
      "https://script.google.com/macros/s/AKfycby4WRBI1RbfDfn1I1RETLNAZk3u6dNN__n07j90pnfUE1hvTbljjAATcu-lOjUgJl2wcw/exec",
      data
    );

    console.log("SHEET OK:", result.data);

    return true;
  } catch (error) {
    console.log("SHEET ERROR:");
    console.log(error.response?.data || error.message);

    return false;
  }
}
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🎰 VEGAS", "VEGAS")],
    [Markup.button.callback("👑 PRIME", "PRIME")],
    [Markup.button.callback("💵 TAKVİYE", "TAKVIYE")],
    [Markup.button.callback("📊 RAPORLAR", "RAPORLAR")]
  ]);
}

bot.start(async (ctx) => {
  await ctx.reply(
    "🏦 VGSPRM Yönetim Paneli",
    mainMenu()
  );
});

bot.action("VEGAS", async (ctx) => {
  await ctx.editMessageText(
    "🎰 VEGAS",
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Crypto Yatırım", "VG_YATIRIM")],
      [Markup.button.callback("💸 Crypto Çekim", "VG_CEKIM")],
      [Markup.button.callback("📦 Teslimat", "VG_TESLIMAT")],
      [Markup.button.callback("🔙 Ana Menü", "ANA_MENU")]
    ])
  );
});

bot.action("PRIME", async (ctx) => {
  await ctx.editMessageText(
    "👑 PRIME",
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Crypto Yatırım", "PR_YATIRIM")],
      [Markup.button.callback("💸 Crypto Çekim", "PR_CEKIM")],
      [Markup.button.callback("📦 Teslimat", "PR_TESLIMAT")],
      [Markup.button.callback("🔙 Ana Menü", "ANA_MENU")]
    ])
  );
});

bot.action("VG_TESLIMAT", async (ctx) => {
  const buttons = VEGAS_PROVIDERS.map(provider => [
    Markup.button.callback(provider, `VGP_${provider}`)
  ]);

  buttons.push([
    Markup.button.callback("🔙 Geri", "VEGAS")
  ]);

  await ctx.editMessageText(
    "📦 VEGAS Teslimat Provider Seçiniz",
    Markup.inlineKeyboard(buttons)
  );
});

bot.action("PR_TESLIMAT", async (ctx) => {
  const buttons = PRIME_PROVIDERS.map(provider => [
    Markup.button.callback(provider, `PRP_${provider}`)
  ]);

  buttons.push([
    Markup.button.callback("🔙 Geri", "PRIME")
  ]);

  await ctx.editMessageText(
    "📦 PRIME Teslimat Provider Seçiniz",
    Markup.inlineKeyboard(buttons)
  );
});

VEGAS_PROVIDERS.forEach((provider) => {
  bot.action(`VGP_${provider}`, async (ctx) => {
    userState[ctx.from.id] = {
      marka: "VEGAS",
      islem: "TESLIMAT",
      provider: provider
    };

    await ctx.reply(
      `📦 ${provider}\n\n💰 Teslimat tutarını giriniz:`
    );
  });
});

PRIME_PROVIDERS.forEach((provider) => {
  bot.action(`PRP_${provider}`, async (ctx) => {
    userState[ctx.from.id] = {
      marka: "PRIME",
      islem: "TESLIMAT",
      provider: provider
    };

    await ctx.reply(
      `📦 ${provider}\n\n💰 Teslimat tutarını giriniz:`
    );
  });
});

bot.action("ANA_MENU", async (ctx) => {
  await ctx.editMessageText(
    "🏦 VGSPRM Yönetim Paneli",
    mainMenu()
  );
});

bot.action("VG_YATIRIM", async (ctx) => {
  userState[ctx.from.id] = {
    marka: "VEGAS",
    islem: "CRYPTO_YATIRIM"
  };

  await ctx.reply("💰 VEGAS Crypto Yatırım tutarını giriniz:");
});

bot.action("VG_CEKIM", async (ctx) => {
  userState[ctx.from.id] = {
    marka: "VEGAS",
    islem: "CRYPTO_CEKIM"
  };

  await ctx.reply("💸 VEGAS Crypto Çekim tutarını giriniz:");
});

bot.action("PR_YATIRIM", async (ctx) => {
  userState[ctx.from.id] = {
    marka: "PRIME",
    islem: "CRYPTO_YATIRIM"
  };

  await ctx.reply("💰 PRIME Crypto Yatırım tutarını giriniz:");
});

bot.action("PR_CEKIM", async (ctx) => {
  userState[ctx.from.id] = {
    marka: "PRIME",
    islem: "CRYPTO_CEKIM"
  };

  await ctx.reply("💸 PRIME Crypto Çekim tutarını giriniz:");
});

bot.on("text", async (ctx) => {
  const state = userState[ctx.from.id];

  if (!state) return;

  const amount = Number(
    ctx.message.text.replace(/\./g, "").replace(",", ".")
  );

  if (isNaN(amount)) {
    return ctx.reply("❌ Geçerli bir tutar giriniz.");
  }

  const payload = {
    id: currentId++,
    kullanici:
      ctx.from.username ||
      `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim(),
    marka: state.marka,
    islemTipi: state.islem,
    provider: state.provider || "-",
    tutar: amount
  };

  const saved = await saveToSheet(payload);

  if (!saved) {
    return ctx.reply("❌ Kayıt sırasında hata oluştu.");
  }

  await ctx.reply(
    `✅ Kayıt Edildi

Marka: ${state.marka}
İşlem: ${state.islem}
Tutar: ${amount.toLocaleString("tr-TR")} TL`
  );

  delete userState[ctx.from.id];
});

bot.launch();

console.log("VGSPRM Bot Aktif");
