import { describe, it, expect } from 'vitest';
import { checkArticleSafety, hasUsableArticleBody } from '@/lib/rss/content-filter';

describe('Sensitive Content Filter', () => {
  it('allows safe technological, science, cultural and sports news', () => {
    const safeNews = [
      { title: 'Российские ученые разработали новый кремниевый чип', text: 'Устройство работает в 2 раза быстрее предыдущей модели.' },
      { title: 'Футбольный клуб одержал победу со счетом 3:1', text: 'Матч прошел в теплой атмосфере на стадионе в Казани.' },
      { title: 'Открылась выставка современного искусства в Эрмитаже', text: 'Представлено более 150 полотен известных художников.' },
      { title: 'В Сочи запустили новый туристический маршрут', text: 'Длина тропы составляет 12 километров по реликтовому лесу.' },
    ];

    for (const item of safeNews) {
      const result = checkArticleSafety(item.title, item.text);
      expect(result.isSafe).toBe(true);
    }
  });

  it('rejects violent, political, disaster, and criminal topics', () => {
    const unsafeNews = [
      { title: 'В результате взрыва газа в здании погибли люди', text: 'Спасатели продолжают разбирать завалы на месте происшествия.' },
      { title: 'Полиция задержала подозреваемого в вооруженном ограблении', text: 'Возбуждено уголовное дело по статье о краже со взломом.' },
      { title: 'Госдума приняла новый закон о санкциях и выборах', text: 'Министерство иностранных дел РФ сделало заявление.' },
      { title: 'В регионе началась вспышка опасной эпидемии', text: 'Зафиксировано тяжелое заболевание и летальные случаи.' },
    ];

    for (const item of unsafeNews) {
      const result = checkArticleSafety(item.title, item.text);
      expect(result.isSafe).toBe(false);
      expect(result.matchedReason).toBeDefined();
    }
  });

  it('rejects an empty body or a feed item that only repeats its headline', () => {
    expect(hasUsableArticleBody('Заголовок', '')).toBe(false);
    expect(hasUsableArticleBody('Заголовок', '  Заголовок\n')).toBe(false);
    expect(hasUsableArticleBody('Заголовок', 'Самостоятельный исходный текст.')).toBe(true);
  });
});
