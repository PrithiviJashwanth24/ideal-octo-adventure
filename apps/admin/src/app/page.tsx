'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const GOLD = '#D4AF37';
const BG = '#0A0A0B';
const CARD_BG = '#111113';
const BORDER = '#1E1E22';
const TEXT = '#E8E6E3';
const MUTED = '#6B6B6B';

const mockStats = {
  totalUsers: 84_231,
  activeToday: 12_847,
  mrr: 214_500,
  churnRate: 2.1,
  avgConfidence: 7.8,
  wardrobeItemsLogged: 2_340_000,
  outfitsGenerated: 8_900_000,
  aiCalls: 45_000,
};

const mockMrrData = [
  { month: 'Jan', mrr: 42000 }, { month: 'Feb', mrr: 68000 },
  { month: 'Mar', mrr: 89000 }, { month: 'Apr', mrr: 121000 },
  { month: 'May', mrr: 156000 }, { month: 'Jun', mrr: 189000 },
  { month: 'Jul', mrr: 214500 },
];

const mockTierData = [
  { name: 'Free', users: 61200, color: '#444' },
  { name: 'Essential', users: 15400, color: '#8B7355' },
  { name: 'Style', users: 6300, color: GOLD },
  { name: 'Luxe', users: 1331, color: '#F5E6A3' },
];

const mockRetentionData = [
  { day: 'D1', rate: 78 }, { day: 'D3', rate: 61 }, { day: 'D7', rate: 52 },
  { day: 'D14', rate: 44 }, { day: 'D30', rate: 38 }, { day: 'D60', rate: 31 },
];

const mockTopCountries = [
  { country: 'United States', users: 34200, pct: 40.6 },
  { country: 'United Kingdom', users: 9100, pct: 10.8 },
  { country: 'Canada', users: 6800, pct: 8.1 },
  { country: 'Australia', users: 5200, pct: 6.2 },
  { country: 'Germany', users: 3900, pct: 4.6 },
];

