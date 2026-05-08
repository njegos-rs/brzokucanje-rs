'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DailyPoint {
  date: string
  vezba: number
  rank: number
  registracije: number
  avgWpm: number | null
}

interface DistPoint {
  name: string
  value: number
}

interface Props {
  dailyData: DailyPoint[]
  scriptData: DistPoint[]
  categoryData: DistPoint[]
}

const SCRIPT_COLORS: Record<string, string> = {
  latinica: 'var(--accent)',
  cirilica: '#a78bfa',
  easy: '#34d399',
}

const CATEGORY_COLORS = ['var(--accent)', '#a78bfa', '#34d399', '#f59e0b', '#f87171']

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      {children}
    </div>
  )
}

export function StatsCharts({ dailyData, scriptData, categoryData }: Props) {
  const tickStyle = { fontSize: 11, fill: 'var(--muted-foreground)' }
  const tooltipStyle = {
    contentStyle: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      fontSize: 12,
      borderRadius: 6,
    },
  }

  return (
    <div className="space-y-6">
      {/* Testovi po danu */}
      <ChartCard title="Testovi po danu (vezba + rank)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={tickStyle} interval={4} />
            <YAxis tick={tickStyle} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="vezba"
              name="Vežba"
              stackId="1"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="rank"
              name="Rank"
              stackId="1"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Prosečni WPM po danu */}
      <ChartCard title="Prosečni WPM (RANK mod, po danu)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={tickStyle} interval={4} />
            <YAxis tick={tickStyle} domain={['auto', 'auto']} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v) => [v === null ? '—' : `${v} wpm`, 'Prosek WPM']}
            />
            <Bar dataKey="avgWpm" name="Prosek WPM" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Registracije po danu */}
      <ChartCard title="Registracije po danu">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={tickStyle} interval={4} />
            <YAxis tick={tickStyle} allowDecimals={false} />
            <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Registracije']} />
            <Bar dataKey="registracije" name="Registracije" fill="#34d399" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Distribucije */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Distribucija po pismu">
          {scriptData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Nema podataka</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={scriptData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {scriptData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SCRIPT_COLORS[entry.name] ?? 'var(--accent)'}
                    />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribucija po kategoriji">
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Nema podataka</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
