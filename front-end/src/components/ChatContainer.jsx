import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useRef } from "react";
import { CheckCheckIcon, CheckIcon } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unSubscribeFromMessages,
    deleteMessages,
    removeMessageForMe,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const messageRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    if (!socket || !messages || !authUser) return;

    messages.forEach((message) => {
      // If the message is received and not seen, emit "messageSeen"
      if (message?.receiverId === authUser?._id && !message.isSeen) {
        socket.emit("messageSeen", {
          messageId: message._id,
          receiverId: authUser._id,
        });
      }
    });
  }, [messages, authUser, socket]);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unSubscribeFromMessages();
  }, [
    selectedUser._id,
    subscribeToMessages,
    unSubscribeFromMessages,
    getMessages,
  ]);

  console.log({ onlineUsers });

  const onDeleteMessage = async (messageId) => {
    await deleteMessages(messageId);
  };

  useEffect(() => {
    if (messages && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1  flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }
  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            ref={messageRef}
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser?._id
                      ? authUser?.profilePic
                      : selectedUser.profilePic || "/username.png"
                  }
                  alt=""
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="flex flex-row items-center">
              <div className="relative mr-2">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === message._id ? null : message._id
                    )
                  }
                  className="p-1 rounded hover:bg-gray-200"
                  title="Options"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === message._id && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-10">
                    <button
                      onClick={() => {
                        if (message.senderId !== authUser._id) {
                          removeMessageForMe(message._id);
                          setOpenDropdown(null);
                          return;
                        }
                        onDeleteMessage(message._id);
                        setOpenDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                    >
                      {message.senderId !== authUser._id
                        ? "Delete for me"
                        : "Delete for everyone"}
                    </button>
                  </div>
                )}
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {message.text && (
                  <p className="flex flex-row items-center gap-1">
                    {message.text}{" "}
                    {message.senderId === authUser._id && (
                      <>
                        {message.isSeen ? (
                          <CheckCheckIcon className="text-blue-500 size-4" />
                        ) : onlineUsers.includes(selectedUser._id) ? (
                          <CheckCheckIcon className="size-4" />
                        ) : (
                          <CheckIcon className="size-4" />
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
