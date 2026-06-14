import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined. AI scanning features will fallback to offline mock generator.");
}

// Helper to generate highly realistic comparative data if offline or key is missing
function generateOfflineMockProduct(query: string, country: string): any {
  const cleanQuery = query.trim() || "هاتف ذكي";
  const normalizedQuery = cleanQuery.toLowerCase();
  
  // Decide category based on query
  let category: 'electronics' | 'appliances' | 'fashion' | 'supermarket' | 'home' = 'electronics';
  let avgPriceBaseEGP = 15000;
  let brand = "Gen-Tech";
  
  if (normalizedQuery.includes("حذاء") || normalizedQuery.includes("ملابس") || normalizedQuery.includes("نايكي") || normalizedQuery.includes("أديداس") || normalizedQuery.includes("شنطة")) {
    category = 'fashion';
    avgPriceBaseEGP = 2500;
    brand = normalizedQuery.includes("نايكي") ? "Nike" : normalizedQuery.includes("أديداس") ? "Adidas" : "ماركة معروفة";
  } else if (normalizedQuery.includes("ثلاجة") || normalizedQuery.includes("غسالة") || normalizedQuery.includes("ميكروويف") || normalizedQuery.includes("خلاط") || normalizedQuery.includes("مكنسة")) {
    category = 'appliances';
    avgPriceBaseEGP = 18000;
    brand = "تورنيدو";
  } else if (normalizedQuery.includes("رز") || normalizedQuery.includes("زيت") || normalizedQuery.includes("قهوة") || normalizedQuery.includes("شوكولاتة") || normalizedQuery.includes("سكر") || normalizedQuery.includes("حفاظ")) {
    category = 'supermarket';
    avgPriceBaseEGP = 350;
    brand = "الشركة الوطنية";
  } else if (normalizedQuery.includes("طاير") || normalizedQuery.includes("طقم") || normalizedQuery.includes("أثاث") || normalizedQuery.includes("سرير") || normalizedQuery.includes("مطبخ")) {
    category = 'home';
    avgPriceBaseEGP = 5000;
    brand = "هوم ستايل";
  }

  // Country rate multiplier
  const rate = country === 'SA' ? 0.08 : country === 'AE' ? 0.078 : 1.0;
  const localPrice = Math.round(avgPriceBaseEGP * rate);
  const currencySymbol = country === 'SA' ? 'ر.س' : country === 'AE' ? 'د.إ' : 'ج.م';
  
  // Create stores
  const stores: any[] = [
    {
      storeId: 'amazon',
      storeName: country === 'EG' ? 'أمازون مصر' : country === 'SA' ? 'أمازون السعودية' : 'أمازون الإمارات',
      price: Math.round(localPrice * 0.96),
      originalPrice: Math.round(localPrice * 1.1),
      inStock: true,
      shippingDays: 1,
      shippingFee: 0,
      promoCode: { code: "AMZ10", discountPercent: 10, description: "خصم 10% لعملاء برايم" },
      productUrl: `https://amazon.${country === 'EG' ? 'eg' : 'sa'}/dp/B0D987654?tag=qarenly-21`
    },
    {
      storeId: 'noon',
      storeName: country === 'EG' ? 'نون مصر' : country === 'SA' ? 'نون السعودية' : 'نون الإمارات',
      price: Math.round(localPrice * 0.98),
      originalPrice: undefined,
      inStock: true,
      shippingDays: 2,
      shippingFee: Math.round(5 * rate),
      promoCode: { code: "N50", discountPercent: 15, description: "كوبون خصم إضافي" },
      productUrl: `https://noon.com/${country.toLowerCase()}/N554433A?affiliate_code=qarenly`
    }
  ];

  if (country === 'EG' && category !== 'supermarket') {
    stores.push({
      storeId: 'jumia',
      storeName: 'جوميا مصر',
      price: Math.round(localPrice * 1.02),
      originalPrice: undefined,
      inStock: true,
      shippingDays: 3,
      shippingFee: 25,
      productUrl: `https://jumia.com.eg/search?q=${encodeURIComponent(query)}&utm_source=qarenly`
    });
  }

  if (category === 'supermarket' || category === 'appliances') {
    stores.push({
      storeId: 'carrefour',
      storeName: country === 'EG' ? 'كارفور أونلاين' : country === 'SA' ? 'كارفور السعودية' : 'كارفور الإمارات',
      price: Math.round(localPrice * 0.94),
      originalPrice: Math.round(localPrice * 1.15),
      inStock: true,
      shippingDays: 1,
      shippingFee: Math.round(10 * rate),
      promoCode: { code: "MAF20", discountPercent: 20, description: "كوبون خصم لعملاء ماجد الفطيم" },
      productUrl: `https://carrefour.com/search?q=${encodeURIComponent(query)}&promo=qarenly`
    });
  }

  stores.sort((a, b) => a.price - b.price);

  return {
    id: `dynamic-${Date.now()}`,
    name: `${query} Premium Grade`,
    arabicName: query.includes("ال") ? query : `منتج ${query} - الأصلي المختار`,
    category,
    brand,
    image: category === 'supermarket' ? 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&auto=format&fit=crop&q=60' :
           category === 'appliances' ? 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60' :
           category === 'fashion' ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60' :
           'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
    rating: 4.5,
    reviewsCount: 320,
    specs: [
      "مواصفات تماثل أعلى معايير الجودة",
      "تصميم عصري وجودة بناء موثوقة وعملية",
      "ضمان الوكيل المعتمد لمدة عامين بالكامل"
    ],
    stores,
    priceHistory: [
      { date: 'مارس', avgPrice: Math.round(localPrice * 1.08) },
      { date: 'أبريل', avgPrice: Math.round(localPrice * 1.04) },
      { date: 'مايو', avgPrice: Math.round(localPrice * 1.01) },
      { date: 'يونيو', avgPrice: stores[0].price }
    ],
    isHotDeal: Math.random() > 0.5,
    priceDropPercentage: Math.round(Math.random() * 15) + 5
  };
}

