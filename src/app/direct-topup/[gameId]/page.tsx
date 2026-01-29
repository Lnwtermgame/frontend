"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ShoppingCart, Shield, Info, Clock, Star, Globe, Tag, Gamepad2, Award } from "lucide-react";
import { motion } from "@/lib/framer-exports";

// Mock game data generator
function getGameDetails(id: string) {
  const gameNumber = id.split('-')[1];
  const colorOptions = ["1E88E5", "5E35B1", "D81B60", "7CB342", "FB8C00", "6D4C41", "546E7A", "EC407A", "5C6BC0", "26A69A"];
  const color = colorOptions[parseInt(gameNumber) % colorOptions.length];
  
  function getGameName(index: number) {
    const gameNames = [
      "Valorant", "League of Legends", "PUBG", "Mobile Legends", "Call of Duty", 
      "Free Fire", "Genshin Impact", "Ragnarok", "Arena of Valor", "Apex Legends",
      "Fortnite", "Overwatch", "Minecraft", "Rainbow Six", "Counter-Strike",
      "Dota 2", "Honor of Kings", "FIFA Mobile", "NBA 2K", "Clash Royale"
    ];
    return gameNames[index % gameNames.length];
  }
  
  function getPublisherName(index: number) {
    const publishers = [
      "Riot Games", "Tencent", "Epic Games", "Valve", "Moonton",
      "Activision", "miHoYo", "Garena", "Ubisoft", "Electronic Arts",
      "Blizzard", "PUBG Corp", "Krafton", "Gravity", "Sea Limited"
    ];
    return publishers[index % publishers.length];
  }
  
  const gameName = getGameName(parseInt(gameNumber));
  const publisher = getPublisherName(parseInt(gameNumber));
  
  return {
    id,
    name: gameName,
    description: `${gameName} is a popular online game that offers in-game purchases to enhance your gaming experience. Top up your game currency directly through our secure platform and receive instant credit to your game account.`,
    image: `https://placehold.co/800x450?text=${gameName.replace(/\s+/g, '+')}`,
    publisher: publisher,
    category: parseInt(gameNumber) % 5 === 0 ? "Popular" : parseInt(gameNumber) % 4 === 0 ? "RPG" : parseInt(gameNumber) % 3 === 0 ? "MOBA" : parseInt(gameNumber) % 2 === 0 ? "FPS" : "Adventure",
    topUpOptions: [
      { id: "option1", name: "100 Gems", price: 9.99, bonus: 0 },
      { id: "option2", name: "500 Gems", price: 49.99, bonus: 50 },
      { id: "option3", name: "1000 Gems", price: 99.99, bonus: 150 },
      { id: "option4", name: "2000 Gems", price: 199.99, bonus: 400 },
      { id: "option5", name: "5000 Gems", price: 499.99, bonus: 1500 }
    ],
    servers: ["Asia", "Europe", "North America", "South America", "Oceania"],
    platforms: ["PC", "Mobile", "Console"],
    rating: 4.7,
    reviews: 352,
    processingTime: "Instant",
    releaseYear: 2020 + (parseInt(gameNumber) % 3),
    tags: ["online", gameName.toLowerCase(), "top-up", "gems"],
    requirements: ["Valid game account", "Internet connection", "Latest game version"]
  };
}

