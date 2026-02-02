
export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio?: string;
  avatar?: string;
  cover_image?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  following_count?: number;
}


export interface UserProfile {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string | null;
  bio: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  email?: string;
  gender?: string;
  website?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPost {
  _id: string;
  caption: string;
  image: string | null;
  video: string | null;
  mediaType: "image" | "video";
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  username: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  code: string;
}


export interface Post {
  id: string;
  user_id: string;
  user?: User;
  content: string;
  images?: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface CreatePostRequest {
  content: string;
  images?: File[];
}

export interface UpdatePostRequest {
  content: string;
}


export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  content: string;
  like_count: number;
  reply_count: number;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}


export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}


export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  post?: Post;
  created_at: string;
}


export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}


export interface Conversation {
  id: string;
  user_id: string;
  other_user_id: string;
  other_user?: User;
  last_message?: Message;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image?: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateMessageRequest {
  conversation_id: string;
  content: string;
  image?: File;
}


export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}


export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}


export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "follow" | "message";
  actor_id: string;
  actor?: User;
  post_id?: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
}


export interface SearchResult {
  users: User[];
  posts: Post[];
}


export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status: number;
}


export interface Reply {
  _id: string;
  userId: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export interface CommentData {
  _id: string;
  userId: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  repliesCount?: number;
}

export interface CommentModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onSave: () => void;
}

export interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete: () => void;
  onReport?: () => void;
  type?: "post" | "comment";
}
