import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  FileText, 
  DollarSign, 
  CreditCard, 
  Coins, 
  Ticket, 
  Heart, 
  Gift, 
  Bell,
  ShoppingCart
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export default function AccountSidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/account",
      label: "My Account",
      icon: <User size={18} />
    },
    {
      href: "/top-up",
      label: "Top Up",
      icon: <DollarSign size={18} />
    },
    {
      href: "/orders",
      label: "My Orders",
      icon: <ShoppingCart size={18} />
    },
    {
      href: "/my-cards",
      label: "My Cards",
      icon: <CreditCard size={18} />
    },
    {
      href: "/invoice",
      label: "My Invoice",
      icon: <FileText size={18} />
    },
    {
      href: "/coupons",
      label: "My Coupons",
      icon: <Ticket size={18} />
    },
    {
      href: "/favorite",
      label: "My Favorite",
      icon: <Heart size={18} />
    },
    {
      href: "/lucky-draw",
      label: "My Lucky Draw",
      icon: <Gift size={18} />
    },
    {
      href: "/balance",
      label: "SEAGM Balance",
      icon: <DollarSign size={18} />
    },
    {
      href: "/credits",
      label: "SEAGM Credits",
      icon: <Coins size={18} />
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <Bell size={18} />
    }
  ];

  return (
    <motion.div 
      className="space-y-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "nav-item relative",
              isActive ? "active" : ""
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {isActive && (
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                layoutId="sidebar-highlight"
              />
            )}
          </Link>
        );
      })}
    </motion.div>
  );
} 
