/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface ChatPartner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: number;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  receiver_first_name: string;
  receiver_last_name: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/check");
        const userData: any = await userResponse.json();

        if (userData.authenticated) {
          setUser(userData.user);

          // Fetch chat partners
          const partnersResponse = await fetch(
            `/api/chat/partners?userId=${userData.user.id}`
          );
          const partnersData: any = await partnersResponse.json();

          if (partnersData.success) {
            setChatPartners(partnersData.chatPartners);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for new messages
    const interval = setInterval(() => {
      if (user && selectedPartner) {
        fetchMessages(user.id, selectedPartner.id);
      }
      if (user) {
        fetchChatPartners(user.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchChatPartners = async (userId: number) => {
    try {
      const response = await fetch(`/api/chat/partners?userId=${userId}`);
      const data: any = await response.json();

      if (data.success) {
        setChatPartners(data.chatPartners);

        // Update selected partner if it exists in the new list
        if (selectedPartner) {
          const updatedPartner = data.chatPartners.find(
            (p: ChatPartner) => p.id === selectedPartner.id
          );
          if (updatedPartner) {
            setSelectedPartner(updatedPartner);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chat partners:", error);
    }
  };

  const fetchMessages = async (senderId: number, receiverId: number) => {
    try {
      const response = await fetch(
        `/api/chat/messages?senderId=${senderId}&receiverId=${receiverId}`
      );
      const data: any = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handlePartnerSelect = async (partner: ChatPartner) => {
    setSelectedPartner(partner);

    if (user) {
      await fetchMessages(user.id, partner.id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !selectedPartner) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedPartner.id,
          content: messageContent,
        }),
      });

      const data: any = await response.json();

      if (data.success) {
        // Add new message to the list
        setMessages([...messages, data.message]);
        setMessageContent("");

        // Update chat partners list to reflect the new message
        fetchChatPartners(user.id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  router.push(
                    user?.user_type === "applicant"
                      ? "/applicant/dashboard"
                      : "/expert/dashboard"
                  )
                }
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Chat Partners List */}
              <div className="border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800">Conversations</h2>
                </div>

                <div className="overflow-y-auto h-[calc(80vh-8rem)]">
                  {chatPartners.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No conversations yet
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {chatPartners.map((partner) => (
                        <li
                          key={partner.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedPartner?.id === partner.id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => handlePartnerSelect(partner)}
                        >
                          <div className="p-4 relative">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900">
                                {partner.first_name} {partner.last_name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(partner.last_message_time)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {partner.user_type === "applicant"
                                ? "Applicant"
                                : "Expert"}
                            </p>

                            {partner.unread_count > 0 && (
                              <span className="absolute top-4 right-4 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {partner.unread_count}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="col-span-2 flex flex-col h-[80vh]">
                {selectedPartner ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center">
                      <div>
                        <h2 className="font-semibold text-gray-800">
                          {selectedPartner.first_name}{" "}
                          {selectedPartner.last_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedPartner.user_type === "applicant"
                            ? "Applicant"
                            : "Expert"}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          const isCurrentUser = message.sender_id === user.id;
                          const showDate =
                            index === 0 ||
                            formatDate(messages[index - 1].created_at) !==
                              formatDate(message.created_at);

                          return (
                            <div key={message.id}>
                              {showDate && (
                                <div className="text-center text-xs text-gray-500 my-2">
                                  {formatDate(message.created_at)}
                                </div>
                              )}
                              <div
                                className={`flex ${
                                  isCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    isCurrentUser
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      isCurrentUser
                                        ? "text-blue-100"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {formatTime(message.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type a message..."
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={isSending || !messageContent.trim()}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {isSending ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="mb-2">
                        Select a conversation to start chatting
                      </p>
                      {chatPartners.length === 0 && (
                        <p className="text-sm">
                          No conversations yet. Start by reviewing CVs or
                          responding to reviews.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
