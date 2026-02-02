import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageIcon, XIcon } from "lucide-react";
import { useCreatePostMutation } from "@/hooks/usePostsQuery";
import { useAuth } from "@/hooks/useAuth";

const createPostSchema = z.object({
  content: z.string().min(1, "Post content is required").max(2200),
});

type CreatePostInput = z.infer<typeof createPostSchema>;

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostForm({ open, onOpenChange }: PostFormProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createPost, isPending } = useCreatePostMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 10);

    setImages(newImages);

    const urls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);

    setImages(newImages);
    setPreviewUrls(newUrls);

    URL.revokeObjectURL(previewUrls[index]);
  };

  const onSubmit = (data: CreatePostInput) => {
    createPost(
      {
        content: data.content,
        images: images.length > 0 ? images : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setImages([]);
          setPreviewUrls([]);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-sm">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <textarea
              id="content"
              placeholder="Share your thoughts..."
              className="w-full px-3 py-2 rounded-md border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[100px]"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative bg-muted rounded-md overflow-hidden aspect-square"
                >
                  <img
                    src={url}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70"
                  >
                    <XIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add images
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {images.length}/10 images selected
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