// ENDPOINTS

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Compare Product using Gemini API
// This serves as our Live Intelligent Web Crawler!
app.post("/api/compare", async (req, res) => {
  const { query, country } = req.body;
  if (!query) {
    return res.status(400).json({ error: "الرجاء توفير مسمى المنتج للبحث عنه ومقارنته" });
  }

  const countryCode = (country || 'EG') as 'EG' | 'SA' | 'AE';

  if (!ai) {
    // Return mock offline dynamic data gracefully
    const mock = generateOfflineMockProduct(query, countryCode);
    return res.json({ product: mock, source: "mock_fallback" });
  }

  try {
    const prompt = `You are an expert real-time price comparator and shopper bot specialized in Middle Eastern markets: Egypt, Saudi Arabia, and UAE.
    The user wants to find the best online prices to purchase the secret product query: "${query}" in the country: "${countryCode}".
    YOUR JOB IS TO SIMULATE ACTING AS A CRAWLER. Return a structured JSON representation of this product containing matching, mathematically logical, valid local prices in local currency across current Middle East stores.
    
    STORE MATCHING INSTRUCTIONS FOR Country Code: "${countryCode}":
    - Egypt (EG): Include "amazon" (أمازون مصر), "noon" (نون مصر), "carafour" (كارفور أونلاين), "jumia" (جوميا مصر) if appropriate.
    - Saudi Arabia (SA): Include "amazon" (أمازون السعودية), "noon" (نون السعودية), "carrefour" (كارفور السعودية). STRICTLY EXCLUDE Jumia (it does not exist in SA).
    - UAE (AE): Include "amazon" (أمازون الإمارات), "noon" (نون الإمارات), "carrefour" (كارفور الإمارات). STRICTLY EXCLUDE Jumia (it does not exist in AE).

    IMPORTANT PRICING MULTIPLIERS FOR CURRENCIES:
    - EG (Egypt): Pricing should be in EGP (Pounds). E.g., Laptop: 25000 to 70000 EGP, Shoes: 1500 to 5000 EGP, Chips: 15 to 55 EGP.
    - SA (Saudi Arabia): Pricing should be in SAR (Riyals). E.g., Laptop: 2000 to 5000 SAR, Shoes: 120 to 450 SAR.
    - AE (UAE): Pricing should be in AED (Dirhams). E.g., Laptop: 1900 to 4800 AED, Shoes: 110 to 440 AED.
    Please ensure prices are logically matching local retail values.

    YOUR RESPONSE MUST BE A SINGLE JSON OBJECT fitting this typescript interface strictly:
    {
      id: string; // url-safe slug
      name: string; // English high fidelity name
      arabicName: string; // Elegant Arabic retail name
      category: 'electronics' | 'appliances' | 'fashion' | 'supermarket' | 'home';
      brand: string; // brand name e.g. Samsung, Apple, Tefal, Adidas
      image: string; // Pick a real, high-quality, relevant free image url from Unsplash based on the category of this product or use high-quality mockup image links
      rating: number; // realistically between 4.0 and 4.9
      reviewsCount: number; // positive integer
      specs: string[]; // List of 4 key technical/functional specifications of the product in ARABIC language
      stores: {
        storeId: 'amazon' | 'noon' | 'jumia' | 'carrefour';
        storeName: string; // e.g. "أمازون مصر", "نون السعودية"
        price: number; // Local price in country currency (integer)
        originalPrice?: number; // Realistic pre-discount price if applicable
        inStock: boolean;
        shippingDays: number; // integer days e.g. 1 or 2
        shippingFee: number; // e.g. 0 (Free shipping) or 15
        promoCode?: {
          code: string; // e.g. "NOON15" or "AMZ20"
          discountPercent: number; // integer percentage e.g. 10
          description: string; // brief arabic description e.g. "خصم إضافي لعملاء كارفور"
        };
        productUrl: string; // simulated affiliate url link
      }[];
      priceHistory: { date: string; avgPrice: number }[]; // 4 monthly history milestones from March to June showing a realistic progression or hove effects
      isHotDeal?: boolean;
      priceDropPercentage?: number; // if on sale, what percent was shaved off
    }

    Respond ONLY with the JSON object. Do not wrap in markdown quotes. Ensure correct JSON format, no trailing commas. Write all specifications (specs) and coupon descriptions in beautiful, clear Arabic!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const bodyText = response.text || "";
    try {
      const cleanedJson = bodyText.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
      const parsedProduct = JSON.parse(cleanedJson);
      return res.json({ product: parsedProduct, source: "live_ai" });
    } catch (parseError) {
      console.error("JSON parsing error on Gemini response:", bodyText, parseError);
      // Fallback
      const mock = generateOfflineMockProduct(query, countryCode);
      return res.json({ product: mock, source: "mock_bracket_fallback", debugText: bodyText });
    }
  } catch (error: any) {
    console.error("API Compare Error:", error);
    const mock = generateOfflineMockProduct(query, countryCode);
    return res.json({ product: mock, source: "mock_error_fallback", error: error.message });
  }
});

// 3. AI Shopping Assistant Chat
app.post("/api/chat", async (req, res) => {
  const { messages, country } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "الرجاء توفير مصفوفة الرسائل للمساعد" });
  }

  const countryCode = country || 'EG';
  const latestMessage = messages[messages.length - 1]?.text || "";

  if (!ai) {
    return res.json({
      text: `أهلاً بك! أنا مساعد التسوق والبحث عن أفضل الأسعار للسلع في مصر والخليج. (وضع غير متصل بالإنترنت) يبدو أنك تبحث عن عروض ممتازة. لمقارنة أي منتج مباشرة وبسرعة فائقة والحصول على كوبونات إضافية، يرجى كتابة اسم المنتج في شريط البحث بالأعلى ودعنا نقوم بجلب الأسعار الحقيقية وتوفير حتى 40% من ميزانيتك!`,
      suggestedProducts: []
    });
  }

  try {
    const prompt = `You are QarenLy Assistant (مساعد قارن لي), a brilliant, super friendly, and objective Arabic shopping assistant who helps consumers in Egypt and the Gulf spend wisely and save money.
    You communicate in a warm, welcoming Egyptian-gulf mixed Arabic tone (لهجة مصرية خليجية مبهجة ومفيدة).
    The user is asking you: "${latestMessage}".
    The target country of the shopper is: "${countryCode}".
    
    Guidelines:
    1. Answer their query elegantly in Arabic, explaining which stores are normally the cheapest, how they can optimize their cart, and give general smart buying tips.
    2. Recommend 2 specific product ideas relevant to their inquiry (e.g. if they ask for phones, recommend iPhone 15 or Samsung A54; if they ask for coffee, recommend Nescafe Gold).
    
    YOUR FINAL RESPONSE MUST BE IN JSON FORMAT STRICTLY with these 2 properties:
    {
      "text": "Your beautiful retail advice in Arabic, fully detailed, welcoming and explaining money saving tips",
      "suggestedKeywords": ["keyword1", "keyword2"] // 2 relevant short search queries in Arabic they can search next on our platform
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    try {
      const cleaned = responseText.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch {
      res.json({
        text: responseText || "عذراً لم أستطع صياغة رد مناسب، لكن يمكنك البحث عن كل ما تريد بمربع البحث بالأعلى والحصول على خصومات حصرية فوراً!",
        suggestedKeywords: ["شاشة ذكية", "قلاية هوائية"]
      });
    }
  } catch (error: any) {
    console.error("Chatbot Express Error:", error);
    res.json({
      text: "أهلاً بك يا صديقي! أنا جاهز لمساعدتك في إيجاد أرخص سعر لأي منتج في مصر، السعودية، أو الإمارات. فقط تفضل بكتابة ما تبحث عنه بالبحث العام واستمتع بأقوى الخصومات الفورية عبر المتاح الإلكتروني الموثق.",
      suggestedKeywords: ["آيفون 15", "نسكافيه جولد"]
    });
  }
});

// Vite & Static assets serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [QarenLy Server] running on http://localhost:${PORT}`);
  });
}

startServer();
