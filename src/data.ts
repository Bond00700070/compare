import { Product, CountryCode, StorePrice } from './types';

// Price scale multiplier relative to EGP base simulation or pre-set pricing
export function getCurrencyDetails(country: CountryCode) {
  switch (country) {
    case 'SA':
      return { symbol: 'ر.س', label: 'ريال سعودي', rate: 0.08, code: 'SAR' };
    case 'AE':
      return { symbol: 'د.إ', label: 'درهم إماراتي', rate: 0.078, code: 'AED' };
    case 'EG':
    default:
      return { symbol: 'ج.م', label: 'جنيه مصري', rate: 1.0, code: 'EGP' };
  }
}

// Generate the store pricing for a product given country code
export function getStorePricing(
  basePriceEGP: number,
  category: string,
  country: CountryCode,
  isHotDeal: boolean = false
): StorePrice[] {
  const { rate } = getCurrencyDetails(country);
  const baseLocalPrice = Math.round(basePriceEGP * rate);

  const stores: StorePrice[] = [];

  // Amazon details
  const amazonDiff = isHotDeal ? -0.05 : -0.01; // Amazon slightly cheaper or standard
  const amazonPrice = Math.round(baseLocalPrice * (1 + amazonDiff));
  stores.push({
    storeId: 'amazon',
    storeName: country === 'EG' ? 'أمازون مصر' : country === 'SA' ? 'أمازون السعودية' : 'أمازون الإمارات',
    price: amazonPrice,
    originalPrice: isHotDeal ? Math.round(amazonPrice * 1.18) : undefined,
    inStock: true,
    shippingDays: 1,
    shippingFee: baseLocalPrice > 500 ? 0 : Math.round(15 * rate),
    promoCode: country === 'EG' ? { code: 'AMAZON10', discountPercent: 10, description: 'خصم 10% لبطاقات البنك الأهلي' } : undefined,
    productUrl: `https://www.amazon.${country === 'EG' ? 'eg' : 'sa'}/dp/B0D12345?tag=qarenly-21`,
  });

  // Noon details
  const noonDiff = isHotDeal ? -0.08 : 0.01; // Noon might match or have active coupon
  const noonPrice = Math.round(baseLocalPrice * (1 + noonDiff));
  stores.push({
    storeId: 'noon',
    storeName: country === 'EG' ? 'نون مصر' : country === 'SA' ? 'نون السعودية' : 'نون الإمارات',
    price: noonPrice,
    originalPrice: isHotDeal ? Math.round(noonPrice * 1.15) : undefined,
    inStock: true,
    shippingDays: country === 'EG' ? 2 : 1,
    shippingFee: 0, // Express free shipping
    promoCode: { code: 'NOON50', discountPercent: 15, description: 'كوبون العيد الإضافي' },
    productUrl: `https://www.noon.com/${country === 'EG' ? 'egypt' : country.toLowerCase()}-en/N12345A?affiliate_code=qarenly`,
  });

  // Jumia (Egypt ONLY)
  if (country === 'EG' && category !== 'supermarket') {
    const jumiaDiff = 0.04;
    const jumiaPrice = Math.round(baseLocalPrice * (1 + jumiaDiff));
    stores.push({
      storeId: 'jumia',
      storeName: 'جوميا مصر',
      price: jumiaPrice,
      originalPrice: undefined,
      inStock: true,
      shippingDays: 3,
      shippingFee: 35,
      promoCode: { code: 'JUMIA15', discountPercent: 5, description: 'خصم 5% ساري للدفع المسبق' },
      productUrl: 'https://www.jumia.com.eg/products/detail?utm_source=qarenly',
    });
  }

  // Carrefour details (great for supermarket & appliances)
  if (category === 'supermarket' || category === 'appliances' || basePriceEGP < 15000) {
    const carrefourDiff = isHotDeal ? -0.09 : 0.02;
    const carrefourPrice = Math.round(baseLocalPrice * (1 + carrefourDiff));
    stores.push({
      storeId: 'carrefour',
      storeName: country === 'EG' ? 'كارفور أونلاين' : country === 'SA' ? 'كارفور السعودية' : 'كارفور الإمارات',
      price: carrefourPrice,
      originalPrice: isHotDeal ? Math.round(carrefourPrice * 1.2) : undefined,
      inStock: Math.random() > 0.08, // mostly instock
      shippingDays: 1, // Same day or next day
      shippingFee: Math.round(10 * rate),
      promoCode: { code: 'MAF20', discountPercent: 20, description: 'خصم 20% لعملاء كارفور الجدد' },
      productUrl: `https://www.carrefour${country === 'EG' ? 'egypt' : country === 'SA' ? 'saudi' : 'uae'}.com/maf?promo=qarenly`,
    });
  }

  // Sort by price ascending so cheapest is always easy to find
  return stores.sort((a, b) => a.price - b.price);
}

