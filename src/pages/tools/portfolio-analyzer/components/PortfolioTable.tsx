import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '../hooks/usePortfolio';

interface PortfolioTableProps {
  stocks: Stock[];
  onEditStock: (stock: Stock) => void;
  onDeleteStock: (stock: Stock) => void;
}

export function PortfolioTable({ stocks, onEditStock, onDeleteStock }: PortfolioTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Stock</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Avg. Buy Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Profit/Loss</TableHead>
            <TableHead>Allocation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.symbol}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm text-slate-500">{stock.name}</div>
                </div>
              </TableCell>
              <TableCell>{stock.quantity}</TableCell>
              <TableCell>₹{stock.buyPrice.toFixed(2)}</TableCell>
              <TableCell>₹{(typeof stock.currentPrice === 'number' ? stock.currentPrice : 0).toFixed(2)}</TableCell>
              <TableCell>₹{(stock.value / 1000).toFixed(2)}K</TableCell>
              <TableCell>
                <div className={`flex items-center ${stock.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.profit >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                  {stock.profit >= 0 ? '+' : ''}₹{(stock.profit / 1000).toFixed(2)}K
                  <span className="ml-1">({stock.profitPercentage.toFixed(2)}%)</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mr-2">
                    <div 
                      className="h-2 rounded-full bg-fin-primary" 
                      style={{ width: `${stock.allocation}%` }}
                    ></div>
                  </div>
                  {stock.allocation.toFixed(1)}%
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEditStock(stock)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteStock(stock)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
