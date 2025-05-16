import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types for FinWell data
export interface Budget {
  id?: string;
  user_id?: string;
  name: string;
  amount: number;
  category: string;
  start_date: string;
  end_date: string;
  recurring?: boolean;
  recurrence_period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at?: string;
  updated_at?: string;
}

export interface BudgetTransaction {
  id?: string;
  budget_id: string;
  user_id?: string;
  amount: number;
  description: string;
  transaction_date: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface SavingGoal {
  id?: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}

export interface SavingContribution {
  id?: string;
  goal_id: string;
  user_id?: string;
  amount: number;
  contribution_date: string;
  notes?: string;
  created_at?: string;
}

export interface NetWorthAsset {
  id?: string;
  user_id?: string;
  name: string;
  category: string;
  value: number;
  asset_type: 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  is_liquid?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NetWorthLiability {
  id?: string;
  user_id?: string;
  name: string;
  category: string;
  amount: number;
  interest_rate?: number;
  liability_type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NetWorthHistory {
  id?: string;
  user_id?: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  snapshot_date: string;
  created_at?: string;
}

// Cache for optimization
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class FinwellCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const timestamp = Date.now();
    const expiry = timestamp + ttl;
    this.cache.set(key, { data, timestamp, expiry });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateUserData(userId: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }
}

const finwellCache = new FinwellCache();

// Budget service functions
export async function getBudgets(userId: string): Promise<{ data: Budget[] | null; error: PostgrestError | null }> {
  const cacheKey = `budgets_${userId}`;
  const cachedData = finwellCache.get<Budget[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

export async function createBudget(budget: Budget): Promise<{ data: Budget | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budget])
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`budgets_${budget.user_id}`);
  }
  
  return { data, error };
}

export async function updateBudget(budget: Budget): Promise<{ data: Budget | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('budgets')
    .update(budget)
    .eq('id', budget.id)
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`budgets_${budget.user_id}`);
  }
  
  return { data, error };
}

export async function deleteBudget(budgetId: string, userId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);
    
  if (!error) {
    finwellCache.invalidate(`budgets_${userId}`);
  }
  
  return { error };
}

// Budget transactions service functions
export async function getBudgetTransactions(budgetId: string): Promise<{ data: BudgetTransaction[] | null; error: PostgrestError | null }> {
  const cacheKey = `budget_transactions_${budgetId}`;
  const cachedData = finwellCache.get<BudgetTransaction[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('budget_transactions')
    .select('*')
    .eq('budget_id', budgetId)
    .order('transaction_date', { ascending: false });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

export async function createBudgetTransaction(transaction: BudgetTransaction): Promise<{ data: BudgetTransaction | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('budget_transactions')
    .insert([transaction])
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`budget_transactions_${transaction.budget_id}`);
  }
  
  return { data, error };
}

// Saving goals service functions
export async function getSavingGoals(userId: string): Promise<{ data: SavingGoal[] | null; error: PostgrestError | null }> {
  const cacheKey = `saving_goals_${userId}`;
  const cachedData = finwellCache.get<SavingGoal[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('saving_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

export async function createSavingGoal(goal: SavingGoal): Promise<{ data: SavingGoal | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('saving_goals')
    .insert([goal])
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`saving_goals_${goal.user_id}`);
  }
  
  return { data, error };
}

export async function updateSavingGoal(goal: SavingGoal): Promise<{ data: SavingGoal | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('saving_goals')
    .update(goal)
    .eq('id', goal.id)
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`saving_goals_${goal.user_id}`);
  }
  
  return { data, error };
}

export async function addSavingContribution(contribution: SavingContribution): Promise<{ data: SavingContribution | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('saving_contributions')
    .insert([contribution])
    .select()
    .single();
    
  if (data && !error) {
    // Update the current amount in the saving goal
    const { data: goalData } = await supabase
      .from('saving_goals')
      .select('current_amount')
      .eq('id', contribution.goal_id)
      .single();
      
    if (goalData) {
      const newAmount = parseFloat(goalData.current_amount) + parseFloat(contribution.amount.toString());
      
      await supabase
        .from('saving_goals')
        .update({ current_amount: newAmount })
        .eq('id', contribution.goal_id);
        
      finwellCache.invalidate(`saving_goals_${contribution.user_id}`);
    }
  }
  
  return { data, error };
}

// Net worth service functions
export async function getNetWorthAssets(userId: string): Promise<{ data: NetWorthAsset[] | null; error: PostgrestError | null }> {
  const cacheKey = `net_worth_assets_${userId}`;
  const cachedData = finwellCache.get<NetWorthAsset[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('net_worth_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

export async function getNetWorthLiabilities(userId: string): Promise<{ data: NetWorthLiability[] | null; error: PostgrestError | null }> {
  const cacheKey = `net_worth_liabilities_${userId}`;
  const cachedData = finwellCache.get<NetWorthLiability[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('net_worth_liabilities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

export async function createNetWorthAsset(asset: NetWorthAsset): Promise<{ data: NetWorthAsset | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('net_worth_assets')
    .insert([asset])
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`net_worth_assets_${asset.user_id}`);
    await updateNetWorthSnapshot(asset.user_id!);
  }
  
  return { data, error };
}

export async function createNetWorthLiability(liability: NetWorthLiability): Promise<{ data: NetWorthLiability | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('net_worth_liabilities')
    .insert([liability])
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`net_worth_liabilities_${liability.user_id}`);
    await updateNetWorthSnapshot(liability.user_id!);
  }
  
  return { data, error };
}

export async function updateNetWorthAsset(asset: NetWorthAsset): Promise<{ data: NetWorthAsset | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('net_worth_assets')
    .update(asset)
    .eq('id', asset.id)
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`net_worth_assets_${asset.user_id}`);
    await updateNetWorthSnapshot(asset.user_id!);
  }
  
  return { data, error };
}

