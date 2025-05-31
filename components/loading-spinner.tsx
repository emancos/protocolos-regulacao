export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-600 dark:border-blue-400 opacity-20"></div>
            </div>
        </div>
    )
}
  