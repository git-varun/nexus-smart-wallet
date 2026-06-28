import React from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { cn } from '@/shared/lib/cn';
import { StateView } from './StateView';

export interface ChartProps {
    type: 'line' | 'area' | 'bar' | 'donut';
    data: any[];
    keys: string[];
    colors?: string[];
    xAxisKey?: string;
    loading?: boolean;
    empty?: boolean;
    height?: number;
    className?: string;
}

export const Chart: React.FC<ChartProps> = ({
    type,
    data = [],
    keys = [],
    colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
    xAxisKey = 'name',
    loading = false,
    empty = false,
    height = 250,
    className
}) => {
    const hasData = data && data.length > 0;
    const isChartEmpty = empty || !hasData;

    const renderChartContent = () => {
        if (loading) {
            return (
                <div style={{ height }} className="flex items-center justify-center">
                    <StateView type="loading" className="border-0 bg-transparent py-0" />
                </div>
            );
        }

        if (isChartEmpty) {
            return (
                <div style={{ height }} className="flex items-center justify-center">
                    <StateView type="empty" title="No activity recorded" description="Transactions or volume data will render here." className="border-0 bg-transparent py-0" />
                </div>
            );
        }

        switch (type) {
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                {keys.map((key, i) => (
                                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[i] || 'var(--primary)'} stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor={colors[i] || 'var(--primary)'} stopOpacity={0}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            />
                            {keys.map((key, i) => (
                                <Area key={key} type="monotone" dataKey={key} stroke={colors[i]} fillOpacity={1} fill={`url(#grad-${key})`} strokeWidth={2} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            />
                            {keys.map((key, i) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 2 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            />
                            {keys.map((key, i) => (
                                <Bar key={key} dataKey={key} fill={colors[i]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'donut': {
                const donutData = data.map(item => {
                    const value = item[keys[0]];
                    const name = item[xAxisKey];
                    return { name, value };
                });
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={height * 0.22}
                                outerRadius={height * 0.35}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                            >
                                {donutData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className={cn("w-full transition-all duration-300 relative", className)}>
            {renderChartContent()}
        </div>
    );
};
export default Chart;
