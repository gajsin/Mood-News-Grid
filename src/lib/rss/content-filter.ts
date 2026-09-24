import { Article } from '@/types/news';

// Sensitive topics stop-words and regex patterns (Unicode-safe for Cyrillic)
// Politics, war, violence, crime, disaster, death, severe illness, accidents
const SENSITIVE_PATTERNS: RegExp[] = [
  // Война, вооружённые конфликты, военные действия
  /(?:войн[а-я]|военн[а-я]+|сво|всу|минобороны|обстрел[а-я]*|бомб[а-я]*|снаряд[а-я]*|дрон-камикадзе|пво|фронт[а-я]*|оружи[а-я]+|ракетами|удар[а-я]* по|теракт[а-я]*|террорист[а-я]*|оккупац[а-я]+)/iu,

  // Политика и госбезопасность, выборы, санкции, аресты
  /(?:путин[а-я]*|байден[а-я]*|трамп[а-я]*|зеленск[а-я]*|госдум[а-я]*|правительств[а-я]*|кремл[а-я]*|мид рф|санкци[а-я]+|иноагент[а-я]*|оппозици[а-я]*|митинг[а-я]*|выбор[а-я]*|белый дом|навальн[а-я]*)/iu,

  // Смерть, убийства, насилие, ранения, жертвы
  /(?:умер[ла-я]*|погиб[ла-я]*|смерт[а-я]*|убит[а-я]*|убийств[а-я]*|труп[а-я]*|похороны|казн[а-я]+|расстрел[а-я]*|жертв[а-я]*|ранен[а-я]*|пострадавш[а-я]*|скончал[а-я]*|покончил[а-я]*|самоубийств[а-я]*)/iu,

  // Преступления, криминал, суды, насилие
  /(?:криминал[а-я]*|изнасилован[а-я]*|педофил[а-я]*|ограблен[а-я]*|наркоти[а-я]*|тюрьм[а-я]*|заключенн[а-я]*|следственн[а-я]* комитет|уголовн[а-я]* дел[а-я]*|задержан[а-я]* полици[а-я]*|мошенни[а-я]+|взятк[а-я]*|коррупци[а-я]*)/iu,

  // Катастрофы, аварии, крушения, бедствия
  /(?:крушен[а-я]+|авари[а-я]+|дтп|взрыв[а-я]*|пожар[а-я]*|землетрясен[а-я]+|цунами|наводнен[а-я]+|эвакуаци[а-я]+|крушение самолета|катастроф[а-я]*|трагеди[а-я]*)/iu,

  // Тяжёлые заболевания, эпидемии, летальные исходы
  /(?:онкологи[а-я]+|рак третьей|рак четвёртой|терминальн[а-я]+|эпидеми[а-я]+|пандеми[а-я]+|ковид[а-я]*|заражени[а-я]+|чума|холер[а-я]*|летальн[а-я]+)/iu,
];

export interface SafetyCheckResult {
  isSafe: boolean;
  matchedReason?: string;
}

export function hasUsableArticleBody(title: string, text: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  const normalizedText = normalize(text);
  return normalizedText.length > 0 && normalizedText !== normalize(title);
}

export function checkArticleSafety(title: string, text: string): SafetyCheckResult {
  const combined = `${title} ${text}`;

  for (const pattern of SENSITIVE_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      return {
        isSafe: false,
        matchedReason: `Содержит чувствительный триггер: "${match[0]}"`,
      };
    }
  }

  return { isSafe: true };
}

export function filterSafeArticles(articles: Article[]): Article[] {
  return articles.filter((article) => {
    if (!hasUsableArticleBody(article.original_title, article.original_text)) {
      article.safety_status = 'rejected';
      return false;
    }

    const check = checkArticleSafety(article.original_title, article.original_text);
    if (!check.isSafe) {
      article.safety_status = 'rejected';
      return false;
    }
    article.safety_status = 'safe';
    return true;
  });
}
