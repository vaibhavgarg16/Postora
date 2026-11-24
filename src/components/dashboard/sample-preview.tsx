"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const points = [
  { day: "Mon", engagement: 42 },
  { day: "Tue", engagement: 55 },
  { day: "Wed", engagement: 48 },
  { day: "Thu", engagement: 76 },
  { day: "Fri", engagement: 68 },
  { day: "Sat", engagement: 91 },
  { day: "Sun", engagement: 84 },
]

export function SamplePreview() {
  return (
    <section className="rounded-2xl border border-dashed bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">Sample preview</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Demo data</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        These numbers are a static illustration of the dashboard. They are not your followers, likes, or publishing
        history, and they are not saved to the database.
      </p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <Tooltip />
            <Area type="monotone" dataKey="engagement" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.16} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