export async function updateNetWorthLiability(liability: NetWorthLiability): Promise<{ data: NetWorthLiability | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('net_worth_liabilities')
    .update(liability)
    .eq('id', liability.id)
    .select()
    .single();
    
  if (data && !error) {
    finwellCache.invalidate(`net_worth_liabilities_${liability.user_id}`);
    await updateNetWorthSnapshot(liability.user_id!);
  }
  
  return { data, error };
}

export async function deleteNetWorthAsset(assetId: string, userId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('net_worth_assets')
    .delete()
    .eq('id', assetId);
    
  if (!error) {
    finwellCache.invalidate(`net_worth_assets_${userId}`);
    await updateNetWorthSnapshot(userId);
  }
  
  return { error };
}

export async function deleteNetWorthLiability(liabilityId: string, userId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('net_worth_liabilities')
    .delete()
    .eq('id', liabilityId);
    
  if (!error) {
    finwellCache.invalidate(`net_worth_liabilities_${userId}`);
    await updateNetWorthSnapshot(userId);
  }
  
  return { error };
}

export async function getNetWorthHistory(userId: string): Promise<{ data: NetWorthHistory[] | null; error: PostgrestError | null }> {
  const cacheKey = `net_worth_history_${userId}`;
  const cachedData = finwellCache.get<NetWorthHistory[]>(cacheKey);
  
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  const { data, error } = await supabase
    .from('net_worth_history')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true });
    
  if (data && !error) {
    finwellCache.set(cacheKey, data);
  }
  
  return { data, error };
}

// Helper function to update net worth snapshot
async function updateNetWorthSnapshot(userId: string): Promise<void> {
  try {
    // Get all assets
    const { data: assets } = await supabase
      .from('net_worth_assets')
      .select('value')
      .eq('user_id', userId);
      
    // Get all liabilities
    const { data: liabilities } = await supabase
      .from('net_worth_liabilities')
      .select('amount')
      .eq('user_id', userId);
      
    // Calculate totals
    const totalAssets = assets ? assets.reduce((sum, asset) => sum + parseFloat(asset.value.toString()), 0) : 0;
    const totalLiabilities = liabilities ? liabilities.reduce((sum, liability) => sum + parseFloat(liability.amount.toString()), 0) : 0;
    const netWorth = totalAssets - totalLiabilities;
    
    // Create a new snapshot
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have a snapshot for today
    const { data: existingSnapshot } = await supabase
      .from('net_worth_history')
      .select('id')
      .eq('user_id', userId)
      .eq('snapshot_date', today)
      .single();
      
    if (existingSnapshot) {
      // Update existing snapshot
      await supabase
        .from('net_worth_history')
        .update({
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth
        })
        .eq('id', existingSnapshot.id);
    } else {
      // Create new snapshot
      await supabase
        .from('net_worth_history')
        .insert([{
          user_id: userId,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          snapshot_date: today
        }]);
    }
    
    finwellCache.invalidate(`net_worth_history_${userId}`);
  } catch (error) {
    console.error('Error updating net worth snapshot:', error);
  }
}

// Financial health calculation
export async function calculateFinancialHealthScore(userId: string): Promise<number> {
  try {
    // Get user's budgets
    const { data: budgets } = await getBudgets(userId);
    
    // Get user's saving goals
    const { data: savingGoals } = await getSavingGoals(userId);
    
    // Get user's net worth
    const { data: assets } = await getNetWorthAssets(userId);
    const { data: liabilities } = await getNetWorthLiabilities(userId);
    
    // Calculate scores for different aspects
    let budgetScore = 0;
    let savingsScore = 0;
    let debtScore = 0;
    let netWorthScore = 0;
    
    // Budget score calculation
    if (budgets && budgets.length > 0) {
      budgetScore = 70; // Base score for having budgets
    }
    
    // Savings score calculation
    if (savingGoals && savingGoals.length > 0) {
      const totalTargets = savingGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
      const totalCurrent = savingGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
      
      if (totalTargets > 0) {
        const savingsRate = (totalCurrent / totalTargets) * 100;
        savingsScore = Math.min(100, savingsRate);
      }
    }
    
    // Debt score calculation
    if (assets && liabilities) {
      const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
      const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
      
      if (totalAssets > 0) {
        const debtToAssetRatio = totalLiabilities / totalAssets;
        debtScore = Math.max(0, 100 - (debtToAssetRatio * 100));
      }
      
      // Net worth score
      const netWorth = totalAssets - totalLiabilities;
      if (netWorth > 0) {
        netWorthScore = 70; // Positive net worth base score
      }
    }
    
    // Calculate overall financial health score
    const overallScore = Math.round((budgetScore + savingsScore + debtScore + netWorthScore) / 4);
    
    return overallScore;
  } catch (error) {
    console.error('Error calculating financial health score:', error);
    return 50; // Default score
  }
}
