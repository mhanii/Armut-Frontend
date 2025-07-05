const Loading = () => {
    return (
        <div className="container mx-auto p-6 py-8">
            <h2 className="text-3xl font-bold mb-6">Our Collection</h2>
            <div className="mb-8 flex justify-center flex-wrap gap-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-10 w-28 rounded-full animate-pulse"></div>
                ))}
            </div>
            <div className="mb-8 max-w-xl mx-auto">
                 <div className="bg-gray-200 h-12 w-full rounded-lg animate-pulse"></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="relative h-64 bg-gray-200 animate-pulse"></div>
                        <div className="p-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/4 mt-2 animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Loading; 