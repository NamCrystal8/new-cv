import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react';
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
  getItemId = (_item: T, index: number) => index,
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
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {title && <CardTitle className="text-lg sm:text-xl font-bold">{title}</CardTitle>}
          <div className="flex flex-col gap-3 sm:gap-4">
            {searchable && (
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 sm:pl-10 w-full h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            )}
            {bulkActions.length > 0 && selectedItems.size > 0 && (
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => action.onClick(getSelectedItems())}
                    className="text-xs sm:text-sm"
                  >
                    {action.label} ({selectedItems.size})
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectable && (
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 h-4 w-4 touch-manipulation"
                        aria-label="Select all items"
                        title="Select all items"
                      />
                    </th>
                  )}
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100 touch-manipulation' : ''
                      } ${column.width ? `w-[${column.width}]` : ''}`}
                      onClick={() => column.sortable && handleSort(String(column.key))}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="truncate">{column.header}</span>
                        {column.sortable && sortConfig?.key === column.key && (
                          <span className="text-xs flex-shrink-0">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  {(Array.isArray(actions) ? actions.length > 0 : !!actions) && (
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sm:w-48">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0) + ((Array.isArray(actions) ? actions.length > 0 : !!actions) ? 1 : 0)}
                      className="px-3 sm:px-4 py-8 text-center text-sm text-gray-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => {
                    const itemId = getItemId(item, index);
                    return (
                      <tr key={itemId} className="hover:bg-gray-50">
                        {selectable && (
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(itemId)}
                              onChange={() => handleSelectItem(itemId)}
                              className="rounded border-gray-300 h-4 w-4 touch-manipulation"
                              aria-label={`Select item ${itemId}`}
                              title={`Select item ${itemId}`}
                            />
                          </td>
                        )}
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-900">
                            <div className="truncate max-w-xs sm:max-w-sm lg:max-w-none">
                              {renderCellContent(item, column)}
                            </div>
                          </td>
                        ))}
                        {(Array.isArray(actions) ? actions.length > 0 : !!actions) && (
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="flex gap-1 sm:gap-2 flex-wrap">
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
                                  className="text-xs sm:text-sm touch-manipulation"
                                >
                                  {action.icon}
                                  <span className="ml-1 hidden sm:inline">{action.label}</span>
                                  <span className="sm:hidden" title={action.label}>{action.icon}</span>
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
        </div>

        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t gap-4 sm:gap-6">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1 text-center sm:text-left">
              Showing <span className="font-semibold">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.currentPage * pagination.pageSize, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="touch-manipulation"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <span className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-md text-xs sm:text-sm font-medium">
                <span className="sm:hidden">{pagination.currentPage}/{pagination.totalPages}</span>
                <span className="hidden sm:inline">Page {pagination.currentPage} of {pagination.totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="touch-manipulation"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
