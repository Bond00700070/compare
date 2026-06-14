// Product Comparison Platform Types for Egypt & Gulf

export type CountryCode = 'EG' | 'SA' | 'AE';

export interface StorePrice {
  storeId: 'amazon' | 'noon' | 'jumia' | 'carrefour';
  storeName: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  shippingDays: number;
  shippingFee: number;
  promoCode?: {
    code: string;
    discountPercent: number;
    description: string;
  };
  productUrl: string; // simulated affiliate url
}

export interface Product {
  id: string;
  name: string;
  arabicName: string;
  category: 'electronics' | 'appliances' | 'fashion' | 'supermarket' | 'home';
  brand: string;
  image: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
  stores: StorePrice[];
  priceHistory: { date: string; avgPrice: number }[];
  isHotDeal?: boolean;
  priceDropPercentage?: number;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  targetPrice: number;
  currentPrice: number;
  country: CountryCode;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface SavingsItem {
  product: Product;
  selectedStoreId: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
}
