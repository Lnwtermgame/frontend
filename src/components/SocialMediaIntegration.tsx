"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "@/lib/framer-exports";
import {
  Facebook,
  Twitter,
  Instagram,
  Twitch,
  Youtube,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

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
  className = "",
}: SocialMediaIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any pending message timer on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  // Default platforms if none provided
  const defaultPlatforms: SocialPlatform[] = [
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook />,
      connected: false,
      color: "#1877F2",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: <Twitter />,
      connected: false,
      color: "#1DA1F2",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram />,
      connected: false,
      color: "#E4405F",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: <Youtube />,
      connected: false,
      color: "#FF0000",
    },
    {
      id: "twitch",
      name: "Twitch",
      icon: <Twitch />,
      connected: false,
      color: "#9146FF",
    },
  ];

  const displayPlatforms = platforms.length > 0 ? platforms : defaultPlatforms;

  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await onConnect(platformId);
      setSuccessMessage(
        `Successfully connected to ${displayPlatforms.find((p) => p.id === platformId)?.name}`,
      );
      messageTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(
        `Failed to connect to ${displayPlatforms.find((p) => p.id === platformId)?.name}`,
      );
      messageTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
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
      setSuccessMessage(
        `Successfully disconnected from ${displayPlatforms.find((p) => p.id === platformId)?.name}`,
      );
      messageTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(
        `Failed to disconnect from ${displayPlatforms.find((p) => p.id === platformId)?.name}`,
      );
      messageTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-brutal-blue/20 border-2 border-black flex items-center justify-center">
          <Globe className="h-5 w-5 text-brutal-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Social Accounts</h2>
          <p className="text-gray-600 text-sm">
            Connect your social media accounts to share progress and get rewards
          </p>
        </div>
      </div>

      {/* Notification Messages */}
      {(successMessage || errorMessage) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 border-2 border-black ${successMessage ? "bg-green-100" : "bg-red-100"}`}
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="flex items-center">
            {successMessage ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span
              className={successMessage ? "text-green-700" : "text-red-700"}
            >
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            whileHover={{ y: -4, boxShadow: "6px 6px 0 0 #000000" }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div
                    className="h-12 w-12 border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <span
                      className="text-2xl"
                      style={{ color: platform.color }}
                    >
                      {platform.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-black font-medium">{platform.name}</h3>
                    {platform.connected ? (
                      <span className="text-green-600 text-sm flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">
                        Not connected
                      </span>
                    )}
                  </div>
                </div>

                {platform.connected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={isConnecting === platform.id}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 border-2 border-black text-red-700 text-sm transition-colors font-medium"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    {isConnecting === platform.id
                      ? "Processing..."
                      : "Disconnect"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting === platform.id}
                    className="px-3 py-1.5 bg-brutal-blue/20 hover:bg-brutal-blue/30 border-2 border-black text-brutal-blue text-sm transition-colors font-medium"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    {isConnecting === platform.id ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>

              {platform.connected && platform.username && (
                <div className="mt-4 bg-gray-100 border-2 border-black p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600 text-xs">Username:</span>
                      <span className="text-black text-sm ml-2 font-medium">
                        {platform.username}
                      </span>
                    </div>
                    {platform.followers !== undefined && (
                      <div className="text-brutal-blue text-sm font-medium">
                        {platform.followers.toLocaleString()} followers
                      </div>
                    )}
                  </div>

                  {platform.profileUrl && (
                    <Link
                      href={platform.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-brutal-blue hover:underline text-sm inline-flex items-center font-medium"
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
      <div
        className="bg-brutal-gray border-[3px] border-black p-5 mt-6"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <h3 className="text-black font-bold mb-3">
          Why Connect Social Accounts?
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <div className="h-5 w-5 bg-brutal-blue/20 border-2 border-black flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 bg-brutal-blue"></div>
            </div>
            <span className="text-gray-600">
              Share your gaming achievements with your friends
            </span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 bg-brutal-blue/20 border-2 border-black flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 bg-brutal-blue"></div>
            </div>
            <span className="text-gray-600">
              Earn bonus points when friends use your referral
            </span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 bg-brutal-blue/20 border-2 border-black flex items-center justify-center mr-3 mt-0.5">
              <div className="h-2 w-2 bg-brutal-blue"></div>
            </div>
            <span className="text-gray-600">
              Participate in exclusive social media promotions
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
