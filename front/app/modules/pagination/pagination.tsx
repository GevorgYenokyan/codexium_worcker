import React, { FC, useMemo, useState, ChangeEvent } from "react";
import styles from "./style/pagination.module.scss";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

interface PaginationProps {
    page?: number;
    limit?: number;
    count: number;
    currentPage?: number;
    maxVisiblePages?: number;
    prevLabel?: string;
    nextLabel?: string;
    onPageChange: (newPage: number) => void;
    onLimitChange?: (newLimit: number) => void;
}

const defaultProps: Partial<PaginationProps> = {
    page: 1,
    limit: 10,
    maxVisiblePages: 5,
    prevLabel: "Previous",
    nextLabel: "Next",
};

const generatePageNumbers = (
    currentPage: number,
    totalPages: number,
    maxVisible: number
): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    pages.push(1);

    if (startPage > 2) {
        pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
            pages.push(i);
        }
    }

    if (endPage < totalPages - 1) {
        pages.push("...");
    }

    if (totalPages !== 1) {
        pages.push(totalPages);
    }

    return pages;
};

const Pagination: FC<PaginationProps> = ({
    page = 1,
    limit = 10,
    count,
    maxVisiblePages = 5,
    prevLabel,
    nextLabel,
    currentPage = 1,
    onPageChange,
    onLimitChange,
}) => {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.max(1, Math.floor(limit));
    const totalPages = Math.ceil(count / safeLimit);

    const [gotoPage, setGotoPage] = useState<string>("");

    const pageNumbers = useMemo(
        () => generatePageNumbers(currentPage, totalPages, maxVisiblePages),
        [currentPage, totalPages, maxVisiblePages]
    );

    const handleGotoPage = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGotoPage(value);
        const pageNum = parseInt(value, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum);
        }
    };

    const handleLimitChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(e.target.value, 10);
        if (onLimitChange && newLimit > 0) {
            onLimitChange(newLimit);
            // Reset to first page when limit changes
            onPageChange(1);
        }
    };

    if (count === 0) {
        return <div className={styles.empty}>No items to display</div>;
    }

    return (
      <nav
        className={styles.pagination}
        aria-label="Pagination"
        data-testid="pagination"
      >
        {/* Items per page selector */}
        {onLimitChange && (
          <div className={styles.limitSelector}>
            <label htmlFor="limit-select" className="sr-only">
              Items per page
            </label>
            <select
              id="limit-select"
              value={safeLimit}
              onChange={handleLimitChange}
              className="border rounded px-2 py-1 text-sm"
              data-testid="limit-select"
            >
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value} per page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pagination buttons */}
        <div className={styles.buttonContainer}>
            
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${styles.button} ${
              currentPage === 1 ? styles.disabled : ""
            }`}
            aria-label="Previous page"
            data-testid="prev-button"
          >
            <MdOutlineArrowBackIosNew />
          </button>
            
          {pageNumbers.map((pageNumber, index) =>
          
            typeof pageNumber === "number" ? (
                
              <button
                key={`page-${pageNumber}`}
                onClick={() => onPageChange(pageNumber)}
                className={`${styles.button} ${
                  currentPage === pageNumber ? styles.active : ""
                }`}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                data-testid={`page-button-${pageNumber}`}
              >
                {pageNumber}
              </button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className={styles.dots}
                aria-hidden="true"
              >
                {pageNumber}
              </span>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${styles.button} ${
              currentPage === totalPages ? styles.disabled : ""
            }`}
            aria-label="Next page"
            data-testid="next-button"
          >
            <MdOutlineArrowForwardIos />
          </button>
        </div>
      </nav>
    );
};

export default React.memo(Pagination);
