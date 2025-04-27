import React, { useRef, useEffect, useState } from 'react';
import Graph from "react-graph-vis";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, 
  ExternalLink, MessageCircle, X, Info, ZoomIn, ZoomOut, Home
} from "lucide-react";
import axios from 'axios';
import "vis-network/styles/vis-network.css";
import ChatWindow from './ChatWindow';

// Loader component with subtle animation
const PulseLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[600px]">
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-indigo-500/30 animate-ping absolute"></div>
        <div className="w-16 h-16 rounded-full bg-indigo-600 relative flex items-center justify-center">
          <span className="text-white font-medium">Loading</span>
        </div>
      </div>
      <p className="text-indigo-700 font-medium mt-4 animate-pulse">Building network graph...</p>
    </div>
  </div>
);

// References list component with improved styling
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
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-200"
      >
        <span>References: {referenceCount}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {references.map((ref) => (
                  <div key={ref.reference_id} className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 hover:border-indigo-300 transition-colors duration-200">
                    <a
                      href={ref.reference_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <span className="truncate">{ref.reference_link}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                    <div 
                      className="text-sm text-gray-600 mt-1.5 truncate group relative"
                      title={ref.reference_details}
                    >
                      {ref.reference_details}
                      <div className="hidden group-hover:block absolute left-0 top-full mt-2 p-3 bg-white border rounded-lg shadow-lg z-10 max-w-md text-xs leading-relaxed">
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [networkInstance, setNetworkInstance] = useState(null);
  
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

  // Empty state handler
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
          className="bg-white rounded-lg shadow-xl p-6 max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full p-1 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Info className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Articles Available</h2>
            <p className="text-gray-600 text-center mb-6">There are no articles to display in the network graph.</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-md"
            >
              Close
            </button>
          </div>
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
            color: {
              color: '#ddd6fe',  // Light purple
              highlight: '#a78bfa', // Medium purple
              hover: '#8b5cf6'    // Darker purple
            },
            width: 2,
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

  // Generate colors based on category
  const getCategoryColor = (category) => {
    // Simple hash function for consistent colors per category
    const hash = category.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Map to color range within indigo/purple spectrum for coherent design
    const hue = ((hash % 60) + 230) % 360; // Range between 230-290 (blue-purple)
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Prepare data for the network graph
  const graph = {
    nodes: sortedArticles.map((article) => {
      const date = new Date(article.date).getTime();
      
      // Truncate author name if longer than 12 characters
      const truncatedAuthor = article.author.length > 12 
        ? article.author.substring(0, 10) + '...' 
        : article.author;
      
      const yPosition = -((date - minDate) / dateRange) * 500;
      const xPosition = (Math.random() - 0.5) * 400;
      
      // Base size on a combination of factors for visual interest
      const categoryFactor = article.category.length % 3 + 1;
      const randomFactor = Math.random() * 0.4 + 0.8;  // 0.8 to 1.2
      const nodeSize = 15 + (categoryFactor * 5 * randomFactor);
      
      // Generate color based on article category
      const backgroundColor = getCategoryColor(article.category);

      return {
        id: article.id,
        label: truncatedAuthor,
        title: `${article.title}\nAuthor: ${article.author}\nCategory: ${article.category}`,
        x: xPosition,
        y: yPosition,
        fixed: {
          y: true
        },
        font: {
          size: 11,
          color: '#1f2937',
          face: 'Inter, Arial, sans-serif',
          multi: true,
          align: 'center',
          vadjust: -10
        },
        size: nodeSize,
        value: nodeSize,
        color: {
          background: backgroundColor,
          border: backgroundColor,
          highlight: {
            background: '#c4b5fd',
            border: '#8b5cf6'
          },
          hover: {
            background: '#a78bfa',
            border: '#7c3aed'
          }
        },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 10,
          x: 0,
          y: 4
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
      scaling: {
        min: 10,
        max: 15,
        label: {
          enabled: true,
          min: 12,
          max: 18
        }
      },
      font: {
        color: '#1f2937',
        size: 12,
        face: 'Inter, Arial, sans-serif',
        vadjust: -8
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      width: 1.5,
      selectionWidth: 2,
      smooth: {
        enabled: true,
        type: 'continuous',
        roundness: 0.5
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.5
        }
      }
    },
    height: '600px',
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        iterations: 100,
        updateInterval: 50
      },
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.1,
        springLength: 150,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true,
      dragView: true,
      navigationButtons: false,
      keyboard: true
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

  // Handle zoom controls
  const handleZoomIn = () => {
    if (networkInstance) {
      const newZoom = zoomLevel * 1.2;
      networkInstance.moveTo({ scale: newZoom });
      setZoomLevel(newZoom);
    }
  };
  
  const handleZoomOut = () => {
    if (networkInstance) {
      const newZoom = zoomLevel * 0.8;
      networkInstance.moveTo({ scale: newZoom });
      setZoomLevel(newZoom);
    }
  };
  
  const handleResetView = () => {
    if (networkInstance) {
      networkInstance.fit({
        animation: {
          duration: 800,
          easingFunction: 'easeInOutQuad'
        }
      });
      setZoomLevel(1);
    }
  };

  const DetailPanel = () => (
    <div className="h-full overflow-y-auto p-1">
      {selectedArticle ? (
        <div className="space-y-5">
          <div className="bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-indigo-900">
                {selectedArticle.author}
              </h3>
              <span className="text-sm text-gray-500 font-medium">
                {new Date(selectedArticle.date).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                {selectedArticle.category}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {selectedArticle.title}
            </h2>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Abstract</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {selectedArticle.abstract}
            </p>
          </div>

          <ReferencesList 
            studyId={selectedArticle.id} 
            referenceCount={selectedArticle.referenceCount}
          />
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleOpenChat(selectedArticle)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors duration-200 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-full"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Request access to this research</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
          <Info className="h-8 w-8 mb-2 text-indigo-300" />
          <p>Select a node to view article details</p>
          <p className="text-sm text-gray-400 mt-2">Click on any circle in the graph to explore research details</p>
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
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 modal-backdrop"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-7xl h-[85vh] flex flex-col md:flex-row relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 rounded-full p-2 hover:bg-gray-100 transition-colors duration-200 z-20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Mobile Navigation Buttons */}
            <div className="md:hidden absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
              {showDetailPanel ? (
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
              ) : selectedArticle && (
                <button
                  onClick={() => setShowDetailPanel(true)}
                  className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <ChevronRight className="h-6 w-6 text-gray-600" />
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
              h-full relative
            `}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Research Articles Network</h2>
              <div className="h-[calc(100%-2rem)] border rounded-lg bg-gray-50 relative">
                {isLoading ? (
                  <PulseLoader />
                ) : (
                  <>
                    <Graph
                      graph={graph}
                      options={options}
                      events={events}
                      getNetwork={network => {
                        setNetworkInstance(network);
                        network.fit({
                          animation: true
                        });
                      }}
                    />
                    
                    {/* Zoom controls inside the graph area */}
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md flex flex-col">
                      <button
                        onClick={handleZoomIn}
                        className="p-2 hover:bg-gray-100 text-gray-700 transition-colors duration-200 rounded-t-lg"
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <div className="h-px bg-gray-200"></div>
                      <button
                        onClick={handleResetView}
                        className="p-2 hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                        title="Reset view"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                      <div className="h-px bg-gray-200"></div>
                      <button
                        onClick={handleZoomOut}
                        className="p-2 hover:bg-gray-100 text-gray-700 transition-colors duration-200 rounded-b-lg"
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md opacity-80 hover:opacity-100 transition-opacity duration-200 text-xs">
                      <div className="font-medium mb-1.5">Network Legend</div>
                      <div className="flex items-center mb-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-indigo-600 mr-2"></span>
                        <span>Research Articles</span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block w-6 h-0.5 bg-indigo-300 mr-2"></span>
                        <span>Category Relationships</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Chat windows are rendered by the parent component */}
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