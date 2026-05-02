import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0a0c12] text-white">
      <Sidebar />
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}