import { supabase } from '@/lib/supabase';

export const stocksService = {
  async getStockData(symbol: string) {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  },
  async getMarketOverview(market: string = 'india') {
    try {
      const { data: indices, error: indicesError } = await supabase
        .from('market_indices')
        .select('*')
        .eq('market', market)
        .order('importance', { ascending: true });
      if (indicesError) throw indicesError;
      const { data: topGainers, error: gainersError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('change_percent', { ascending: false })
        .limit(10);
      if (gainersError) throw gainersError;
      const { data: topLosers, error: losersError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('change_percent', { ascending: true })
        .limit(10);
      if (losersError) throw losersError;
      const { data: mostActive, error: activeError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('volume', { ascending: false })
        .limit(10);
      if (activeError) throw activeError;
      return { indices, topGainers, topLosers, mostActive };
    } catch (error) {
      console.error('Error fetching market overview:', error);
      return null;
    }
  },
  // ...other stock-related methods
};

export const userService = {
  async getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
  // ...other user-related methods
};

export const newsService = {
  async getLatestNews(market: string = 'global', limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('market', market)
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },
  async getCompanyNews(symbol: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('symbol', symbol)
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching company news:', error);
      return [];
    }
  },
};

export const financialDataService = {
  async getStockFinancials(symbol: string) {
    try {
      const { data, error } = await supabase
        .from('financials')
        .select('*')
        .eq('symbol', symbol)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock financials:', error);
      return null;
    }
  },
  // ...other financial data-related methods
};

export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async getCurrentUser() {
    // For Supabase v2+, use getUser() async method
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  async resetPassword(email: string) {
    // Implement your password reset logic
    // e.g., send reset email
  },
};


