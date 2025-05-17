import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

// PieChart component
export const PieChart = ({
  data,
  dataKey = "value",
  nameKey = "name",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"],
  className,
  ...props
}: {
  data: Array<Record<string, any>>;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  className?: string;
  [key: string]: any;
}) => {
  return (
    <div className={cn("w-full h-full min-h-[300px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart {...props}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}`, dataKey]}
            labelFormatter={(name) => `${name}`}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

// LineChart component
export const LineChart = ({
  data,
  lines = [{ dataKey: "value", stroke: "#8884d8" }],
  xAxisDataKey = "name",
  className,
  grid = true,
  ...props
}: {
  data: Array<Record<string, any>>;
  lines?: Array<{ dataKey: string; stroke?: string; name?: string }>;
  xAxisDataKey?: string;
  className?: string;
  grid?: boolean;
  [key: string]: any;
}) => {
  return (
    <div className={cn("w-full h-full min-h-[300px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          {...props}
        >
          {grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              name={line.name || line.dataKey}
              activeDot={{ r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// BarChart component
export const BarChart = ({
  data,
  bars = [{ dataKey: "value", fill: "#8884d8" }],
  xAxisDataKey = "name",
  className,
  grid = true,
  ...props
}: {
  data: Array<Record<string, any>>;
  bars?: Array<{ dataKey: string; fill?: string; name?: string }>;
  xAxisDataKey?: string;
  className?: string;
  grid?: boolean;
  [key: string]: any;
}) => {
  return (
    <div className={cn("w-full h-full min-h-[300px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          {...props}
        >
          {grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={`bar-${index}`}
              dataKey={bar.dataKey}
              fill={bar.fill || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              name={bar.name || bar.dataKey}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
