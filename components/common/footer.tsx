import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-page text-gray-600 border-t border-gray-200/80">
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-[12px] text-gray-500">
          © {new Date().getFullYear()} Next Voters. All rights reserved.
        </p>
        <p className="text-[12px] text-gray-500">
          Supported by Google for Nonprofits
        </p>
      </div>
    </footer>
  );
};

export default Footer;
