import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

const FilterSection = () => {
  const [openSections, setOpenSections] = useState({
    date: true,
    degree: true,
    category: true
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="px-4 py-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h3>
      
      {/* Date Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('date')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
        >
          <span>Date of Completion</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${openSections.date ? 'rotate-180' : ''}`} />
        </button>
        {openSections.date && (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Last 3 months</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Last 6 months</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Last year</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">All time</span>
            </label>
          </div>
        )}
      </div>

      {/* Degree Program Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('degree')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
        >
          <span>Degree Program</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${openSections.degree ? 'rotate-180' : ''}`} />
        </button>
        {openSections.degree && (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Bachelor's Degree</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Master's Degree</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Doctorate</span>
            </label>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
        >
          <span>Category</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${openSections.category ? 'rotate-180' : ''}`} />
        </button>
        {openSections.category && (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Computer Science</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Engineering</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Business</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Education</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Health Sciences</span>
            </label>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      <button className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium">
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSection;