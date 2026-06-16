export type PeriodKey = "today" | "week" | "month" | "quarter";
export type DealStageId = "new" | "qualified" | "proposal" | "negotiation" | "contract" | "closed";
export type SourceChannel = "WhatsApp" | "Звонок" | "Instagram" | "Email";
export type Urgency = "Горячий" | "Тёплый" | "Холодный";
export type ContractStatus = "Активен" | "Истекает" | "Истёк" | "На согласовании";
export type NotificationType = "Критические" | "Важные" | "Информационные" | "AI-события";

export const periods: Array<{ id: PeriodKey; label: string; days: number }> = [
  { id: "today", label: "Сегодня", days: 1 },
  { id: "week", label: "Эта неделя", days: 7 },
  { id: "month", label: "Этот месяц", days: 31 },
  { id: "quarter", label: "Квартал", days: 92 },
];

export const stageLabels: Record<DealStageId, string> = {
  new: "Новый запрос",
  qualified: "Квалифицирован",
  proposal: "КП отправлено",
  negotiation: "Переговоры",
  contract: "Договор",
  closed: "Закрыт",
};

export const stageOrder: DealStageId[] = ["new", "qualified", "proposal", "negotiation", "contract", "closed"];

export interface SteppeClient {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  type: string;
  contractStatus: ContractStatus;
  contractDaysLeft: number;
  lastContact: string;
  notes: string;
}

export interface SteppeDeal {
  id: string;
  clientId: string;
  contact: string;
  company: string;
  source: SourceChannel;
  owner: string;
  stage: DealStageId;
  amount: number;
  ancillary: number;
  urgency: Urgency;
  lastContact: string;
  daysAgo: number;
  responseMinutes: number;
  summary: string;
  dialogue: string[];
}

export interface ChatMessage {
  id: string;
  author: "client" | "ai" | "manager";
  text: string;
  time: string;
}

export interface SteppeChat {
  id: string;
  clientId: string;
  contact: string;
  company: string;
  channel: "WhatsApp" | "Telegram";
  owner: "AI L2" | "Данияр Касымов" | "Айгерим Нурлан";
  lastMessage: string;
  lastAction: string;
  sentiment: "Заинтересован" | "Сомневается" | "Раздражён";
  facts: string[];
  summary: string;
  aiHints: string[];
  messages: ChatMessage[];
  activeAi: boolean;
  responseMinutes: number;
}

export interface SteppeNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface Contract {
  id: string;
  clientId: string;
  company: string;
  owner: string;
  value: number;
  status: ContractStatus;
  expiresInDays: number;
  nextStep: string;
}

