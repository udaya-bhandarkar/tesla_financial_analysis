import React from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Area, ReferenceLine, AreaChart
} from 'recharts';
import {
    DollarSign, Activity, Percent, Briefcase, Globe,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- Data Processing (Hardcoded from provided CSVs) ---
const financialData = [
    {
        year: '2018',
        revenue: 21461,
        costOfRevenue: 17419,
        grossProfit: 4042,
        operatingExpenses: 4430,
        ebit: -388,
        netIncome: -976, // Attributable to common stockholders
        interestExpense: 663,
        cash: 3686,
        currentAssets: 8307,
        currentLiabilities: 9993,
        inventory: 3113,
        totalAssets: 29740,
        totalLiabilities: 23427,
        equity: 4923,
        accountsReceivable: 949,
    },
    {
        year: '2019',
        revenue: 24578,
        costOfRevenue: 20509,
        grossProfit: 4069,
        operatingExpenses: 4138,
        ebit: -69,
        netIncome: -862,
        interestExpense: 685,
        cash: 6268,
        currentAssets: 12103,
        currentLiabilities: 10667,
        inventory: 3552,
        totalAssets: 34309,
        totalLiabilities: 26199,
        equity: 6618,
        accountsReceivable: 1324,
    },
    {
        year: '2020',
        revenue: 31536,
        costOfRevenue: 24906,
        grossProfit: 6630,
        operatingExpenses: 4636,
        ebit: 1994,
        netIncome: 721,
        interestExpense: 748,
        cash: 19384,
        currentAssets: 26717,
        currentLiabilities: 14248,
        inventory: 4101,
        totalAssets: 52148,
        totalLiabilities: 28418,
        equity: 22225,
        accountsReceivable: 1886,
    },
];

// --- Helper Calculations ---
const calculateMetrics = (data) => {
    return data.map((item, index, arr) => {
        const prevItem = arr[index - 1];

        // Growth
        const revGrowth = prevItem ? ((item.revenue - prevItem.revenue) / prevItem.revenue) * 100 : 0;
        const niGrowth = prevItem ? ((item.netIncome - prevItem.netIncome) / Math.abs(prevItem.netIncome)) * 100 : 0;

        // Margins
        const grossMargin = (item.grossProfit / item.revenue) * 100;
        const operatingMargin = (item.ebit / item.revenue) * 100;
        const netMargin = (item.netIncome / item.revenue) * 100;

        // Liquidity
        const currentRatio = item.currentAssets / item.currentLiabilities;
        const quickRatio = (item.currentAssets - item.inventory) / item.currentLiabilities;

        // Leverage
        const debtToEquity = item.totalLiabilities / item.equity;
        const interestCoverage = item.interestExpense > 0 ? item.ebit / item.interestExpense : 0;

        // Efficiency (Using simple averages where prev year exists, else current)
        const avgInventory = prevItem ? (item.inventory + prevItem.inventory) / 2 : item.inventory;
        const avgAssets = prevItem ? (item.totalAssets + prevItem.totalAssets) / 2 : item.totalAssets;

        const inventoryTurnover = item.costOfRevenue / avgInventory;
        const assetTurnover = item.revenue / avgAssets;
        const dso = (item.accountsReceivable / item.revenue) * 365;

        return {
            ...item,
            revGrowth,
            niGrowth,
            grossMargin,
            operatingMargin,
            netMargin,
            currentRatio,
            quickRatio,
            debtToEquity,
            interestCoverage,
            inventoryTurnover,
            assetTurnover,
            dso
        };
    });
};

const processedData = calculateMetrics(financialData);
const latestYear = processedData[processedData.length - 1];

// --- Components ---

const KPICard = ({ title, value, subValue, icon: Icon, trend, trendValue, invertColor = false }) => {
    const isPositive = trend === 'up';
    const trendColor = invertColor
        ? (isPositive ? 'text-red-500' : 'text-green-500')
        : (isPositive ? 'text-green-500' : 'text-red-500');

    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Icon className="w-6 h-6 text-slate-700" />
                </div>
                {trendValue && (
                    <div className={`flex items-center text-sm font-medium ${trendColor} bg-slate-50 px-2 py-1 rounded-full`}>
                        <TrendIcon className="w-4 h-4 mr-1" />
                        {trendValue}
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                {subValue && <p className="text-slate-400 text-xs mt-1">{subValue}</p>}
            </div>
        </div>
    );
};

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label, unit = '', prefix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs min-w-[180px] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                <p className="font-bold mb-3 text-slate-700 text-sm border-b border-slate-200 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => {
                        let displayValue = entry.value;
                        let displayUnit = unit;

                        if (typeof entry.value === 'number') {
                            // Auto-format millions to billions if > 1000 (ignoring sign)
                            if (Math.abs(entry.value) >= 1000 && (unit === 'M' || unit === '')) {
                                displayValue = (entry.value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
                                displayUnit = 'B';
                            } else {
                                displayValue = entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            }
                        }

                        return (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: entry.color }} />
                                    <span className="text-slate-500 font-medium">{entry.name}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-700">
                                    {prefix}{displayValue}{displayUnit}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export default function TeslaDashboard() {


    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-4">
            {/* --- Top Navigation / Header --- */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center min-h-16 py-3 gap-2 sm:gap-0">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-8 h-8 text-red-600 flex-shrink-0">
                                <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <title>Tesla</title>
                                    <path d="M12 5.362l2.475-3.026s4.245.09 8.471 2.054c-1.082 1.636-3.231 2.438-3.231 2.438-.146-1.439-1.154-1.79-4.354-1.79L12 24 8.619 5.034c-3.18 0-4.188.354-4.335 1.792 0 0-2.146-.795-3.229-2.43C5.28 2.431 9.525 2.34 9.525 2.34L12 5.362l-.004.002H12v-.002zm0-3.899c3.415-.03 7.326.528 11.328 2.28.535-.968.672-1.395.672-1.395C19.625.612 15.528.015 12 0 8.472.015 4.375.61 0 2.349c0 0 .195.525.672 1.396C4.674 1.989 8.585 1.435 12 1.46v.003z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 leading-tight">Financial Statement Analysis</h1>
                                <p className="text-xs text-slate-500">Tesla, Inc. | FY 2018 - 2020</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                                Source: SEC 10-K filings (2018-2020)
                            </span>

                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* --- KPI Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Total Revenue"
                        value={`$${(latestYear.revenue / 1000).toFixed(1)}B`}
                        subValue="FY 2020"
                        icon={DollarSign}
                        trend="up"
                        trendValue={`${latestYear.revGrowth.toFixed(1)}% YoY`}
                    />
                    <KPICard
                        title="Net Income"
                        value={`$${latestYear.netIncome}M`}
                        subValue="GAAP Net Income"
                        icon={Activity}
                        trend="up"
                        trendValue="Turned Profitable"
                    />
                    <KPICard
                        title="Gross Margin"
                        value={`${latestYear.grossMargin.toFixed(1)}%`}
                        subValue={`Vs ${processedData[1].grossMargin.toFixed(1)}% Prev Year`}
                        icon={Percent}
                        trend="up"
                        trendValue="+4.5% pts"
                    />
                    <KPICard
                        title="Free Cash Proxy"
                        value={`$${((latestYear.cash - processedData[1].cash) / 1000).toFixed(1)}B`}
                        subValue="Net Change in Cash"
                        icon={Briefcase}
                        trend="up"
                        trendValue="Strong Accumulation"
                    />
                </div>

                {/* --- Main Dashboard Content --- */}

                {/* Section 1: Profitability & Growth */}
                <SectionHeader title="Profitability & Growth Analysis" subtitle="Revenue trajectory and margin expansion trends." />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Revenue Composition Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Revenue vs. Costs & Income</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(val) => `$${val / 1000}B`}
                                        domain={[0, 40000]}
                                        ticks={[0, 10000, 20000, 30000, 40000]}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#10b981', fontSize: 12 }}
                                        tickFormatter={(val) => `$${val}M`}
                                    />
                                    <Tooltip content={<CustomTooltip prefix="$" unit="M" />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar yAxisId="left" dataKey="revenue" name="Total Revenue" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar yAxisId="left" dataKey="grossProfit" name="Gross Profit" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Line yAxisId="right" type="monotone" dataKey="netIncome" name="Net Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Margin Trends */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Margin Evolution</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={processedData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip content={<CustomTooltip unit="%" />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <ReferenceLine y={0} stroke="#94a3b8" />
                                    <Line type="monotone" dataKey="grossMargin" name="Gross Margin" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="operatingMargin" name="Operating Margin" stroke="#1e293b" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="netMargin" name="Net Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- Key Strategic Insight: Profitability --- */}
                <div className="bg-white border border-slate-100 shadow-sm p-6 rounded-xl mb-8">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <Globe className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">
                                A Defining Year: Global Scale & Efficiency
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                Tesla’s shift toward profitability is an important turning point, made possible in large part by rising sales in <strong>China and Europe</strong>, and the addition of the <strong>Model Y</strong>. Despite a challenging environment, 2020 was a defining year with delivery of nearly half a million cars—a 36% increase fueled by the Shanghai factory.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">2020 Deliveries</p>
                                    <p className="text-emerald-600 font-bold text-lg">499,550</p>
                                    <p className="text-xs text-emerald-600 font-medium">↑ 36% YoY Growth</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Key Drivers</p>
                                    <p className="text-slate-700 font-bold text-lg">China & Model Y</p>
                                    <p className="text-xs text-slate-500">Shanghai Factory Scale-up</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Liquidity & Leverage */}
                <SectionHeader title="Liquidity & Financial Health" subtitle="Assessing ability to meet short and long-term obligations." />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* Liquidity Ratios */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Liquidity Ratios</h3>
                            <div className="flex gap-2 text-xs">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800"></div> Current</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Quick</span>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={processedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: 'Target > 1.0', fill: '#94a3b8', fontSize: 10 }} />
                                    <Bar dataKey="currentRatio" name="Current Ratio" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="quickRatio" name="Quick Ratio" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                            <span className="font-bold">Insight:</span> Liquidity improved significantly in 2020. Current Ratio of 1.88 indicates strong ability to cover short-term debts.
                        </div>
                    </div>

                    {/* Capital Structure */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Capital Structure & Solvency</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLiab" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}B`} />
                                    <Tooltip content={<CustomTooltip prefix="$" unit="M" />} />
                                    <Legend iconType="circle" />
                                    <Area type="monotone" dataKey="totalLiabilities" name="Total Liabilities" stroke="#ef4444" fillOpacity={1} fill="url(#colorLiab)" />
                                    <Area type="monotone" dataKey="equity" name="Total Equity" stroke="#10b981" fillOpacity={1} fill="url(#colorEquity)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                            <span className="font-bold">Insight:</span> Massive equity injection in 2020 reduced financial leverage risk significantly.
                        </div>
                    </div>
                </div>



            </main>
        </div>
    );
}