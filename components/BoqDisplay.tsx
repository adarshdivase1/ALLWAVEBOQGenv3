import React, { useState, useEffect, useMemo } from 'react';
import { Boq, BoqItem, Currency, CURRENCIES } from '../types';
import { getExchangeRates } from '../utils/currency';

import CurrencySelector from './CurrencySelector';
import RefineModal from './RefineModal';
import WebSearchModal from './WebSearchModal';
import ImagePreviewModal from './ImagePreviewModal';
import AutoResizeTextarea from './AutoResizeTextarea';

import DownloadIcon from './icons/DownloadIcon';
import WandIcon from './icons/WandIcon';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface BoqDisplayProps {
  boq: Boq | null;
  onRefine: (refinementPrompt: string) => void;
  isRefining: boolean;
  onExport: () => void;
  margin: number;
  onMarginChange: (margin: number) => void;
  onBoqItemUpdate: (itemIndex: number, updatedValues: Partial<BoqItem>) => void;
  onBoqItemAdd: () => void;
  onBoqItemDelete: (itemIndex: number) => void;
}

const BoqDisplay: React.FC<BoqDisplayProps> = ({ 
    boq, onRefine, isRefining, onExport, margin, onMarginChange, onBoqItemUpdate, onBoqItemAdd, onBoqItemDelete 
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number> | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [isWebSearchModalOpen, setIsWebSearchModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<BoqItem | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    };
    fetchRates();
  }, []);

  const currencySymbol = useMemo(() => {
    return CURRENCIES.find(c => c.value === selectedCurrency)?.symbol || '$';
  }, [selectedCurrency]);

  const { processedBoq, totals } = useMemo(() => {
    if (!exchangeRates || !boq) {
        return { 
            processedBoq: [], 
            totals: { subTotal: 0, marginAmount: 0, gstAmount: 0, grandTotal: 0 } 
        };
    }
    
    const rate = exchangeRates[selectedCurrency] || 1;
    const gstRate = 0.18;

    let subTotal = 0;
    let totalAfterMargin = 0;

    const processedItems = boq.map(item => {
      const baseTotalPrice = item.totalPrice * rate;
      const currentItemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
      const itemMarginMultiplier = 1 + currentItemMarginPercent / 100;
      const totalPriceWithMargin = baseTotalPrice * itemMarginMultiplier;
      const unitPriceWithMargin = (item.unitPrice * rate) * itemMarginMultiplier;
      const gstAmountForItem = totalPriceWithMargin * gstRate;
      const finalTotalPrice = totalPriceWithMargin + gstAmountForItem;
      const finalUnitPrice = unitPriceWithMargin * (1 + gstRate);

      subTotal += baseTotalPrice;
      totalAfterMargin += totalPriceWithMargin;

      return {
          ...item,
          unitPrice: finalUnitPrice,
          totalPrice: finalTotalPrice,
      };
    });
    
    const marginAmount = totalAfterMargin - subTotal;
    const gstAmount = totalAfterMargin * gstRate;
    const grandTotal = totalAfterMargin + gstAmount;

    return { 
        processedBoq: processedItems, 
        totals: { subTotal, marginAmount, gstAmount, grandTotal } 
    };
  }, [boq, selectedCurrency, exchangeRates, margin]);

  
  const handleAddProductFromSearch = (productName: string, productDescription: string) => {
    const prompt = `CRITICAL COMMAND: Add a single item to the BOQ based on the following details. DO NOT substitute the brand or model.
- Searched Product Name: "${productName}"
- Detailed Product Description from Web Search: "${productDescription}"
- Quantity: 1
- Action: From the detailed description, extract the precise Brand and Model. Find the most logical category for this item. Provide a realistic unit price in USD. Add this single item to the existing list and return the complete, updated BOQ. Do not add any other items.`;
    onRefine(prompt);
    setIsWebSearchModalOpen(false);
  };

  const handleFetchDetails = (item: BoqItem) => {
    setSelectedProduct(item);
    setIsWebSearchModalOpen(true);
  };
  
  const handleOpenWebSearch = () => {
    setSelectedProduct(null);
    setIsWebSearchModalOpen(true);
  };

  const handleImageClick = (item: BoqItem) => {
    setSelectedProduct(item);
    setIsImagePreviewOpen(true);
  };

  const inputClass = "block w-full text-sm bg-slate-700 border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-white py-1 px-2";
  const numberInputClass = `${inputClass} text-center`;


  return (
    <>
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-white">Generated Bill of Quantities</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <label htmlFor="margin-input" className="text-sm font-medium text-slate-300">Project Margin:</label>
                <div className="relative rounded-md shadow-sm">
                    <input
                        type="number"
                        name="margin-input"
                        id="margin-input"
                        className="block w-24 pl-3 pr-8 py-2 text-base bg-slate-700 border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white"
                        placeholder="0"
                        value={margin}
                        onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
                        min="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 sm:text-sm">%</span>
                    </div>
                </div>
            </div>
            <CurrencySelector selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} disabled={!exchangeRates} />
            <button
                onClick={handleOpenWebSearch}
                className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
            >
                <SearchIcon className="h-5 w-5 mr-2" /> Web Search
            </button>
            <button
                onClick={() => setIsRefineModalOpen(true)}
                disabled={!boq || boq.length === 0}
                className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
                <WandIcon /> Refine with AI
            </button>
            <button
                onClick={onExport}
                disabled={!boq || boq.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
                <DownloadIcon /> Export
            </button>
          </div>
        </div>

        {boq && boq.length > 0 ? (
            <>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900">
                <tr>
                    {['Category', 'Item Description', 'Brand', 'Model', 'Qty', 'Unit Price (USD)', 'Item Margin (%)', 'Final Unit Price', 'Final Total Price', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {header}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                {processedBoq.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-700/50 align-middle">
                    <td className="px-3 py-2 whitespace-nowrap"><input type="text" value={item.category} onChange={(e) => onBoqItemUpdate(index, { category: e.target.value })} className={inputClass} style={{minWidth: '120px'}} /></td>
                    <td className="px-3 py-2">
                        <AutoResizeTextarea
                            value={item.itemDescription}
                            onChange={(e) => onBoqItemUpdate(index, { itemDescription: e.target.value })}
                            className={`${inputClass} resize-none overflow-hidden`}
                            style={{minWidth: '250px'}}
                        />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap"><input type="text" value={item.brand} onChange={(e) => onBoqItemUpdate(index, { brand: e.target.value })} className={inputClass} style={{minWidth: '120px'}} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><input type="text" value={item.model} onChange={(e) => onBoqItemUpdate(index, { model: e.target.value })} className={inputClass} style={{minWidth: '120px'}}/></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                        <input type="number" value={item.quantity} onChange={(e) => {
                            const newQuantity = parseInt(e.target.value, 10) || 0;
                            const originalItem = boq[index];
                            onBoqItemUpdate(index, {
                                quantity: newQuantity,
                                totalPrice: newQuantity * originalItem.unitPrice,
                            });
                        }} className={numberInputClass} style={{width: '70px'}} min="0" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                        <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">$</span>
                        <input
                            type="number"
                            className="block w-full text-sm bg-slate-700 border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-white py-1 pl-5 pr-2"
                            value={boq[index].unitPrice}
                            onChange={(e) => {
                                const newUnitPrice = parseFloat(e.target.value) || 0;
                                const originalItem = boq[index];
                                onBoqItemUpdate(index, {
                                    unitPrice: newUnitPrice,
                                    totalPrice: newUnitPrice * originalItem.quantity,
                                });
                            }}
                            min="0"
                            step="0.01"
                            style={{width: '120px'}}
                        />
                        </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                        <div className="relative">
                        <input
                            type="number"
                            className={numberInputClass}
                            style={{width: '80px'}}
                            value={item.margin ?? ''}
                            onChange={(e) => onBoqItemUpdate(index, { margin: parseFloat(e.target.value) })}
                            placeholder={`${margin}`}
                            min="0"
                        />
                        </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300 text-right">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300 text-right font-semibold">{currencySymbol}{item.totalPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-400 space-x-1 flex items-center">
                        <button onClick={() => handleImageClick(item)} className="p-1 hover:text-blue-400" title="Preview Image"><ImageIcon /></button>
                        <button onClick={() => handleFetchDetails(item)} className="p-1 hover:text-green-400" title="Fetch Details"><SearchIcon /></button>
                        <button onClick={() => onBoqItemDelete(index)} className="p-1 hover:text-red-500" title="Delete Item"><TrashIcon /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
                <tfoot className="bg-slate-900">
                    <tr>
                        <td colSpan={8} className="px-6 py-3 text-right text-sm font-medium text-slate-300 uppercase">Subtotal</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-slate-300">{currencySymbol}{totals.subTotal.toFixed(2)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={8} className="px-6 py-3 text-right text-sm font-medium text-slate-300 uppercase">Total Margin</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-slate-300">{currencySymbol}{totals.marginAmount.toFixed(2)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={8} className="px-6 py-3 text-right text-sm font-medium text-slate-300 uppercase">GST (18%)</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-slate-300">{currencySymbol}{totals.gstAmount.toFixed(2)}</td>
                        <td></td>
                    </tr>
                    <tr className="border-t-2 border-slate-700">
                        <td colSpan={8} className="px-6 py-3 text-right text-sm font-bold text-white uppercase">Grand Total</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-white">{currencySymbol}{totals.grandTotal.toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            </div>
            <div className="mt-4">
                <button
                    onClick={onBoqItemAdd}
                    className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
                >
                    <PlusIcon /> Add Item
                </button>
            </div>
            </>
        ) : (
            <div className="text-center py-12 text-slate-400 border-t border-slate-700 mt-4">
                <h3 className="text-lg font-semibold">This BOQ is empty.</h3>
                <p>Generate a full BOQ using the questionnaire, or add individual items using "Web Search".</p>
            </div>
        )}

      </div>
      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onSubmit={(prompt) => {
          onRefine(prompt);
          setIsRefineModalOpen(false);
        }}
        isLoading={isRefining}
      />
      <WebSearchModal
        isOpen={isWebSearchModalOpen}
        onClose={() => setIsWebSearchModalOpen(false)}
        initialProductName={selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model}` : ''}
        onAdd={handleAddProductFromSearch}
      />
       {isImagePreviewOpen && selectedProduct && (
        <ImagePreviewModal
          imageUrl={`https://source.unsplash.com/800x600/?${encodeURIComponent(selectedProduct.itemDescription)}`}
          onClose={() => setIsImagePreviewOpen(false)}
        />
      )}
    </>
  );
};

export default BoqDisplay;