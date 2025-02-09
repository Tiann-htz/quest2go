import React, { useRef, useEffect, useState } from 'react';
import Graph from "react-graph-vis";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import "vis-network/styles/vis-network.css";

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

const NetworkGraphModal = ({ isOpen, onClose, articles }) => {
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">References:</span>
            <span className="text-sm text-gray-900">{selectedArticle.referenceCount}</span>
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
    </AnimatePresence>
  );
};

export default NetworkGraphModal;