export const steppeClients: SteppeClient[] = [
  {
    id: "kmg",
    company: "АО «КазМунайГаз»",
    contact: "Мадина Ержанова",
    phone: "+7 701 240 18 77",
    email: "m.yerzhanova@kmg.kz",
    type: "VIP корпоративный",
    contractStatus: "Истекает",
    contractDaysLeft: 28,
    lastContact: "Сегодня, 14:20",
    notes: "Ежеквартальные стратегические сессии, требуется быстрый SLA для руководства.",
  },
  {
    id: "samruk",
    company: "АО «Самрук-Қазына»",
    contact: "Руслан Ахметов",
    phone: "+7 777 105 44 21",
    email: "r.akhmetov@sk.kz",
    type: "Госхолдинг",
    contractStatus: "Активен",
    contractDaysLeft: 146,
    lastContact: "Сегодня, 12:05",
    notes: "Частые бронирования конференц-залов, чувствительны к протоколу и безопасности.",
  },
  {
    id: "astana-group",
    company: "ТОО «Astana Group»",
    contact: "Алия Сейдахмет",
    phone: "+7 705 333 90 12",
    email: "aliya@astanagroup.kz",
    type: "MICE",
    contractStatus: "На согласовании",
    contractDaysLeft: 0,
    lastContact: "Вчера, 18:40",
    notes: "Ищут площадку для запуска дилерской конференции на 120 гостей.",
  },
  {
    id: "bi-group",
    company: "BI Group",
    contact: "Ербол Мусин",
    phone: "+7 701 771 28 91",
    email: "e.musin@bi.group",
    type: "Корпоративный",
    contractStatus: "Активен",
    contractDaysLeft: 221,
    lastContact: "Сегодня, 09:35",
    notes: "Регулярные командировки проектных команд, нужен апселл завтраков.",
  },
  {
    id: "kaspi",
    company: "Kaspi.kz",
    contact: "Динара Омарова",
    phone: "+7 747 650 22 10",
    email: "d.omarova@kaspi.kz",
    type: "Tech / корпоративный",
    contractStatus: "Активен",
    contractDaysLeft: 89,
    lastContact: "2 дня назад",
    notes: "Предпочитают быстрые коммерческие предложения и электронный документооборот.",
  },
  {
    id: "air-astana",
    company: "Air Astana",
    contact: "Тимур Сабиров",
    phone: "+7 727 244 44 77",
    email: "t.sabirov@airastana.com",
    type: "Экипажи",
    contractStatus: "Истёк",
    contractDaysLeft: -12,
    lastContact: "5 дней назад",
    notes: "Возобновление рамочного договора зависит от тарифа на ранние заезды.",
  },
  {
    id: "kazpost",
    company: "АО «Казпочта»",
    contact: "Жанар Тулеген",
    phone: "+7 701 908 45 31",
    email: "z.tulegen@post.kz",
    type: "Госкомпания",
    contractStatus: "На согласовании",
    contractDaysLeft: 0,
    lastContact: "Сегодня, 11:10",
    notes: "Нужен зал на 80 человек, кофе-брейки и трансфер для региональных директоров.",
  },
  {
    id: "halyk",
    company: "Halyk Bank",
    contact: "Сауле Муханова",
    phone: "+7 701 550 70 01",
    email: "s.mukhanova@halykbank.kz",
    type: "Финансовый сектор",
    contractStatus: "Активен",
    contractDaysLeft: 63,
    lastContact: "Сегодня, 16:05",
    notes: "VIP-размещение для руководства и переговорные с приватным сервисом.",
  },
];

