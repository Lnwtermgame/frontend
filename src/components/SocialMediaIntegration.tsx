"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { Facebook, Twitter, Instagram, Twitch, Youtube, Globe, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  username?: string;
  profileUrl?: string;
  color: string;
  followers?: number;
}

export interface SocialMediaIntegrationProps {
  platforms?: SocialPlatform[];
  onConnect: (platformId: string) => Promise<void>;
  onDisconnect: (platformId: string) => Promise<void>;
  className?: string;
}

export function SocialMediaIntegration({
  platforms = [],
  onConnect,
  onDisconnect,
  className = ""
}: SocialMediaIntegrationProps) {
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Default platforms if none provided
  const defaultPlatforms: SocialPlatform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook />,
      connected: false,
      color: '#1877F2'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: <Twitter />,
      connected: false,
      color: '#1DA1F2'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram />,
      connected: false,
      color: '#E4405F'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube />,
      connected: false,
      color: '#FF0000'
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: <Twitch />,
      connected: false,
      color: '#9146FF'
    }
  ];
  
  const displayPlatforms = platforms.length > 0 ? platforms : defaultPlatforms;
  
  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      await onConnect(platformId);
      setSuccessMessage(`Successfully connected to ${displayPlatforms.find(p => p.id === platformId)?.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(`Failed to connect to ${displayPlatforms.find(p => p.id === platformId)?.name}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsConnecting(null);
    }
  };
  
  const handleDisconnect = async (platformId: string) => {
    setIsConnecting(platformId);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      await onDisconnect(platformId);
      setSuccessMessage(`Successfully disconnected from ${displayPlatforms.find(p => p.id === platformId)?.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(`Failed to disconnect from ${displayPlatforms.find(p => p.id === platformId)?.name}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsConnecting(null);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-mali-blue/30 flex items-center justify-center">
          <Globe className="h-5 w-5 text-mali-blue-light" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Social Accounts</h2>
          <p className="text-mali-text-secondary text-sm">Connect your social media accounts to share progress and get rewards</p>
        </div>
      </div>
      
      {/* Notification Messages */}
      {(successMessage || errorMessage) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-lg ${successMessage ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}
        >
          <div className="flex items-center">
            {successMessage ? (
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
            )}
            <span className={successMessage ? 'text-green-400' : 'text-red-400'}>
              {successMessage || errorMessage}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Platforms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPlatforms.map((platform) => (
          <motion.div
            key={platform.id}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            whileHover={{ y: -4, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <span className="text-2xl" style={{ color: platform.color }}>{platform.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{platform.name}</h3>
                    {platform.connected ? (
                      <span className="text-green-400 text-sm flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </span>
                    ) : (
                      <span className="text-mali-text-secondary text-sm">Not connected</span>
                    )}
                  </div>
                </div>
                
                {platform.connected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={isConnecting === platform.id}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md text-sm transition-colors"
                  >
                    {isConnecting === platform.id ? 'Processing...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting === platform.id}
                    className="px-3 py-1.5 bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/20 text-mali-blue-light rounded-md text-sm transition-colors"
                  >
                    {isConnecting === platform.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
              
              {platform.connected && platform.username && (
                <div className="mt-4 bg-mali-blue/10 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-mali-text-secondary text-xs">Username:</span>
                      <span className="text-white text-sm ml-2">{platform.username}</span>
                    </div>
                    {platform.followers !== undefined && (
                      <div className="text-mali-blue-light text-sm">
                        {platform.followers.toLocaleString()} followers
                      </div>
                    )}
                  </div>
                  
                  {platform.profileUrl && (
                    <Link 
                      href={platform.profileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-mali-blue-light hover:text-mali-blue-accent text-sm inline-flex items-center"
                    >
                      View Profile
                      <Globe className="h-3 w-3 ml-1" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-mali-blue/20 to-mali-purple/20 border border-mali-blue/30 rounded-xl p-5 mt-6">
        <h3 className="text-white font-medium mb-3">Why Connect Social Accounts?</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-mali-blue-light"></div>
            </div>
            <span className="text-mali-text-secondary">Share your gaming achievements with your friends</span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-mali-blue-light"></div>
            </div>
            <span className="text-mali-text-secondary">Earn bonus points when friends use your referral</span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-mali-blue-light"></div>
            </div>
            <span className="text-mali-text-secondary">Participate in exclusive social media promotions</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 
