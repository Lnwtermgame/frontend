"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { Download, Copy, Check, Image as ImageIcon, FileText, Video, Code, Monitor, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface MarketingAsset {
  id: string;
  title: string;
  type: 'banner' | 'logo' | 'text' | 'video' | 'code' | 'template';
  preview: string;
  downloadUrl?: string;
  dimensions?: string;
  format?: string;
  description?: string;
  embedCode?: string;
  copiedState?: boolean;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  assets: MarketingAsset[];
}

export interface MarketingMaterialsProps {
  categories?: AssetCategory[];
  className?: string;
}

export function MarketingMaterials({
  categories = [],
  className = ''
}: MarketingMaterialsProps) {
  
  const [activeCategory, setActiveCategory] = useState<string>(categories.length > 0 ? categories[0].id : '');
  const [copiedAssets, setCopiedAssets] = useState<Record<string, boolean>>({});
  
  // Get active category
  const activeCategoryData = categories.find(cat => cat.id === activeCategory) || categories[0];
  
  // Handle copying embed code
  const handleCopyCode = (assetId: string, code: string) => {
    navigator.clipboard.writeText(code);
    
    // Update copied state for this asset
    setCopiedAssets({
      ...copiedAssets,
      [assetId]: true
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedAssets({
        ...copiedAssets,
        [assetId]: false
      });
    }, 2000);
  };
  
  // Get asset type icon
  const getAssetTypeIcon = (type: string) => {
    switch(type) {
      case 'banner':
      case 'logo':
        return <ImageIcon className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'template':
        return <Monitor className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-mali-blue/30 flex items-center justify-center">
          <Download className="h-5 w-5 text-mali-blue-light" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Marketing Materials</h2>
          <p className="text-mali-text-secondary text-sm">Assets and resources to help you promote our products</p>
        </div>
      </div>
      
      {categories.length === 0 ? (
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center">
          <p className="text-mali-text-secondary">No marketing materials available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-mali-blue/20">
                <h3 className="text-white text-sm font-medium">Categories</h3>
              </div>
              <nav className="p-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left mb-1 transition-colors ${
                      activeCategory === category.id 
                        ? 'bg-mali-blue/20 text-white' 
                        : 'hover:bg-mali-blue/10 text-mali-text-secondary'
                    }`}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center">
                      {category.icon}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`font-medium truncate ${activeCategory === category.id ? 'text-white' : 'text-mali-text-secondary'}`}>
                        {category.name}
                      </p>
                      <p className="text-xs text-mali-text-secondary truncate">
                        {category.assets.length} assets
                      </p>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Materials Display */}
          <div className="lg:col-span-3">
            {activeCategoryData && (
              <motion.div 
                className="space-y-6"
                key={activeCategoryData.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Category Header */}
                <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-mali-blue/20 flex items-center justify-center">
                      {activeCategoryData.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{activeCategoryData.name}</h3>
                      <p className="text-mali-text-secondary">{activeCategoryData.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Assets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {activeCategoryData.assets.map((asset) => (
                    <motion.div 
                      key={asset.id}
                      className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Preview Section */}
                      <div className="relative h-48 bg-gray-900 flex items-center justify-center overflow-hidden">
                        {asset.type === 'banner' || asset.type === 'logo' ? (
                          <Image
                            src={asset.preview}
                            alt={asset.title}
                            fill
                            className="object-contain"
                          />
                        ) : asset.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Video className="h-12 w-12 text-mali-text-secondary" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 py-2 px-3">
                              <p className="text-xs text-white truncate">{asset.title}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {getAssetTypeIcon(asset.type)}
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 bg-gray-900/80 rounded-md px-2 py-1 flex items-center space-x-1">
                          {getAssetTypeIcon(asset.type)}
                          <span className="text-xs text-white capitalize">{asset.type}</span>
                        </div>
                      </div>
                      
                      {/* Asset Details */}
                      <div className="p-4">
                        <h4 className="text-white font-medium">{asset.title}</h4>
                        
                        {/* Dimensions & Format (for visual assets) */}
                        {(asset.dimensions || asset.format) && (
                          <div className="flex space-x-4 mt-1">
                            {asset.dimensions && (
                              <span className="text-xs text-mali-text-secondary">{asset.dimensions}</span>
                            )}
                            {asset.format && (
                              <span className="text-xs text-mali-text-secondary">{asset.format}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Description */}
                        {asset.description && (
                          <p className="text-mali-text-secondary text-sm mt-2">{asset.description}</p>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex mt-4 space-x-3">
                          {asset.downloadUrl && (
                            <Link
                              href={asset.downloadUrl}
                              className="flex-1 flex items-center justify-center space-x-2 bg-mali-blue/20 hover:bg-mali-blue/40 text-mali-blue-light text-sm rounded-lg py-2 px-3 transition-colors"
                              download
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </Link>
                          )}
                          
                          {asset.embedCode && (
                            <button
                              onClick={() => handleCopyCode(asset.id, asset.embedCode || '')}
                              className="flex-1 flex items-center justify-center space-x-2 bg-mali-purple/20 hover:bg-mali-purple/30 text-mali-purple-light text-sm rounded-lg py-2 px-3 transition-colors"
                            >
                              {copiedAssets[asset.id] ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      {/* Additional Resources */}
      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Additional Resources</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Commission Rates */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-mali-blue-light" />
              </div>
              <h4 className="text-white font-medium">Commission Rates</h4>
            </div>
            <p className="text-mali-text-secondary text-sm">View your current commission rates and requirements for higher tiers.</p>
            <Link href="/agent-registration" className="text-mali-blue-light text-sm hover:underline mt-2 inline-block">View rates →</Link>
          </div>
          
          {/* Game Information */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center">
                <Monitor className="h-4 w-4 text-mali-blue-light" />
              </div>
              <h4 className="text-white font-medium">Game Information</h4>
            </div>
            <p className="text-mali-text-secondary text-sm">Access details about games to help you market them effectively.</p>
            <Link href="/games" className="text-mali-blue-light text-sm hover:underline mt-2 inline-block">Browse games →</Link>
          </div>
          
          {/* Social Media Templates */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-mali-blue-light" />
              </div>
              <h4 className="text-white font-medium">Social Templates</h4>
            </div>
            <p className="text-mali-text-secondary text-sm">Post templates optimized for different social media platforms.</p>
            <span className="text-mali-text-secondary text-xs mt-2 inline-block">Coming soon</span>
          </div>
          
          {/* Marketing Guides */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-mali-blue-light" />
              </div>
              <h4 className="text-white font-medium">Marketing Guides</h4>
            </div>
            <p className="text-mali-text-secondary text-sm">Tips and strategies to maximize your affiliate earnings.</p>
            <span className="text-mali-text-secondary text-xs mt-2 inline-block">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
