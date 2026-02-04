import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Grid3x3, Bookmark, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/services/axios";
import {
  useCurrentUserProfileQuery,
  useUserByIdQuery,
} from "@/hooks/useUserQuery";
import FollowListModal from "@/components/common/FollowListModal";
import EditProfileModal from "@/components/common/EditProfileModal";
import ChangePasswordModal from "@/components/common/ChangePasswordModal";
import CommentModal from "@/components/common/CommentModal";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post } from "@/types";
import { useNavigate } from "react-router-dom";

type TabType = "posts" | "saved" | "video";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const queryClient = useQueryClient();

  const [followListModal, setFollowListModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
  }>({ isOpen: false, type: "followers" });

  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const { data: currentUser } = useCurrentUserProfileQuery();

  const isOwnProfile = !userId || currentUser?._id === userId;
  const profileUserId = userId || currentUser?._id || "";

  const { data: otherUserProfile, refetch: refetchProfile } =
    useUserByIdQuery(profileUserId);

  const profile = isOwnProfile
    ? otherUserProfile || currentUser
    : otherUserProfile;

  const isLoading = !profile;

  const [isFollowingLocal, setIsFollowingLocal] = useState(false);
  const [followersCountLocal, setFollowersCountLocal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setIsFollowingLocal(!!profile.isFollowing);
      setFollowersCountLocal(profile.followersCount || 0);
    }
  }, [profile]);

  const getFilterParam = () => {
    switch (activeTab) {
      case "saved":
        return "saved";
      case "video":
        return "video";
      default:
        return "all";
    }
  };

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", profileUserId, activeTab],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/posts/user/${profileUserId}`, {
        params: { filter: getFilterParam() },
      });
      return res.data.data;
    },
    enabled: !!profileUserId,
  });

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      if (isFollowingLocal) {
        await axiosInstance.delete(`/api/follow/${userId}/follow`);
        setIsFollowingLocal(false);
        setFollowersCountLocal((prev) => Math.max(prev - 1, 0));
        toast.success("Đã bỏ theo dõi");
      } else {
        await axiosInstance.post(`/api/follow/${userId}/follow`);
        setIsFollowingLocal(true);
        setFollowersCountLocal((prev) => prev + 1);
        toast.success("Đã theo dõi");
      }
      await refetchProfile();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditProfileSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    queryClient.invalidateQueries({ queryKey: ["user", profileUserId] });
  };

  const handleDeleteProfilePicture = async () => {
    try {
      await axiosInstance.delete("/api/users/profile/picture");
      toast.success("Xóa ảnh đại diện thành công");
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["user", profileUserId] });
    } catch (error) {
      console.error(error);
      toast.error("Xóa ảnh đại diện thất bại");
    }
  };

  const handlePostClick = async (postId: string) => {
    try {
      setIsLoadingPost(true);
      const res = await axiosInstance.get(`/api/posts/${postId}`);
      const fullPost = res.data.data;

      const transformedPost: Post = {
        id: fullPost._id,
        user: {
          id: fullPost.userId._id,
          username: fullPost.userId.username,
          avatar: fullPost.userId.profilePicture
            ? getMediaUrl(fullPost.userId.profilePicture)
            : null,
        },
        content: fullPost.caption || "",
        images: fullPost.image ? [getMediaUrl(fullPost.image)] : [],
        video: fullPost.video ? getMediaUrl(fullPost.video) : null,
        like_count: fullPost.likes || 0,
        comment_count: fullPost.comments || 0,
        is_liked: fullPost.isLiked || false,
        is_saved: fullPost.isSaved || false,
        created_at: fullPost.createdAt,
      };

      setSelectedPost(transformedPost);
      setShowComments(true);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      toast.error("Không thể tải bài viết");
    } finally {
      setIsLoadingPost(false);
    }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;

    try {
      if (selectedPost.is_liked) {
        await axiosInstance.delete(`/api/posts/${selectedPost.id}/like`);
      } else {
        await axiosInstance.post(`/api/posts/${selectedPost.id}/like`);
      }

      setSelectedPost({
        ...selectedPost,
        is_liked: !selectedPost.is_liked,
        like_count: selectedPost.is_liked
          ? selectedPost.like_count - 1
          : selectedPost.like_count + 1,
      });

      queryClient.invalidateQueries({
        queryKey: ["userPosts", profileUserId, activeTab],
      });
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;

    try {
      if (selectedPost.is_saved) {
        await axiosInstance.delete(`/api/posts/${selectedPost.id}/save`);
      } else {
        await axiosInstance.post(`/api/posts/${selectedPost.id}/save`);
      }

      setSelectedPost({
        ...selectedPost,
        is_saved: !selectedPost.is_saved,
      });

      queryClient.invalidateQueries({
        queryKey: ["userPosts", profileUserId, activeTab],
      });
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const handleCloseFollowListModal = async () => {
    setFollowListModal({ ...followListModal, isOpen: false });

    const { data } = await refetchProfile();
    if (data) {
      setIsFollowingLocal(!!data.isFollowing);
      setFollowersCountLocal(data.followersCount || 0);
    }
  };

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Không tìm thấy người dùng</p>
      </div>
    );
  }

  const posts = postsData?.posts || [];
  const postsCount = postsData?.total || 0;

  return (
    <div className="w-full flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-start gap-8 md:gap-16 mb-11">
          <div className="flex-shrink-0">
            {profile.profilePicture ? (
              <img
                src={getMediaUrl(profile.profilePicture)}
                alt={profile.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center">
                <span className="text-5xl font-semibold text-black uppercase">
                  {profile.username[0]}
                </span>
              </div>
            )}
            {isOwnProfile && profile.profilePicture && (
              <button
                onClick={handleDeleteProfilePicture}
                className="text-center px-4 h-8 cursor-pointer w-full mt-4 bg-[#363636] hover:bg-[#262626] rounded-lg text-sm"
              >
                Xóa ảnh đại diện
              </button>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{profile.username}</h1>
            <p className="text-xl mb-2">{profile.fullName}</p>

            <div className="flex items-center gap-10 mb-5 text-base">
              <div>
                <span className="font-semibold">{postsCount}</span>
                <span className="ml-1">bài viết</span>
              </div>

              <button
                onClick={() =>
                  setFollowListModal({ isOpen: true, type: "followers" })
                }
                className="hover:text-gray-300 cursor-pointer"
              >
                <span className="font-semibold">{followersCountLocal}</span>
                <span className="ml-1">người theo dõi</span>
              </button>

              <button
                onClick={() =>
                  setFollowListModal({ isOpen: true, type: "following" })
                }
                className="hover:text-gray-300 cursor-pointer"
              >
                <span>Đang theo dõi </span>
                <span className="font-semibold">
                  {profile.followingCount || 0}
                </span>
                <span className="ml-1">người dùng</span>
              </button>
            </div>

            {profile.bio && <p className="text-sm">{profile.bio}</p>}
          </div>
        </div>

        {isOwnProfile ? (
          <div className="flex gap-2 mb-10">
            <Button
              variant="secondary"
              className="bg-[#363636] hover:bg-[#262626] text-white px-4 h-8 rounded-lg flex-1 cursor-pointer"
              onClick={() => setEditProfileModal(true)}
            >
              Chỉnh sửa trang cá nhân
            </Button>

            <Button
              variant="secondary"
              className="bg-[#363636] hover:bg-[#262626] text-white px-4 h-8 rounded-lg flex-1 cursor-pointer"
              onClick={() => setChangePasswordModal(true)}
            >
              Đổi mật khẩu
            </Button>
          </div>
        ) : (
          <div className="mb-10">
            {isFollowingLocal ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollowToggle}
                  className="bg-[#363636] hover:bg-[#262626] text-white font-semibold px-6 h-8 rounded-lg flex-1 cursor-pointer"
                >
                  Đang theo dõi
                </Button>

                <Button
                  variant="secondary"
                  className="bg-[#363636] hover:bg-[#262626] text-white font-semibold px-4 h-8 rounded-lg flex-1 cursor-pointer"
                  onClick={async () => {
                    try {
                      const res = await axiosInstance.post(
                        "/api/messages/conversations",
                        {
                          userId: profileUserId,
                        },
                      );

                      const conversation = res.data.data;

                      navigate("/chat", {
                        state: {
                          conversationId: conversation._id,
                        },
                      });
                    } catch (err) {
                      console.error(err);
                      toast.error("Không thể mở cuộc trò chuyện");
                    }
                  }}
                >
                  Gửi tin nhắn
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleFollowToggle}
                className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold w-full h-8 rounded-lg cursor-pointer"
              >
                Theo dõi
              </Button>
            )}
          </div>
        )}

        <div className="border-t border-gray-700">
          <div className="flex items-center justify-center gap-12">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 py-4 text-xs font-semibold tracking-widest border-t cursor-pointer ${
                activeTab === "posts"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Grid3x3 className="w-3 h-3" />
              BÀI VIẾT
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 py-4 text-xs font-semibold tracking-widest border-t cursor-pointer ${
                activeTab === "saved"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Bookmark className="w-3 h-3" />
              ĐÃ LƯU
            </button>

            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-2 py-4 text-xs font-semibold tracking-widest border-t cursor-pointer ${
                activeTab === "video"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Play className="w-3 h-3" />
              VIDEO
            </button>
          </div>
        </div>

        <div className="py-8">
          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-2xl mb-2">
                {activeTab === "saved"
                  ? "Chưa có bài viết nào được lưu"
                  : activeTab === "video"
                    ? "Chưa có video nào"
                    : "Chưa có bài viết nào"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post: any) => (
                <div
                  key={post._id}
                  onClick={() => handlePostClick(post._id)}
                  className="relative aspect-square bg-gray-800 group cursor-pointer"
                >
                  {post.mediaType === "video" ? (
                    <>
                      <video
                        src={getMediaUrl(post.video)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <svg
                          className="w-6 h-6 text-white drop-shadow-lg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462Z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img
                      src={getMediaUrl(post.image)}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <svg className="w-7 h-7 fill-current" viewBox="0 0 48 48">
                        <path d="M34.6 6.1c5.7 0 10.4 5.2 10.4 11.5 0 6.8-5.9 11-11.5 16S25 41.3 24 41.9c-1.1-.7-4.7-4-9.5-8.3-5.7-5-11.5-9.2-11.5-16C3 11.3 7.7 6.1 13.4 6.1c4.2 0 6.5 2 8.1 4.3 1.9 2.6 2.2 3.9 2.5 3.9.3 0 .6-1.3 2.5-3.9 1.6-2.3 3.9-4.3 8.1-4.3m0-3c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5.6 0 1.1-.2 1.6-.5 1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
                      </svg>
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <svg className="w-7 h-7 fill-current" viewBox="0 0 48 48">
                        <path
                          clipRule="evenodd"
                          d="M47.5 46.1l-2.8-11c1.8-3.3 2.8-7.1 2.8-11.1C47.5 11 37 .5 24 .5S.5 11 .5 24 11 47.5 24 47.5c4 0 7.8-1 11.1-2.8l11 2.8c.8.2 1.6-.6 1.4-1.4zm-3-22.1c0 4-1 7-2.6 10-.2.4-.3.9-.2 1.4l2.1 8.4-8.3-2.1c-.5-.1-1-.1-1.4.2-1.8 1-5.2 2.6-10 2.6-11.4 0-20.6-9.2-20.6-20.5S12.7 3.5 24 3.5 44.5 12.7 44.5 24z"
                          fillRule="evenodd"
                        />
                      </svg>
                      <span>{post.comments}</span>
                    </div>
                  </div>

                  {isLoadingPost && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowListModal
        isOpen={followListModal.isOpen}
        onClose={handleCloseFollowListModal}
        userId={profileUserId}
        type={followListModal.type}
        isOwnProfile={isOwnProfile}
      />

      <EditProfileModal
        isOpen={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        profile={{
          username: profile.username,
          fullName: profile.fullName,
          bio: profile.bio || "",
          website: profile.website || "",
          gender: profile.gender || "male",
          profilePicture: profile.profilePicture,
        }}
        onSuccess={handleEditProfileSuccess}
      />

      <ChangePasswordModal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
      />

      {selectedPost && (
        <CommentModal
          post={selectedPost}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
          onLike={handleLikePost}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}
