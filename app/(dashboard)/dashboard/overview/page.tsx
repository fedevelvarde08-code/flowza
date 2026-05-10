"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  IndianRupee,
  Info,
  RefreshCcw,
  Wallet,
  Clock3,
  Percent,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getBusinessId } from "@/lib/getBusinessId";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  service_taken: string | null;
  joining_date: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  pending_amount: number | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string | null;
  business_id: string;
};

type Lead = {
  id: string;
  status?: string | null;
  lead_status?: string | null;
  created_at?: string | null;
  business_id?: string | null;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCustomerDate(customer: Customer) {
  return new Date(customer.joining_date || customer.created_at);
}

export default function OverviewPage() {
  const currentDate = new Date();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [chartType, setChartType] = useState<"bar" | "table">("bar");

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        setLoading(true);

        const businessId = await getBusinessId();

        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("business_id", businessId);

        if (customersError) throw customersError;

        const { data: leadsData } = await supabase
          .from("leads")
          .select("*")
          .eq("business_id", businessId);

        setCustomers((customersData || []) as Customer[]);
        setLeads((leadsData || []) as Lead[]);
      } catch (error) {
        console.error("Overview fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOverviewData();
  }, []);

  const availableYears = useMemo(() => {
    const years = customers.map((c) => getCustomerDate(c).getFullYear());
    return Array.from(new Set([...years, currentDate.getFullYear()])).sort((a, b) => b - a);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const date = getCustomerDate(customer);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    });
  }, [customers, selectedYear, selectedMonth]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!lead.created_at) return true;
      const date = new Date(lead.created_at);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    });
  }, [leads, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const totalExpected = filteredCustomers.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
    const totalCollected = filteredCustomers.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
    const totalPending = filteredCustomers.reduce((sum, c) => sum + Number(c.pending_amount || 0), 0);

    const paid = filteredCustomers.filter((c) => c.payment_status?.toLowerCase() === "paid").length;
    const partial = filteredCustomers.filter((c) => c.payment_status?.toLowerCase() === "partial").length;
    const due = filteredCustomers.filter((c) => c.payment_status?.toLowerCase() !== "paid").length;

    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    const convertedLeads = filteredLeads.filter((l) => {
      const status = String(l.status || l.lead_status || "").toLowerCase();
      return status.includes("convert") || status.includes("customer");
    }).length;

    const contactedLeads = filteredLeads.filter((l) => {
      const status = String(l.status || l.lead_status || "").toLowerCase();
      return status.includes("contact") || status.includes("follow") || status.includes("convert");
    }).length;

    const conversionRate = filteredLeads.length > 0 ? (convertedLeads / filteredLeads.length) * 100 : 0;

    const monthlyRevenue = months.map((month, index) => {
      const value = customers
        .filter((c) => {
          const date = getCustomerDate(c);
          return date.getFullYear() === selectedYear && date.getMonth() === index;
        })
        .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);

      return {
        month,
        value,
        active: index === selectedMonth,
      };
    });

    return {
      totalExpected,
      totalCollected,
      totalPending,
      paid,
      partial,
      due,
      collectionRate,
      convertedLeads,
      contactedLeads,
      conversionRate,
      monthlyRevenue,
    };
  }, [customers, filteredCustomers, filteredLeads, selectedYear, selectedMonth]);

  const topPending = [...filteredCustomers]
    .filter((c) => Number(c.pending_amount || 0) > 0)
    .sort((a, b) => Number(b.pending_amount || 0) - Number(a.pending_amount || 0))
    .slice(0, 4);

  const recentPayments = [...filteredCustomers]
    .filter((c) => Number(c.amount_paid || 0) > 0)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 4);

  function handleReset() {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
    setChartType("bar");
  }

  function handleDownload() {
    const rows = [
      ["Metric", "Value"],
      ["Selected Month", `${months[selectedMonth]} ${selectedYear}`],
      ["Total Expected", stats.totalExpected],
      ["Total Collected", stats.totalCollected],
      ["Total Pending", stats.totalPending],
      ["Collection Rate", `${stats.collectionRate.toFixed(1)}%`],
      ["Total Customers", filteredCustomers.length],
      ["Total Leads", filteredLeads.length],
      ["Converted Leads", stats.convertedLeads],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `flowza-overview-${months[selectedMonth]}-${selectedYear}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05080d] p-4 text-white">
        <div className="rounded-xl border border-slate-800 bg-[#0b111a] p-6">
          Loading overview...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05080d] px-4 py-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your business performance and revenue insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none rounded-lg border border-slate-800 bg-[#0b111a] py-2 pl-9 pr-8 text-xs outline-none"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none rounded-lg border border-slate-800 bg-[#0b111a] py-2 pl-9 pr-8 text-xs outline-none"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  Month {month}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0b111a] px-3 py-2 text-xs"
          >
            <RefreshCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <section className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard title="Monthly Revenue" value={formatINR(stats.totalCollected)} change="Live" positive icon={<IndianRupee size={22} />} color="blue" />
        <KpiCard title="Collected" value={formatINR(stats.totalCollected)} change="Live" positive icon={<Wallet size={22} />} color="green" />
        <KpiCard title="Pending" value={formatINR(stats.totalPending)} change="Live" icon={<Clock3 size={22} />} color="red" />
        <KpiCard title="Collection Rate" value={`${stats.collectionRate.toFixed(1)}%`} change="Live" positive icon={<Percent size={22} />} color="yellow" />
      </section>

      <section className="grid grid-cols-[1.75fr_1fr] items-stretch gap-4">
        <RevenueChart
          data={stats.monthlyRevenue}
          chartType={chartType}
          setChartType={setChartType}
          onDownload={handleDownload}
        />

        <div className="flex h-full flex-col gap-4">
          <PaymentBreakdown stats={stats} customersCount={filteredCustomers.length} />
          <LeadFunnel stats={stats} totalLeads={filteredLeads.length} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4">
        <TableCard title="Top Pending Customers" type="pending" data={topPending} />
        <TableCard title="Recent Payments" type="payments" data={recentPayments} />
      </section>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Info size={13} /> Data is fetched from Supabase customers and leads tables.
      </p>
    </main>
  );
}

function RevenueChart({
  data,
  chartType,
  setChartType,
  onDownload,
}: {
  data: { month: string; value: number; active: boolean }[];
  chartType: "bar" | "table";
  setChartType: (type: "bar" | "table") => void;
  onDownload: () => void;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 100000);
  const roundedMax = Math.ceil(maxValue / 100000) * 100000;
  const chartHeight = 410;

  return (
    <div className="h-full rounded-xl border border-slate-800/80 bg-[#0b111a] p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
            <Info size={14} className="text-slate-500" />
          </div>
          <p className="mt-2 text-xs text-blue-400">Total Revenue Collected</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <BarChart3 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as "bar" | "table")}
              className="appearance-none rounded-lg border border-slate-800 bg-[#0b111a] py-2 pl-9 pr-8 text-xs text-slate-300 outline-none"
            >
              <option value="bar">Bar Chart</option>
              <option value="table">Table View</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-300"
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      {chartType === "bar" ? (
        <div className="relative h-[500px] pl-12 pr-2 pt-4">
          {[6, 5, 4, 3, 2, 1, 0].map((n) => (
            <div
              key={n}
              className="absolute left-12 right-2 border-t border-slate-800/70"
              style={{ top: `${24 + ((6 - n) / 6) * chartHeight}px` }}
            >
              <span className="absolute -left-11 -top-2 text-[11px] text-slate-400">
                {n === 0 ? "₹0" : `₹${Math.round((roundedMax / 100000) * (n / 6))}L`}
              </span>
            </div>
          ))}

          <div className="absolute bottom-5 left-12 right-2 top-6 z-10 flex items-end justify-between gap-3">
            {data.map((item) => (
              <div key={item.month} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className={`w-full max-w-[24px] rounded-t-md ${
                    item.active
                      ? "bg-gradient-to-t from-blue-600 to-violet-400"
                      : "bg-gradient-to-t from-blue-950 to-cyan-500"
                  }`}
                  style={{ height: `${Math.max((item.value / roundedMax) * chartHeight, item.value > 0 ? 8 : 0)}px` }}
                />
                <p className="text-[11px] text-slate-400">{item.month}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[500px] overflow-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f1724] text-slate-400">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.month} className="border-t border-slate-800">
                  <td className="p-3">{item.month}</td>
                  <td className="p-3">{formatINR(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentBreakdown({ stats, customersCount }: { stats: any; customersCount: number }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-800/80 bg-[#0b111a] p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-5 text-lg font-semibold">Payment Status Breakdown</h2>

      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#22c55e_0_48%,#eab308_48%_72%,#ef4444_72%_100%)]">
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#0b111a]">
            <span className="text-[11px] text-slate-400">Total</span>
            <span className="text-xl font-bold">{customersCount}</span>
            <span className="text-[11px] text-slate-400">Customers</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <Legend color="bg-green-500" label="Paid" value={`${stats.paid}`} />
          <Legend color="bg-yellow-500" label="Partial" value={`${stats.partial}`} />
          <Legend color="bg-red-500" label="Due" value={`${stats.due}`} />
        </div>
      </div>

      <div className="mt-5 space-y-3 text-xs">
        <Row label="Total Expected" value={formatINR(stats.totalExpected)} />
        <Row label="Total Collected" value={formatINR(stats.totalCollected)} />
        <Row label="Total Pending" value={formatINR(stats.totalPending)} />
      </div>
    </div>
  );
}

function LeadFunnel({ stats, totalLeads }: { stats: any; totalLeads: number }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-800/80 bg-[#0b111a] p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-semibold">Lead Conversion Funnel</h2>
      <Funnel label="Total Leads" value={`${totalLeads}`} width="100%" color="bg-blue-600" />
      <Funnel label="Contacted" value={`${stats.contactedLeads}`} width={`${totalLeads ? (stats.contactedLeads / totalLeads) * 100 : 0}%`} color="bg-violet-600" />
      <Funnel label="Converted" value={`${stats.convertedLeads}`} width={`${totalLeads ? (stats.convertedLeads / totalLeads) * 100 : 0}%`} color="bg-green-600" />
      <div className="mt-4 flex justify-between text-xs">
        <span className="text-slate-300">Conversion Rate</span>
        <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function KpiCard({ title, value, change, positive, icon, color }: any) {
  const colors: any = {
    blue: "from-blue-500/20 text-blue-400 border-blue-500/30",
    green: "from-green-500/20 text-green-400 border-green-500/30",
    red: "from-red-500/20 text-red-400 border-red-500/30",
    yellow: "from-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className={`rounded-xl border border-slate-800/80 bg-gradient-to-br ${colors[color]} to-[#0b111a] p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-400">{title}</p>
          <h3 className="mt-1.5 text-xl font-bold text-white">{value}</h3>
          <p className={`mt-1.5 flex items-center gap-1 text-[11px] ${positive ? "text-green-400" : "text-red-400"}`}>
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {change}
          </p>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: any) {
  return (
    <div className="flex w-36 items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-slate-300">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-slate-400">{value}</span>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between border-t border-slate-800 pt-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Funnel({ label, value, width, color }: any) {
  return (
    <div className="mb-3 grid grid-cols-[80px_1fr_35px] items-center gap-3 text-xs">
      <span className="text-slate-300">{label}</span>
      <div className="h-6 rounded bg-slate-900">
        <div className={`h-full rounded ${color}`} style={{ width }} />
      </div>
      <span>{value}</span>
    </div>
  );
}

function TableCard({ title, type, data }: { title: string; type: "pending" | "payments"; data: Customer[] }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0b111a] p-4 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href="/customers" className="text-xs text-indigo-400 hover:text-indigo-300">
          View all
        </Link>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="uppercase text-slate-500">
          <tr>
            <th className="pb-3">Customer</th>
            <th className="pb-3">Service</th>
            <th className="pb-3">{type === "pending" ? "Total Amount" : "Amount Paid"}</th>
            <th className="pb-3">{type === "pending" ? "Pending" : "Status"}</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-500">
                No data found
              </td>
            </tr>
          ) : (
            data.map((customer) => (
              <tr key={customer.id} className="border-t border-slate-800">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px]">
                      {customer.name?.[0] || "C"}
                    </div>
                    {customer.name}
                  </div>
                </td>
                <td>{customer.service_taken || "-"}</td>
                <td>{type === "pending" ? formatINR(Number(customer.total_amount || 0)) : formatINR(Number(customer.amount_paid || 0))}</td>
                <td className={type === "pending" ? "font-semibold text-red-400" : ""}>
                  {type === "pending" ? formatINR(Number(customer.pending_amount || 0)) : customer.payment_status || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}