import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function getBusiness() {
  const supabase = await createClient();
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", session.user.id)
    .single();

  return data;
}