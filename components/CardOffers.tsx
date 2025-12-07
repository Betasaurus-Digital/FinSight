
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SavedCard, BankOffer } from '../types';
import { detectCardInfo, getCardColors } from '../utils/cardUtils';
import { saveCard, deleteCard } from '../utils/storage';
import { fetchBankOffers, findCreditCards } from '../services/geminiService';

interface CardOffersProps {
  myCards: SavedCard[];
  onCardsChange: () => void;
}

const OfferModal: React.FC<{ offer: BankOffer; onClose: () => void }> = ({ offer, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (offer.code) {
      navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearchDeal = () => {
     window.open(`https://www.google.com/search?q=${encodeURIComponent(`${offer.bank} ${offer.platform} ${offer.title} offer`)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
           >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="flex items-center gap-3 mb-4">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {offer.category}
              </span>
              {offer.validTill && (
                 <span className="bg-rose-500/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Exp {offer.validTill}
                 </span>
              )}
           </div>
           <h3 className="text-2xl font-bold leading-tight mb-1">{offer.title}</h3>
           <p className="text-indigo-100 font-medium">{offer.bank} • {offer.platform}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
           <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Offer Details</h4>
              <p className="text-slate-700 leading-relaxed text-sm">{offer.description}</p>
              <p className="text-slate-700 leading-relaxed text-sm mt-2">
                 Use your <span className="font-semibold text-indigo-600">{offer.bank}</span> card on <span className="font-semibold text-indigo-600">{offer.platform}</span> to avail this offer. Ensure you check the merchant's T&C before transaction.
              </p>
           </div>

           {/* Coupon Section */}
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs text-slate-500 font-medium uppercase">Promo Code</span>
              {offer.code ? (
                <div 
                   onClick={handleCopy}
                   className="w-full bg-white border-2 border-dashed border-indigo-200 rounded-lg py-3 px-4 font-mono text-xl font-bold text-indigo-700 tracking-widest cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all relative group"
                >
                   {offer.code}
                   <div className="absolute inset-0 flex items-center justify-center bg-indigo-600 text-white font-sans text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      {copied ? 'Copied!' : 'Click to Copy'}
                   </div>
                </div>
              ) : (
                <div className="text-slate-400 font-medium italic">No code needed. Direct discount.</div>
              )}
           </div>
           
           {/* Actions */}
           <button 
             onClick={handleSearchDeal}
             className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
           >
             Find Deal Online
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export const CardOffers: React.FC<CardOffersProps> = ({ myCards, onCardsChange }) => {
  const [activeTab, setActiveTab] = useState<'MY_OFFERS' | 'ALL_OFFERS' | 'ADD_CARD'>('MY_OFFERS');
  const [selectedOffer, setSelectedOffer] = useState<BankOffer | null>(null);
  
  // Add Card State
  const [addMethod, setAddMethod] = useState<'SEARCH' | 'NUMBER'>('SEARCH');
  const [cardNumber, setCardNumber] = useState('');
  const [searchCardQuery, setSearchCardQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{name: string, bank: string, network: string}>>([]);
  const [isSearchingCards, setIsSearchingCards] = useState(false);

  // Offers State
  const [searchTerm, setSearchTerm] = useState('');
  const [liveOffers, setLiveOffers] = useState<BankOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // Derived state for adding a card by number
  const detectedInfo = useMemo(() => detectCardInfo(cardNumber), [cardNumber]);
  
  // Fetch Offers Function (reusable)
  const loadOffers = useCallback(async (pageNum: number, isNewSearch: boolean) => {
      // Don't fetch if adding card
      if (activeTab === 'ADD_CARD') return;

      if (isNewSearch) {
        setIsLoadingOffers(true);
        setLiveOffers([]);
      } else {
        setIsLoadingMore(true);
      }

      let query = '';

      if (activeTab === 'MY_OFFERS') {
        if (myCards.length === 0) {
          if (isNewSearch) {
              setLiveOffers([]);
              setIsLoadingOffers(false);
          }
          return;
        }
        // Use specific card names if available, falling back to bank names
        const cardNames = Array.from(new Set(myCards.map(c => c.cardName || c.bankName))).join(', ');
        query = `Current active offers for these specific credit cards: ${cardNames} in ${new Date().getFullYear()}.`;
      } else {
        // ALL_OFFERS
        query = searchTerm 
          ? `Credit card offers for ${searchTerm}` 
          : `Top trending credit card offers worldwide ${new Date().getFullYear()}`;
      }

      try {
        const newOffers = await fetchBankOffers(query, pageNum);
        
        setLiveOffers(prev => {
          if (isNewSearch) return newOffers;
          
          // Deduplicate based on title and bank to prevent repeats in pagination
          const existingIds = new Set(prev.map(o => `${o.bank}-${o.title}`));
          const uniqueNewOffers = newOffers.filter(o => !existingIds.has(`${o.bank}-${o.title}`));
          
          return [...prev, ...uniqueNewOffers];
        });
      } catch (e) {
        console.error("Failed to load offers", e);
      } finally {
        if (isNewSearch) setIsLoadingOffers(false);
        else setIsLoadingMore(false);
      }
  }, [activeTab, myCards, searchTerm]);

  // Initial Load Effect (Debounced)
  useEffect(() => {
    setPage(1); // Reset page on tab/search change
    const timeoutId = setTimeout(() => {
      loadOffers(1, true);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [activeTab, myCards, searchTerm, loadOffers]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadOffers(nextPage, false);
  };

  const handleCardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCardQuery.trim()) return;
    
    setIsSearchingCards(true);
    try {
      const results = await findCreditCards(searchCardQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCards(false);
    }
  };

  const saveFoundCard = (card: {name: string, bank: string, network: string}) => {
    const colors = getCardColors(card.bank);
    const newCard: SavedCard = {
      id: Date.now().toString(),
      bankName: card.bank,
      cardName: card.name,
      network: card.network,
      cardType: 'Credit',
      last4: '****', // Placeholder for manually added cards
      colorStart: colors.start,
      colorEnd: colors.end
    };
    saveCard(newCard);
    setSearchCardQuery('');
    setSearchResults([]);
    onCardsChange();
    setActiveTab('MY_OFFERS');
  };

  const handleAddCardNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 13) return;

    const colors = getCardColors(detectedInfo.bankName);
    
    const newCard: SavedCard = {
      id: Date.now().toString(),
      bankName: detectedInfo.bankName,
      // No specific card name for number detection usually
      network: detectedInfo.network,
      cardType: 'Credit', 
      last4: cardNumber.slice(-4),
      colorStart: colors.start,
      colorEnd: colors.end
    };

    saveCard(newCard);
    setCardNumber('');
    onCardsChange();
    setActiveTab('MY_OFFERS');
  };

  const handleDeleteCard = (id: string) => {
    if (confirm('Remove this card?')) {
      deleteCard(id);
      onCardsChange();
    }
  };

  const getNetworkIcon = (network: string) => {
    const n = network.toLowerCase();
    if (n.includes('visa')) return <i className="fab fa-cc-visa text-2xl"></i>;
    if (n.includes('master')) return <i className="fab fa-cc-mastercard text-2xl"></i>;
    if (n.includes('amex') || n.includes('american')) return <i className="fab fa-cc-amex text-2xl"></i>;
    return <i className="fas fa-credit-card text-2xl"></i>;
  };

  const getCategoryColor = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('food') || cat.includes('dining')) return 'bg-orange-100 text-orange-600';
    if (cat.includes('travel') || cat.includes('flight') || cat.includes('hotel') || cat.includes('cab')) return 'bg-sky-100 text-sky-600';
    if (cat.includes('shop') || cat.includes('fashion') || cat.includes('electronic')) return 'bg-purple-100 text-purple-600';
    if (cat.includes('fuel')) return 'bg-rose-100 text-rose-600';
    if (cat.includes('utility')) return 'bg-yellow-100 text-yellow-700';
    if (cat.includes('grocery')) return 'bg-emerald-100 text-emerald-600';
    return 'bg-slate-100 text-slate-500';
  };

  const getPlatformInitial = (platform: string) => {
    return platform ? platform.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {selectedOffer && (
        <OfferModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
      )}
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cards & Rewards</h2>
          <p className="text-slate-500 text-sm">Manage your cards and discover live worldwide offers</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm">
           <button 
             onClick={() => setActiveTab('MY_OFFERS')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'MY_OFFERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
           >
             My Offers
           </button>
           <button 
             onClick={() => setActiveTab('ALL_OFFERS')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ALL_OFFERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
           >
             Explore All
           </button>
           <button 
             onClick={() => setActiveTab('ADD_CARD')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ADD_CARD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
           >
             + Add Card
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Saved Cards (Always Visible) */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">My Wallet ({myCards.length})</h3>
              
              {myCards.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                  <p className="text-slate-400 text-sm mb-2">No cards saved</p>
                  <button onClick={() => setActiveTab('ADD_CARD')} className="text-indigo-600 font-medium text-sm hover:underline">Add a card</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCards.map(card => (
                    <div 
                      key={card.id} 
                      className="relative h-40 rounded-xl p-5 text-white shadow-lg transition-transform hover:-translate-y-1"
                      style={{ background: `linear-gradient(135deg, ${card.colorStart}, ${card.colorEnd})` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="font-bold tracking-wider text-sm opacity-90">{card.bankName}</span>
                            {card.cardName && <span className="text-xs opacity-75 font-medium mt-1">{card.cardName}</span>}
                        </div>
                        {getNetworkIcon(card.network)}
                      </div>
                      <div className="mt-8">
                         <div className="flex items-center gap-2">
                           {card.last4 === '****' ? (
                               <span className="text-sm opacity-60 tracking-widest">**** **** **** ****</span>
                           ) : (
                               <>
                                <span className="text-xl opacity-60 tracking-widest">••••</span>
                                <span className="text-xl opacity-60 tracking-widest mx-2">••••</span>
                                <span className="font-mono text-xl tracking-widest">{card.last4}</span>
                               </>
                           )}
                         </div>
                      </div>
                      <div className="mt-6 flex justify-between items-end">
                        <span className="text-xs uppercase opacity-75">{card.cardType}</span>
                        <button 
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-white opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Right Col: Dynamic Content */}
        <div className="lg:col-span-2">
           
           {/* Add Card View */}
           {activeTab === 'ADD_CARD' && (
             <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm max-w-lg mx-auto animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Add a New Card</h3>
                
                {/* Method Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                    <button 
                        onClick={() => setAddMethod('SEARCH')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${addMethod === 'SEARCH' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Search by Name
                    </button>
                    <button 
                        onClick={() => setAddMethod('NUMBER')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${addMethod === 'NUMBER' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Enter Number
                    </button>
                </div>
                
                {/* Method: SEARCH */}
                {addMethod === 'SEARCH' && (
                    <div className="space-y-6">
                        <form onSubmit={handleCardSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="e.g. HDFC Regalia, Amex Platinum..."
                                value={searchCardQuery}
                                onChange={(e) => setSearchCardQuery(e.target.value)}
                                className="flex-1 block rounded-lg border-slate-300 border p-3 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button 
                                type="submit" 
                                disabled={isSearchingCards}
                                className="bg-indigo-600 text-white px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                {isSearchingCards ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {searchResults.map((result, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            {getNetworkIcon(result.network)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{result.name}</p>
                                            <p className="text-xs text-slate-500">{result.bank} • {result.network}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => saveFoundCard(result)}
                                        className="text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full hover:bg-indigo-600 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                            {searchResults.length === 0 && searchCardQuery && !isSearchingCards && (
                                <p className="text-center text-slate-400 text-sm mt-4">Search to find your card model</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Method: NUMBER */}
                {addMethod === 'NUMBER' && (
                    <form onSubmit={handleAddCardNumber} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                        <div className="relative">
                        <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                            className="block w-full rounded-lg border-slate-300 border p-3 pl-12 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-lg tracking-widest"
                            placeholder="0000 0000 0000 0000"
                            required
                        />
                        <div className="absolute left-3 top-3.5 text-slate-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                        We only store the last 4 digits and bank name. Your full card number is never saved.
                        </p>
                    </div>

                    {cardNumber.length >= 6 && (
                        <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between border border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            {getNetworkIcon(detectedInfo.network)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{detectedInfo.bankName}</p>
                                <p className="text-xs text-slate-500">{detectedInfo.network}</p>
                            </div>
                        </div>
                        <div className="text-xs font-medium text-indigo-600 bg-white px-2 py-1 rounded">
                            Auto-detected
                        </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Save Card
                    </button>
                    </form>
                )}
             </div>
           )}

           {/* Offers View */}
           {(activeTab === 'MY_OFFERS' || activeTab === 'ALL_OFFERS') && (
              <div className="space-y-6">
                 {/* Search Bar */}
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder={activeTab === 'MY_OFFERS' ? "Filter your offers..." : "Search all offers (e.g. Travel, Zomato)..."} 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>

                 {/* Loading State */}
                 {isLoadingOffers ? (
                   <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 h-32 flex flex-col justify-between">
                           <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                           <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                           <div className="h-4 bg-slate-100 rounded w-full"></div>
                        </div>
                      ))}
                      <div className="text-center text-xs text-slate-400">Searching live offers with Gemini...</div>
                   </div>
                 ) : (
                   <>
                     {activeTab === 'MY_OFFERS' && myCards.length === 0 && !searchTerm ? (
                        <div className="text-center py-12">
                           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                           </div>
                           <h3 className="text-lg font-bold text-slate-800">No cards added yet</h3>
                           <p className="text-slate-500 mb-6">Add your credit/debit cards to see personalized offers here.</p>
                           <button onClick={() => setActiveTab('ADD_CARD')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Add Your First Card</button>
                        </div>
                     ) : liveOffers.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                           No offers found. Try a different search term.
                        </div>
                     ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {liveOffers.map((offer, idx) => (
                                <div 
                                    key={offer.id || idx} 
                                    onClick={() => setSelectedOffer(offer)}
                                    className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                                            {getPlatformInitial(offer.platform)}
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${getCategoryColor(offer.category)}`}>
                                                    {offer.category}
                                            </span>
                                            <h4 className="font-bold text-slate-900 leading-tight mt-1 line-clamp-2">{offer.title}</h4>
                                        </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                        {offer.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-600 uppercase">{offer.bank}</span>
                                            {offer.validTill && <span className="text-[10px] text-slate-400">Exp {offer.validTill}</span>}
                                        </div>
                                        <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                        Details <span className="text-lg leading-none">→</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                            </div>
                            
                            {/* Load More Button */}
                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-indigo-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Finding more offers...
                                        </span>
                                    ) : (
                                        "Load More Offers"
                                    )}
                                </button>
                            </div>
                        </>
                     )}
                   </>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
