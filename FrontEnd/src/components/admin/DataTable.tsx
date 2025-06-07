import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    label: string;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }[] | ((item: T) => {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }[]);
  bulkActions?: {
    label: string;
    onClick: (selectedItems: T[]) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }[];
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  getItemId?: (item: T, index: number) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  title,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  pagination,
  actions = [],
  bulkActions = [],
  selectable = false,
  loading = false,
  emptyMessage = "No data available",
  getItemId = (item: T, index: number) => index,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = data.map((item, index) => getItemId(item, index));
      setSelectedItems(new Set(allIds));
    }
  };

  const handleSelectItem = (itemId: string | number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getSelectedItems = () => {
    return data.filter((item, index) => {
      const itemId = getItemId(item, index);
      return selectedItems.has(itemId);
    });
  };

  const renderCellContent = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = item[column.key as keyof T];
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />;
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {title && <CardTitle className="text-xl font-bold">{title}</CardTitle>}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full sm:w-80 h-10"
                />
              </div>
            )}
            {bulkActions.length > 0 && selectedItems.size > 0 && (
              <div className="flex gap-3 flex-wrap">
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="default"
                    onClick={() => action.onClick(getSelectedItems())}
                  >
                    {action.label} ({selectedItems.size})
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                {selectable && (
                  <th className="text-left p-4 w-16">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === data.length && data.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 h-4 w-4"
                      aria-label="Select all items"
                      title="Select all items"
                    />
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`text-left p-4 font-medium text-gray-700 ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${column.width ? `w-[${column.width}]` : ''}`}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortConfig?.key === column.key && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {(Array.isArray(actions) ? actions.length > 0 : !!actions) && (
                  <th className="text-left p-4 w-48 font-medium text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + ((Array.isArray(actions) ? actions.length > 0 : !!actions) ? 1 : 0)}
                    className="text-center p-8 text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const itemId = getItemId(item, index);
                  return (
                    <tr key={itemId} className="border-b hover:bg-gray-50">
                      {selectable && (
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(itemId)}
                            onChange={() => handleSelectItem(itemId)}
                            className="rounded border-gray-300 h-4 w-4"
                            aria-label={`Select item ${itemId}`}
                            title={`Select item ${itemId}`}
                          />
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="p-4">
                          {renderCellContent(item, column)}
                        </td>
                      ))}
                      {(Array.isArray(actions) ? actions.length > 0 : !!actions) && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            {(Array.isArray(actions) ? actions : actions(item)).map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                variant={action.variant || 'outline'}
                                size="sm"
                                onClick={() => {
                                  if (Array.isArray(actions)) {
                                    (action as any).onClick(item);
                                  } else {
                                    (action as any).onClick();
                                  }
                                }}
                              >
                                {action.icon}
                                <span className="ml-1">{action.label}</span>
                              </Button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t gap-6">
            <div className="text-gray-600 order-2 sm:order-1">
              Showing <span className="font-semibold">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.currentPage * pagination.pageSize, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="default"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
