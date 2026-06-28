import React from 'react';
import { Button } from './Button';
import { cn } from '@/shared/lib/cn';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className={cn("flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-6 w-full", className)}>
            <div className="flex flex-1 justify-between sm:hidden">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">
                        Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
                        <span className="font-semibold text-foreground">{totalPages}</span>
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm gap-1" aria-label="Pagination">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="px-2"
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                        </Button>
                        
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNum = index + 1;
                            const isActive = pageNum === currentPage;
                            // Show page numbers within range of current page to keep layout tidy
                            if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                    return <span key={pageNum} className="px-2 py-1 text-muted-foreground select-none text-xs">...</span>;
                                }
                                return null;
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={isActive ? "primary" : "secondary"}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    className="min-w-[32px] px-0"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}

                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="px-2"
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        </Button>
                    </nav>
                </div>
            </div>
        </div>
    );
};
