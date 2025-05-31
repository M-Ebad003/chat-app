import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  allMessages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await axiosInstance.get("/message/users");
      set({ users: response?.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getAllMessages: async () => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/message`);
      set({ allMessages: response?.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/message/${userId}`);
      set({ messages: response?.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessages: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const response = await axiosInstance.post(
        `/message/send/${selectedUser?._id}`,
        messageData
      );
      set({ messages: [...messages, response?.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  deleteMessages: async (messageId) => {
    const { authUser } = useAuthStore.getState();
    try {
      const response = await axiosInstance.delete(
        `/message/delete/${messageId}`
      );

      if (response?.data?.success) {
        toast.success(response?.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  },
  removeMessageForMe: (messageId) => {
    set({
      messages: get().messages.filter((msg) => msg._id !== messageId),
    });
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();

    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser?._id) return;
      set({
        messages: [...get().messages, newMessage],
      });
    });
    socket.on("messageSeen", (updatedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, isSeen: true } : msg
        ),
      });
    });
    socket.on("messageDeleted", (deletedMessageId) => {
      set({
        messages: get().messages.filter(
          (message) => message._id !== deletedMessageId
        ),
      });
    });
  },
  unSubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
