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

const ChatWindow = ({ article, onClose, isOpen }) => {
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
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chatRef.current) {
            const windowWidth = window.innerWidth;
            const chatWidth = 320;
            const initialX = (windowWidth - chatWidth) / 2;
            const initialY = window.innerHeight - chatRef.current.offsetHeight - 40;
            setPosition({ x: initialX, y: initialY });
        }
        
        if (article?.id) {
            fetchMessages();
        }
    }, [article?.id]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`/api/chat/messages/${article.id}`, {
                withCredentials: true
            });
            if (response.data.messages) {
                setMessages(response.data.messages);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages');
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging && chatRef.current) {
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

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e) => {
        if (chatRef.current && e.target.closest('.chat-header')) {
            setIsDragging(true);
            const rect = chatRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        
        setIsSending(true);
        setError('');
        
        try {
            const response = await axios.post('/api/chat/send', {
                research_id: article.id,
                message: message.trim()
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                // Add the new message to the messages array
                const newMessage = {
                    id: response.data.chatId,
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                    isCurrentUser: true
                };
                setMessages(prev => [...prev, newMessage]);
                await fetchMessages();
                setMessage('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const Message = ({ msg }) => {
        const [editText, setEditText] = useState(msg.message);
        const isEditing = editingMessage === msg.id;

        return (
            <div className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
                {msg.isCurrentUser && !isEditing && (
                    <button
                        onClick={() => setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id)}
                        className="relative top-2 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                    >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                )}
                
                <div className={`relative max-w-[80%] rounded-lg p-3 ${
                    msg.isCurrentUser 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-gray-200'
                }`}>
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
                            <p className={`text-xs mt-1 ${msg.isCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {formatTimestamp(msg.timestamp)}
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                ref={chatRef}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'none'
                }}
                className="w-80 bg-white rounded-lg shadow-xl z-50 flex flex-col"
                onMouseDown={handleMouseDown}
            >
                <div className="chat-header bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center cursor-move">
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
                
                <div className="p-4 h-80 overflow-y-auto bg-gray-50">
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
                        <div className="space-y-3">
                            {messages.map((msg) => (
                                <Message key={msg.id} msg={msg} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                
                <div className="border-t border-gray-200 p-3 bg-white">
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
