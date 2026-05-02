"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    // create user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      alert(error?.message);
      return;
    }

    // create business
    await supabase.from("businesses").insert({
      owner_id: data.user.id,
      business_name: businessName,
      owner_name: ownerName,
      phone,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#050508",
    }}>
      <div style={{
        background: "#0f0f17",
        padding: "40px",
        borderRadius: "16px",
        width: "360px",
        boxShadow: "0 0 40px rgba(139,92,246,0.2)",
        textAlign: "center",
      }}>
        <h2 style={{
          color: "#a78bfa",
          marginBottom: "20px",
          textShadow: "0 0 12px rgba(167,139,250,0.6)",
        }}>
          Create Workspace
        </h2>

        <form onSubmit={handleSignup}>
          <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={inputStyle}/>
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} style={inputStyle}/>
          <input placeholder="Business Name" value={businessName} onChange={(e)=>setBusinessName(e.target.value)} style={inputStyle}/>
          <input placeholder="Owner Name" value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} style={inputStyle}/>
          <input placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} style={inputStyle}/>

          <button style={btnStyle}>Create</button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: "12px",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid rgba(167,139,250,0.3)",
  background: "transparent",
  color: "#a78bfa",
};

const btnStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
  color: "#fff",
  fontWeight: "600",
  boxShadow: "0 0 20px rgba(167,139,250,0.5)",
};