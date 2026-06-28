import React, { useState, useMemo } from 'react';
import { cn } from '@/shared/lib/cn';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

export interface TableProps<T> {
    columns?: Column<T>[];
    data?: T[];
    onRowClick?: (item: T) => void;
    emptyText?: string;
    loading?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function Table<T>({
    columns,
    data,
    onRowClick,
    emptyText = 'No records found',
    loading = false,
    className,
    children
}: TableProps<T>) {
    if (children) {
        return (
            <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm scrollbar-none", className)}>
                <table className="w-full text-left border-collapse text-sm">
                    {children}
                </table>
            </div>
        );
    }

    const cols = columns || [];
    const rows = data || [];

    return (
        <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm scrollbar-none", className)}>
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/25 text-muted-foreground font-semibold">
                        {cols.map((col) => (
                            <th
                                key={col.key}
                                className={cn("px-4 py-3 font-semibold", col.className)}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {loading && (
                        [...Array(3)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                {cols.map((col) => (
                                    <td key={col.key} className="px-4 py-4">
                                        <div className="h-4 bg-muted rounded w-2/3" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    {!loading && rows.length === 0 && (
                        <tr>
                            <td colSpan={cols.length} className="px-4 py-8 text-center text-muted-foreground/60">
                                {emptyText}
                            </td>
                        </tr>
                    )}
                    {!loading && rows.map((item, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "transition-colors hover:bg-muted/15",
                                onRowClick && "cursor-pointer"
                            )}
                        >
                            {cols.map((col) => (
                                <td
                                    key={col.key}
                                    className={cn("px-4 py-3.5 text-foreground font-medium", col.className)}
                                >
                                    {col.render ? col.render(item) : (item as any)[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Declarative Table Subcomponents
export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
    <thead className={cn("border-b border-border bg-muted/25 text-muted-foreground font-semibold", className)} {...props} />
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
    <tbody className={cn("divide-y divide-border/60", className)} {...props} />
);

export const TR: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
    <tr className={cn("border-b border-border transition-colors hover:bg-muted/15", className)} {...props} />
);

export const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
    <th className={cn("px-4 py-3.5 font-semibold text-left text-muted-foreground text-xs uppercase tracking-wider", className)} {...props} />
);

export const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
    <td className={cn("px-4 py-3.5 text-foreground text-sm font-medium", className)} {...props} />
);

// -------------------------------------------------------------
// Interactive Reusable DataTable Wrapper (Phase 5)
// -------------------------------------------------------------
export interface FilterOption {
    label: string;
    value: string;
}

export interface TableFilter {
    key: string;
    label: string;
    options: FilterOption[];
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    emptyText?: string;
    loading?: boolean;
    searchable?: boolean;
    searchKey?: string;
    searchPlaceholder?: string;
    
    // Pagination parameters
    paginated?: boolean;
    defaultPageSize?: number;

    // Filters definition
    filters?: TableFilter[];

    // Checkbox selections
    selectable?: boolean;
    onSelectionChange?: (selectedItems: T[]) => void;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    onRowClick,
    emptyText = 'No matching records found.',
    loading = false,
    searchable = false,
    searchKey,
    searchPlaceholder = 'Search records...',
    paginated = false,
    defaultPageSize = 10,
    filters = [],
    selectable = false,
    onSelectionChange
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(defaultPageSize);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

    // 1. Reset selections helper
    const syncSelectionChange = (newSelected: Set<string | number>) => {
        setSelectedIds(newSelected);
        if (onSelectionChange) {
            const selectedItems = data.filter(item => {
                const identifier = item.id || item.hash || item.key;
                return newSelected.has(identifier);
            });
            onSelectionChange(selectedItems);
        }
    };

    // 2. Filter, Search, Sort Process
    const processedData = useMemo(() => {
        let result = [...data];

        // Search Filter
        if (searchable && searchQuery && searchKey) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => {
                const val = item[searchKey];
                return val ? String(val).toLowerCase().includes(query) : false;
            });
        }

        // Dropdown Filters
        Object.entries(selectedFilters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                result = result.filter(item => String(item[key]) === value);
            }
        });

        // Sort Processing
        if (sortKey) {
            result.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                
                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
                if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchable, searchQuery, searchKey, selectedFilters, sortKey, sortDirection]);

    // 3. Pagination limits
    const paginatedData = useMemo(() => {
        if (!paginated) return processedData;
        const start = (currentPage - 1) * pageSize;
        return processedData.slice(start, start + pageSize);
    }, [processedData, paginated, currentPage, pageSize]);

    const totalPages = Math.ceil(processedData.length / pageSize);

    // Row selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = paginatedData.map(item => item.id || item.hash || item.key).filter(Boolean);
            syncSelectionChange(new Set(allIds));
        } else {
            syncSelectionChange(new Set());
        }
    };

    const handleSelectRow = (checked: boolean, identifier: string | number) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(identifier);
        } else {
            next.delete(identifier);
        }
        syncSelectionChange(next);
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.has(item.id || item.hash || item.key));

    return (
        <div className="space-y-4">
            {/* Top Control Bar (Search + Dropdown Filters) */}
            {(searchable || filters.length > 0) && (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card/40 border border-border p-4 rounded-xl shrink-0">
                    {searchable && searchKey && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                            <Input
                                aria-label={searchPlaceholder}
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 h-10 w-full"
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 items-center">
                        {filters.map(f => (
                            <select
                                key={f.key}
                                value={selectedFilters[f.key] || ''}
                                onChange={(e) => {
                                    setSelectedFilters(prev => ({ ...prev, [f.key]: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="h-10 text-xs px-3 bg-card border border-border rounded-xl font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Filter {f.label}</option>
                                <option value="all">All</option>
                                {f.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>
            )}

            {/* Table layout content */}
            <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm scrollbar-none">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/25 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                            {selectable && (
                                <th className="px-4 py-3.5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-border bg-background focus:ring-primary text-primary w-4 h-4 cursor-pointer"
                                    />
                                </th>
                            )}
                            {columns.map(col => {
                                const isSorted = sortKey === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        className={cn(
                                            "px-4 py-3.5 font-bold select-none",
                                            col.sortable && "cursor-pointer hover:bg-muted/30 hover:text-foreground transition-all duration-150",
                                            col.className
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{col.header}</span>
                                            {col.sortable && (
                                                <ArrowUpDown className={cn(
                                                    "w-3.5 h-3.5 text-muted-foreground/60 transition-colors",
                                                    isSorted && "text-primary"
                                                )} />
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {loading ? (
                            [...Array(pageSize)].map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    {selectable && <td className="px-4 py-4"><div className="w-4 h-4 bg-muted rounded mx-auto" /></td>}
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-4">
                                            <div className="h-4 bg-muted rounded w-2/3" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground/60 font-medium">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => {
                                const identifier = item.id || item.hash || item.key;
                                const isSelected = selectedIds.has(identifier);
                                return (
                                    <tr
                                        key={identifier || idx}
                                        onClick={() => onRowClick?.(item)}
                                        className={cn(
                                            "transition-colors hover:bg-muted/15",
                                            isSelected && "bg-primary/5 hover:bg-primary/10 border-primary/20",
                                            onRowClick && "cursor-pointer"
                                        )}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-3.5 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => handleSelectRow(e.target.checked, identifier)}
                                                    className="rounded border-border bg-background focus:ring-primary text-primary w-4 h-4 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        {columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={cn("px-4 py-3.5 text-foreground text-sm font-semibold", col.className)}
                                            >
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {paginated && totalPages > 1 && (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-card/25 border border-border/80 rounded-xl text-xs font-semibold text-muted-foreground shrink-0">
                    <div>
                        Showing <span className="text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="text-foreground">
                            {Math.min(currentPage * pageSize, processedData.length)}
                        </span>{' '}
                        of <span className="text-foreground">{processedData.length}</span> records
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1 h-8 w-8 min-w-0"
                            aria-label="Previous Page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-2 text-foreground font-mono">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1 h-8 w-8 min-w-0"
                            aria-label="Next Page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
