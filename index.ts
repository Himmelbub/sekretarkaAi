import 'dotenv/config';
// import * as Langtrace from '@langtrase/typescript-sdk';
import { createEvent, fetchEvents } from './gcal';
import {
  ContextChatEngine,
  Document,
  Gemini,
  GEMINI_MODEL,
  Settings,
  VectorStoreIndex,
} from 'llamaindex';
import { extractJSON, getFormattedDate } from './utils';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'process';
import { eventTemplate } from './templates';

// Langtrace.init({ api_key: process.env.LANGTRACE_API_KEY });

// Update chunk size

Settings.llm = new Gemini({
  model: GEMINI_MODEL.GEMINI_PRO,
});

Settings.chunkSize = 512;

const role = `Twoja rola to asystentka która zarządza spotkanami w moim kalendarzu google. Dzisiaj mamy ${getFormattedDate()}`;

const prompt = (eventsSummary: string) => `
1) Jeżeli uzytkownik zaproponował dzień lub datę spotkania przejdź do punktu 2 w innym przypadku zapytaj o cel i termin spotkania.
2) Przeanalizuj zajęte terminy z kalendarza: "${eventsSummary}", i zaproponuj w trzech punktach 3 możliwe wolne terminy w nabliższym czasie.
3) Zaproponuj trzy daty spotkania, podając dzień tygodnia i godzinę (np: wtorek, 19 maja 2024), nie każ użytkownikowi czekać, odpowiedz natychmiast!.
4) Pozwól użytkownikowi wybrać jeden z proponowanych terminów, wskazując numer propozycji.
5) Koniecznie! poproś o potwierdzenie terminu spotkania słowem kluczowym "TAK". Słowo "TAK" musi być wypisane wielkimi literami. i kończy konwersację.
6) W oparciu o wybrany termin stwórz kod JSON zgodny z szablonem ${JSON.stringify(eventTemplate)} wstawiając opowiednie daty w pola start i end dateTime
7) W przypadku innych pytań opowiedz że twoją rola jest tylko i wyłacznie ustalenie terminu spotkania.
9) Nie wysyłaj żadnych pozycji z listy z datami. Użytkownik może tylko otrzymać nowe propozycje terminów spotkania.
10) Bardzo ważne - nowe spotkania nie mogą kolidować z już istniejącymi w kalendarzu!`;

export async function useAIChat(eventsSummary: string, query: string) {
  const createNewContext = async () => {
    const document = new Document({
      text: `${role}. ${prompt(eventsSummary)} . `,
    });
    const index = await VectorStoreIndex.fromDocuments([document]);
    const retriever = index.asRetriever();
    retriever.similarityTopK = 5;
    return new ContextChatEngine({ retriever });
  };

  let chatEngine = await createNewContext();
  const rl = createInterface({ input, output });

  let done = false;
  while (!done) {
    const query = await rl.question('Query: ');
    const stream = await chatEngine.chat({ message: query, stream: true });
    let response = '';
    for await (const chunk of stream) {
      response += chunk.response;
    }

    const responseData = extractJSON(response);

    console.log(responseData.text);

    if (query === 'TAK' && responseData.data) {
      console.log('Creating event...', responseData.data);
      const newEvent = await createEvent(responseData.data);
      console.log(newEvent);
      rl.close(); // Close the readline interface
      chatEngine = await createNewContext();
      done = true;
      run();
    }
  }
}

async function run() {
  const eventsSummary = await fetchEvents();
  console.log(eventsSummary);
  await useAIChat(eventsSummary, '');
}

run();
