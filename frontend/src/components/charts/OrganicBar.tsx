"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ORGANIC_COLORS = [
  "#7A8B6F", // sage green (accent)
  "#8B7A6F", // warm brown
  "#6F7A8B", // muted blue-gray
  "#8B6F7A", // dusty mauve
  "#6F8B7A", // teal sage
];

/**
 * Custom bar shape with organic, slightly rounded edges
 * Creates a hand-drawn feel using rounded top corners
 */
function OrganicBarShape(props: any) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;

  const r = Math.min(8, width / 3, height / 3);
  const path = `
    M${x},${y + height}
    L${x},${y + r}
    Q${x},${y} ${x + r},${y}
    L${x + width - r},${y}
    Q${x + width},${y} ${x + width},${y + r}
    L${x + width},${y + height}
    Z
  `;
  return <path d={path} fill={fill} stroke="none" opacity={0.85} />;
}

interface ChartDataItem {
  name: string;
  value: number;
  label?: string;
}

interface OrganicBarChartProps {
  data: ChartDataItem[];
  height?: number;
  unit?: string;
}

/**
 * OrganicBarChart — Recharts BarChart wrapped in Calm's organic aesthetic.
 * Uses custom rounded bar shapes and muted earth-tone colors.
 */
export function OrganicBarChart({
  data,
  height = 280,
  unit = "t",
}: OrganicBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#6B6B68" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#9A9A97" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "rgba(122, 139, 111, 0.08)" }}
          contentStyle={{
            background: "#FAFAF8",
            border: "1px solid #E5E5E2",
            borderRadius: "8px",
            fontSize: "14px",
          }}
          formatter={((value: any) => [`${Number(value).toFixed(1)}${unit}`, ""]) as any}
        />
        <Bar dataKey="value" shape={<OrganicBarShape />}>
          {data.map((_, i) => (
            <Cell key={i} fill={ORGANIC_COLORS[i % ORGANIC_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { OrganicBarShape, ORGANIC_COLORS };
