(function (global) {
  "use strict";

  const quotes = [
    {
      id: "plotinus-inner-statue",
      textZh: "回到你自己，向内观看；如果你尚未发现自己是美的，就像雕塑家那样，继续削去、校正、净化，直到神性的光辉显现。",
      textOriginal: "Withdraw into yourself and look... never cease working at your statue until the divine glory of virtue shines out on you.",
      authorZh: "普罗提诺",
      authorEn: "Plotinus",
      period: "古典晚期｜约204–270",
      country: "古希腊—罗马",
      discipline: "哲学家",
      sourceUrl: "https://en.wikiquote.org/wiki/Plotinus",
      sourceTitle: "《九章集》第一卷·论美"
    },
    {
      id: "leonardo-hand-spirit",
      textZh: "手若没有精神的引领，就不会产生艺术。",
      textOriginal: "Where the spirit does not work with the hand, there is no art.",
      authorZh: "列奥纳多·达·芬奇",
      authorEn: "Leonardo da Vinci",
      period: "文艺复兴｜1452–1519",
      country: "意大利",
      discipline: "艺术家、工程师",
      sourceUrl: "https://en.wikiquote.org/wiki/Leonardo_da_Vinci",
      sourceTitle: "Leonardo da Vinci — Wikiquote"
    },
    {
      id: "michelangelo-mind-hand",
      textZh: "人是用头脑作画，而不是只用双手。",
      textOriginal: "A man paints with his brains and not with his hands.",
      authorZh: "米开朗基罗",
      authorEn: "Michelangelo Buonarroti",
      period: "文艺复兴｜1475–1564",
      country: "意大利",
      discipline: "雕塑家、画家",
      sourceUrl: "https://en.wikiquote.org/wiki/Michelangelo",
      sourceTitle: "Michelangelo — Wikiquote"
    },
    {
      id: "hokusai-forms-of-things",
      textZh: "六岁起，我便迷恋描画万物的形态。",
      textOriginal: "From the age of six I had a mania for drawing the forms of things.",
      authorZh: "葛饰北斋",
      authorEn: "Katsushika Hokusai",
      period: "江户时代｜1760–1849",
      country: "日本",
      discipline: "浮世绘艺术家",
      sourceUrl: "https://en.wikiquote.org/wiki/Hokusai",
      sourceTitle: "Hokusai — Wikiquote；《富岳百景》跋"
    },
    {
      id: "rodin-to-be-moved",
      textZh: "最重要的是被感动：去爱、去希望、去战栗、去生活。",
      textOriginal: "The main thing is to be moved, to love, to hope, to tremble, to live.",
      authorZh: "奥古斯特·罗丹",
      authorEn: "Auguste Rodin",
      period: "19世纪｜1840–1917",
      country: "法国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Auguste_Rodin",
      sourceTitle: "Auguste Rodin — Wikiquote；《艺术：与保罗·格塞尔的谈话》"
    },
    {
      id: "rodin-patience",
      textZh: "艺术家只需要眼睛与耐心：眼睛用来观看，耐心用来坚持。",
      textOriginal: "The artist must have eyes and patience: eyes to see and patience to persevere.",
      authorZh: "奥古斯特·罗丹",
      authorEn: "Auguste Rodin",
      period: "19世纪｜1840–1917",
      country: "法国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Auguste_Rodin",
      sourceTitle: "《Art》— Auguste Rodin / Paul Gsell"
    },
    {
      id: "kollwitz-effect",
      textZh: "我愿在自己的时代发挥作用；那是人们如此困惑、如此需要帮助的时代。",
      textOriginal: "I want to have an effect during this age, in which people are so perplexed and in need of help.",
      authorZh: "凯绥·珂勒惠支",
      authorEn: "Käthe Kollwitz",
      period: "现代主义｜1867–1945",
      country: "德国",
      discipline: "版画家、雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/K%C3%A4the_Kollwitz",
      sourceTitle: "Käthe Kollwitz — Wikiquote；日记与书信"
    },
    {
      id: "brancusi-essence",
      textZh: "真实并不在外部形态，而在事物的本质。",
      textOriginal: "What is real is not the external form, but the essence of things.",
      authorZh: "康斯坦丁·布朗库西",
      authorEn: "Constantin Brâncuși",
      period: "现代主义｜1876–1957",
      country: "罗马尼亚—法国",
      discipline: "雕塑家",
      sourceUrl: "https://www.guggenheim.org/artwork/artist/constantin-brancusi",
      sourceTitle: "Constantin Brancusi — Solomon R. Guggenheim Museum"
    },
    {
      id: "brancusi-simplicity",
      textZh: "简洁不是艺术的终点，而是抵达事物本质后自然呈现的状态。",
      textOriginal: "Simplicity is not an end in art, but we usually arrive at simplicity as we approach the true sense of things.",
      authorZh: "康斯坦丁·布朗库西",
      authorEn: "Constantin Brâncuși",
      period: "现代主义｜1876–1957",
      country: "罗马尼亚—法国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Constantin_Br%C3%A2ncu%C8%99i",
      sourceTitle: "Constantin Brâncuși — Wikiquote"
    },
    {
      id: "klee-makes-visible",
      textZh: "艺术并不再现可见之物，而是使不可见者成为可见。",
      textOriginal: "Art does not reproduce the visible; rather, it makes visible.",
      authorZh: "保罗·克利",
      authorEn: "Paul Klee",
      period: "现代主义｜1879–1940",
      country: "瑞士—德国",
      discipline: "画家、艺术理论家",
      sourceUrl: "https://en.wikiquote.org/wiki/Paul_Klee",
      sourceTitle: "Paul Klee — Wikiquote；《Creative Credo》"
    },
    {
      id: "moore-mystery",
      textZh: "所有艺术都应保有某种神秘，并向观看者提出要求。",
      textOriginal: "All art should have a certain mystery and should make demands on the spectator.",
      authorZh: "亨利·摩尔",
      authorEn: "Henry Moore",
      period: "现代主义｜1898–1986",
      country: "英国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Henry_Moore",
      sourceTitle: "Henry Moore — Wikiquote"
    },
    {
      id: "moore-nature",
      textZh: "观察自然是艺术家生命的一部分，它扩充形态知识，使人保持新鲜，也避免只靠公式工作。",
      textOriginal: "The observation of nature is part of an artist's life; it enlarges his form-knowledge, keeps him fresh and prevents him from working only by formula.",
      authorZh: "亨利·摩尔",
      authorEn: "Henry Moore",
      period: "现代主义｜1898–1986",
      country: "英国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Henry_Moore",
      sourceTitle: "Henry Moore: Ideas for Sculpture — Henry Moore Foundation"
    },
    {
      id: "hepworth-sculptor-landscape",
      textZh: "我，作为雕塑家，就是风景；我不再与它分离。",
      textOriginal: "I, the sculptor, am the landscape. I am no longer apart from it.",
      authorZh: "芭芭拉·赫普沃斯",
      authorEn: "Barbara Hepworth",
      period: "现代主义｜1903–1975",
      country: "英国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Barbara_Hepworth",
      sourceTitle: "Barbara Hepworth: Art & Life — Tate"
    },
    {
      id: "noguchi-everything-sculpture",
      textZh: "一切都可以是雕塑：任何材料、任何想法，只要不受阻碍地诞生于空间之中。",
      textOriginal: "Everything is sculpture. Any material, any idea without hindrance born into space, I consider sculpture.",
      authorZh: "野口勇",
      authorEn: "Isamu Noguchi",
      period: "现代主义｜1904–1988",
      country: "日本—美国",
      discipline: "雕塑家、景观设计师",
      sourceUrl: "https://www.noguchi.org/isamu-noguchi/",
      sourceTitle: "Isamu Noguchi — The Noguchi Museum；《A Sculptor's World》"
    },
    {
      id: "giacometti-seeing",
      textZh: "我工作得越多，观看的方式就越不同。",
      textOriginal: "The more I work, the more I see differently.",
      authorZh: "阿尔贝托·贾科梅蒂",
      authorEn: "Alberto Giacometti",
      period: "现代主义｜1901–1966",
      country: "瑞士—法国",
      discipline: "雕塑家、画家",
      sourceUrl: "https://en.wikiquote.org/wiki/Alberto_Giacometti",
      sourceTitle: "Alberto Giacometti — Fondation Giacometti"
    },
    {
      id: "bourgeois-sanity",
      textZh: "艺术是心智健全的保证。",
      textOriginal: "Art is a guarantee of sanity.",
      authorZh: "路易丝·布尔乔亚",
      authorEn: "Louise Bourgeois",
      period: "现代—当代｜1911–2010",
      country: "法国—美国",
      discipline: "雕塑家、装置艺术家",
      sourceUrl: "https://www.tate.org.uk/art/artists/louise-bourgeois-2351/art-louise-bourgeois",
      sourceTitle: "The Art of Louise Bourgeois — Tate"
    },
    {
      id: "bourgeois-do-undo-redo",
      textZh: "我做，我拆解，我再做。",
      textOriginal: "I do, I undo, I redo.",
      authorZh: "路易丝·布尔乔亚",
      authorEn: "Louise Bourgeois",
      period: "现代—当代｜1911–2010",
      country: "法国—美国",
      discipline: "雕塑家、装置艺术家",
      sourceUrl: "https://en.wikiquote.org/wiki/Louise_Bourgeois",
      sourceTitle: "I Do, I Undo, I Redo — Tate"
    },
    {
      id: "nevelson-strength",
      textZh: "真正的力量是细腻的。",
      textOriginal: "True strength is delicate.",
      authorZh: "路易丝·内维尔森",
      authorEn: "Louise Nevelson",
      period: "现代主义｜1899–1988",
      country: "乌克兰—美国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Louise_Nevelson",
      sourceTitle: "Louise Nevelson — Wikiquote"
    },
    {
      id: "hesse-art-life",
      textZh: "艺术、工作、艺术与生活彼此紧密相连，而我的整个生命一直是荒诞的。",
      textOriginal: "Art and work and art and life are very connected and my whole life has been absurd.",
      authorZh: "伊娃·海瑟",
      authorEn: "Eva Hesse",
      period: "后极简主义｜1936–1970",
      country: "德国—美国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Eva_Hesse",
      sourceTitle: "Eva Hesse — Wikiquote；1970年访谈"
    },
    {
      id: "serra-drawing-verb",
      textZh: "绘画是一个动词。",
      textOriginal: "Drawing is a verb.",
      authorZh: "理查德·塞拉",
      authorEn: "Richard Serra",
      period: "后极简主义｜1938–2024",
      country: "美国",
      discipline: "雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Richard_Serra",
      sourceTitle: "Richard Serra — MoMA；《Writings/Interviews》"
    },
    {
      id: "lewitt-idea-machine",
      textZh: "观念成为制造艺术的机器。",
      textOriginal: "The idea becomes a machine that makes the art.",
      authorZh: "索尔·勒维特",
      authorEn: "Sol LeWitt",
      period: "观念艺术｜1928–2007",
      country: "美国",
      discipline: "艺术家",
      sourceUrl: "https://en.wikiquote.org/wiki/Sol_LeWitt",
      sourceTitle: "Sol LeWitt — Wikiquote；《Paragraphs on Conceptual Art》, 1967"
    },
    {
      id: "dewey-communication",
      textZh: "艺术是现存最有效的交流方式。",
      textOriginal: "Art is the most effective mode of communications that exists.",
      authorZh: "约翰·杜威",
      authorEn: "John Dewey",
      period: "20世纪｜1859–1952",
      country: "美国",
      discipline: "哲学家、教育家",
      sourceUrl: "https://en.wikiquote.org/wiki/John_Dewey",
      sourceTitle: "John Dewey — Wikiquote；《Art as Experience》"
    },
    {
      id: "kandinsky-color-soul",
      textZh: "色彩是一种直接影响灵魂的力量。",
      textOriginal: "Color is a power which directly influences the soul.",
      authorZh: "瓦西里·康定斯基",
      authorEn: "Wassily Kandinsky",
      period: "现代主义｜1866–1944",
      country: "俄罗斯—德国—法国",
      discipline: "画家、艺术理论家",
      sourceUrl: "https://en.wikiquote.org/wiki/Wassily_Kandinsky",
      sourceTitle: "《Concerning the Spiritual in Art》— Project Gutenberg"
    },
    {
      id: "matisse-courage",
      textZh: "创造需要勇气。",
      textOriginal: "Creativity takes courage.",
      authorZh: "亨利·马蒂斯",
      authorEn: "Henri Matisse",
      period: "现代主义｜1869–1954",
      country: "法国",
      discipline: "画家、雕塑家",
      sourceUrl: "https://en.wikiquote.org/wiki/Henri_Matisse",
      sourceTitle: "Henri Matisse — Wikiquote"
    }
  ];

  function dateKey(value) {
    const calendarDate = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (calendarDate) {
      return `${calendarDate[1]}-${calendarDate[2].padStart(2, "0")}-${calendarDate[3].padStart(2, "0")}`;
    }
    const instant = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(instant.getTime())) return "1970-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(instant);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function dayNumber(value) {
    const [year, month, day] = dateKey(value).split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function quoteForDate(value) {
    if (!quotes.length) return null;
    const index = ((dayNumber(value) % quotes.length) + quotes.length) % quotes.length;
    return quotes[index];
  }

  global.OUART_QUOTES = Object.freeze(quotes.map((quote) => Object.freeze(quote)));
  global.OUART_DAILY_QUOTE_FOR_DATE = quoteForDate;
})(window);