export const initialDeals: SteppeDeal[] = [
  {
    id: "d-001",
    clientId: "kmg",
    contact: "Мадина Ержанова",
    company: "АО «КазМунайГаз»",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "negotiation",
    amount: 8400000,
    ancillary: 1160000,
    urgency: "Горячий",
    lastContact: "Сегодня, 14:20",
    daysAgo: 0,
    responseMinutes: 4,
    summary: "VIP-клиент запрашивает 24 номера и зал «Сарыарка» на совет директоров.",
    dialogue: ["Клиент уточнил приватный вход", "AI L2 предложил этаж без соседних групп", "Ожидается подтверждение меню к 18:00"],
  },
  {
    id: "d-002",
    clientId: "samruk",
    contact: "Руслан Ахметов",
    company: "АО «Самрук-Қазына»",
    source: "Звонок",
    owner: "Данияр Касымов",
    stage: "contract",
    amount: 12600000,
    ancillary: 1840000,
    urgency: "Горячий",
    lastContact: "Сегодня, 12:05",
    daysAgo: 0,
    responseMinutes: 9,
    summary: "Конференц-зал на 80 человек, 38 номеров, договор у юристов клиента.",
    dialogue: ["Менеджер согласовал тариф", "Юристы запросили пункт по отмене", "Следующий шаг — финальная редакция договора"],
  },
  {
    id: "d-003",
    clientId: "astana-group",
    contact: "Алия Сейдахмет",
    company: "ТОО «Astana Group»",
    source: "Instagram",
    owner: "AI L1",
    stage: "qualified",
    amount: 5200000,
    ancillary: 740000,
    urgency: "Тёплый",
    lastContact: "Сегодня, 17:15",
    daysAgo: 0,
    responseMinutes: 2,
    summary: "Новая заявка на презентацию автомобилей и фуршет для 120 гостей.",
    dialogue: ["AI L1 уточнил дату", "Клиент попросил два варианта рассадки", "Лид готов к передаче AI L2"],
  },
  {
    id: "d-004",
    clientId: "bi-group",
    contact: "Ербол Мусин",
    company: "BI Group",
    source: "Email",
    owner: "Айгерим Нурлан",
    stage: "closed",
    amount: 6800000,
    ancillary: 920000,
    urgency: "Тёплый",
    lastContact: "Сегодня, 09:35",
    daysAgo: 0,
    responseMinutes: 18,
    summary: "Закрыта серия командировок проектной группы на 16 номеров.",
    dialogue: ["Согласован тариф с завтраком", "Клиент подтвердил трансфер", "Счёт отправлен в бухгалтерию"],
  },
  {
    id: "d-005",
    clientId: "halyk",
    contact: "Сауле Муханова",
    company: "Halyk Bank",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "proposal",
    amount: 7400000,
    ancillary: 860000,
    urgency: "Горячий",
    lastContact: "Сегодня, 16:05",
    daysAgo: 0,
    responseMinutes: 3,
    summary: "VIP-размещение правления, клиент сравнивает junior suite и deluxe.",
    dialogue: ["AI L2 предложил апгрейд в Deluxe", "Клиент запросил тишину на этаже", "Нужно отправить КП до конца дня"],
  },
  {
    id: "d-006",
    clientId: "kazpost",
    contact: "Жанар Тулеген",
    company: "АО «Казпочта»",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "new",
    amount: 3900000,
    ancillary: 620000,
    urgency: "Тёплый",
    lastContact: "Сегодня, 11:10",
    daysAgo: 0,
    responseMinutes: 5,
    summary: "Региональные директора, нужен зал на 80 гостей и кофе-брейк.",
    dialogue: ["AI L2 принял запрос", "Клиент уточняет бюджет", "Следующий шаг — квалификация по дате"],
  },
  {
    id: "d-007",
    clientId: "kaspi",
    contact: "Динара Омарова",
    company: "Kaspi.kz",
    source: "Email",
    owner: "AI L2",
    stage: "closed",
    amount: 9100000,
    ancillary: 1220000,
    urgency: "Тёплый",
    lastContact: "Вчера, 18:10",
    daysAgo: 1,
    responseMinutes: 6,
    summary: "Закрыта продуктовая встреча на 42 гостя с апселлом кофе-станции.",
    dialogue: ["AI L2 отправил КП", "Клиент выбрал пакет с трансфером", "Оплата подтверждена"],
  },
  {
    id: "d-008",
    clientId: "air-astana",
    contact: "Тимур Сабиров",
    company: "Air Astana",
    source: "Звонок",
    owner: "Данияр Касымов",
    stage: "negotiation",
    amount: 15500000,
    ancillary: 2100000,
    urgency: "Холодный",
    lastContact: "2 дня назад",
    daysAgo: 2,
    responseMinutes: 22,
    summary: "Возобновление договора по экипажам, клиент давит на ранний заезд без доплаты.",
    dialogue: ["Менеджер предложил гибкий тариф", "Клиент сравнивает с конкурентом", "Нужен вариант с лимитом ранних заездов"],
  },
  {
    id: "d-009",
    clientId: "kmg",
    contact: "Мадина Ержанова",
    company: "АО «КазМунайГаз»",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "closed",
    amount: 11200000,
    ancillary: 1680000,
    urgency: "Горячий",
    lastContact: "3 дня назад",
    daysAgo: 3,
    responseMinutes: 4,
    summary: "Закрыто размещение делегации из Атырау на 31 номеро-ночь.",
    dialogue: ["AI L2 предложил поздний выезд", "Клиент подтвердил номера", "Дополнительная выручка — трансфер и завтраки"],
  },
  {
    id: "d-010",
    clientId: "samruk",
    contact: "Руслан Ахметов",
    company: "АО «Самрук-Қазына»",
    source: "Email",
    owner: "Айгерим Нурлан",
    stage: "proposal",
    amount: 4700000,
    ancillary: 510000,
    urgency: "Тёплый",
    lastContact: "4 дня назад",
    daysAgo: 4,
    responseMinutes: 16,
    summary: "Запрос на обучение проектного офиса, КП отправлено с двумя пакетами.",
    dialogue: ["Клиент запросил проектор и синхронный перевод", "КП отправлено", "Ожидается обратная связь"],
  },
  {
    id: "d-011",
    clientId: "astana-group",
    contact: "Алия Сейдахмет",
    company: "ТОО «Astana Group»",
    source: "Instagram",
    owner: "AI L1",
    stage: "new",
    amount: 6300000,
    ancillary: 970000,
    urgency: "Холодный",
    lastContact: "5 дней назад",
    daysAgo: 5,
    responseMinutes: 7,
    summary: "Свадьба на 150 гостей, лид ранний, требуется уточнение бюджета.",
    dialogue: ["Клиент спросил свободные даты", "AI L1 запросил формат банкета", "Нужна квалификация"],
  },
  {
    id: "d-012",
    clientId: "bi-group",
    contact: "Ербол Мусин",
    company: "BI Group",
    source: "WhatsApp",
    owner: "Айгерим Нурлан",
    stage: "contract",
    amount: 5800000,
    ancillary: 680000,
    urgency: "Тёплый",
    lastContact: "6 дней назад",
    daysAgo: 6,
    responseMinutes: 14,
    summary: "Серия тренингов для руководителей проектов, договор на подписи у клиента.",
    dialogue: ["Подтверждены даты", "Добавлен кофе-брейк", "Остался акт согласования"],
  },
  {
    id: "d-013",
    clientId: "halyk",
    contact: "Сауле Муханова",
    company: "Halyk Bank",
    source: "Звонок",
    owner: "Данияр Касымов",
    stage: "closed",
    amount: 13200000,
    ancillary: 1960000,
    urgency: "Горячий",
    lastContact: "8 дней назад",
    daysAgo: 8,
    responseMinutes: 11,
    summary: "Закрыта закрытая стратегическая сессия с приватной зоной и трансфером.",
    dialogue: ["Данияр согласовал приватную зону", "Клиент подтвердил список гостей", "Сделка закрыта"],
  },
  {
    id: "d-014",
    clientId: "kazpost",
    contact: "Жанар Тулеген",
    company: "АО «Казпочта»",
    source: "Email",
    owner: "AI L2",
    stage: "qualified",
    amount: 4400000,
    ancillary: 390000,
    urgency: "Холодный",
    lastContact: "12 дней назад",
    daysAgo: 12,
    responseMinutes: 8,
    summary: "Квалифицирован запрос на обучение региональных координаторов.",
    dialogue: ["AI L2 уточнил количество гостей", "Клиент просит скидку", "Ожидается решение по бюджету"],
  },
  {
    id: "d-015",
    clientId: "kaspi",
    contact: "Динара Омарова",
    company: "Kaspi.kz",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "closed",
    amount: 7600000,
    ancillary: 890000,
    urgency: "Тёплый",
    lastContact: "18 дней назад",
    daysAgo: 18,
    responseMinutes: 5,
    summary: "Закрыто размещение IT-команды на релизный спринт.",
    dialogue: ["AI L2 предложил питание в переговорной", "Клиент принял апселл", "Счёт оплачен"],
  },
  {
    id: "d-016",
    clientId: "air-astana",
    contact: "Тимур Сабиров",
    company: "Air Astana",
    source: "Email",
    owner: "Данияр Касымов",
    stage: "proposal",
    amount: 9800000,
    ancillary: 710000,
    urgency: "Холодный",
    lastContact: "25 дней назад",
    daysAgo: 25,
    responseMinutes: 26,
    summary: "КП на экипажи отправлено, клиент ждет подтверждение бюджета.",
    dialogue: ["Предложены два тарифа", "Клиент просит ранний заезд", "Риск ухода к конкуренту"],
  },
  {
    id: "d-017",
    clientId: "samruk",
    contact: "Руслан Ахметов",
    company: "АО «Самрук-Қазына»",
    source: "Звонок",
    owner: "Айгерим Нурлан",
    stage: "closed",
    amount: 17400000,
    ancillary: 2450000,
    urgency: "Горячий",
    lastContact: "48 дней назад",
    daysAgo: 48,
    responseMinutes: 13,
    summary: "Квартальная стратегическая сессия закрыта с полным банкетным пакетом.",
    dialogue: ["Подписан договор", "Клиент добавил банкет", "Сделка закрыта без скидки"],
  },
  {
    id: "d-018",
    clientId: "kmg",
    contact: "Мадина Ержанова",
    company: "АО «КазМунайГаз»",
    source: "WhatsApp",
    owner: "AI L2",
    stage: "closed",
    amount: 14900000,
    ancillary: 1980000,
    urgency: "Горячий",
    lastContact: "62 дня назад",
    daysAgo: 62,
    responseMinutes: 4,
    summary: "Закрыто размещение правления с индивидуальными трансферами.",
    dialogue: ["AI L2 удержал тариф без скидки", "Клиент взял трансфер", "Сделка закрыта"],
  },
];

