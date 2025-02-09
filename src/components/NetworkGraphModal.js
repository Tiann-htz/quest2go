import React, { useRef, useEffect, useState } from 'react';
import Graph from "react-graph-vis";

// We need to include the vis network css
import "vis-network/styles/vis-network.css";

const PulseLoader = () => (
  <div className="flex items-center justify-center h-96">
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-indigo-600 animate-ping absolute inline-flex"></div>
      <div className="w-12 h-12 rounded-full bg-indigo-600 relative inline-flex">
        <span className="animate-pulse absolute inset-0 inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
      </div>
    </div>
  </div>
);

const NetworkGraphModal = ({ isOpen, onClose, articles }) => {
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate positions based on dates
  const maxDate = new Date(sortedArticles[0].date).getTime();
  const minDate = new Date(sortedArticles[sortedArticles.length - 1].date).getTime();
  const dateRange = maxDate - minDate;

  // Prepare data for the network graph
  const graph = {
    nodes: sortedArticles.map((article, index) => {
      const year = new Date(article.date).getFullYear();
      const date = new Date(article.date).getTime();
      
      // Calculate y position based on date (0 at top, -500 at bottom)
      const yPosition = -((date - minDate) / dateRange) * 500;
      
      // Calculate x position with some randomness for natural spread
      const xPosition = (Math.random() - 0.5) * 300;

      return {
        id: article.id,
        label: `${article.author}\n${year}`,
        title: article.title,
        x: xPosition,
        y: yPosition,
        fixed: {
          y: true // Fix Y position to maintain date-based ordering
        },
        font: {
          size: 14,
          multi: true,
          align: 'center'
        }
      };
    }),
    edges: sortedArticles.slice(1).map((article, index) => ({
      from: sortedArticles[index].id,
      to: article.id,
      arrows: 'to',
      smooth: {
        type: 'curvedCW',
        roundness: 0.2
      }
    }))
  };

  const options = {
    layout: {
      hierarchical: {
        enabled: false // Disable hierarchical layout
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
    height: '400px',
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
      const { nodes, edges } = event;
      if (nodes.length > 0) {
        const selectedArticle = articles.find(article => article.id === nodes[0]);
        console.log('Selected article:', selectedArticle);
      }
    },
    stabilizationIterationsDone: function() {
      console.log('Graph stabilized');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Research Articles Network Graph</h2>
        <div className="h-96 border rounded-lg bg-gray-50">
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
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NetworkGraphModal;