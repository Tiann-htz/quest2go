import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import { Plus, Edit2, Trash2, X, Menu, Search, Link as LinkIcon } from 'lucide-react';

export default function Studies() {
  const router = useRouter();
  const [studies, setStudies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStudy, setCurrentStudy] = useState(null);
  const [references, setReferences] = useState([]);
  const [newReference, setNewReference] = useState({
    reference_link: '',
    reference_details: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    year_of_completion: '',
    degree_program: '',
    category: '',
    institution: '',
    author: '',
    status: 'Non-Available'
  });

  useEffect(() => {
    fetchStudies();
  }, []);

  useEffect(() => {
    if (currentStudy) {
      fetchReferences(currentStudy.research_id);
    } else {
      setReferences([]); // Add this line to ensure references are cleared when no study is selected
    }
  }, [currentStudy]);

  const fetchStudies = async () => {
    try {
      const response = await axios.get('/api/admin/studies');
      setStudies(response.data.studies);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching studies:', error);
      setIsLoading(false);
    }
  };

  const fetchReferences = async (researchId) => {
    try {
      const response = await axios.get(`/api/admin/references/${researchId}`);
      setReferences(response.data.references);
    } catch (error) {
      console.error('Error fetching references:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddReference = () => {
    if (newReference.reference_link && newReference.reference_details) {
      setReferences([...references, { ...newReference, temp_id: Date.now() }]);
      setNewReference({ reference_link: '', reference_details: '' });
    }
  };

  const handleRemoveReference = async (referenceId) => {
    if (window.confirm('Are you sure you want to remove this reference?')) {
      if (typeof referenceId === 'number') {
        try {
          await axios.delete(`/api/admin/references/${referenceId}`);
        } catch (error) {
          console.error('Error deleting reference:', error);
          return;
        }
      }
      setReferences(references.filter(ref => 
        ref.reference_id !== referenceId && ref.temp_id !== referenceId
      ));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let studyId;
      if (currentStudy) {
        await axios.put(`/api/admin/studies/${currentStudy.research_id}`, formData);
        studyId = currentStudy.research_id;
      } else {
        const response = await axios.post('/api/admin/studies', formData);
        studyId = response.data.study_id;
      }

      await axios.post(`/api/admin/references/${studyId}`, { references });

      setIsModalOpen(false);
      setCurrentStudy(null);
      setFormData({
        title: '',
        abstract: '',
        keywords: '',
        year_of_completion: '',
        degree_program: '',
        category: '',
        institution: '',
        author: '',
        status: 'Non-Available'
      });
      setReferences([]);
      fetchStudies();
    } catch (error) {
      console.error('Error saving study:', error);
    }
  };

  const handleEdit = (study) => {
    setCurrentStudy(study);
    setFormData({
      title: study.title,
      abstract: study.abstract,
      keywords: study.keywords,
      year_of_completion: study.year_of_completion,
      degree_program: study.degree_program,
      category: study.category,
      institution: study.institution,
      author: study.author,
      status: study.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this study?')) {
      try {
        await axios.delete(`/api/admin/studies/${id}`);
        fetchStudies();
      } catch (error) {
        console.error('Error deleting study:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-0"></div>
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Studies Management - Quest2Go Admin</title>
      </Head>

      <div className="flex h-screen">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 flex-shrink-0
        `}>
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="flex-1 px-4 flex justify-between">
                  <div className="flex-1 flex">
                    <div className="w-full flex md:ml-0">
                      <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                          <Search className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm"
                          placeholder="Search studies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

           {/* Main Content Area */}
           <div className="flex-1 overflow-auto">
            <main className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Research Studies</h1>
                <button
                  onClick={() => {
                    setCurrentStudy(null);
                    setFormData({
                      title: '',
                      abstract: '',
                      keywords: '',
                      year_of_completion: '',
                      degree_program: '',
                      category: '',
                      institution: '',
                      author: '',
                      status: 'Non-Available'  
                    });
                    setReferences([]);
                    setIsModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Study
                </button>
              </div>

              {/* Studies Table with horizontal scroll */}
              <div className="bg-white shadow rounded-lg">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Institution</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {studies
                          .filter(study => 
                            study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            study.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            study.institution.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((study) => (
                            <tr key={study.research_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{study.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{study.category}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{study.institution}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          study.status === 'Available' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {study.status}
        </span>
      </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(study)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(study.research_id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentStudy ? 'Edit Study' : 'Add New Study'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Abstract</label>
                    <textarea
                      name="abstract"
                      value={formData.abstract}
                      onChange={handleInputChange}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Keywords</label>
                    <input
                      type="text"
                      name="keywords"
                      value={formData.keywords}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year of Completion</label>
                      <input
                        type="number"
                        name="year_of_completion"
                        value={formData.year_of_completion}
                        onChange={handleInputChange}
                        min="1900"
                        max="2099"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Degree Program</label>
                      <input
                        type="text"
                        name="degree_program"
                        value={formData.degree_program}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institution</label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
  <label className="block text-sm font-medium text-gray-700">Author</label>
  <input
    type="text"
    name="author"
    value={formData.author}
    onChange={handleInputChange}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    required
  />
</div>

<div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        >
          <option value="Non-Available">Non-Available</option>
          <option value="Available">Available</option>
        </select>
      </div>
                 {/* Add New Reference */}
                 <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="Reference Link"
                        value={newReference.reference_link}
                        onChange={(e) => setNewReference({
                          ...newReference,
                          reference_link: e.target.value
                        })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Reference Details"
                        value={newReference.reference_details}
                        onChange={(e) => setNewReference({
                          ...newReference,
                          reference_details: e.target.value
                        })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddReference}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>

                  {/* References List */}
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    {references.map((ref) => (
                      <div
                        key={ref.reference_id || ref.temp_id}
                        className="flex items-center gap-3 p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-indigo-600 truncate">
                            {ref.reference_link}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {ref.reference_details}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReference(ref.reference_id || ref.temp_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {references.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No references added yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {currentStudy ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}