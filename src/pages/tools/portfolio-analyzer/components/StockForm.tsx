import React from 'react';
import { Modal } from 'antd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { Stock } from '../hooks/usePortfolio';

interface StockFormProps {
  isOpen: boolean;
  isEditing: boolean;
  stock: {
    symbol: string;
    name: string;
    quantity: string;
    buyPrice: string;
    sector: string;
    currentPrice: string;
  };
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBuyPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrentPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice: () => void;
}

export function StockForm({
  isOpen,
  isEditing,
  stock,
  loading,
  onCancel,
  onSave,
  onInputChange,
  onQuantityChange,
  onBuyPriceChange,
  onCurrentPriceChange,
  onRefreshPrice
}: StockFormProps) {
  return (
    <Modal
      title={isEditing ? "Edit Stock" : "Add Stock"}
      open={isOpen}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" variant="outline" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          onClick={onSave} 
          disabled={!stock.symbol || !stock.name || !stock.quantity || !stock.buyPrice || loading}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Stock' : 'Add Stock'}
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              name="symbol"
              value={stock.symbol}
              onChange={onInputChange}
              placeholder="e.g. RELIANCE.NS"
              disabled={isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={stock.name}
              onChange={onInputChange}
              placeholder="e.g. Reliance Industries Ltd."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              value={stock.quantity}
              onChange={onQuantityChange}
              placeholder="e.g. 10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyPrice">Buy Price (₹)</Label>
            <Input
              id="buyPrice"
              name="buyPrice"
              value={stock.buyPrice}
              onChange={onBuyPriceChange}
              placeholder="e.g. 2500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              name="sector"
              value={stock.sector}
              onChange={onInputChange}
              placeholder="e.g. Technology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Current Price (₹)</Label>
            <div className="flex space-x-2">
              <Input
                id="currentPrice"
                name="currentPrice"
                value={stock.currentPrice}
                onChange={onCurrentPriceChange}
                placeholder="Auto-fetch or enter manually"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefreshPrice}
                disabled={!stock.symbol || loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 mt-4">
          {isEditing 
            ? "Update your stock details. Current price will be refreshed automatically."
            : "Add a stock to your portfolio. You can manually enter the current price or click the refresh button to fetch it."}
        </p>
      </div>
    </Modal>
  );
}