export const initialChats: SteppeChat[] = [
  {
    id: "chat-kmg",
    clientId: "kmg",
    contact: "Мадина Ержанова",
    company: "АО «КазМунайГаз»",
    channel: "WhatsApp",
    owner: "AI L2",
    lastMessage: "Нужно понять, можно ли сделать отдельный вход для правления.",
    lastAction: "предложил номер Делюкс и приватный этаж",
    sentiment: "Заинтересован",
    facts: ["Заезд: 24 июня", "24 номера", "Бюджет: до 9,5 млн ₸", "Нужен приватный вход"],
    summary: "Клиент готовит совет директоров. Важны приватность, отдельная регистрация, быстрый ответ по меню. Следующий шаг — подтвердить приватный вход и отправить обновлённое КП.",
    aiHints: [
      "Мадина, можем закрыть этаж и организовать отдельную регистрацию. Отправить вам обновлённое КП до 18:00?",
      "Предлагаю зафиксировать Deluxe по текущему тарифу и добавить приватный трансфер для правления.",
      "Подтвердите, пожалуйста, список VIP-гостей — я заранее подготовлю отдельный check-in.",
    ],
    messages: [
      { id: "m1", author: "client", text: "Добрый день. Нам нужен зал и размещение для совета директоров на 24 июня.", time: "14:03" },
      { id: "m2", author: "ai", text: "Мадина, добрый день. На 24 июня доступен зал «Сарыарка» и 24 номера на одном этаже. Предварительная стоимость — 8,4 млн ₸.", time: "14:04" },
      { id: "m3", author: "client", text: "Важно, чтобы руководство не пересекалось с другими группами.", time: "14:16" },
      { id: "m4", author: "ai", text: "Можем закрыть этаж и организовать отдельную регистрацию. Также предложу Deluxe для правления без смены корпуса.", time: "14:18" },
      { id: "m5", author: "client", text: "Нужно понять, можно ли сделать отдельный вход для правления.", time: "14:20" },
    ],
    activeAi: true,
    responseMinutes: 4,
  },
  {
    id: "chat-halyk",
    clientId: "halyk",
    contact: "Сауле Муханова",
    company: "Halyk Bank",
    channel: "Telegram",
    owner: "AI L2",
    lastMessage: "Если Deluxe тихий, отправьте расчёт с завтраками.",
    lastAction: "сравнил Junior Suite и Deluxe",
    sentiment: "Сомневается",
    facts: ["Заезд: 19 июня", "6 VIP-гостей", "3 ночи", "Нужны завтраки и тихий этаж"],
    summary: "Клиент выбирает между Junior Suite и Deluxe для правления. Главное возражение — шум и скорость подтверждения. Следующий шаг — отправить расчёт Deluxe с завтраками и гарантией тихого этажа.",
    aiHints: [
      "Сауле, Deluxe расположен в тихом крыле. Добавляю завтраки и фиксирую тариф на 24 часа.",
      "Можем показать разницу по двум категориям в одном КП, чтобы вам было проще согласовать.",
      "Если подтвердите до 17:00, забронируем тихий этаж без предоплаты до завтра.",
    ],
    messages: [
      { id: "m1", author: "client", text: "Нужно разместить 6 гостей правления. Есть тихие номера?", time: "15:41" },
      { id: "m2", author: "ai", text: "Да, на 19–22 июня доступны Junior Suite и Deluxe в тихом крыле. Deluxe даст больше приватности и быстрый доступ к переговорной.", time: "15:42" },
      { id: "m3", author: "client", text: "Если Deluxe тихий, отправьте расчёт с завтраками.", time: "16:05" },
    ],
    activeAi: true,
    responseMinutes: 3,
  },
  {
    id: "chat-kazpost",
    clientId: "kazpost",
    contact: "Жанар Тулеген",
    company: "АО «Казпочта»",
    channel: "WhatsApp",
    owner: "AI L2",
    lastMessage: "Нам нужно уложиться в 3,8 млн ₸, иначе пойдём в другой отель.",
    lastAction: "уточнил бюджет и формат кофе-брейка",
    sentiment: "Раздражён",
    facts: ["80 участников", "1 день", "Бюджет: 3,8 млн ₸", "Кофе-брейк обязателен"],
    summary: "Клиент ограничен бюджетом и раздражён из-за медленного согласования. Риск потери высокий. Следующий шаг — предложить пакет с сокращённым меню и сохранить зал без штрафа до завтра.",
    aiHints: [
      "Жанар, можем уложиться в 3,8 млн ₸: зал, базовый кофе-брейк и 10% скидка на трансфер.",
      "Я зафиксирую зал до завтра без предоплаты, чтобы вы успели согласовать бюджет.",
      "Если важно снизить чек, уберём второй кофе-брейк и сохраним основной сервис.",
    ],
    messages: [
      { id: "m1", author: "client", text: "Нужен зал на 80 региональных директоров и кофе-брейк.", time: "10:50" },
      { id: "m2", author: "ai", text: "Жанар, доступен зал «Бәйтерек». Пакет с кофе-брейком и оборудованием — 3,9 млн ₸.", time: "10:55" },
      { id: "m3", author: "client", text: "Нам нужно уложиться в 3,8 млн ₸, иначе пойдём в другой отель.", time: "11:10" },
    ],
    activeAi: true,
    responseMinutes: 5,
  },
  {
    id: "chat-bi",
    clientId: "bi-group",
    contact: "Ербол Мусин",
    company: "BI Group",
    channel: "Telegram",
    owner: "Айгерим Нурлан",
    lastMessage: "Подтверждаю, завтраки включаем для всех 16 гостей.",
    lastAction: "менеджер согласовал апселл завтраков",
    sentiment: "Заинтересован",
    facts: ["16 гостей", "5 ночей", "Завтраки для всех", "Нужен один трансфер"],
    summary: "Сделка почти закрыта. Клиент подтвердил завтраки и ждёт счёт с трансфером. Следующий шаг — отправить счёт и забронировать минивэн.",
    aiHints: [
      "Ербол, включаю завтраки и один трансфер. Счёт отправлю сегодня до 17:30.",
      "Зафиксирую 16 номеров на 5 ночей и добавлю контакт водителя в день заезда.",
      "Можем добавить комнату для коротких планёрок без доплаты на первый день.",
    ],
    messages: [
      { id: "m1", author: "manager", text: "Ербол, можем добавить завтраки по 7 500 ₸ на гостя.", time: "09:12" },
      { id: "m2", author: "client", text: "Подтверждаю, завтраки включаем для всех 16 гостей.", time: "09:35" },
    ],
    activeAi: false,
    responseMinutes: 18,
  },
];

