import React from 'react';
import { Modal } from 'antd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, X } from 'lucide-react';
import { ImportedStock } from '../hooks/usePortfolio';

interface ImportModalProps {
  showImportModal: boolean;
  importedStocks: ImportedStock[];
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
  onUpdateStock: (index: number, field: keyof ImportedStock, value: string | number) => void;
  onRemoveStock: (index: number) => void;
}

export function ImportModal({
  showImportModal,
  importedStocks,
  loading,
  onCancel,
  onSave,
  onUpdateStock,
  onRemoveStock
}: ImportModalProps) {
  return (
    <Modal
      title="Confirm Portfolio Import"
      open={showImportModal}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" variant="outline" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          onClick={onSave} 
          disabled={importedStocks.length === 0 || loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Add Holdings'}
        </Button>
      ]}
      width={1000}
    >
      <div className="py-4">
        <p className="mb-4">
          Review and edit your portfolio holdings before adding them. You can adjust quantities, prices, or remove entries.
        </p>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Buy Price</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Buy Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importedStocks.map((stock, index) => (
                <TableRow key={`${stock.symbol}-${index}`}>
                  <TableCell>
                    <Input 
                      value={stock.symbol} 
                      onChange={(e) => onUpdateStock(index, 'symbol', e.target.value)}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={stock.name} 
                      onChange={(e) => onUpdateStock(index, 'name', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={stock.quantity} 
                      onChange={(e) => onUpdateStock(index, 'quantity', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={stock.buyPrice} 
                      onChange={(e) => onUpdateStock(index, 'buyPrice', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={stock.currentPrice || ''} 
                      placeholder="Auto-fetch"
                      onChange={(e) => onUpdateStock(index, 'currentPrice', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={stock.sector} 
                      onChange={(e) => onUpdateStock(index, 'sector', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="date" 
                      value={stock.buyDate || new Date().toISOString().split('T')[0]} 
                      onChange={(e) => onUpdateStock(index, 'buyDate', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveStock(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Modal>
  );
}
