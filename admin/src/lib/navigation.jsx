import {
  ClipboardListIcon,
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  Building2Icon,
  StoreIcon,
  FileTextIcon,
  MessagesSquareIcon,
} from "lucide-react";

// Navigation is role-aware: platform admins and sellers see different menus.
const ADMIN_NAV = [
  { name: "Dashboard", path: "/dashboard", icon: <HomeIcon className="size-5" /> },
  { name: "Vendors", path: "/vendors", icon: <Building2Icon className="size-5" /> },
  { name: "Products", path: "/products", icon: <ShoppingBagIcon className="size-5" /> },
  { name: "Orders", path: "/orders", icon: <ClipboardListIcon className="size-5" /> },
  { name: "Customers", path: "/customers", icon: <UsersIcon className="size-5" /> },
];

const SELLER_NAV = [
  { name: "Dashboard", path: "/dashboard", icon: <HomeIcon className="size-5" /> },
  { name: "My Products", path: "/products", icon: <ShoppingBagIcon className="size-5" /> },
  { name: "Orders", path: "/orders", icon: <ClipboardListIcon className="size-5" /> },
  { name: "RFQ Inbox", path: "/rfqs", icon: <FileTextIcon className="size-5" /> },
  { name: "Messages", path: "/chat", icon: <MessagesSquareIcon className="size-5" /> },
  { name: "Store Profile", path: "/store", icon: <StoreIcon className="size-5" /> },
];

export function getNavigation(role) {
  if (role === "admin") return ADMIN_NAV;
  if (role === "vendor") return SELLER_NAV;
  return [];
}
