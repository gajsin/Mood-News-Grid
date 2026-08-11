import { getAllSafeArticles } from '../src/lib/db/repository';
import { syncFreshRssArticles } from '../src/lib/rss/sync';
import { CATEGORIES } from '../src/types/news';

async function runIngestion() {
  console.log('Обновление локального хранилища из живых RSS-лент...');
  await syncFreshRssArticles();

  const articles = await getAllSafeArticles();
  console.log(`Сохранено безопасных новостей: ${articles.length}`);
  for (const category of CATEGORIES) {
    const count = articles.filter((article) => article.category === category).length;
    console.log(`- ${category}: ${count}`);
  }
}

runIngestion().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Ошибка обновления RSS: ${message}`);
  process.exit(1);
});
