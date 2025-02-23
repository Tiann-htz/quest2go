import React, { useEffect, useRef, useState } from 'react';
import { X as XIcon, MessageCircle, MoreVertical } from "lucide-react";
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ChatWindow = ({ article, onClose, isOpen, onUpdateNotifications }) => {
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 400 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [messageMenuOpen, setMessageMenuOpen] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [adminReplies, setAdminReplies] = useState({});

    // Mobile detection effect
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) {
            const handleResize = () => {
                const isKeyboardVisible = window.innerHeight < window.outerHeight * 0.85;
                setKeyboardVisible(isKeyboardVisible);
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isMobile]);

    // Position and messages initialization effect
    useEffect(() => {
        if (chatRef.current) {
            if (isMobile) {
                setPosition({
                    x: 0,
                    y: keyboardVisible ? 0 : window.innerHeight - chatRef.current.offsetHeight
                });
            } else {
                const windowWidth = window.innerWidth;
                const chatWidth = 400; 
                const initialX = (windowWidth - chatWidth) / 2;
                const initialY = window.innerHeight - chatRef.current.offsetHeight - 40;
                setPosition({ x: initialX, y: initialY });
            }
        }
        
        if (article?.id) {
            fetchMessages();
            fetchAdminReplies();
        }
    }, [article?.id, isMobile, keyboardVisible]);

    // Scroll effect
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Drag handling effect
    useEffect(() => {
        if (!isMobile && isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', () => setIsDragging(false));
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', () => setIsDragging(false));
        };
    }, [isDragging, dragOffset, isMobile]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleMouseMove = (e) => {
        if (!isMobile && isDragging && chatRef.current) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const maxX = window.innerWidth - chatRef.current.offsetWidth;
            const maxY = window.innerHeight - chatRef.current.offsetHeight;
            setPosition({
                x: Math.min(Math.max(0, newX), maxX),
                y: Math.min(Math.max(0, newY), maxY)
            });
        }
    };

    const handleMouseDown = (e) => {
        if (!isMobile && chatRef.current && e.target.closest('.chat-header')) {
            setIsDragging(true);
            const rect = chatRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const filterValidMessages = (messages) => {
        return messages.filter(msg => {
            // Keep messages that either:
            // 1. Have actual message content from the user
            // 2. Have an admin reply
            return (msg.message && msg.message.trim() !== '') || msg.reply;
        });
    };

    useEffect(() => {
        const markAsRead = async () => {
          if (isOpen && article?.id) {
            try {
              await axios.post('/api/chat/mark-read', {
                researchId: article.id
              }, {
                withCredentials: true
              });
              
              // Call the notification update function
              if (onUpdateNotifications) {
                onUpdateNotifications();
              }
            } catch (error) {
              console.error('Failed to mark messages as read:', error);
            }
          }
        };
    
        markAsRead();
      }, [isOpen, article?.id, onUpdateNotifications]);

      
    // API functions
    const fetchMessages = async () => {
        try {
          const response = await axios.get(`/api/chat/messages/${article.id}`, {
            withCredentials: true
          });
          if (response.data.messages) {
            const filteredMessages = filterValidMessages(response.data.messages);
            setMessages(filteredMessages);
            
            // Update notification count after receiving new messages
            if (onUpdateNotifications) {
              onUpdateNotifications();
            }
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err);
          setError('Failed to load messages');
        }
      };

    // New function to fetch admin replies
    const fetchAdminReplies = async () => {
        try {
            const response = await axios.get(`/api/chat/admin-replies/${article.id}`, {
                withCredentials: true
            });
            if (response.data.replies) {
                // Convert array to object with message ID as key
                const repliesMap = {};
                response.data.replies.forEach(reply => {
                    repliesMap[reply.chat_id] = reply.replies;
                });
                setAdminReplies(repliesMap);
            }
        } catch (err) {
            console.error('Failed to fetch admin replies:', err);
           
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        
        setIsSending(true);
        setError('');
        
        try {
            const response = await axios.post('/api/chat/send', {
                research_id: article.id,
                message: message.trim(),
                timestamp: new Date().toISOString() 
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                const newMessage = {
                    id: response.data.chatId,
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                    isCurrentUser: true
                };
                setMessages(prev => [...prev, newMessage]);
                setMessage('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleEditMessage = async (messageId, newText) => {
        try {
            await axios.post('/api/chat/edit', {
                chatId: messageId,
                message: newText
            }, {
                withCredentials: true
            });
            
            setMessages(messages.map(msg => 
                msg.id === messageId ? { ...msg, message: newText } : msg
            ));
            setEditingMessage(null);
        } catch (error) {
            setError('Failed to edit message');
            console.error('Edit error:', error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/chat/message/${messageId}`, {
                withCredentials: true
            });
            
            setMessages(messages.filter(msg => msg.id !== messageId));
            setDeleteConfirmOpen(false);
            setMessageToDelete(null);
        } catch (error) {
            setError('Failed to delete message');
            console.error('Delete error:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTimestamp = (timestamp) => {
        // Create a date object that correctly interprets the timestamp as Manila time
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-PH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        });
    };

    const getChatWindowStyles = () => {
        if (isMobile) {
            return {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                top: keyboardVisible ? 0 : 'auto',
                height: keyboardVisible ? '100%' : '80vh',
                width: '100%',
                transform: 'none',
                borderRadius: keyboardVisible ? '0' : '12px 12px 0 0'
            };
        }

        return {
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'none'
        };
    };

    // Message component
    const Message = ({ msg }) => {
        const [editText, setEditText] = useState(msg.message);
        const isEditing = editingMessage === msg.id;
        const hasReply = adminReplies[msg.id];
        
        // Skip rendering if there's no message content and no reply
        if (!msg.message && !hasReply) {
            return null;
        }

        return (
            <div className="space-y-2">
                {/* Only render the user message if it has content */}
                {msg.message && msg.message.trim() !== '' && (
                    <div className="flex justify-end group">
                        {!isEditing && (
                            <button
                                onClick={() => setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id)}
                                className="relative top-2 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                            >
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                            </button>
                )}
                    
                    <div className="relative max-w-[80%] rounded-lg p-3 bg-indigo-600 text-white">
                        {messageMenuOpen === msg.id && (
                            <div className="absolute left-0 top-0 mt-8 w-32 bg-white rounded-lg shadow-lg py-1 z-10">
                                <button
                                    onClick={() => {
                                        setEditingMessage(msg.id);
                                        setMessageMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setMessageToDelete(msg.id);
                                        setDeleteConfirmOpen(true);
                                        setMessageMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                >
                                    Delete
                                </button>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 text-sm text-gray-900 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows="2"
                                />
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setEditingMessage(null)}
                                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleEditMessage(msg.id, editText)}
                                        className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                            <p className="text-sm">{msg.message}</p>
                                    <p className="text-xs mt-1 text-indigo-200">
                                        {formatTimestamp(msg.timestamp)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Display admin reply if available */}
                {hasReply && !isEditing && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                            <p className="text-sm">{adminReplies[msg.id]}</p>
                            <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500 mr-2">Admin</span>
                                <span className="text-xs text-gray-400">
                                    {msg.replyTimestamp ? formatTimestamp(msg.replyTimestamp) : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
        

    if (!isOpen) return null;

    return (
        <>
            <div 
                ref={chatRef}
                style={getChatWindowStyles()}
                className={`bg-white shadow-xl z-50 flex flex-col ${
                    isMobile ? 'w-full' : 'w-96'  
                }`}
                onMouseDown={!isMobile ? handleMouseDown : undefined}
            >
                <div className={`chat-header bg-indigo-600 text-white p-3 flex justify-between items-center ${
                    isMobile ? '' : 'cursor-move rounded-t-lg'
                }`}>
                    <h3 className="text-sm font-medium truncate flex-1 pr-2">
                        {article.title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-white hover:bg-indigo-700 rounded-full p-1"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
                
                <div className={`p-4 overflow-y-auto bg-gray-50 ${
                    isMobile ? 'flex-grow' : 'h-96' 
                }`}>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageCircle className="h-12 w-12 text-indigo-200 mb-2" />
                            <p className="text-center text-sm mb-4">
                                Send a message to request access to this research
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <Message key={msg.id} msg={msg} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                
                <div className={`border-t border-gray-200 p-3 bg-white ${
                    keyboardVisible ? 'sticky bottom-0' : ''
                }`}>
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows="2"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isSending || !message.trim()}
                            className={`absolute right-2 bottom-2 p-1.5 text-white rounded-full transition-colors ${
                                isSending || !message.trim() 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {isSending ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteConfirmOpen(false);
                            setMessageToDelete(null);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteMessage(messageToDelete)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ChatWindow;