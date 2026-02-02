import { create } from "zustand";
import type { Post } from "@/types";

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  setPosts: (posts: Post[]) => void;
  appendPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;
  deletePost: (postId: string) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  setPosts: (posts) => set({ posts }),
  appendPosts: (posts) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
    })),
  updatePost: (post) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? post : p)),
    })),
  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
  reset: () =>
    set({
      posts: [],
      isLoading: false,
      hasMore: true,
      page: 1,
    }),
}));
