"use client";

import { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { useSecurity } from '@/lib/context/security-context';
import { useAuth } from '@/lib/hooks/use-auth';
import Image from 'next/image';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  Phone, 
  Smartphone,
  Check,
  X,
  AlertCircle,
  Clock,
  Globe,
  Laptop,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';

export default function SecurityPage() {
  const { user } = useAuth();
  const { 
    securitySettings, 
    updateSecuritySettings,
    sendVerificationEmail,
    setupTwoFactor,
    verifyTwoFactorCode,
    disableTwoFactor,
    logoutAllDevices,
    removeDevice,
    resolveActivity,
    isLoadingSettings,
    is2FAVerified,
    generateBackupCodes
  } = useSecurity();
  
  // Component state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'2fa-app' | 'sms' | 'email'>('2fa-app');
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ secret?: string; qrCodeUrl?: string; }>({});
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  // Handle setting up 2FA
  const handleSetup2FA = async () => {
    const result = await setupTwoFactor(twoFactorMethod);
    
    if (result.success) {
      setTwoFactorSetupData({
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl
      });
    }
  };
  
  // Handle verifying 2FA code
  const handleVerify2FA = async () => {
    setVerificationError('');
    
    const isValid = await verifyTwoFactorCode(twoFactorCode);
    
    if (isValid) {
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      
      // Show backup codes
      const codes = await generateBackupCodes();
      setBackupCodes(codes);
      setShowBackupCodes(true);
    } else {
      setVerificationError('Invalid verification code. Please try again.');
    }
  };
  
  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    const isValid = await disableTwoFactor(disablePassword);
    
    if (isValid) {
      setShowPasswordInput(false);
      setDisablePassword('');
    } else {
      setVerificationError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="text-mali-blue-accent" />
            Security Settings
          </h1>
          <p className="text-mali-text-secondary">
            Manage your account security and privacy settings
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Two-Factor Authentication */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Two-Factor Authentication</h2>
              {securitySettings.twoFactorEnabled && (
                <span className="bg-green-900/30 text-green-400 border border-green-500/20 px-2 py-1 text-xs rounded-full">
                  Enabled
                </span>
              )}
            </div>
            
            <div className="p-6">
              {securitySettings.twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {securitySettings.twoFactorMethod === '2fa-app' && <Smartphone className="text-mali-blue-accent mt-1" />}
                    {securitySettings.twoFactorMethod === 'sms' && <Phone className="text-mali-blue-accent mt-1" />}
                    {securitySettings.twoFactorMethod === 'email' && <Mail className="text-mali-blue-accent mt-1" />}
                    
                    <div>
                      <h3 className="font-medium text-white mb-1">
                        {securitySettings.twoFactorMethod === '2fa-app' && 'Authenticator App'}
                        {securitySettings.twoFactorMethod === 'sms' && 'SMS Authentication'}
                        {securitySettings.twoFactorMethod === 'email' && 'Email Authentication'}
                      </h3>
                      <p className="text-sm text-mali-text-secondary mb-2">
                        {securitySettings.twoFactorMethod === '2fa-app' && 'You\'re using an authenticator app to generate verification codes.'}
                        {securitySettings.twoFactorMethod === 'sms' && 'You\'re receiving SMS messages with verification codes.'}
                        {securitySettings.twoFactorMethod === 'email' && 'You\'re receiving emails with verification codes.'}
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const codes = await generateBackupCodes();
                            setBackupCodes(codes);
                            setShowBackupCodes(true);
                          }}
                          className="text-sm text-mali-blue-accent hover:underline"
                        >
                          Get backup codes
                        </button>
                        <span className="text-mali-text-secondary">•</span>
                        <button
                          onClick={() => setShowPasswordInput(true)}
                          className="text-sm text-red-400 hover:underline"
                        >
                          Disable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password input for disabling 2FA */}
                  {showPasswordInput && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-red-500/20 bg-red-900/10 rounded-lg p-4 mt-4"
                    >
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-400" />
                        Confirm with your password
                      </h4>
                      <p className="text-sm text-mali-text-secondary mb-3">
                        Disabling two-factor authentication will make your account less secure.
                      </p>
                      
                      <div className="flex flex-col gap-4">
                        <input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
                        />
                        
                        {verificationError && (
                          <p className="text-sm text-red-400">{verificationError}</p>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowPasswordInput(false);
                              setDisablePassword('');
                              setVerificationError('');
                            }}
                            className="px-3 py-1.5 bg-mali-blue/20 text-mali-text-secondary rounded-lg hover:bg-mali-blue/30 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDisable2FA}
                            disabled={!disablePassword || isLoadingSettings}
                            className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isLoadingSettings ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              'Disable 2FA'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : showTwoFactorSetup ? (
                <div className="space-y-6">
                  {/* Step 1: Choose 2FA method */}
                  {!twoFactorSetupData.secret && (
                    <div>
                      <h3 className="font-medium text-white mb-3">Choose authentication method</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <button
                          onClick={() => setTwoFactorMethod('2fa-app')}
                          className={`p-3 rounded-lg border flex flex-col items-center ${
                            twoFactorMethod === '2fa-app' 
                              ? 'border-mali-blue-accent bg-mali-blue/20' 
                              : 'border-mali-blue/20 hover:bg-mali-blue/10'
                          }`}
                        >
                          <Smartphone size={24} className={twoFactorMethod === '2fa-app' ? 'text-mali-blue-accent' : 'text-mali-text-secondary'} />
                          <span className={`text-sm mt-2 ${twoFactorMethod === '2fa-app' ? 'text-white' : 'text-mali-text-secondary'}`}>
                            Authenticator App
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setTwoFactorMethod('sms')}
                          className={`p-3 rounded-lg border flex flex-col items-center ${
                            twoFactorMethod === 'sms' 
                              ? 'border-mali-blue-accent bg-mali-blue/20' 
                              : 'border-mali-blue/20 hover:bg-mali-blue/10'
                          }`}
                        >
                          <Phone size={24} className={twoFactorMethod === 'sms' ? 'text-mali-blue-accent' : 'text-mali-text-secondary'} />
                          <span className={`text-sm mt-2 ${twoFactorMethod === 'sms' ? 'text-white' : 'text-mali-text-secondary'}`}>
                            SMS
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setTwoFactorMethod('email')}
                          className={`p-3 rounded-lg border flex flex-col items-center ${
                            twoFactorMethod === 'email' 
                              ? 'border-mali-blue-accent bg-mali-blue/20' 
                              : 'border-mali-blue/20 hover:bg-mali-blue/10'
                          }`}
                        >
                          <Mail size={24} className={twoFactorMethod === 'email' ? 'text-mali-blue-accent' : 'text-mali-text-secondary'} />
                          <span className={`text-sm mt-2 ${twoFactorMethod === 'email' ? 'text-white' : 'text-mali-text-secondary'}`}>
                            Email
                          </span>
                        </button>
                      </div>
                      
                      <button
                        onClick={handleSetup2FA}
                        disabled={isLoadingSettings}
                        className="w-full py-2 px-4 bg-mali-blue-accent text-white rounded-lg font-medium hover:bg-mali-blue-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoadingSettings ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Setting up...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Step 2: Set up based on method */}
                  {twoFactorSetupData.secret && twoFactorMethod === '2fa-app' && (
                    <div>
                      <h3 className="font-medium text-white mb-3">Set up authenticator app</h3>
                      <ol className="space-y-4 mb-6">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 text-mali-blue-accent flex items-center justify-center text-sm">1</span>
                          <div>
                            <p className="text-mali-text-secondary">
                              Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                            </p>
                          </div>
                        </li>
                        
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 text-mali-blue-accent flex items-center justify-center text-sm">2</span>
                          <div>
                            <p className="text-mali-text-secondary mb-3">
                              Scan this QR code with your authenticator app
                            </p>
                            <div className="bg-white p-4 rounded-lg inline-block">
                              {twoFactorSetupData.qrCodeUrl && (
                                <Image 
                                  src={twoFactorSetupData.qrCodeUrl}
                                  alt="Two-Factor Authentication QR Code"
                                  width={150}
                                  height={150}
                                />
                              )}
                            </div>
                          </div>
                        </li>
                        
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 text-mali-blue-accent flex items-center justify-center text-sm">3</span>
                          <div>
                            <p className="text-mali-text-secondary">
                              Or manually enter this code in your app:
                            </p>
                            <div className="font-mono text-white bg-mali-blue/10 py-1 px-2 rounded mt-1 text-center">
                              {twoFactorSetupData.secret}
                            </div>
                          </div>
                        </li>
                        
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 text-mali-blue-accent flex items-center justify-center text-sm">4</span>
                          <div>
                            <p className="text-mali-text-secondary mb-2">
                              Enter the 6-digit code from your authenticator app
                            </p>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="w-full md:w-40 p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent text-center font-mono"
                            />
                            
                            {verificationError && (
                              <p className="text-sm text-red-400 mt-2">{verificationError}</p>
                            )}
                          </div>
                        </li>
                      </ol>
                    </div>
                  )}
                  
                  {twoFactorSetupData.secret && twoFactorMethod === 'sms' && (
                    <div>
                      <h3 className="font-medium text-white mb-3">Set up SMS authentication</h3>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-mali-text-secondary mb-2">
                            Your phone number
                          </label>
                          <input
                            type="tel"
                            placeholder="+66 XX XXX XXXX"
                            className="w-full p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
                            readOnly
                            value="+66 XX XXX XX89"
                          />
                          <p className="text-xs text-mali-text-secondary mt-1">
                            This is the phone number associated with your account
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-mali-text-secondary mb-2">
                            We've sent a 6-digit code to your phone. Enter it below:
                          </p>
                          <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full md:w-40 p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent text-center font-mono"
                          />
                          
                          {verificationError && (
                            <p className="text-sm text-red-400 mt-2">{verificationError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {twoFactorSetupData.secret && twoFactorMethod === 'email' && (
                    <div>
                      <h3 className="font-medium text-white mb-3">Set up email authentication</h3>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-mali-text-secondary mb-2">
                            Your email address
                          </label>
                          <input
                            type="email"
                            placeholder="your.email@example.com"
                            className="w-full p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
                            readOnly
                            value={user?.email || 'user@example.com'}
                          />
                          <p className="text-xs text-mali-text-secondary mt-1">
                            This is the email address associated with your account
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-mali-text-secondary mb-2">
                            We've sent a 6-digit code to your email. Enter it below:
                          </p>
                          <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full md:w-40 p-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent text-center font-mono"
                          />
                          
                          {verificationError && (
                            <p className="text-sm text-red-400 mt-2">{verificationError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Verification buttons */}
                  {twoFactorSetupData.secret && (
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowTwoFactorSetup(false);
                          setTwoFactorSetupData({});
                          setTwoFactorCode('');
                          setVerificationError('');
                        }}
                        className="px-3 py-1.5 bg-mali-blue/20 text-mali-text-secondary rounded-lg hover:bg-mali-blue/30 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVerify2FA}
                        disabled={twoFactorCode.length !== 6 || isLoadingSettings}
                        className="px-3 py-1.5 bg-mali-blue-accent text-white rounded-lg hover:bg-mali-blue-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingSettings ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Verifying...
                          </>
                        ) : (
                          'Verify & Enable'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-mali-text-secondary mb-4">
                    Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
                  </p>
                  <button
                    onClick={() => setShowTwoFactorSetup(true)}
                    className="w-full py-2 px-4 bg-mali-blue-accent text-white rounded-lg font-medium hover:bg-mali-blue-accent/90"
                  >
                    Set up two-factor authentication
                  </button>
                </div>
              )}
            </div>
            
            {/* Backup codes dialog */}
            {showBackupCodes && (
              <div className="p-4 border-t border-mali-blue/20 bg-mali-blue/5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-white">Backup Codes</h3>
                  <button
                    onClick={() => setShowBackupCodes(false)}
                    className="text-mali-text-secondary hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-mali-text-secondary mb-3">
                  Save these backup codes in a secure place. You can use them to sign in if you lose access to your authentication device.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index} 
                      className="bg-mali-blue/10 border border-mali-blue/20 rounded p-2 font-mono text-sm text-white text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowBackupCodes(false)}
                    className="px-3 py-1.5 bg-mali-blue-accent text-white rounded-lg hover:bg-mali-blue-accent/90 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Codes
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Email Verification */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20">
              <h2 className="text-lg font-medium text-white">Email Verification</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {securitySettings.emailVerified ? (
                    <Check className="text-green-400" />
                  ) : (
                    <AlertCircle className="text-amber-400" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-1">
                    {securitySettings.emailVerified ? 'Email verified' : 'Email not verified'}
                  </h3>
                  <p className="text-sm text-mali-text-secondary mb-3">
                    {securitySettings.emailVerified 
                      ? 'Your email address has been verified.' 
                      : 'Please verify your email address to enhance security.'}
                  </p>
                  
                  {!securitySettings.emailVerified && (
                    <button
                      onClick={async () => {
                        await sendVerificationEmail();
                        updateSecuritySettings({ emailVerified: true }); // For demo purposes
                      }}
                      disabled={isLoadingSettings}
                      className="py-1.5 px-3 bg-mali-blue-accent text-white rounded-lg text-sm hover:bg-mali-blue-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingSettings ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Verification Email'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Devices */}
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl">
          <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Recent Devices</h2>
            <button
              onClick={logoutAllDevices}
              disabled={isLoadingSettings}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoadingSettings ? (
                <>
                  <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <LogOut size={14} />
                  Log out all devices
                </>
              )}
            </button>
          </div>
          
          <div className="divide-y divide-mali-blue/20">
            {securitySettings.recentDevices.map(device => (
              <div key={device.id} className="p-4 flex justify-between items-center">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {device.os.toLowerCase().includes('windows') && <Laptop className="text-mali-blue-accent" />}
                    {device.os.toLowerCase().includes('ios') && <Smartphone className="text-mali-blue-accent" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{device.name}</h3>
                    <div className="text-sm text-mali-text-secondary flex items-center gap-1 mt-1">
                      <span>{device.browser}</span>
                      <span>•</span>
                      <span>{device.os}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-mali-text-secondary">
                      <div className="flex items-center gap-1">
                        <Globe size={12} />
                        {device.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        Last active: {new Date(device.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  {device.isCurrent ? (
                    <span className="text-xs bg-mali-blue/20 text-mali-blue-accent px-2 py-1 rounded-full">
                      Current Device
                    </span>
                  ) : (
                    <button
                      onClick={() => removeDevice(device.id)}
                      disabled={isLoadingSettings}
                      className="text-mali-text-secondary hover:text-red-400"
                    >
                      {isLoadingSettings ? (
                        <div className="w-4 h-4 border-2 border-mali-text-secondary/30 border-t-mali-text-secondary rounded-full animate-spin"></div>
                      ) : (
                        <X size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Suspicious Activity */}
        {securitySettings.suspiciousActivities.length > 0 && (
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl">
            <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20">
              <h2 className="text-lg font-medium text-white">Suspicious Activity</h2>
            </div>
            
            <div className="divide-y divide-mali-blue/20">
              {securitySettings.suspiciousActivities.map(activity => (
                <div key={activity.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {activity.suspicious ? (
                          <AlertTriangle className="text-red-400" />
                        ) : (
                          <CheckCircle className="text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{activity.description}</h3>
                        <div className="text-sm text-mali-text-secondary flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Globe size={12} />
                            {activity.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <KeyRound size={12} />
                            IP: {activity.ip}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {activity.suspicious && !activity.resolved && (
                      <button
                        onClick={() => resolveActivity(activity.id)}
                        className="text-xs bg-mali-blue/20 text-mali-blue-accent px-2 py-1 rounded-full hover:bg-mali-blue/30"
                      >
                        Mark as resolved
                      </button>
                    )}
                    
                    {activity.resolved && (
                      <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded-full">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional Settings */}
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl">
          <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20">
            <h2 className="text-lg font-medium text-white">Additional Settings</h2>
          </div>
          
          <div className="divide-y divide-mali-blue/20">
            {/* Login Notifications */}
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Login Notifications</h3>
                <p className="text-sm text-mali-text-secondary mt-1">
                  Receive notifications when someone logs into your account
                </p>
              </div>
              <div>
                <button
                  onClick={() => updateSecuritySettings({
                    loginNotifications: !securitySettings.loginNotifications
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    securitySettings.loginNotifications ? 'bg-mali-blue-accent' : 'bg-mali-blue/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      securitySettings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {/* Security Questions */}
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Security Questions</h3>
                <p className="text-sm text-mali-text-secondary mt-1">
                  Set up security questions to verify your identity
                </p>
              </div>
              <div>
                <button
                  onClick={() => updateSecuritySettings({
                    securityQuestions: !securitySettings.securityQuestions
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    securitySettings.securityQuestions ? 'bg-mali-blue-accent' : 'bg-mali-blue/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      securitySettings.securityQuestions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 