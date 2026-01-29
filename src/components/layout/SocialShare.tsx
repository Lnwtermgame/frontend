import { useState } from 'react';
import { 
  Facebook, Twitter, Linkedin, Mail, Copy, 
  Check, Share2, MessageCircle, Send, Link as Link2
} from 'lucide-react';
import { motion } from '@/lib/framer-exports';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  hashtags?: string[];
  showLabel?: boolean;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  platforms?: ('facebook' | 'twitter' | 'linkedin' | 'email' | 'telegram' | 'discord' | 'copy')[];
  onShare?: (platform: string) => void;
  size?: number;
  buttonClassName?: string;
  darkMode?: boolean;
}

/**
 * Social share component that allows users to share content on various platforms
 */
export default function SocialShare({
  url,
  title,
  description = '',
  image = '',
  hashtags = [],
  showLabel = false,
  direction = 'horizontal',
  className = '',
  platforms = ['facebook', 'twitter', 'linkedin', 'email', 'copy'],
  onShare,
  size = 18,
  buttonClassName = '',
  darkMode = true,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showNativeSuccess, setShowNativeSuccess] = useState(false);
  const hashtagString = hashtags.length > 0 ? hashtags.join(',') : '';

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onShare?.('copy');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Get sharing URLs for different platforms
  const getShareUrl = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&hashtags=${encodeURIComponent(hashtagString)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      case 'email':
        return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
      case 'discord':
        return 'discord://';  // Discord doesn't have a direct share URL, this would be handled specifically
      default:
        return '';
    }
  };

  // Handle share action
  const handleShare = (platform: string) => {
    if (platform === 'copy') {
      handleCopy();
      return;
    }

    if (platform === 'discord') {
      // Discord sharing would need a special handling
      alert('Discord sharing feature is not fully implemented yet.');
      return;
    }

    window.open(getShareUrl(platform), '_blank', 'width=600,height=400');
    onShare?.(platform);
  };

  // Get icon component for each platform
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook size={size} />;
      case 'twitter':
        return <Twitter size={size} />;
      case 'linkedin':
        return <Linkedin size={size} />;
      case 'email':
        return <Mail size={size} />;
      case 'telegram':
        return <Send size={size} />;
      case 'discord':
        return <MessageCircle size={size} />;
      case 'copy':
        return copied ? <Check size={size} /> : <Copy size={size} />;
      default:
        return <Link2 size={size} />;
    }
  };

  // Get display label for each platform
  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'twitter':
        return 'Twitter';
      case 'linkedin':
        return 'LinkedIn';
      case 'email':
        return 'Email';
      case 'telegram':
        return 'Telegram';
      case 'discord':
        return 'Discord';
      case 'copy':
        return copied ? 'Copied!' : 'Copy Link';
      default:
        return 'Share';
    }
  };

  // Get styling for platform buttons
  const getPlatformButtonStyle = (platform: string) => {
    if (!darkMode) {
      return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }

    switch (platform) {
      case 'facebook':
        return 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400';
      case 'twitter':
        return 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400';
      case 'linkedin':
        return 'bg-blue-800/20 hover:bg-blue-800/30 text-blue-400';
      case 'email':
        return 'bg-red-600/20 hover:bg-red-600/30 text-red-400';
      case 'telegram':
        return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400';
      case 'discord':
        return 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400';
      case 'copy':
        return copied 
          ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400' 
          : 'bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent';
      default:
        return 'bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent';
    }
  };

  // Check if web share API is available
  const isWebShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`${className} ${direction === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}`}>
      {/* Platform-specific share buttons */}
      {platforms.map((platform) => (
        <motion.button
          key={platform}
          onClick={() => handleShare(platform)}
          className={`${buttonClassName} ${getPlatformButtonStyle(platform)} 
            flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 
            ${showLabel ? 'px-4' : 'justify-center'} 
            ${direction === 'vertical' ? 'w-full' : ''}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {getPlatformIcon(platform)}
          {showLabel && <span>{getPlatformLabel(platform)}</span>}
        </motion.button>
      ))}

      {/* Web Share API button (only shown if supported) */}
      {isWebShareSupported && (
        <motion.button
          onClick={handleNativeShare}
          className={`${buttonClassName} bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent
            flex items-center gap-2 p-2 rounded-lg transition-colors duration-200
            ${showLabel ? 'px-4' : 'justify-center'}
            ${direction === 'vertical' ? 'w-full' : ''}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 size={size} />
          {showLabel && <span>Share</span>}
          
          {showNativeSuccess && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-900/80 text-green-400 text-xs rounded-lg"
            >
              Shared successfully!
            </motion.span>
          )}
        </motion.button>
      )}
    </div>
  );

  // Handle native share functionality
  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: description,
        url,
      });
      
      setShowNativeSuccess(true);
      onShare?.('native');
      
      setTimeout(() => {
        setShowNativeSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }
} 
