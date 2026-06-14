import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  ArrowLeftRight, 
  TrendingDown, 
  Bell, 
  ShoppingBag, 
  Sparkles, 
  ChevronRight, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  Copy, 
  Trash2, 
  Calculator, 
  ArrowUpRight, 
  Volume2, 
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Percent,
  X,
  MessageSquare,
  Send,
  Sparkle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { Product, CountryCode, PriceAlert, SavingsItem, ChatMessage, StorePrice } from './types';
import { getProductsForCountry, getCurrencyDetails } from './data';

export default function App() {
  // State variables
  const [country, setCountry] = useState<CountryCode>('EG');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'alerts' | 'savings' | 'chat'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Dynamic Catalog (localized based on country)
  const [localCatalog, setLocalCatalog] = useState<Product[]>([]);
  
  // Custom Dynamic AI Search products
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  
  // Alerts and custom savings states
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [savingsCart, setSavingsCart] = useState<SavingsItem[]>([]);
  
  // UI States
  const [isScanning, setIsScanning] = useState(false);
  const [alertFormEmail, setAlertFormEmail] = useState('');
  const [alertFormPrice, setAlertFormPrice] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  // Chatbot Assistant AI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load and Update Catalog when Country selection shifts
  useEffect(() => {
    const freshCatalog = getProductsForCountry(country);
    setLocalCatalog(freshCatalog);
    // Reset scanned items of previous country since exchange rates and stores change
    setScannedProducts([]);
    setSelectedProduct(null);
  }, [country]);

  // Load persisted alerts on start
  useEffect(() => {
    const savedAlerts = localStorage.getItem('qarenly_alerts');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Error loaded alerts", e);
      }
    }
    
    // Welcome message for AI Smart Assistant
    setChatMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'أهلاً بك في منصة قارن لي! 🤖 أنا مساعدك المالي للتسوق الذكي في مصر والخليج. اسألني عن مقارنة لمنتج معين، كيف توفر ميزانيتك، أو الكوبونات النشطة حالياً لمتاجر نون، أمازون، جوميا، وكارفور!',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Load persisted Savings cart
    const savedCart = localStorage.getItem('qarenly_savings_cart');
    if (savedCart) {
      try {
        setSavingsCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  // Sync to localStorage helpers
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('qarenly_alerts', JSON.stringify(newAlerts));
  };

  const saveCart = (newCart: SavingsItem[]) => {
    setSavingsCart(newCart);
    localStorage.setItem('qarenly_savings_cart', JSON.stringify(newCart));
  };

  // Toast Notification Trigger
  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const currency = getCurrencyDetails(country);

  // Dynamic Search function
  const handleAISearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsScanning(true);
    triggerNotification("جاري تشغيل الماسح الذكي بالذكاء الاصطناعي لفحص كود المتاجر...", "info");

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, country })
      });
      const data = await response.json();
      
      if (data.product) {
        const productWithId: Product = {
          ...data.product,
          id: data.product.id || `dynamic-${Date.now()}`
        };
        // Add to scanned list so they appear in current search session
        setScannedProducts(prev => [productWithId, ...prev]);
        setSelectedProduct(productWithId);
        triggerNotification("تم العثور على المنتج ومطابقة الأسعار الحية بنجاح!");
      } else {
        triggerNotification("عذراً، تعذر العثور على أسعار حية لهذا المنتج حالياً.", "info");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("عذراً، حدث خطأ أثناء فحص الأسعار بالذكاء الاصطناعي.", "info");
    } finally {
      setIsScanning(false);
    }
  };

  // Smart Assistant AI Chat endpoint fetcher
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const originalInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ text: m.text, sender: m.sender })),
          country
        })
      });
      const data = await response.json();

      let matchedProducts: Product[] = [];
      if (data.suggestedKeywords && data.suggestedKeywords.length > 0) {
        // Find existing products matching suggested keywords to show elegant dynamic helpers
        const queryWord = data.suggestedKeywords[0].toLowerCase();
        matchedProducts = localCatalog.filter(p => 
          p.name.toLowerCase().includes(queryWord) || 
          p.arabicName.includes(queryWord) ||
          p.category.includes(queryWord)
        ).slice(0, 2);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text || "أنا هنا لمساعدتك دائماً في العثور على أفضل الكوبونات وأرخص الأسعار للتوفير ومقارنة السلع بمصر والخليج.",
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: matchedProducts.length > 0 ? matchedProducts : undefined
      };

      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: 'عذراً يا صديقي، واجهتني مشكلة فنية بسيطة للاتصال بالخادم. لكن يمكنك دائماً مقارنة أسعار السلع بمربع البحث بالأعلى وتفعيل "حقيبة التوفير" الذكية للتوفير فورا!',
        timestamp: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add Item to Price alert list
  const handleAddPriceAlert = (prod: Product) => {
    if (!alertFormEmail) {
      triggerNotification("الرجاء إدخال بريدك الإلكتروني لإشعارك الفوري", "info");
      return;
    }
    if (alertFormPrice <= 0) {
      triggerNotification("الرجاء اختيار سعر مستهدف صحيح", "info");
      return;
    }

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      productId: prod.id,
      productName: prod.arabicName,
      productImage: prod.image,
      targetPrice: alertFormPrice,
      currentPrice: prod.stores[0].price,
      country,
      email: alertFormEmail,
      active: true,
      createdAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    saveAlerts([newAlert, ...alerts]);
    triggerNotification(`تم تفعيل تنبيه هبوط السعر لـ ${prod.arabicName} إلى ${alertFormPrice} ${currency.symbol}!`);
    setAlertFormEmail('');
  };

  // Delete Alert helper
  const handleDeleteAlert = (id: string) => {
    const filtered = alerts.filter(a => a.id !== id);
    saveAlerts(filtered);
    triggerNotification("تم حذف التنبيه بنجاح");
  };

  // Add item to Savings Basket
  const handleAddToSavingsCart = (prod: Product, storeId: string) => {
    const exists = savingsCart.some(item => item.product.id === prod.id);
    if (exists) {
      triggerNotification("المنتج مضاف بالفعل لحقيبة التوفير", "info");
      return;
    }

    const newCart = [...savingsCart, { product: prod, selectedStoreId: storeId }];
    saveCart(newCart);
    triggerNotification(`تم إضافة ${prod.arabicName} لحقيبة التوفير!`);
  };

  // Remove item from Savings Basket
  const handleRemoveFromSavings = (prodId: string) => {
    const updated = savingsCart.filter(item => item.product.id !== prodId);
    saveCart(updated);
    triggerNotification("تم إزالة المنتج من حقيبة التوفير");
  };

  // Simulate price drop alert action
  const triggerMockPriceDrop = (alertItem: PriceAlert) => {
    const dropAmount = Math.round(alertItem.targetPrice * 0.95); // drop below target
    triggerNotification(
      `🔔 تنبيه هبوط السعر المبرمج! لقد تراجع سعر "${alertItem.productName}" إلى ${dropAmount} ${currency.symbol} (أقل من السعر المستهدف ${alertItem.targetPrice})! تم بعث رسالة لـ ${alertItem.email}`,
      "success"
    );
  };

  // Setup coupons mock copy tracking
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    triggerNotification(`تم تصوير الكوبون: ${code} بنجاح! تم احتساب العمولة.`);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  // Filter products by combining Search string + Category select + local and scanned list
  const allCurrentProducts = [...scannedProducts, ...localCatalog];
  
  const filteredProducts = allCurrentProducts.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch = prod.arabicName.includes(searchTerm) || 
                          prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate overall statistics for Savings Bag
  const totalBestIndividualPrice = savingsCart.reduce((acc, item) => {
    // Cheapest price available for this product in stores
    const cheapestPrice = item.product.stores[0]?.price || 0;
    return acc + cheapestPrice;
  }, 0);

  const totalBuyEverythingFromAmazon = savingsCart.reduce((acc, item) => {
    const amz = item.product.stores.find(s => s.storeId === 'amazon');
    return acc + (amz ? amz.price : (item.product.stores[0]?.price || 0));
  }, 0);

  const totalBuyEverythingFromNoon = savingsCart.reduce((acc, item) => {
    const noon = item.product.stores.find(s => s.storeId === 'noon');
    return acc + (noon ? noon.price : (item.product.stores[0]?.price || 0));
  }, 0);

  const overallMaxSavings = savingsCart.length > 0 
    ? Math.max(0, Math.max(totalBuyEverythingFromAmazon, totalBuyEverythingFromNoon) - totalBestIndividualPrice) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased pb-12 dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* Toast Alert banner overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-6 right-6 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-xl flex items-start gap-3 border ${
              notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Premium Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setActiveTab('all' as any); setSelectedProduct(null); setSearchTerm(''); }}>
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <ArrowLeftRight className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                قارن لي
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded-full">الذكية</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">مستشارك لأرخص الأسعار في مصر والخليج</p>
            </div>
          </div>

          {/* Quick Country Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 p-1.5 rounded-xl">
            <button 
              id="country-eg"
              onClick={() => setCountry('EG')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                country === 'EG' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">🇪🇬</span> مصر
            </button>
            <button 
              id="country-sa"
              onClick={() => setCountry('SA')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                country === 'SA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">🇸🇦</span> السعودية
            </button>
            <button 
              id="country-ae"
              onClick={() => setCountry('AE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                country === 'AE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">🇦🇪</span> الإمارات
            </button>
          </div>

          {/* Navigation Items (Middle to Right) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-home"
              onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'home' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">الرئيسية والمقارنات</span>
            </button>
            <button
              id="tab-savings"
              onClick={() => setActiveTab('savings')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition relative ${
                activeTab === 'savings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>حقيبة التوفير</span>
              {savingsCart.length > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {savingsCart.length}
                </span>
              )}
            </button>
            <button
              id="tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition relative ${
                activeTab === 'alerts' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>تنبيهات الأسعار</span>
              {alerts.length > 0 && (
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>
            <button
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5 transition`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>مساعد الذكاء الاصطناعي</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-900 text-white py-14 px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            التسوق الذكي يبدأ من مقارنة الأسعار لحظياً في {country === 'EG' ? 'جمهورية مصر العربية 🇪🇬' : country === 'SA' ? 'المملكة العربية السعودية 🇸🇦' : 'دولة الإمارات العربية المتحدة 🇦🇪'}
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            قارن أسعار المنتجات عبر المتاجر الكبرى وسلّم الجيب!
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            ابحث عن الهاتف، السلع الغذائية، الملابس، أو أجهزة المنزل، وسيقوم محركنا بمقارنة فورية لنفس السلعة بدقة فائقة لتوفير ما يصل لغاية <span className="text-emerald-400 font-bold underline">٤٠٪ من ميزانية عائلتك.</span>
          </p>

          {/* Core Central Search System */}
          <form onSubmit={handleAISearch} className="max-w-2xl mx-auto mt-6 bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 relative">
            <div className="flex-1 flex items-center pr-3 gap-2">
              <Search className="text-slate-400 w-5 h-5 shrink-0" />
              <input 
                id="search-input"
                type="text" 
                placeholder="اكتب اسم منتج؛ مثلا: ايفون 15، قلاية هوائية فيليبس، نسكافيه جولد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 ring-0 focus:outline-none focus:ring-0 text-slate-800 text-sm py-2"
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* AI Trigger Option */}
              <button
                id="ai-instant-scan"
                type="button"
                disabled={isScanning || !searchTerm.trim()}
                onClick={() => handleAISearch()}
                className="px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center gap-1.5 hover:bg-teal-100 disabled:opacity-50 transition"
                title="تفعيل البحث اللحظي بالذكاء الاصطناعي لفحص المتاجر حالاً"
              >
                <Sparkles className={`w-4 h-4 text-teal-600 ${isScanning ? 'animate-spin' : ''}`} />
                <span>مسح ذكي بالذكاء الاصطناعي</span>
              </button>

              <button
                id="search-btn"
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-700/10 active:scale-95 transition w-full md:w-auto"
              >
                <span>بحث عام</span>
              </button>
            </div>
          </form>

          {/* Quick Autocomplete Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-300">
            <span className="font-medium text-slate-400">مثال بحث رائج:</span>
            {['آيفون 15', 'قلاية فيليبس', 'نسكافيه جولد', 'بامبرز', 'بلايستيشن 5'].map((keyword) => (
              <button
                id={`chip-${keyword}`}
                key={keyword}
                onClick={() => { setSearchTerm(keyword); }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition cursor-pointer text-[11px]"
              >
                {keyword}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* TAB 1: Search, Catalog, and Product detail sheet */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left sidebar filters / Category bar */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Category selector */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-50 pb-3 text-sm">أصناف التسوق الكبرى</h3>
                <div id="category-filter-list" className="flex flex-col gap-1.5">
                  {[
                    { id: 'all', label: 'جميع الأصناف', icon: ShoppingBag },
                    { id: 'electronics', label: 'الأجهزة الفاخرة والذكية', icon: ArrowLeftRight },
                    { id: 'appliances', label: 'معدات الطهي والأجهزة المنزلية', icon: Calculator },
                    { id: 'supermarket', label: 'المقاضي والسوبرماركت الأساسية', icon: Percent },
                    { id: 'fashion', label: 'الأزياء والأحذية الفخمة', icon: Sparkles },
                    { id: 'home', label: 'البيت والمطبخ الراقي', icon: MapPin },
                  ].map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        id={`category-btn-${category.id}`}
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition ${
                          selectedCategory === category.id 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedCategory === category.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span> {category.label} </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Affiliate & Coupon Feature Banner */}
              <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white p-5 rounded-2xl relative overflow-hidden shadow-lg shadow-indigo-900/10">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <h4 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  برنامج عمولات وتوفير إضافي
                </h4>
                <p className="text-[11px] text-indigo-200 leading-relaxed mt-2.5">
                  قسائم خصم نون وأمازون قابلة للنسخ المباشر! استخدم الكوبون المصاحب لأي منتج لتوفير فوري والحصول على كاش باك فوري.
                </p>
                <div className="mt-4 p-2.5 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/80">كوبون نون المميز حالياً:</span>
                  <button 
                    id="copy-global-coupon"
                    onClick={() => handleCopyCoupon('NOON50')}
                    className="px-2.5 py-1 bg-yellow-400 text-indigo-950 font-black rounded-lg text-[10px] uppercase hover:bg-white transition"
                  >
                    NOON50
                  </button>
                </div>
              </div>

            </div>

            {/* Right Product Listing or Detailed Product Sheet View */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Loading AI spinner */}
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-teal-50/50 border border-teal-200 p-8 rounded-2xl text-center space-y-4"
                >
                  <div className="inline-flex relative">
                    <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-teal-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-900 text-sm">جاري تشغيل المعالج وقراءة الأسعار الحية بالمحاكاة...</h4>
                    <p className="text-xs text-teal-700/80 mt-1 max-w-md mx-auto">
                      المحرك يفحص قواعد ومواقع نون، أمازون، جوميا، وكارفور في {country === 'EG' ? 'مصر' : 'الخليج'} لربط المواصفات واختيار الكوبون الأفضل.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* If a product is selected, display rich comparison details */}
              {selectedProduct ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
                >
                  {/* Detailed head summary */}
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <button 
                      id="back-to-catalog"
                      onClick={() => setSelectedProduct(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold transition select-none cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>رجوع لكافة السلع</span>
                    </button>
                    
                    <div className="flex gap-4 items-center">
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.arabicName} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                          {selectedProduct.category.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedProduct.arabicName}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedProduct.name}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-600 text-white p-3.5 rounded-xl text-center self-stretch md:self-auto flex flex-col justify-center shadow-lg shadow-emerald-600/10">
                      <span className="text-[10px] text-emerald-100 block">أرخص سعر حالياً</span>
                      <strong className="text-xl font-black block mt-0.5">
                        {selectedProduct.stores[0]?.price.toLocaleString()} {currency.symbol}
                      </strong>
                    </div>
                  </div>

                  {/* Stores grid and history block */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* Stores Pricing compared table (Left-hand on desktop) */}
                    <div className="md:col-span-7 space-y-4">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                        مقارنة الأسعار اللحظية حسب المتجر
                      </h4>

                      <div className="flex flex-col gap-3">
                        {selectedProduct.stores.map((store, idx) => (
                          <div 
                            key={store.storeId} 
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition relative ${
                              idx === 0 
                              ? 'border-emerald-300 bg-emerald-50/20 shadow-sm shadow-emerald-500/5' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                            }`}
                          >
                            {idx === 0 && (
                              <span className="absolute top-0 left-4 -translate-y-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-full">
                                الخيار الأوفر
                              </span>
                            )}

                            <div>
                              <strong className="text-sm font-bold block text-slate-900">{store.storeName}</strong>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold ${store.inStock ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'} px-2 py-0.5 rounded-md`}>
                                  {store.inStock ? '✓ متوفر جاهز للشحن' : '⚠️ نفد من المخزن'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">الشحن خلال {store.shippingDays} أيام</span>
                              </div>
                            </div>

                            {/* Coupon if active */}
                            {store.promoCode && (
                              <div className="px-3 py-1.5 rounded-lg bg-yellow-100/60 border border-yellow-200 text-right flex flex-col justify-center">
                                <span className="text-[9px] text-yellow-800 font-bold block">كوبون إضافي متاح:</span>
                                <button
                                  id={`coupon-${store.promoCode.code}`}
                                  onClick={() => handleCopyCoupon(store.promoCode!.code)}
                                  className="text-xs font-black inline-flex items-center justify-end gap-1 text-slate-900 mt-0.5 hover:text-emerald-700"
                                >
                                  <span>{store.promoCode.code}</span>
                                  <Copy className="w-3 h-3 shrink-0" />
                                </button>
                              </div>
                            )}

                            <div className="text-left flex items-center gap-4">
                              <div className="text-right">
                                {store.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through block">
                                    {store.originalPrice.toLocaleString()} {currency.symbol}
                                  </span>
                                )}
                                <strong className="text-base font-black text-slate-900 block">
                                  {store.price.toLocaleString()} {currency.symbol}
                                </strong>
                                <span className="text-[9px] text-slate-400 block">+ شحن {store.shippingFee === 0 ? 'مجاني' : `${store.shippingFee} ${currency.symbol}`}</span>
                              </div>
                              
                              <div className="flex flex-col gap-1.5 shrink-0">
                                <a 
                                  id={`store-link-${store.storeId}`}
                                  href={store.productUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-3.5 py-2 rounded-xl bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition"
                                >
                                  <span>تسوق الآن</span>
                                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                                </a>
                                
                                <button 
                                  id={`add-savings-bag-${store.storeId}`}
                                  onClick={() => handleAddToSavingsCart(selectedProduct, store.storeId)}
                                  className="px-2.5 py-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 pointer-events-auto"
                                >
                                  <Calculator className="w-2.5 h-2.5" />
                                  <span>أضف لحقيبة التوفير</span>
                                </button>
                              </div>

                            </div>

                          </div>
                        ))}
                      </div>
                      
                      {/* Product specifications list */}
                      <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                        <h5 className="text-xs font-bold text-slate-800">مواصفات ومميزات السلعة</h5>
                        <ul className="space-y-1.5">
                          {selectedProduct.specs.map((spec, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              <span>{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Chart and Price Trend configuration (Right-hand on desktop) */}
                    <div className="md:col-span-5 space-y-6">
                      
                      {/* Interactive area chart of price trends */}
                      <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                            تاريخ تذبذب الأسعار (آخر ٤ شهور)
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">يحدد متى يكون السعر مثالياً للشراء وبدون خداع عروض وهمية</p>
                        </div>

                        <div className="h-44 w-full text-xs font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedProduct.priceHistory}>
                              <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                              <Tooltip formatter={(value) => [`${value} ${currency.symbol}`, 'متوسط السعر']} labelStyle={{ color: '#0f172a' }} />
                              <Area type="monotone" dataKey="avgPrice" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Set Alert Module form */}
                      <div className="p-5 bg-white border border-rose-100 rounded-xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-650 text-rose-600">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">ذكاء هبوط السعر (Price Drop)</h4>
                            <p className="text-[10px] text-slate-400">سنرسل لك إشعاراً فورياً لبريدك عند بلوغ السعر المستهدف</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3.5">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">السعر المستهدف ({currency.symbol})</label>
                              <input 
                                id="target-price-input"
                                type="number" 
                                placeholder={Math.round(selectedProduct.stores[0].price * 0.9).toString()}
                                value={alertFormPrice || ""}
                                onChange={(e) => setAlertFormPrice(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-450 text-slate-400 block mb-1">بريدك الإلكتروني</label>
                              <input 
                                id="alert-email-input"
                                type="email" 
                                placeholder="name@email.com"
                                value={alertFormEmail}
                                onChange={(e) => setAlertFormEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            id="activate-alert-btn"
                            onClick={() => handleAddPriceAlert(selectedProduct)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                          >
                            تنشيط جرس المتابعة الآمنة
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>

                </motion.div>
              ) : (
                <div className="space-y-8">
                  {/* Title banner */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">العروض والمنتجات الرائجة</h3>
                      <p className="text-xs text-rose-500 font-semibold animate-pulse mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        تحديث مباشر قبل: ثانية واحدة
                      </p>
                    </div>
                    {searchTerm && (
                      <button 
                        id="clear-search-btn"
                        onClick={() => setSearchTerm('')}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-900"
                      >
                        إلغاء أشرطة البحث
                      </button>
                    )}
                  </div>

                  {/* Products Grid rendering */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((prod) => {
                      const cheapest = prod.stores[0];
                      const ratingAverageDigits = prod.rating.toFixed(1);
                      return (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -4 }}
                          key={prod.id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition relative cursor-pointer"
                          onClick={() => { setSelectedProduct(prod); setAlertFormPrice(Math.round(cheapest.price * 0.9)); }}
                        >
                          {/* Percent discount label */}
                          {prod.isHotDeal && prod.priceDropPercentage && (
                            <span className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center gap-1 shadow-sm">
                              <TrendingDown className="w-3 h-3" />
                              هبوط بـ {prod.priceDropPercentage}%
                            </span>
                          )}

                          {/* Product visual banner */}
                          <div className="h-44 bg-slate-100 relative overflow-hidden">
                            <img 
                              src={prod.image} 
                              alt={prod.arabicName} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {/* Brand Tag */}
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/40 text-white backdrop-blur-md rounded-md text-[10px] font-semibold uppercase">
                              {prod.brand}
                            </span>
                          </div>

                          {/* Content elements block */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <strong className="text-slate-400 text-[10px] uppercase tracking-wide block">{prod.category}</strong>
                              <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-2 leading-relaxed">{prod.arabicName}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono line-clamp-1">{prod.name}</p>
                              
                              {/* Ratings details */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-[11px] font-bold text-slate-600">{ratingAverageDigits}</span>
                                <span className="text-[10px] text-slate-400">({prod.reviewsCount.toLocaleString()})</span>
                              </div>
                            </div>

                            <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-slate-400 block">يقارن عبر {prod.stores.length} متاجر</span>
                                <strong className="text-sm font-black text-slate-900 block mt-0.5">
                                  {cheapest.price.toLocaleString()} {currency.symbol} <span className="text-[10px] font-medium text-emerald-600">كحد أدنى</span>
                                </strong>
                              </div>
                              
                              <button 
                                id={`view-deal-${prod.id}`}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 hover:text-white text-[11px] font-bold text-slate-300 transition shrink-0"
                              >
                                قارن المتاجر
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-12 text-center space-y-3">
                        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-700">لم نعثر على سلع مخزنة مطابقة لهذا البحث</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          انقر على زر "مسح ذكي بالذكاء الاصطناعي" الموجود بحوار مربع البحث بالأعلى؛ لنجري سحب وتحليل ذكي حقيقي حالاً لـ "{searchTerm}" ومقارنة أسعاره!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: Savings Basket dashboard calculator */}
        {activeTab === 'savings' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-emerald-600" />
                حقيبة التوفير الذكية (حقيبة تخطيط المشتريات)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تتيح لك حساب كيف يوزع شراؤك لعدة منتجات دفعة واحدة! يحلل النظام ما إذا كان شراء كل سلعة من متجرها الأرخص يوفر عليك مقابل شرائها كاملة من متجر واحد.
              </p>
            </div>

            {savingsCart.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700">حقيبة التوفير فارغة تماماً</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  تصفح السلع الرائجة في صفحة المقارنات، وانقر على "أضف لحقيبة التوفير" المتواجد بجوار أسعار المتاجر المختلفة لمقارنة وتحليلات باقات سلتك دفعة واحدة!
                </p>
                <button
                  id="cart-back-home"
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  تصفح المنتجات الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* List items under evaluation */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="font-bold text-[#0F172A] text-xs">العناصر المضافة تحت المراجعة الفورية</h4>
                  
                  <div className="flex flex-col gap-3">
                    {savingsCart.map((item) => {
                      const selectedStoreObj = item.product.stores.find(s => s.storeId === item.selectedStoreId) || item.product.stores[0];
                      return (
                        <div key={item.product.id} className="p-4 bg-white border border-slate-150 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <img 
                              src={item.product.image} 
                              alt={item.product.arabicName} 
                              className="w-12 h-12 rounded-lg object-cover bg-slate-50 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{item.product.arabicName}</h4>
                              <span className="text-[10px] text-slate-400">الحد الأدنى للوصول: {item.product.stores[0].price.toLocaleString()} {currency.symbol}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block">المتجر المختار مقارنةً:</span>
                              <strong className="text-xs font-black text-slate-900">{selectedStoreObj.storeName}</strong>
                              <span className="text-xs text-emerald-600 block pl-1">({selectedStoreObj.price.toLocaleString()} {currency.symbol})</span>
                            </div>

                            <button 
                              id={`remove-cart-${item.product.id}`}
                              onClick={() => handleRemoveFromSavings(item.product.id)}
                              className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 text-red-600 flex items-center justify-center transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Savings Calculator Summary */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-md space-y-4">
                    <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-spin-slow" />
                      خطة التوفير القصوى المُقترحة
                    </h4>

                    <div className="space-y-2 border-b border-slate-100 pb-4 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>إجمالي التكلفة بالتسوق الذكي المقسم:</span>
                        <strong className="text-slate-900 font-bold">{totalBestIndividualPrice.toLocaleString()} {currency.symbol}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>التكلفة التقريبية إذا اشتريت من متجر واحد:</span>
                        <strong className="text-slate-900 font-bold">
                          {Math.max(totalBuyEverythingFromAmazon, totalBuyEverythingFromNoon).toLocaleString()} {currency.symbol}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-emerald-800 block">صافي التوفير المقدّر لك اليوم</span>
                      <strong className="text-2xl font-black text-emerald-700 block">
                        {overallMaxSavings.toLocaleString()} {currency.symbol}
                      </strong>
                      <p className="text-[10px] text-emerald-800/80 leading-normal">
                        مذهل! من خلال تقسيم السلة، تم توفير هذا المبلغ لعدم شراء المنتجات من مكان واحد غير مثالي.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-[11px] text-slate-900">كيف تنفذ الخطة؟</h5>
                      <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-[10px] text-slate-600 leading-normal">
                        {savingsCart.map((item, idx) => {
                          const favStore = item.product.stores[0];
                          return (
                            <div key={idx} className="flex gap-1">
                              <span>•</span>
                              <span>اشترِ <b>{item.product.arabicName}</b> من <b>{favStore.storeName}</b> بسعر <b>{favStore.price} {currency.symbol}</b></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      id="sim-checkout-btn"
                      onClick={() => triggerNotification("توجيه مجمع جاري تسجيل العمولات التابعة... شكراً لاستخدامك قارن لي")}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/10 font-black text-xs transition"
                    >
                      تنفيذ الشراء المقسم والحصول على الكاش باك
                    </button>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: Active Drop Alerts Management */}
        {activeTab === 'alerts' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-rose-500" />
                تنبيهات الأسعار النشطة ومستقبل المبيعات
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تصفح وإلغاء أو محاكاة هبوط الأسعار للسرعة الفائقة وتأكيد فاعلية جرس تنبيه المبيعات.
              </p>
            </div>

            {alerts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                <Bell className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700">لا يوجد منبهات نشطة بربطة الرسل</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  اختر أي منتج من الصفحة الرئيسية للسلع، ثم توجه لخانة "ذكاء هبوط السعر" وحدد السعر والبريد لتنبيهك لحظياً.
                </p>
                <button
                  id="alerts-back-home"
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition"
                >
                  تصفح وقارن المنتجات الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.map((alertItem) => (
                  <div key={alertItem.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 relative">
                    <button
                      id={`delete-alert-${alertItem.id}`}
                      onClick={() => handleDeleteAlert(alertItem.id)}
                      className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                      title="إزالة التنبيه"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex gap-3">
                      <img 
                        src={alertItem.productImage} 
                        alt={alertItem.productName} 
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{alertItem.productName}</h4>
                        <span className="text-[9px] text-slate-400 block">بدأ بـ {alertItem.currentPrice} {currency.symbol}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">البطاقة الموجهة: {alertItem.email}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 text-center text-xs">
                      <div className="border-l border-slate-200">
                        <span className="text-[9px] text-slate-400 block">السعر الحالي</span>
                        <strong className="text-slate-800 font-bold">{alertItem.currentPrice} {currency.symbol}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-rose-500 block">السعر المستهدف</span>
                        <strong className="text-rose-600 font-black">{alertItem.targetPrice} {currency.symbol}</strong>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id={`mock-alert-${alertItem.id}`}
                        onClick={() => triggerMockPriceDrop(alertItem)}
                        className="flex-1 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-indigo-950 rounded-lg text-[9px] font-black uppercase text-center transition flex items-center justify-center gap-1"
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>محاكاة هبوط السعر فوراً</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: Smart AI Shopping Coach Chatbot */}
        {activeTab === 'chat' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[600px]"
          >
            {/* Header board */}
            <div className="p-5 bg-gradient-to-r from-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">مساعد قارن لي الذكي (AI Saving Coach)</h4>
                  <p className="text-[10px] text-emerald-200">يبحث، يطابق الكوبونات، ويقترح البدائل الأرخص</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full">
                متصل وجاهز مجاناً
              </span>
            </div>

            {/* Chat messages viewport */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
              {chatMessages.map((msg, i) => (
                <div 
                  key={msg.id || i}
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                    ? 'bg-slate-900 text-white self-end rounded-tl-none'
                    : 'bg-white border border-slate-200/60 text-slate-800 self-start rounded-tr-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {/* Assistant custom suggests elements panel */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-emerald-700">سلع تم العثور عليها في الكتالوج:</p>
                      <div className="flex flex-col gap-2">
                        {msg.suggestedProducts.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => { setSelectedProduct(p); setActiveTab('home'); }}
                            className="p-2 border border-slate-100 rounded-lg hover:border-emerald-300 transition flex items-center justify-between bg-slate-50/50 cursor-pointer text-[10px]"
                          >
                            <span className="font-bold text-slate-800 line-clamp-1">{p.arabicName}</span>
                            <span className="text-emerald-700 font-bold shrink-0 pr-2">من {p.stores[0].price} {currency.symbol}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[8px] text-slate-400 block text-left mt-2">{msg.timestamp}</span>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="bg-white border border-slate-100 text-slate-650 self-start rounded-2xl p-4 text-xs italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] pr-1">مساعد التوفير ذكي يركب الرد المالي المناسب...</span>
                </div>
              )}
            </div>

            {/* Chat form control panel */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
              <input 
                id="chat-input-box"
                type="text"
                placeholder="اسألني عن: كوبونات نون، جهاز تلفزيون رخيص، أو نصائح المشتري"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-100 text-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition"
              />
              <button
                id="chat-submit-btn"
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </motion.div>
        )}

      </main>

      {/* Footer Info of Platform */}
      <footer className="mt-20 border-t border-slate-100 bg-white py-10 px-4 text-center">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <strong className="text-slate-900">قارن لي - QarenLy © 2026</strong>
          </div>
          
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            المنصة الأولى بالوطن العربي لمطابقة ومقارنة أسعار المنتجات الفورية عبر المتاجر في مصر والسعودية والإمارات. نوفر لك الكوبونات والأكواد ونظام تخطيط للشراء لضمان عدم ضياع أي قرش أو ريال.
          </p>

          <div className="text-[10px] text-slate-400 flex flex-wrap items-center justify-center gap-4 justify-items-center">
            <span>• عمولة Affiliate من 2% لغاية 10% لكل عملية تحويل ناجحة</span>
            <span>• تحديث حقيقي للأسعار بالذكاء الاصطناعي</span>
            <span>• اشتراكات المتاجر الحرة ممكّنة</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