function StatCard({ label, value, sub, gold = false }: any) {
  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${gold ? 'rgba(212,175,55,0.4)' : BORDER}`,
      borderRadius: 16,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: MUTED, fontFamily: 'monospace' }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize: 36,
        fontWeight: 700,
        color: gold ? GOLD : TEXT,
        letterSpacing: -1,
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: MUTED }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'ai' | 'revenue'>('overview');

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        width: 240,
        background: CARD_BG,
        borderRight: `1px solid ${BORDER}`,
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: -0.5 }}>FitCheck</div>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1.5, fontFamily: 'monospace' }}>ADMIN CONSOLE</div>
        </div>

        {(['overview', 'users', 'ai', 'revenue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              background: selectedTab === tab ? 'rgba(212,175,55,0.1)' : 'transparent',
              border: `1px solid ${selectedTab === tab ? 'rgba(212,175,55,0.3)' : 'transparent'}`,
              borderRadius: 10,
              padding: '10px 14px',
              color: selectedTab === tab ? GOLD : MUTED,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: selectedTab === tab ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'overview' && '◎ '}{tab === 'users' && '◉ '}{tab === 'ai' && '✦ '}{tab === 'revenue' && '▦ '}
            {tab}
          </button>
        ))}

        <div style={{ marginTop: 'auto', fontSize: 11, color: MUTED }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 240, padding: '40px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT, letterSpacing: -0.5, margin: 0 }}>
            {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
          </h1>
          <p style={{ color: MUTED, fontSize: 14, margin: '4px 0 0' }}>
            Real-time FitCheck platform intelligence
          </p>
        </div>

        {selectedTab === 'overview' && (
          <>
            {/* Key Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Users" value={mockStats.totalUsers.toLocaleString()} sub="+2.3% this week" />
              <StatCard label="Active Today" value={mockStats.activeToday.toLocaleString()} sub="DAU" />
              <StatCard label="MRR" value={`$${(mockStats.mrr / 1000).toFixed(0)}K`} sub="+18% MoM" gold />
              <StatCard label="Churn Rate" value={`${mockStats.churnRate}%`} sub="Monthly, -0.3% vs last month" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <StatCard label="Avg Confidence" value={mockStats.avgConfidence} sub="Across all outfit logs" gold />
              <StatCard label="Wardrobe Items" value={`${(mockStats.wardrobeItemsLogged / 1e6).toFixed(1)}M`} sub="Total logged" />
              <StatCard label="Outfits Generated" value={`${(mockStats.outfitsGenerated / 1e6).toFixed(1)}M`} sub="All time" />
              <StatCard label="AI Calls Today" value={mockStats.aiCalls.toLocaleString()} sub="GPT-4o requests" />
            </div>

            {/* MRR Chart */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>MRR Growth</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mockMrrData}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" stroke={MUTED} fontSize={11} />
                  <YAxis stroke={MUTED} fontSize={11} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A1F', border: `1px solid ${BORDER}`, borderRadius: 8 }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, 'MRR']}
                  />
                  <Area type="monotone" dataKey="mrr" stroke={GOLD} fill="url(#mrrGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Tier Breakdown + Retention */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Users by Tier</div>
                {mockTierData.map((tier) => (
                  <div key={tier.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: TEXT }}>{tier.name}</span>
                      <span style={{ fontSize: 13, color: tier.color, fontWeight: 600 }}>
                        {tier.users.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: 6, background: BORDER, borderRadius: 3 }}>
                      <div style={{
                        height: 6,
                        width: `${(tier.users / mockStats.totalUsers) * 100}%`,
                        background: tier.color,
                        borderRadius: 3,
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Retention Curve</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={mockRetentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="day" stroke={MUTED} fontSize={11} />
                    <YAxis stroke={MUTED} fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1F', border: `1px solid ${BORDER}`, borderRadius: 8 }}
                    />
                    <Line type="monotone" dataKey="rate" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'users' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Users" value="84,231" sub="All time signups" />
              <StatCard label="Paid Users" value="23,031" sub="27.3% conversion" gold />
              <StatCard label="New This Week" value="2,847" sub="+12% WoW" />
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Top Countries</div>
              {mockTopCountries.map((c, i) => (
                <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 24, fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: TEXT }}>{c.country}</span>
                      <span style={{ fontSize: 13, color: MUTED }}>{c.users.toLocaleString()} ({c.pct}%)</span>
                    </div>
                    <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${c.pct * 2}%`, background: GOLD, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedTab === 'ai' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <StatCard label="API Calls Today" value="45,000" sub="GPT-4o requests" />
              <StatCard label="Avg Latency" value="1.2s" sub="P50 response time" gold />
              <StatCard label="Cost Today" value="$890" sub="OpenAI spend" />
              <StatCard label="Cache Hit Rate" value="34%" sub="Redis cache hits" />
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 8 }}>AI Feature Usage</div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>API calls by feature today</div>
              {[
                { feature: 'Outfit Recommendations', calls: 18400, pct: 41 },
                { feature: 'Wardrobe Enrichment', calls: 9200, pct: 20 },
                { feature: 'Style Chat', calls: 7650, pct: 17 },
                { feature: 'Confidence Prediction', calls: 4500, pct: 10 },
                { feature: 'Mood Dressing', calls: 2700, pct: 6 },
                { feature: 'Social Perception', calls: 1350, pct: 3 },
                { feature: 'Trend Engine', calls: 1200, pct: 3 },
              ].map((f) => (
                <div key={f.feature} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: TEXT }}>{f.feature}</span>
                    <span style={{ fontSize: 12, color: MUTED, fontFamily: 'monospace' }}>
                      {f.calls.toLocaleString()} ({f.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${f.pct * 2.5}%`, background: GOLD, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedTab === 'revenue' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <StatCard label="MRR" value="$214.5K" sub="+18% MoM" gold />
              <StatCard label="ARR Run Rate" value="$2.57M" sub="Projected" />
              <StatCard label="ARPU" value="$9.31" sub="Avg monthly revenue/user" />
              <StatCard label="LTV" value="$186" sub="Avg customer lifetime value" gold />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Revenue by Tier</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { tier: 'Free', revenue: 0 },
                    { tier: 'Essential', revenue: 153846 },
                    { tier: 'Style', revenue: 157497 },
                    { tier: 'Luxe', revenue: 106468 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="tier" stroke={MUTED} fontSize={11} />
                    <YAxis stroke={MUTED} fontSize={11} tickFormatter={(v) => `$${v / 1000}K`} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1F', border: `1px solid ${BORDER}`, borderRadius: 8 }}
                      formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Unit Economics</div>
                {[
                  { metric: 'CAC (Paid)', value: '$12.40' },
                  { metric: 'CAC (Organic)', value: '$2.10' },
                  { metric: 'LTV', value: '$186.00' },
                  { metric: 'LTV:CAC (Paid)', value: '15:1' },
                  { metric: 'Payback Period', value: '1.3 months' },
                  { metric: 'Gross Margin', value: '82%' },
                ].map((m) => (
                  <div key={m.metric} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBlock: 12,
                    borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <span style={{ fontSize: 13, color: MUTED }}>{m.metric}</span>
                    <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
