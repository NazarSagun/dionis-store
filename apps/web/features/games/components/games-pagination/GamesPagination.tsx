import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui'

interface PaginationProps {
  totalPages: number
  onChange: (page: number) => void
  currentPage: number
}

export const GamesPagination = ({ totalPages, onChange, currentPage }: PaginationProps) => {
  const MAX_VISIBLE_PAGES = 11

  const getPageNumbers = () => {
    const pages = []

    if (totalPages <= MAX_VISIBLE_PAGES) {
      // If total pages are less than or equal to 11, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // If total pages are more than 11
      const startPage = Math.max(1, currentPage - 5)
      const endPage = Math.min(totalPages, currentPage + 5)

      if (startPage > 1) {
        pages.push(1) // Always show the first page
        if (startPage > 2) pages.push(<PaginationEllipsis key='start-ellipsis' />) // Add Ellipsis component if starting page is greater than 2
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push(<PaginationEllipsis key='end-ellipsis' />) // Add Ellipsis component if end page is less than total pages - 1
        pages.push(totalPages) // Always show the last page
      }
    }

    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page)
    }
  }

  const pageNumbers = getPageNumbers()

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              handlePageChange(currentPage - 1)
            }}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        {pageNumbers.map((page, index) =>
          typeof page === 'number' ? (
            <PaginationItem
              onClick={() => handlePageChange(page)}
              key={index}
            >
              <PaginationLink isActive={currentPage === page}>{page}</PaginationLink>
            </PaginationItem>
          ) : (
            page // Render the Ellipsis component directly
          )
        )}
        <PaginationItem>
          <PaginationNext
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