export const steppeNotifications: SteppeNotification[] = [
  {
    id: "n-001",
    type: "Критические",
    title: "VIP-клиент АО «КазМунайГаз» не получил подтверждение приватного входа",
    description: "Диалог активен 2 часа, сумма потенциальной сделки 8,4 млн ₸.",
    time: "12 минут назад",
    read: false,
  },
  {
    id: "n-002",
    type: "Важные",
    title: "Договор с АО «КазМунайГаз» истекает через 28 дней",
    description: "Рекомендуется подготовить продление до конца недели.",
    time: "35 минут назад",
    read: false,
  },
  {
    id: "n-003",
    type: "AI-события",
    title: "AI L2 передал тёплого лида менеджеру Данияру",
    description: "АО «Самрук-Қазына»: конференц-зал на 80 человек, договор на 12,6 млн ₸.",
    time: "1 час назад",
    read: false,
  },
  {
    id: "n-004",
    type: "Информационные",
    title: "Новая заявка из Instagram: свадьба на 150 гостей",
    description: "ТОО «Astana Group» интересуется банкетным залом в августе.",
    time: "2 часа назад",
    read: true,
  },
  {
    id: "n-005",
    type: "Критические",
    title: "АО «Казпочта» ограничила бюджет и угрожает уйти к конкуренту",
    description: "Нужно предложить пакет за 3,8 млн ₸ и удержать зал до завтра.",
    time: "Сегодня, 11:16",
    read: false,
  },
  {
    id: "n-006",
    type: "AI-события",
    title: "AI L2 увеличил чек Kaspi.kz за счёт кофе-станции",
    description: "Дополнительная выручка по закрытой сделке: 1,22 млн ₸.",
    time: "Вчера, 18:30",
    read: true,
  },
];