export default function GameDetailPage() {
  const { gameId } = useParams();
  const game = getGameDetails(gameId as string);
  
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [playerID, setPlayerID] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    if (!selectedOption || !selectedServer || !playerID) {
      alert("Please fill in all required fields");
      return;
    }
    
    alert(`Added to cart: ${game.name} - ${game.topUpOptions.find(o => o.id === selectedOption)?.name} on ${selectedServer} server for player ID: ${playerID}`);
  };

  // Calculate current price
  const selectedOptionPrice = game.topUpOptions.find(o => o.id === selectedOption)?.price || 0;
  const totalPrice = selectedOptionPrice * quantity;
  const selectedOptionBonus = game.topUpOptions.find(o => o.id === selectedOption)?.bonus || 0;
  const totalBonus = selectedOptionBonus * quantity;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/direct-topup" className="inline-flex items-center text-mali-text-secondary hover:text-white transition-colors">
        <ChevronLeft size={16} className="mr-1" /> กลับไปยังหน้าเติมเกม
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game info - Left column */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Game main info */}
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden">
            <div className="relative aspect-video w-full overflow-hidden">
              <img 
                src={game.image} 
                alt={game.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-50" />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-white text-2xl font-bold mb-2">{game.name}</h1>
                  <div className="flex items-center flex-wrap gap-3 text-sm">
                    <div className="flex items-center text-mali-text-secondary">
                      <Award size={16} className="mr-1 text-mali-blue-accent" />
                      <span>{game.publisher}</span>
                    </div>
                    <div className="flex items-center text-mali-text-secondary">
                      <Tag size={16} className="mr-1 text-mali-blue-accent" />
                      <span>{game.category}</span>
                    </div>
                    <div className="flex items-center text-mali-text-secondary">
                      <Star size={16} className="mr-1 text-mali-pink" />
                      <span>{game.rating} ({game.reviews} รีวิว)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="bg-mali-blue-accent/20 text-mali-blue-accent px-3 py-1 rounded-full text-xs font-medium">
                    {game.platforms.join(' / ')}
                  </span>
                  <span className="bg-mali-green/20 text-mali-green px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Clock size={12} className="mr-1" /> {game.processingTime}
                  </span>
                </div>
              </div>
              
              <p className="text-mali-text-secondary text-sm mb-4">{game.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {game.tags.map(tag => (
                  <span key={tag} className="bg-mali-blue/20 text-mali-text-secondary px-2 py-0.5 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* How to use */}
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden">
            <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
              <h2 className="text-white font-bold text-lg">ข้อมูลเพิ่มเติม</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-medium mb-3">เซิร์ฟเวอร์ที่รองรับ</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {game.servers.map(server => (
                      <div key={server} className="bg-mali-blue/10 px-3 py-2 rounded-md text-mali-text-secondary text-sm">
                        <Globe size={14} className="inline-block mr-2 text-mali-blue-accent" />
                        {server}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-3">ข้อกำหนดในการใช้งาน</h3>
                  <ul className="space-y-2 text-mali-text-secondary text-sm">
                    {game.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <div className="text-mali-blue-accent mr-2">•</div>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 bg-mali-blue-accent/10 border border-mali-blue-accent/20 rounded-lg p-4 flex items-start">
                <Info size={18} className="text-mali-blue-accent shrink-0 mt-0.5 mr-3" />
                <p className="text-mali-text-secondary text-sm">
                  การเติมเงินเกม {game.name} จะถูกดำเนินการทันที หลังจากชำระเงินเสร็จสิ้น กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนทำการซื้อ เนื่องจากไม่สามารถขอคืนเงินหรือยกเลิกรายการได้หลังจากเติมเงินเข้าบัญชีเกมแล้ว
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Top-up form - Right column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 sticky top-24">
            <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
              <h2 className="text-white font-bold text-lg">รายละเอียดการเติมเงิน</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Top-up options */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">เลือกแพ็คเกจเติมเงิน</label>
                <div className="grid grid-cols-1 gap-3">
                  {game.topUpOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={`p-3 rounded-md text-left border transition-all ${
                        selectedOption === option.id 
                          ? "bg-button-gradient border-transparent text-white" 
                          : "bg-mali-blue/10 border-mali-blue/20 text-mali-text-secondary hover:border-mali-blue-accent/50 hover:text-white"
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{option.name}</div>
                          {option.bonus > 0 && (
                            <div className="text-xs mt-1 text-mali-pink">+ {option.bonus} โบนัส</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${option.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Server selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">เลือกเซิร์ฟเวอร์</label>
                <div className="relative">
                  <select 
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="w-full p-3 rounded-md bg-mali-blue/10 border border-mali-blue/20 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
                  >
                    <option value="">เลือกเซิร์ฟเวอร์</option>
                    {game.servers.map((server) => (
                      <option key={server} value={server}>{server}</option>
                    ))}
                  </select>
                  <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mali-text-secondary pointer-events-none h-4 w-4" />
                </div>
              </div>
              
              {/* Player ID */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">รหัสผู้เล่น</label>
                <input 
                  type="text"
                  placeholder="กรอกรหัสผู้เล่นของคุณ"
                  value={playerID}
                  onChange={(e) => setPlayerID(e.target.value)}
                  className="w-full p-3 rounded-md bg-mali-blue/10 border border-mali-blue/20 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
                />
                <p className="mt-1 text-mali-text-secondary text-xs">
                  สามารถตรวจสอบรหัสผู้เล่นได้จากการตั้งค่าโปรไฟล์ในเกม
                </p>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">จำนวน</label>
                <div className="flex items-center">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-mali-blue/10 border border-mali-blue/20 rounded-md flex items-center justify-center text-white"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 bg-mali-blue/10 border-y border-mali-blue/20 text-center text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-10 h-10 bg-mali-blue/10 border border-mali-blue/20 rounded-md flex items-center justify-center text-white"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Price summary */}
              <div className="pt-4 border-t border-mali-blue/20">
                <div className="flex justify-between mb-2">
                  <span className="text-mali-text-secondary">ราคา:</span>
                  <span className="text-white">${selectedOptionPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-mali-text-secondary">จำนวน:</span>
                  <span className="text-white">x{quantity}</span>
                </div>
                {totalBonus > 0 && (
                  <div className="flex justify-between mb-2 text-mali-pink">
                    <span>โบนัส:</span>
                    <span>+{totalBonus} เจมส์</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-white">ราคารวม:</span>
                  <span className="text-white text-lg">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Add to cart button */}
              <motion.button
                onClick={handleAddToCart}
                className="w-full bg-button-gradient text-white py-3 rounded-md font-medium flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedOption || !selectedServer || !playerID}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                หยิบใส่ตะกร้า
              </motion.button>
              
              {/* Secure purchase info */}
              <div className="flex items-center justify-center text-mali-text-secondary text-xs mt-2">
                <Shield className="mr-1 h-3 w-3" />
                <span>การชำระเงินที่ปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Related games */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">เกมอื่นๆ ที่คล้ายกัน</h2>
          <Link href="/direct-topup" className="text-sm text-mali-text-secondary hover:text-white">
            ดูทั้งหมด
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(null).map((_, i) => {
            const relatedGame = getGameDetails(`game-${i + 1}`);
            return (
              <motion.div
                key={`related-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (i * 0.05) }}
              >
                <Link href={`/direct-topup/game-${i + 1}`}>
                  <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 group">
                    <div className="relative h-32 w-full overflow-hidden">
                      <img 
                        src={relatedGame.image}
                        alt={relatedGame.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />
                      
                      <div className="absolute top-2 right-2 flex items-center bg-mali-blue/70 text-white text-xs px-1.5 py-0.5 rounded">
                        <Star size={10} className="mr-0.5 text-yellow-400" /> {relatedGame.rating}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-1 mb-1">{relatedGame.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-mali-text-secondary text-xs">{relatedGame.category}</div>
                        <div className="text-xs text-white font-medium">$9.99+</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 