'use client'

import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface ChartData {
  type: 'line' | 'bar' | 'area' | 'pie'
  data: any[]
  xKey?: string
  yKey?: string
  title?: string
}

interface ChartRendererProps {
  output: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ChartRenderer({ output }: ChartRendererProps) {
  // Check if output contains chart data
  const chartMatch = output.match(/__CHART__(.*?)__CHART__/)

  if (!chartMatch) {
    // Regular text output
    return (
      <div className="font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
        {output}
      </div>
    )
  }

  try {
    const chartConfig: ChartData = JSON.parse(chartMatch[1])
    const { type, data, xKey, yKey, title } = chartConfig

    return (
      <div className="w-full">
        {title && (
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{title}</h3>
        )}
        <ResponsiveContainer width="100%" height={300}>
          {type === 'line' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px' }} />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          )}
          {type === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px' }} />
              <Legend />
              <Bar dataKey={yKey} fill="#3b82f6" />
            </BarChart>
          )}
          {type === 'area' && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px' }} />
              <Legend />
              <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </AreaChart>
          )}
          {type === 'pie' && (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry[xKey!]}
                outerRadius={100}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px' }} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  } catch (error) {
    // If parsing fails, show regular output
    return (
      <div className="font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
        {output}
      </div>
    )
  }
}
