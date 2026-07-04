import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL;

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
if (!miniAppUrl) throw new Error("MINI_APP_URL is required");

const bot = new Bot(token);

const TEXT = {
  uz: {
    welcome: "Filmni Top o'yiniga xush kelibsiz!\nFilmdan kadr ko'rasiz va nomini topishingiz kerak.",
    play: "🎬 O'ynash",
  },
  ru: {
    welcome: "Добро пожаловать в игру «Угадай фильм»!\nВы увидите кадр из фильма и должны угадать его название.",
    play: "🎬 Играть",
  },
};

function textFor(languageCode: string | undefined) {
  return languageCode?.startsWith("ru") ? TEXT.ru : TEXT.uz;
}

bot.command("start", async (ctx) => {
  const t = textFor(ctx.from?.language_code);
  const keyboard = new InlineKeyboard().webApp(t.play, miniAppUrl);
  await ctx.reply(t.welcome, { reply_markup: keyboard });
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

bot.start();
console.log("Bot started");
