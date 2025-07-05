'use client';

const Footer = () => {
    return (
        <footer className="bg-white mt-8 sm:mt-12">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t">
                <div className="text-center text-gray-500 text-sm sm:text-base">&copy; {new Date().getFullYear()} Armut. All rights reserved.</div>
            </div>
        </footer>
    );
};

export default Footer; 