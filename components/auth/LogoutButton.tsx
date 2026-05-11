"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [ownerName, setOwnerName] = useState("Owner");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }

      const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Owner";

      setOwnerName(name);
    }

    loadUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="border-t border-slate-800 px-4 py-2">
      <button
        type="button"
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 font-semibold text-white">
            {ownerName?.[0]?.toUpperCase() || "O"}
          </div>

          <div className="text-left">
            <p className="max-w-[130px] truncate text-sm font-semibold text-white">
              {ownerName}
            </p>

            <p className="max-w-[130px] truncate text-xs text-slate-400">
              {userEmail}
            </p>
          </div>
        </div>

        <ChevronDown size={17} className="text-slate-400" />
      </button>

      {showUserMenu && (
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
        >
          <LogOut size={16} />
          Sign out
        </button>
      )}
    </div>
  );
}