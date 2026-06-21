import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient, ApiError } from "./api-client";
import { components, paths } from "../types/api";

// Extração cirúrgica de tipos da árvore de caminhos (O "Pulo do Gato")
type PostDetailResponse = paths["/posts/{post_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type CommentCreateRequest = components["schemas"]["CommentCreateRequest"];
type CommentResponse = paths["/posts/{post_id}/comments"]["post"]["responses"]["201"]["content"]["application/json"];
type PostStatusUpdateRequest = components["schemas"]["PostStatusUpdateRequest"];

// --- ADMIN APPROVAL SERVICES ---
export const fetchPendingAdmins = async (): Promise<{ id: string; name: string; email: string; created_at: string | null }[]> => {
  return fetchClient("/admin/pending-users");
};

export const approveAdmin = async (userId: string): Promise<{ message: string }> => {
  return fetchClient(`/admin/approve-user/${userId}`, { method: "POST" });
};

export const rejectAdmin = async (userId: string): Promise<{ message: string }> => {
  return fetchClient(`/admin/reject-user/${userId}`, { method: "POST" });
};

export const fetchClients = async (): Promise<{ id: string; name: string; email: string; }[]> => {
  return fetchClient("/admin/clients");
};

// --- SERVICES (Usando o Base Client) ---
export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  return fetchClient<PostDetailResponse>(`/posts/${postId}`);
};

export const fetchPendingPosts = async (clientId?: string): Promise<PostDetailResponse[]> => {
  const query = clientId ? `?client_id=${clientId}` : "";
  return fetchClient<PostDetailResponse[]>(`/posts${query}`);
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

export const deletePost = async (postId: string): Promise<void> => {
  return fetchClient<void>(`/posts/${postId}`, {
    method: "DELETE",
  });
};

// --- REACT QUERY HOOKS (Tipados com ApiError) ---
export const usePostDetail = (postId: string) => {
  return useQuery<PostDetailResponse, ApiError>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostDetail(postId),
  });
};

export const usePendingPosts = (clientId?: string) => {
  return useQuery<PostDetailResponse[], ApiError>({
    queryKey: ["pendingPosts", clientId],
    queryFn: () => fetchPendingPosts(clientId),
  });
};

export const useClients = () => {
  return useQuery<{ id: string; name: string; email: string; }[], ApiError>({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
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

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deletePost,
    onSuccess: (_, postId) => {
      // Remove do cache
      queryClient.setQueryData<PostDetailResponse[]>(["pendingPosts"], (old) => {
        if (!old) return old;
        return old.filter(post => post.id !== postId);
      });
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
    },
  });
};
