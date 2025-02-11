import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Slider } from '@/components/ui/slider';
import axios from 'axios';

const FilterSection = ({ onFilterChange, initialFilters }) => {
  const [openSections, setOpenSections] = useState({
    date: true,
    degree: true,
    category: true,
    institution: true
  });

  // State for filter values with initial values
  const [filters, setFilters] = useState(initialFilters || {
    yearRange: [2000, new Date().getFullYear()], // Default range will be updated
    selectedDegrees: [],
    selectedCategories: [],
    selectedInstitutions: []
  });

  const [availableOptions, setAvailableOptions] = useState({
    degrees: [],
    categories: [],
    institutions: [],
    years: { min: 2000, max: new Date().getFullYear() }
  });

  // Fetch available options including years
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get('/api/filter-options');
        const years = response.data.years || { 
          min: Math.min(...response.data.years), 
          max: Math.max(...response.data.years) 
        };
        
        setAvailableOptions({
          degrees: response.data.degrees || [],
          categories: response.data.categories || [],
          institutions: response.data.institutions || [],
          years
        });

        // Update year range if not already set
        if (!initialFilters?.yearRange) {
          setFilters(prev => ({
            ...prev,
            yearRange: [years.min, years.max]
          }));
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchOptions();
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters };
    
    switch(type) {
      case 'year':
        newFilters.yearRange = value;
        break;
      case 'degree':
        newFilters.selectedDegrees = value;
        break;
      case 'category':
        newFilters.selectedCategories = value;
        break;
      case 'institution':
        newFilters.selectedInstitutions = value;
        break;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      yearRange: [new Date().getFullYear() - 10, new Date().getFullYear()],
      selectedDegrees: [],
      selectedCategories: [],
      selectedInstitutions: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="px-4 py-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h3>
      
      {/* Year Range Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('date')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
        >
          <span>Year Range</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${openSections.date ? 'rotate-180' : ''}`} />
        </button>
        {openSections.date && (
          <div className="px-2 pt-4">
            <Slider
              defaultValue={filters.yearRange}
              min={new Date().getFullYear() - 10}
              max={new Date().getFullYear()}
              step={1}
              value={filters.yearRange}
              onValueChange={(value) => handleFilterChange('year', value)}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{filters.yearRange[0]}</span>
              <span>{filters.yearRange[1]}</span>
            </div>
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
            {availableOptions.degrees.map((degree) => (
              <label key={degree} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={filters.selectedDegrees.includes(degree)}
                  onChange={(e) => {
                    const newDegrees = e.target.checked
                      ? [...filters.selectedDegrees, degree]
                      : filters.selectedDegrees.filter(d => d !== degree);
                    handleFilterChange('degree', newDegrees);
                  }}
                />
                <span className="text-sm text-gray-600">{degree}</span>
              </label>
            ))}
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
            {availableOptions.categories.map((category) => (
              <label key={category} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={filters.selectedCategories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...filters.selectedCategories, category]
                      : filters.selectedCategories.filter(c => c !== category);
                    handleFilterChange('category', newCategories);
                  }}
                />
                <span className="text-sm text-gray-600">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Institution Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('institution')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
        >
          <span>Institution</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${openSections.institution ? 'rotate-180' : ''}`} />
        </button>
        {openSections.institution && (
          <div className="space-y-2">
            {availableOptions.institutions.map((institution) => (
              <label key={institution} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={filters.selectedInstitutions.includes(institution)}
                  onChange={(e) => {
                    const newInstitutions = e.target.checked
                      ? [...filters.selectedInstitutions, institution]
                      : filters.selectedInstitutions.filter(i => i !== institution);
                    handleFilterChange('institution', newInstitutions);
                  }}
                />
                <span className="text-sm text-gray-600">{institution}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={clearFilters}
        className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSection;