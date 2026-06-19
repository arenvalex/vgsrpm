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

async function getSheetData() {
  try {
    const response = await axios.get(
      "https://script.google.com/macros/s/AKfycby4WRBI1RbfDfn1I1RETLNAZk3u6dNN__n07j90pnfUE1hvTbljjAATcu-lOjUgJl2wcw/exec"
    );

    return response.data.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function calculateReport(rows, type) {
  let vegasYatirim = 0;
  let vegasCekim = 0;
  let vegasTeslimat = 0;

  let primeYatirim = 0;
  let primeCekim = 0;
  let primeTeslimat = 0;

  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const rowDate = new Date(row[1]);

    let include = false;

    if (type === "today") {
      include =
        rowDate.getFullYear() === now.getFullYear() &&
        rowDate.getMonth() === now.getMonth() &&
        rowDate.getDate() === now.getDate();
    }

    if (type === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      include =
        rowDate.getFullYear() === yesterday.getFullYear() &&
        rowDate.getMonth() === yesterday.getMonth() &&
        rowDate.getDate() === yesterday.getDate();
    }

    if (type === "week") {
      const monday = new Date(now);

      const day = monday.getDay();
      const diff = day === 0 ? 6 : day - 1;

      monday.setDate(monday.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      include = rowDate >= monday;
    }

    if (type === "month") {
      const firstDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      include = rowDate >= firstDay;
    }

    if (!include) continue;

    const marka = row[3];
    const islem = row[4];
    const tutar = Number(row[6]) || 0;

    if (marka === "VEGAS") {
      if (islem === "CRYPTO_YATIRIM") vegasYatirim += tutar;
      if (islem === "CRYPTO_CEKIM") vegasCekim += tutar;
      if (islem === "TESLIMAT") vegasTeslimat += tutar;
    }

    if (marka === "PRIME") {
      if (islem === "CRYPTO_YATIRIM") primeYatirim += tutar;
      if (islem === "CRYPTO_CEKIM") primeCekim += tutar;
      if (islem === "TESLIMAT") primeTeslimat += tutar;
    }
  }

  return `
🎰 VEGAS
💰 Yatırım: ${vegasYatirim.toLocaleString("tr-TR")} TL
💸 Çekim: ${vegasCekim.toLocaleString("tr-TR")} TL
📦 Teslimat: ${vegasTeslimat.toLocaleString("tr-TR")} TL

👑 PRIME
💰 Yatırım: ${primeYatirim.toLocaleString("tr-TR")} TL
💸 Çekim: ${primeCekim.toLocaleString("tr-TR")} TL
📦 Teslimat: ${primeTeslimat.toLocaleString("tr-TR")} TL
`;
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

bot.action("RAPORLAR", async (ctx) => {
  await ctx.editMessageText(
    "📊 Raporlar",
    Markup.inlineKeyboard([
      [Markup.button.callback("📅 Bugün", "RAPOR_BUGUN")],
      [Markup.button.callback("📅 Dün", "RAPOR_DUN")],
      [Markup.button.callback("📅 Bu Hafta", "RAPOR_HAFTA")],
      [Markup.button.callback("📅 Bu Ay", "RAPOR_AY")],
      [Markup.button.callback("🔙 Ana Menü", "ANA_MENU")]
    ])
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

bot.command("ekle", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");

    if (args.length < 3) {
      return ctx.reply(
        "Kullanım:\n/ekle Provider Tutar\n\nÖrnek:\n/ekle Şahin 500000"
      );
    }

    const provider = args[1];

    const amount = Number(
      args[2].replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(amount)) {
      return ctx.reply("❌ Geçerli bir tutar giriniz.");
    }

    const payload = {
      id: currentId++,
      kullanici:
        ctx.from.username ||
        `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim(),
      marka: "TAKVIYE",
      islemTipi: "TAKVIYE",
      provider: provider,
      tutar: amount
    };

    const saved = await saveToSheet(payload);

    if (!saved) {
      return ctx.reply("❌ Takviye kaydedilemedi.");
    }

    await ctx.reply(
      `✅ Takviye Kaydedildi

Provider: ${provider}
Tutar: ${amount.toLocaleString("tr-TR")} TL`
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Hata oluştu.");
  }
});

bot.action("RAPOR_BUGUN", async (ctx) => {
  const rows = await getSheetData();

  await ctx.reply(
    `📊 Bugün Raporu\n${calculateReport(rows, "today")}`
  );
});

bot.action("RAPOR_DUN", async (ctx) => {
  const rows = await getSheetData();

  await ctx.reply(
    `📊 Dün Raporu\n${calculateReport(rows, "yesterday")}`
  );
});

bot.action("RAPOR_HAFTA", async (ctx) => {
  const rows = await getSheetData();

  await ctx.reply(
    `📊 Bu Hafta\n${calculateReport(rows, "week")}`
  );
});

bot.action("RAPOR_AY", async (ctx) => {
  const rows = await getSheetData();

  await ctx.reply(
    `📊 Bu Ay\n${calculateReport(rows, "month")}`
  );
});

bot.launch();

console.log("VGSPRM Bot Aktif");