// Full specifications, image keywords, and details
export const baseCatalog = [
  {
    id: 'iphone-15-pro-max',
    name: 'Apple iPhone 15 Pro Max - 256GB',
    arabicName: 'آبل آيفون 15 برو ماكس - 256 جيجابايت',
    category: 'electronics' as const,
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviewsCount: 1420,
    specs: ['شاشة Super Retina XDR مقاس 6.7 بوصة', 'شريحة A17 Pro فائقة القوة', 'هيكل متين وخفيف من التيتانيوم', 'كاميرا خلفية بدقة 48 ميجابكسل مع تقريب بصري x5'],
    basePriceEGP: 58000,
    isHotDeal: true,
    priceDropPercentage: 12,
  },
  {
    id: 'samsung-55-tv',
    name: 'Samsung 55 Inch OLED 4K Smart TV',
    arabicName: 'شاشة سامسونج OLED ذكية 55 بوصة بدقة 4K',
    category: 'electronics' as const,
    brand: 'Samsung',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&auto=format&fit=crop&q=60',
    rating: 4.6,
    reviewsCount: 840,
    specs: ['شاشة OLED ذاتية الإضاءة لتدرج ألوان مذهل', 'معالج Quantum 4K فائق الذكاء', 'تقنية الصوت المحيطي Dolby Atmos', 'رسيفر داخلي ونظام تشغيل تايزن الأنيق'],
    basePriceEGP: 22000,
    isHotDeal: true,
    priceDropPercentage: 15,
  },
  {
    id: 'philips-airfryer-xxl',
    name: 'Philips Premium Airfryer XXL 7.3L',
    arabicName: 'قلاية فيليبس الهوائية بريميوم XXL سعة 7.3 لتر',
    category: 'appliances' as const,
    brand: 'Philips',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60',
    rating: 4.7,
    reviewsCount: 3120,
    specs: ['تقنية إزالة الدهون الزائدة بنسبة 90%', 'سعة عملاقة تحضر دجاجة كاملة أو 1.4 كجم بطاطس', 'شاشة رقمية مع 5 برامج طهي مسبقة الإعداد', 'سهلة التنظيف بفضل أجزاء QuickClean الآمنة لغسالة الأطباق'],
    basePriceEGP: 11500,
    isHotDeal: false,
  },
  {
    id: 'nescafe-gold-200g',
    name: 'Nescafe Gold Instant Coffee - 200g',
    arabicName: 'نسكافيه جولد قهوة سريعة التحضير - 200 جرام',
    category: 'supermarket' as const,
    brand: 'Nescafe',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviewsCount: 4500,
    specs: ['حبوب قهوة أرابيكا منتقاة بعناية ومحمصة بلطف', 'رائحة غنية ونكهة ذهبية ناعمة تفوق التوقعات', 'برطمان زجاجي فاخر يحفظ النكهة طويلاً', 'خالية تماماً من المواد الحافظة'],
    basePriceEGP: 280,
    isHotDeal: true,
    priceDropPercentage: 18,
  },
  {
    id: 'adidas-superstar',
    name: 'Adidas Leather Superstar Sneakers',
    arabicName: 'حذاء رياضي أديداس سوبر ستار كلاسيك جلدي',
    category: 'fashion' as const,
    brand: 'Adidas',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=60',
    rating: 4.5,
    reviewsCount: 1650,
    specs: ['جزء علوي من الجلد الطبيعي المتين', 'مقدمة حذاء مطاطية فريدة على شكل صدفة', 'بطانة مريحة من النسيج ونعل خارجي مطاطي مانع للانزلاق', 'تصميم كلاسيكي جذاب يناسب جميع الأوقات'],
    basePriceEGP: 4800,
    isHotDeal: false,
  },
  {
    id: 'pampers-baby-dry-4',
    name: 'Pampers Baby-Dry Size 4 Mega Pack 132 Pcs',
    arabicName: 'حفاضات بامبرز بيبي دراي مقاس 4 عبوة ميجا 132 حفاضة',
    category: 'supermarket' as const,
    brand: 'Pampers',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&auto=format&fit=crop&q=60',
    rating: 4.4,
    reviewsCount: 2200,
    specs: ['امتصاص فائق يصل لغاية 12 ساعة من الجفاف الكامل', 'قنوات امتصاص تنشر البلل بالتساوي لحماية أفضل', 'جوانب مرنة وناعمة تمنع التسرب وتمنح طفلك حرية الحركة', 'مؤشر الرطوبة الذكي لمساعدتك في التغيير في الوقت المناسب'],
    basePriceEGP: 590,
    isHotDeal: true,
    priceDropPercentage: 8,
  },
  {
    id: 'tefal-cookware-10',
    name: 'Tefal Cookware Non-Stick Set - 10 Pieces',
    arabicName: 'طقم أواني طهي تيفال غير لاصقة - 10 قطع',
    category: 'home' as const,
    brand: 'Tefal',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60',
    rating: 4.6,
    reviewsCount: 720,
    specs: ['مؤشر الحرارة Thermo-Spot الفريد يبين بدء الطهي المثالي', 'طلاء داخلي فائق المقاومة للالتصاق ومقاوم للخدش', 'قاعدة سميكة تضمن توزيع الحرارة بشكل شامل ومنتظم', 'أغطية زجاجية أنيقة ومقاومة للحرارة مع فتحات خروج البخار'],
    basePriceEGP: 6500,
    isHotDeal: false,
  },
  {
    id: 'playstation-5-slim',
    name: 'Sony PlayStation 5 Slim Console',
    arabicName: 'جهاز سوني بلايستيشن 5 سليم بالقرص الصلب',
    category: 'electronics' as const,
    brand: 'Sony',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviewsCount: 2900,
    specs: ['قرص صلب سريع للغاية سعة 1 تيرا SSD لتنقّل فوري', 'دعم دقة 4K بمعدل تحديث يصل لغاية 120 إطاراً في الثانية', 'تكنولوجيا الصوت ثلاثي الأبعاد المذهلة لبيئات ومؤثرات واقعية', 'وحدة تحكم لاسلكية DualSense مع استجابة لمسية ومحفزات تكيفية'],
    basePriceEGP: 25500,
    isHotDeal: true,
    priceDropPercentage: 11,
  }
];

// Generate localized products for any country
export function getProductsForCountry(country: CountryCode): Product[] {
  return baseCatalog.map(base => {
    const stores = getStorePricing(base.basePriceEGP, base.category, country, base.isHotDeal);
    const { rate } = getCurrencyDetails(country);
    
    // Simulate interactive monthly price history points
    const baseLocalAvg = Math.round(base.basePriceEGP * rate * 0.98);
    const priceHistory = [
      { date: 'مارس', avgPrice: Math.round(baseLocalAvg * 1.05) },
      { date: 'أبريل', avgPrice: Math.round(baseLocalAvg * 1.02) },
      { date: 'مايو', avgPrice: Math.round(baseLocalAvg * 1.00) },
      { date: 'يونيو', avgPrice: stores[0].price } // matches current lowest
    ];

    return {
      id: base.id,
      name: base.name,
      arabicName: base.arabicName,
      category: base.category,
      brand: base.brand,
      image: base.image,
      rating: base.rating,
      reviewsCount: base.reviewsCount,
      specs: base.specs,
      stores: stores,
      priceHistory: priceHistory,
      isHotDeal: base.isHotDeal,
      priceDropPercentage: base.priceDropPercentage,
    };
  });
}