export const contracts: Contract[] = [
  { id: "c-001", clientId: "kmg", company: "АО «КазМунайГаз»", owner: "Данияр Касымов", value: 48200000, status: "Истекает", expiresInDays: 28, nextStep: "Подготовить продление и тарифы на Q3" },
  { id: "c-002", clientId: "samruk", company: "АО «Самрук-Қазына»", owner: "Айгерим Нурлан", value: 63500000, status: "Активен", expiresInDays: 146, nextStep: "Плановый контакт через 14 дней" },
  { id: "c-003", clientId: "astana-group", company: "ТОО «Astana Group»", owner: "AI L2", value: 18400000, status: "На согласовании", expiresInDays: 0, nextStep: "Дожать пакет мероприятия без скидки" },
  { id: "c-004", clientId: "air-astana", company: "Air Astana", owner: "Данияр Касымов", value: 37700000, status: "Истёк", expiresInDays: -12, nextStep: "Вернуть клиента через гибкий тариф раннего заезда" },
  { id: "c-005", clientId: "kaspi", company: "Kaspi.kz", owner: "AI L2", value: 29100000, status: "Активен", expiresInDays: 89, nextStep: "Предложить релизный пакет на следующий квартал" },
];

export const revenueSeries = [
  { period: "Март", direct: 32800000, ancillary: 4200000 },
  { period: "Апрель", direct: 41700000, ancillary: 5900000 },
  { period: "Май", direct: 46300000, ancillary: 7100000 },
  { period: "Июнь", direct: 52900000, ancillary: 8460000 },
];

export const formatTenge = (value: number) =>
  new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);

export const getPeriodDays = (period: PeriodKey) => periods.find((item) => item.id === period)?.days ?? 31;

export const filterDealsByPeriod = (deals: SteppeDeal[], period: PeriodKey) => {
  const days = getPeriodDays(period);
  return deals.filter((deal) => deal.daysAgo < days);
};

export const getReachedStageCount = (deals: SteppeDeal[], stage: DealStageId) => {
  const stageIndex = stageOrder.indexOf(stage);
  return deals.filter((deal) => stageOrder.indexOf(deal.stage) >= stageIndex).length;
};
