"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, Clock, ChevronDown, CheckCircle2, Tag } from 'lucide-react';
import { motion } from '@/lib/framer-exports';
import { GameCard } from '@/components/GameCard';
import { SmartSearchBar } from '@/components/search/SmartSearchBar';
import Link from 'next/link';

type GameType = 'riot' | 'garena' | 'steam' | 'default';

interface GameData {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  type: GameType;
  region: string;
  isFavorite?: boolean;
}

// Empty data arrays - will be populated from backend
const allGames: GameData[] = [];

// Categories - will be populated from backend
const categories = [
  { id: 'all', name: 'All Games', count: 0 },
];

// Sort options
const sortOptions = [
  { id: 'relevance', name: 'Relevance' },
  { id: 'price-asc', name: 'Price: Low to High' },
  { id: 'price-desc', name: 'Price: High to Low' },
  { id: 'name-asc', name: 'Name: A to Z' },
  { id: 'name-desc', name: 'Name: Z to A' },
];

// Card types
const cardTypes = [
  { id: 'all', name: 'All Types' },
  { id: 'games', name: 'Games' },
  { id: 'gift-cards', name: 'Gift Cards' },
  { id: 'subscriptions', name: 'Subscriptions' },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCardType, setSelectedCardType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<GameData[]>([]);
  
  // Search function
  const performSearch = (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const results = allGames.filter(game => 
      game.title.toLowerCase().includes(lowerQuery) ||
      game.type.toLowerCase().includes(lowerQuery) ||
      game.region.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults(results);
  };
  
  // Apply filters to search results
  const applyFilters = (results: GameData[]) => {
    let filtered = [...results];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => game.type === selectedCategory);
    }
    
    // Apply price range filter
    filtered = filtered.filter(game => game.price >= priceRange[0] && game.price <= priceRange[1]);
    
    // Apply sorting
    switch (selectedSort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      // relevance is default
    }
    
    return filtered;
  };
  
  // Initial search and when URL parameters change
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      performSearch(queryParam);
    }
  }, [queryParam]);
  
  // Apply filters when filter options change
  useEffect(() => {
    if (searchResults.length > 0) {
      setSearchResults(applyFilters(searchResults));
    }
  }, [selectedCategory, selectedCardType, selectedSort, priceRange]);
  
  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };
  
  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };
  
  // Toggle filter menu on mobile
  const toggleFilterMenu = () => {
    setFilterMenuOpen(prev => !prev);
  };
  
  return (
    <div className="page-container pb-8">
      <div className="space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white">Search Results</h1>
          
          {/* Main search bar */}
          <SmartSearchBar 
            placeholder="Search games, cards, and more..." 
            className="w-full max-w-3xl"
            onSearch={handleSearchSubmit}
            maxResults={5}
          />
          
          {/* Search status */}
          {searchQuery ? (
            <p className="text-mali-text-secondary">
              {searchResults.length} results for "{searchQuery}"
            </p>
          ) : (
            <p className="text-mali-text-secondary">
              Enter a search term to find games, cards, and more
            </p>
          )}
        </div>
        
        {/* Search results area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 space-y-6 flex-shrink-0">
            {/* Category Filter */}
            <div className="glass-card p-4">
              <h3 className="font-medium text-white mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full text-left py-1.5 px-2 rounded-md flex items-center justify-between ${
                      selectedCategory === category.id
                        ? 'bg-mali-blue/30 text-white'
                        : 'text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                    }`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span className="text-sm">{category.name}</span>
                    <span className="text-xs bg-mali-blue/20 rounded-full px-2 py-0.5">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div className="glass-card p-4">
              <h3 className="font-medium text-white mb-3">Price Range</h3>
              <div className="px-2">
                <div className="flex justify-between text-sm text-mali-text-secondary mb-2">
                  <span>${priceRange[0].toFixed(2)}</span>
                  <span>${priceRange[1].toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-mali-blue cursor-pointer"
                />
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="glass-card p-4">
              <h3 className="font-medium text-white mb-3">Sort By</h3>
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-sm ${
                      selectedSort === option.id
                        ? 'bg-mali-blue/30 text-white'
                        : 'text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                    }`}
                    onClick={() => setSelectedSort(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="glass-card p-4">
              <h3 className="font-medium text-white mb-3">Type</h3>
              <div className="space-y-1">
                {cardTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-sm ${
                      selectedCardType === type.id
                        ? 'bg-mali-blue/30 text-white'
                        : 'text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                    }`}
                    onClick={() => setSelectedCardType(type.id)}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recent Searches */}
            <div className="glass-card p-4">
              <h3 className="font-medium text-white mb-3">Recent Searches</h3>
              <div className="space-y-1">
                <button className="w-full text-left py-1.5 px-2 rounded-md text-sm text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white flex items-center">
                  <Clock size={14} className="mr-2" />
                  <span>Valorant</span>
                </button>
                <button className="w-full text-left py-1.5 px-2 rounded-md text-sm text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white flex items-center">
                  <Clock size={14} className="mr-2" />
                  <span>Steam Gift Card</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Filters Button */}
          <div className="lg:hidden">
            <button 
              onClick={toggleFilterMenu}
              className="w-full bg-mali-blue/20 text-mali-blue-light border border-mali-blue/30 py-3 rounded-lg flex items-center justify-center"
            >
              <Filter size={18} className="mr-2" />
              <span>Filters & Sorting</span>
              <ChevronDown size={18} className={`ml-2 transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Mobile Filter Menu */}
            {filterMenuOpen && (
              <div className="mt-4 glass-card p-4 divide-y divide-mali-blue/20">
                {/* Sort Options */}
                <div className="pb-4">
                  <h3 className="font-medium text-white mb-2">Sort By</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        className={`py-1.5 px-2 rounded-md text-sm ${
                          selectedSort === option.id
                            ? 'bg-mali-blue/30 text-white'
                            : 'text-mali-text-secondary bg-mali-blue/10'
                        }`}
                        onClick={() => setSelectedSort(option.id)}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <div className="py-4">
                  <h3 className="font-medium text-white mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 5).map((category) => (
                      <button
                        key={category.id}
                        className={`py-1 px-2 rounded-md text-xs ${
                          selectedCategory === category.id
                            ? 'bg-mali-blue text-white'
                            : 'bg-mali-blue/20 text-mali-text-secondary'
                        }`}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="py-4">
                  <h3 className="font-medium text-white mb-2">Price Range</h3>
                  <div className="px-2">
                    <div className="flex justify-between text-sm text-mali-text-secondary mb-2">
                      <span>${priceRange[0].toFixed(2)}</span>
                      <span>${priceRange[1].toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-mali-blue cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Search Results */}
          <div className="flex-1">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((game) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GameCard
                      id={game.id}
                      title={game.title}
                      image={game.image}
                      price={game.price}
                      originalPrice={game.originalPrice}
                      type={game.type}
                      region={game.region}
                    />
                  </motion.div>
                ))}
              </div>
            ) : searchQuery ? (
              <motion.div 
                className="glass-card p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Search className="h-16 w-16 mx-auto text-mali-blue/50 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
                <p className="text-mali-text-secondary mb-6">
                  We couldn't find any matches for "{searchQuery}". Please try a different search term.
                </p>
                <div className="space-y-3">
                  <h3 className="font-medium text-white">Suggestions:</h3>
                  <ul className="text-mali-text-secondary text-sm">
                    <li>• Check your spelling</li>
                    <li>• Try more general terms</li>
                    <li>• Try different keywords</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="glass-card p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Search className="h-16 w-16 mx-auto text-mali-blue/50 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Search for games and more</h2>
                <p className="text-mali-text-secondary mb-6">
                  Enter a search term above to find games, gift cards, and more.
                </p>
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Popular searches:</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Valorant", "PUBG Mobile", "Steam", "Fortnite", "Gift Cards"].map((term) => (
                      <button
                        key={term}
                        className="bg-mali-blue/20 text-mali-blue-light px-3 py-1.5 rounded-md text-sm hover:bg-mali-blue/30"
                        onClick={() => handleSearchSubmit(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Browse Categories */}
            {!searchQuery && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4">Browse Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <Link href={`/games?category=${category.id}`} key={category.id}>
                      <div className="glass-card p-4 hover:border-mali-blue hover:bg-mali-blue/10 transition-all">
                        <div className="font-medium text-white">{category.name}</div>
                        <div className="text-xs text-mali-text-secondary">{category.count} items</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 