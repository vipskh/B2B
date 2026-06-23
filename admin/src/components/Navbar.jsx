import { useLocation } from "react-router";
import { PanelLeftIcon, RefreshCwIcon } from "lucide-react";
import { useMe } from "../hooks/useMe";
import { getNavigation } from "../lib/navigation";
import { clearDevUserId } from "../lib/devUser";

function Navbar() {
  const location = useLocation();
  const { data: me } = useMe();
  const nav = getNavigation(me?.role);
  const title = nav.find((item) => item.path === location.pathname)?.name || "Dashboard";

  const switchUser = () => {
    clearDevUserId();
    window.location.reload();
  };

  return (
    <div className="navbar w-full bg-base-300">
      <label htmlFor="my-drawer" className="btn btn-square btn-ghost" aria-label="open sidebar">
        <PanelLeftIcon className="size-5" />
      </label>

      <div className="flex-1 px-4">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="mr-3 flex items-center gap-3">
        <span className="text-sm opacity-70 hidden sm:block">{me?.name}</span>
        <button className="btn btn-sm btn-ghost gap-1" onClick={switchUser}>
          <RefreshCwIcon className="size-4" />
          Switch
        </button>
      </div>
    </div>
  );
}

export default Navbar;
