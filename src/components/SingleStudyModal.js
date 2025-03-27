import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLinkIcon, MessageCircle, X as XIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import axios from 'axios';

const PulseLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[300px]">
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-indigo-600 animate-ping absolute"></div>
      <div className="w-12 h-12 rounded-full bg-indigo-600 relative">
        <span className="animate-pulse absolute inset-0 h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
      </div>
    </div>
  </div>
);

const ReferencesList = ({ studyId, referenceCount }) => {
  const [references, setReferences] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferences = async () => {
    if (!isExpanded) {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/study/references?studyId=${studyId}`);
        setReferences(response.data.references);
      } catch (error) {
        console.error('Error fetching references:', error);
      }
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-4">
      <button
        onClick={fetchReferences}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span>References: {referenceCount}</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                {references.map((ref) => (
                  <div key={ref.reference_id} className="bg-gray-50 p-3 rounded-lg">
                    <a
                      href={ref.reference_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <span className="truncate">{ref.reference_link}</span>
                      <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
                    </a>
                    <div 
                      className="text-sm text-gray-600 mt-1 truncate group relative"
                      title={ref.reference_details}
                    >
                      {ref.reference_details}
                      <div className="hidden group-hover:block absolute left-0 top-full mt-2 p-2 bg-white border rounded-lg shadow-lg z-10 max-w-md">
                        {ref.reference_details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SingleStudyModal = ({ isOpen, onClose, article, onOpenChat }) => {
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  
  const handleOpenChat = () => {
    if (article) {
      onOpenChat(article);
    }
  };
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target) && 
          event.target.classList.contains('modal-backdrop')) {
        onClose();
      }
    }
  
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Only show loading state if this is the first time loading
      if (!hasLoaded) {
        setIsLoading(true);
        const timer = setTimeout(() => {
          setIsLoading(false);
          setHasLoaded(true); // Mark as loaded
        }, 800);
        
        return () => {
          clearTimeout(timer);
          document.removeEventListener('mousedown', handleClickOutside);
        };
      } else {
        // If already loaded before, don't show loader
        setIsLoading(false);
        
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }
  }, [isOpen, onClose, hasLoaded]);

  if (!isOpen || !article) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full p-1 z-20"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-6 pr-6">Research Article Details</h2>

            {isLoading ? (
              <PulseLoader />
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {article.author}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(article.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {article.title}
                  </h2>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Abstract</h4>
                  <p className="text-sm text-gray-600">
                    {article.abstract}
                  </p>
                </div>

                <ReferencesList 
                  studyId={article.id} 
                  referenceCount={article.referenceCount || 0}
                />
                
                {/* Chat button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleOpenChat}
                    className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Request access to this research</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SingleStudyModal;