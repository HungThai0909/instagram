import { useInfiniteQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "@/hooks/useUserQuery";

export default function ExplorePage() {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", "explore"],
    queryFn: ({ pageParam = 1 }) =>
      userService.getExplore({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.total_pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const { mutate: followUser } = useFollowUserMutation();
  const { mutate: unfollowUser } = useUnfollowUserMutation();

  const users = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Explore</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load explore</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
              >
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                  />
                )}
                <h3 className="font-semibold text-center">{user.full_name}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  @{user.username}
                </p>
                {user.bio && (
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    {user.bio}
                  </p>
                )}
                <div className="flex gap-2 mt-4 text-xs text-muted-foreground">
                  <span>{user.follower_count || 0} followers</span>
                  <span>{user.following_count || 0} following</span>
                </div>
              </Link>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
