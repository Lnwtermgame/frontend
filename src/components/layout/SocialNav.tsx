import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Newspaper, BookOpen, 
  Star, Gamepad2
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const gameResourcesNavItems: NavItem[] = [
  {
    name: "News",
    path: "/news",
    icon: <Newspaper size={20} className="mr-3" />,
    description: "Latest gaming updates"
  },
  {
    name: "Guides",
    path: "/guides",
    icon: <BookOpen size={20} className="mr-3" />,
    description: "Gaming guides and tutorials"
  },
  {
    name: "Reviews",
    path: "/reviews",
    icon: <Star size={20} className="mr-3" />,
    description: "Game reviews"
  }
];

export default function GameResourcesNav() {
  const pathname = usePathname();
  
  return (
    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8">
      <div className="p-5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-mali-blue/30">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Gamepad2 size={18} className="text-mali-blue-accent mr-2" />
          Game Resources
        </h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gameResourcesNavItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <Link href={item.path} key={item.path}>
                <div className={`
                  border rounded-lg p-4 transition-colors cursor-pointer
                  ${isActive 
                    ? 'border-mali-blue/50 bg-mali-blue/10 text-white' 
                    : 'border-mali-blue/20 hover:border-mali-blue/50 text-mali-text-secondary hover:text-white'
                  }
                `}>
                  <div className="flex items-center mb-2">
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <p className="text-xs text-mali-text-secondary pl-8">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
