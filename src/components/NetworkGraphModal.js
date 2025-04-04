import React, { useRef, useEffect, useState } from 'react';
import Graph from "react-graph-vis";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, MessageCircle, X as XIcon } from "lucide-react";
import axios from 'axios';
import "vis-network/styles/vis-network.css";
import ChatWindow from './ChatWindow';

const PulseLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[600px]">
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

const NetworkGraphModal = ({ isOpen, onClose, articles, activeChatWindows, onOpenChat, onCloseChat }) => {
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const handleOpenChat = (article) => {
    onOpenChat(article);
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
        }, articles.length > 0 ? 1500 : 0);
        
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
  }, [isOpen, onClose, articles.length, hasLoaded]);

  if (!isOpen) return null;

  if (articles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 max-w-md relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full p-1"
          >
            <XIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-bold mb-4">No Articles Available</h2>
          <p className="text-gray-600">There are no articles to display in the network graph.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Sort articles by date in descending order
  const sortedArticles = [...articles].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate date range boundaries
  const maxDate = new Date(sortedArticles[0].date).getTime();
  const minDate = new Date(sortedArticles[sortedArticles.length - 1].date).getTime();
  const dateRange = maxDate - minDate;

  // Create edges based on chronological order and categories
  const createEdges = () => {
    const edges = [];
    const edgeSet = new Set();

    for (let i = 0; i < sortedArticles.length; i++) {
      for (let j = i + 1; j < sortedArticles.length; j++) {
        const edgeId = `${sortedArticles[i].id}-${sortedArticles[j].id}`;
        if (!edgeSet.has(edgeId) && sortedArticles[i].category === sortedArticles[j].category) {
          edges.push({
            id: edgeId,
            from: sortedArticles[i].id,
            to: sortedArticles[j].id,
            arrows: 'to',
            smooth: {
              type: 'curvedCW',
              roundness: 0.2
            }
          });
          edgeSet.add(edgeId);
        }
      }
    }
    return edges;
  };

  // Prepare data for the network graph
  const graph = {
    nodes: sortedArticles.map((article) => {
      const year = new Date(article.date).getFullYear();
      const date = new Date(article.date).getTime();
      
      const yPosition = -((date - minDate) / dateRange) * 500;
      const xPosition = (Math.random() - 0.5) * 300;

      return {
        id: article.id,
        label: `${article.author}\n${year}`,
        title: article.title,
        x: xPosition,
        y: yPosition,
        fixed: {
          y: true
        },
        font: {
          size: 14,
          multi: true,
          align: 'center'
        }
      };
    }),
    edges: createEdges()
  };

  const options = {
    layout: {
      hierarchical: {
        enabled: false
      }
    },
    nodes: {
      shape: 'dot',
      size: 20,
      color: {
        background: '#4f46e5',
        border: '#3730a3',
        highlight: {
          background: '#6366f1',
          border: '#4f46e5'
        }
      },
      font: {
        color: '#1f2937',
        size: 14,
        face: 'Arial'
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      color: {
        color: '#9ca3af',
        highlight: '#6b7280'
      },
      width: 2
    },
    height: '600px',
    physics: {
      enabled: true,
      stabilization: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -50,
        springLength: 200,
        springConstant: 0.01
      },
      stabilization: {
        enabled: true,
        iterations: 200
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200
    }
  };

  const events = {
    select: function(event) {
      const { nodes } = event;
      if (nodes.length > 0) {
        const selected = articles.find(article => article.id === nodes[0]);
        setSelectedArticle(selected);
        // Auto-show detail panel on mobile when node is selected
        if (window.innerWidth < 768) {
          setShowDetailPanel(true);
        }
      }
    }
  };

  const DetailPanel = () => (
    <div className="h-full overflow-y-auto">
      {selectedArticle ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedArticle.author}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(selectedArticle.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedArticle.title}
            </h2>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Abstract</h4>
            <p className="text-sm text-gray-600">
              {selectedArticle.abstract}
            </p>
          </div>

          <ReferencesList 
            studyId={selectedArticle.id} 
            referenceCount={selectedArticle.referenceCount}
          />
          
          {/* Add the Chat button after the ReferencesList */}
          <div className="mt-4 pt-4 border-t border-gray-200">
          <button
              onClick={() => handleOpenChat(selectedArticle)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Request access to this research</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a node to view article details
        </div>
      )}
    </div>
  );
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-7xl h-[80vh] flex flex-col md:flex-row relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full p-1 z-20"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {/* Mobile Navigation Buttons */}
            <div className="md:hidden absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
              {showDetailPanel ? (
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
              ) : selectedArticle && (
                <button
                  onClick={() => setShowDetailPanel(true)}
                  className="bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                </button>
              )}
            </div>

            {/* Article Details Panel - Hidden by default on mobile */}
            <div className={`
              md:w-1/3 md:pr-6 md:border-r md:border-gray-200
              ${showDetailPanel ? 'block' : 'hidden md:block'}
              h-full
            `}>
              <DetailPanel />
            </div>

            {/* Network Graph - Hidden when detail panel is shown on mobile */}
            <div className={`
              flex-1 md:pl-6
              ${showDetailPanel ? 'hidden md:block' : 'block'}
              h-full
            `}>
              <h2 className="text-xl font-bold mb-4">Research Articles Network Graph</h2>
              <div className="h-[calc(100%-2rem)] border rounded-lg bg-gray-50">
                {isLoading ? (
                  <PulseLoader />
                ) : (
                  <Graph
                    graph={graph}
                    options={options}
                    events={events}
                    getNetwork={network => {
                      network.fit();
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {showChatWindow && selectedArticle && (
        <ChatWindow 
          key={`chat-${selectedArticle.id}`}
          article={selectedArticle} 
          onClose={() => setShowChatWindow(false)} 
          isOpen={showChatWindow}
        />
      )}
    </AnimatePresence>
  );
};

export default NetworkGraphModal;