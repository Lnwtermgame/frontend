
export interface TopUpOption {
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    isPopular: boolean;
    bonus: number;
}

export interface GameDetails {
    id: string;
    title: string;
    developer?: string;
    publisher?: string;
    category: string;
    releaseDate?: string;
    platforms: string[];
    rating: number;
    ratingCount?: number;
    description?: string;
    longDescription?: string;
    features?: string[];
    topUpOptions: TopUpOption[];
    screenshots?: string[];
    mainImage: string;
    relatedGames: string[];
    servers?: string[];
    processingTime?: string;
    tags?: string[];
    requirements?: string[];
    discountPercent?: number; // Added for listing page
    price?: number; // Added for listing page (base price)
}

export const gamesData: Record<string, GameDetails> = {
    "pubg-mobile": {
        id: "pubg-mobile",
        title: "PUBG Mobile",
        developer: "KRAFTON, Inc.",
        publisher: "Tencent Games",
        category: "Battle Royale",
        releaseDate: "2018-03-19",
        platforms: ["Android", "iOS"],
        rating: 4.7,
        ratingCount: 12589,
        description: "PUBG Mobile is the FREE battle royale shooter that pits 100 players against each other in a struggle for survival.",
        longDescription: "PUBG MOBILE delivers the most intense free-to-play multiplayer action on mobile. Drop in, gear up, and compete. Survive epic 100-player classic battles, payload mode, and fast-paced 4v4 team deathmatch and zombie modes. Survival is key and the last one standing wins. When duty calls, fire at will!\n\nPUBG MOBILE provides the most intense free-to-play multiplayer action game experience on mobile. Unreal Engine 4 brings smooth, next-level graphics to your mobile device, allowing for an immersive gaming experience that matches the original PUBG on PC.",
        features: [
            "Multiple maps with different terrains and strategies",
            "Different game modes including Classic, Arcade, and EvoGround",
            "Regular updates with new content, features, and gameplay improvements",
            "Customizable controls and settings for optimal gameplay experience",
            "Voice chat with teammates for strategic coordination"
        ],
        topUpOptions: [
            { id: "pubg-60-uc", title: "60 UC", price: 0.99, originalPrice: 0.99, isPopular: false, bonus: 0 },
            { id: "pubg-300-uc", title: "300 UC", price: 4.99, originalPrice: 4.99, isPopular: true, bonus: 10 },
            { id: "pubg-600-uc", title: "600 UC", price: 9.99, originalPrice: 9.99, isPopular: false, bonus: 25 },
            { id: "pubg-1500-uc", title: "1,500 UC", price: 24.99, originalPrice: 29.99, isPopular: false, bonus: 60 },
            { id: "pubg-3000-uc", title: "3,000 UC", price: 49.99, originalPrice: 59.99, isPopular: false, bonus: 150 },
            { id: "pubg-6000-uc", title: "6,000 UC", price: 99.99, originalPrice: 119.99, isPopular: false, bonus: 350 },
        ],
        screenshots: [
            "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+1",
            "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+2",
            "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+3",
            "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+4",
        ],
        mainImage: "https://placehold.co/600x400/003366/ffffff?text=PUBG+Mobile",
        relatedGames: ["free-fire", "apex-legends", "fortnite", "call-of-duty-mobile"],
        servers: ["Global", "Asia", "North America", "Europe", "KR/JP"],
        processingTime: "Instant",
        tags: ["Battle Royale", "Shooter", "Multiplayer", "Survival"],
        requirements: ["Player ID required", "Region specific"],
        discountPercent: 10,
        price: 0.99
    },
    "free-fire": {
        id: "free-fire",
        title: "Garena Free Fire",
        developer: "111dots Studio",
        publisher: "Garena",
        category: "Battle Royale",
        releaseDate: "2017-12-04",
        platforms: ["Android", "iOS"],
        rating: 4.3,
        ratingCount: 9876,
        description: "Garena Free Fire is a battle royale game where 50 players parachute onto a remote island and fight to be the last person standing.",
        longDescription: "Garena Free Fire is an ultimate survival shooter game available on mobile. Each 10-minute game places you on a remote island where you are pit against 49 other players, all seeking survival. Players freely choose their starting point with their parachute, and aim to stay in the safe zone for as long as possible.",
        features: [
            "Fast-paced 10-minute matches for ultimate survival",
            "4v4 squad battles and unique character abilities",
            "Realistic graphics and smooth controls",
            "Social features to play with friends",
            "Regular updates with new content"
        ],
        topUpOptions: [
            { id: "ff-100-diamond", title: "100 Diamonds", price: 0.99, originalPrice: 0.99, isPopular: false, bonus: 0 },
            { id: "ff-310-diamond", title: "310 Diamonds", price: 2.99, originalPrice: 2.99, isPopular: true, bonus: 10 },
            { id: "ff-520-diamond", title: "520 Diamonds", price: 4.99, originalPrice: 4.99, isPopular: false, bonus: 20 },
            { id: "ff-1060-diamond", title: "1,060 Diamonds", price: 9.99, originalPrice: 9.99, isPopular: false, bonus: 50 },
            { id: "ff-2180-diamond", title: "2,180 Diamonds", price: 19.99, originalPrice: 23.99, isPopular: false, bonus: 100 },
        ],
        screenshots: [
            "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+1",
            "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+2",
            "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+3",
        ],
        mainImage: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire",
        relatedGames: ["pubg-mobile", "apex-legends", "fortnite", "call-of-duty-mobile"],
        servers: ["Global", "Thailand", "Vietnam", "Indonesia", "Brazil"],
        processingTime: "Instant",
        tags: ["Battle Royale", "Action", "Survival"],
        requirements: ["Player ID required"],
        discountPercent: 15,
        price: 0.99
    },
    "mobile-legends": {
        id: "mobile-legends",
        title: "Mobile Legends: Bang Bang",
        developer: "Moonton",
        publisher: "Moonton",
        category: "MOBA",
        releaseDate: "2016-11-14",
        platforms: ["Android", "iOS"],
        rating: 4.5,
        ratingCount: 8542,
        description: "Mobile Legends: Bang Bang is a mobile MOBA game where two opposing teams fight to reach and destroy the enemy base.",
        longDescription: "Mobile Legends: Bang Bang is a multiplayer online battle arena (MOBA) game designed for mobile phones. The game pits two teams of five against each other in real-time battles, with the ultimate goal of destroying the enemy base while protecting your own.",
        features: [
            "Fast-paced 10-minute matches with real-time combat",
            "Classic MOBA gameplay with lanes, minions, and towers",
            "Diverse roster of heroes with unique abilities",
            "Various game modes including Classic, Ranked, Brawl, and Arcade",
            "Regular tournaments and esports competitions"
        ],
        topUpOptions: [
            { id: "ml-86-diamond", title: "86 Diamonds", price: 1.99, originalPrice: 1.99, isPopular: false, bonus: 5 },
            { id: "ml-172-diamond", title: "172 Diamonds", price: 3.99, originalPrice: 3.99, isPopular: true, bonus: 10 },
            { id: "ml-257-diamond", title: "257 Diamonds", price: 5.99, originalPrice: 5.99, isPopular: false, bonus: 15 },
            { id: "ml-514-diamond", title: "514 Diamonds", price: 11.99, originalPrice: 11.99, isPopular: false, bonus: 35 },
            { id: "ml-1412-diamond", title: "1,412 Diamonds", price: 29.99, originalPrice: 34.99, isPopular: false, bonus: 100 },
        ],
        screenshots: [
            "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+1",
            "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+2",
            "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+3",
        ],
        mainImage: "https://placehold.co/600x400/660066/ffffff?text=Mobile+Legends",
        relatedGames: ["league-of-legends", "valorant", "arena-of-valor"],
        servers: ["Global", "Asia 1", "Asia 2"],
        processingTime: "Instant",
        tags: ["MOBA", "Strategy", "Team", "Action"],
        requirements: ["User ID", "Zone ID"],
        discountPercent: 5,
        price: 1.99
    },
    "valorant": {
        id: "valorant",
        title: "Valorant",
        publisher: "Riot Games",
        category: "FPS",
        platforms: ["PC"],
        rating: 4.8,
        mainImage: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant",
        description: "A 5v5 character-based tactical shooter.",
        topUpOptions: [
            { id: "val-475-vp", title: "475 VP", price: 4.99, originalPrice: 4.99, isPopular: false, bonus: 0 },
            { id: "val-1000-vp", title: "1000 VP", price: 9.99, originalPrice: 9.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["league-of-legends", "counter-strike", "overwatch"],
        price: 4.99,
        discountPercent: 0
    },
    "league-of-legends": {
        id: "league-of-legends",
        title: "League of Legends",
        publisher: "Riot Games",
        category: "MOBA",
        platforms: ["PC", "Mac"],
        rating: 4.6,
        mainImage: "https://placehold.co/600x400/0066cc/ffffff?text=LoL",
        description: "A team-based strategy game where two teams of five powerful champions face off.",
        topUpOptions: [
            { id: "lol-575-rp", title: "575 RP", price: 4.99, originalPrice: 4.99, isPopular: false, bonus: 0 },
            { id: "lol-1380-rp", title: "1380 RP", price: 10.99, originalPrice: 10.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["valorant", "dota-2", "mobile-legends"],
        price: 4.99,
        discountPercent: 0
    },
    "genshin-impact": {
        id: "genshin-impact",
        title: "Genshin Impact",
        publisher: "miHoYo",
        category: "RPG",
        platforms: ["PC", "Mobile", "PS4", "PS5"],
        rating: 4.9,
        mainImage: "https://placehold.co/600x400/a855f7/ffffff?text=Genshin+Impact",
        description: "Step into Teyvat, a vast world teeming with life and flowing with elemental energy.",
        topUpOptions: [
            { id: "gi-60-crystal", title: "60 Genesis Crystals", price: 0.99, originalPrice: 0.99, isPopular: false, bonus: 0 },
            { id: "gi-300-crystal", title: "300 Genesis Crystals", price: 4.99, originalPrice: 4.99, isPopular: true, bonus: 30 },
        ],
        relatedGames: ["honkai-star-rail", "tower-of-fantasy"],
        price: 0.99,
        discountPercent: 0
    },
    "apex-legends": {
        id: "apex-legends",
        title: "Apex Legends",
        publisher: "Electronic Arts",
        category: "Battle Royale",
        platforms: ["PC", "Console"],
        rating: 4.3,
        mainImage: "https://placehold.co/600x400/cc3333/ffffff?text=Apex+Legends",
        description: "Conquer with character in Apex Legends, a free-to-play Hero Shooter.",
        topUpOptions: [
            { id: "apex-1000-coins", title: "1000 Apex Coins", price: 9.99, originalPrice: 9.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["pubg-mobile", "fortnite", "call-of-duty"],
        price: 9.99,
        discountPercent: 0
    },
    "fortnite": {
        id: "fortnite",
        title: "Fortnite",
        publisher: "Epic Games",
        category: "Battle Royale",
        platforms: ["PC", "Console", "Mobile"],
        rating: 4.2,
        mainImage: "https://placehold.co/600x400/6699cc/ffffff?text=Fortnite",
        description: "Create, play, and battle with friends for free in Fortnite.",
        topUpOptions: [
            { id: "fn-1000-vbucks", title: "1000 V-Bucks", price: 8.99, originalPrice: 8.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["pubg-mobile", "apex-legends"],
        price: 8.99,
        discountPercent: 0
    },
    "call-of-duty-mobile": {
        id: "call-of-duty-mobile",
        title: "Call of Duty: Mobile",
        publisher: "Activision",
        category: "FPS",
        platforms: ["Mobile"],
        rating: 4.4,
        mainImage: "https://placehold.co/600x400/333333/ffffff?text=CoD+Mobile",
        description: "Call of Duty: Mobile delivers the definitive first-person action experience on mobile.",
        topUpOptions: [
            { id: "codm-80-cp", title: "80 CP", price: 0.99, originalPrice: 0.99, isPopular: false, bonus: 0 },
        ],
        relatedGames: ["pubg-mobile", "free-fire"],
        price: 0.99,
        discountPercent: 0
    },
    "arena-of-valor": {
        id: "arena-of-valor",
        title: "Arena of Valor",
        publisher: "Tencent Games",
        category: "MOBA",
        platforms: ["Mobile"],
        rating: 4.1,
        mainImage: "https://placehold.co/600x400/006699/ffffff?text=Arena+of+Valor",
        description: "Experience AOV (Arena of Valor), an epic new 5v5 multiplayer online battle arena (MOBA).",
        topUpOptions: [
            { id: "aov-vouchers", title: "Vouchers", price: 0.99, originalPrice: 0.99, isPopular: false, bonus: 0 },
        ],
        relatedGames: ["mobile-legends", "league-of-legends"],
        price: 0.99,
        discountPercent: 0
    },
    "roblox": {
        id: "roblox",
        title: "Roblox",
        publisher: "Roblox Corporation",
        category: "Adventure",
        platforms: ["PC", "Mobile", "Console"],
        rating: 4.5,
        mainImage: "https://placehold.co/600x400/cc0000/ffffff?text=Roblox",
        description: "Roblox is the ultimate virtual universe that lets you create, share experiences with friends, and be anything you can imagine.",
        topUpOptions: [
            { id: "rbx-400", title: "400 Robux", price: 4.99, originalPrice: 4.99, isPopular: false, bonus: 0 },
            { id: "rbx-800", title: "800 Robux", price: 9.99, originalPrice: 9.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["minecraft"],
        price: 4.99,
        discountPercent: 0
    },
    "minecraft": {
        id: "minecraft",
        title: "Minecraft",
        publisher: "Mojang",
        category: "Adventure",
        platforms: ["PC", "Mobile", "Console"],
        rating: 4.8,
        mainImage: "https://placehold.co/600x400/228b22/ffffff?text=Minecraft",
        description: "Explore infinite worlds and build everything from the simplest of homes to the grandest of castles.",
        topUpOptions: [
            { id: "mc-coins", title: "Minecoins", price: 9.99, originalPrice: 9.99, isPopular: true, bonus: 0 },
        ],
        relatedGames: ["roblox"],
        price: 9.99,
        discountPercent: 0
    }
};

export const getAllGames = () => Object.values(gamesData);

export const getGameById = (id: string) => gamesData[id];
