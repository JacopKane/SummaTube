interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
  loadedCount: number;
  totalCount: number;
}

export default function LoadMoreButton({ 
  hasMore, 
  isLoading, 
  onClick, 
  loadedCount, 
  totalCount 
}: LoadMoreButtonProps) {
  if (!hasMore) return null;
  
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="btn btn-primary px-8 flex items-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          `Load More (${loadedCount}/${totalCount})`
        )}
      </button>
    </div>
  );
}
