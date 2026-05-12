import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient, ApiError } from "./api-client";
import { components, paths } from "../types/api";

// Extração cirúrgica de tipos da árvore de caminhos (O "Pulo do Gato")
type PostDetailResponse = paths["/posts/{post_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type CommentCreateRequest = components["schemas"]["CommentCreateRequest"];
type CommentResponse = paths["/posts/{post_id}/comments"]["post"]["responses"]["201"]["content"]["application/json"];
type PostStatusUpdateRequest = components["schemas"]["PostStatusUpdateRequest"];

// --- SERVICES (Usando o Base Client) ---
export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  return fetchClient<PostDetailResponse>(`/posts/${postId}`);
};

export const fetchPendingPosts = async (): Promise<PostDetailResponse[]> => {
  return fetchClient<PostDetailResponse[]>("/posts");
};

export const addCommentToPost = async ({
  postId,
  comment,
}: {
  postId: string;
  comment: CommentCreateRequest;
}): Promise<CommentResponse> => {
  return fetchClient<CommentResponse>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(comment),
  });
};

export const updatePostStatus = async ({
  postId,
  request,
}: {
  postId: string;
  request: PostStatusUpdateRequest;
}): Promise<PostDetailResponse> => {
  return fetchClient<PostDetailResponse>(`/posts/${postId}/status`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
};

// --- REACT QUERY HOOKS (Tipados com ApiError) ---
export const usePostDetail = (postId: string) => {
  return useQuery<PostDetailResponse, ApiError>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostDetail(postId),
  });
};

export const usePendingPosts = () => {
  return useQuery<PostDetailResponse[], ApiError>({
    queryKey: ["pendingPosts"],
    queryFn: () => fetchPendingPosts(),
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    CommentResponse,
    ApiError,
    { postId: string; comment: CommentCreateRequest },
    { previousPosts?: PostDetailResponse[] }
  >({
    mutationFn: addCommentToPost,
    // UX Instantânea: Atualização Otimista
    onMutate: async ({ postId, comment }) => {
      await queryClient.cancelQueries({ queryKey: ["pendingPosts"] });

      const previousPosts = queryClient.getQueryData<PostDetailResponse[]>(["pendingPosts"]);

      if (previousPosts) {
        queryClient.setQueryData<PostDetailResponse[]>(["pendingPosts"], (old) => {
          if (!old) return old;
          return old.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, {
                  id: `optimistic-${Date.now()}`,
                  post_id: postId,
                  user_id: comment.user_id,
                  content: comment.content,
                  coord_x: comment.coord_x,
                  coord_y: comment.coord_y
                } as CommentResponse]
              };
            }
            return post;
          });
        });
      }

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback se o Sniper pegar (422) ou erro de rede
      if (context?.previousPosts) {
        queryClient.setQueryData(["pendingPosts"], context.previousPosts);
      }
    },
    onSettled: (_, __, variables) => {
      // Sincroniza sempre com o servidor no final para garantir 100% de precisão
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
    },
  });
};

export const useUpdatePostStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    PostDetailResponse,
    ApiError,
    { postId: string; request: PostStatusUpdateRequest }
  >({
    mutationFn: updatePostStatus,
    onSuccess: (updatedPost, variables) => {
      // Invalida e atualiza cache localmente
      queryClient.setQueryData(["post", variables.postId], updatedPost);
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
    },
  });
};
