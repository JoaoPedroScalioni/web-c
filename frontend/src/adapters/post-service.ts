import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient, ApiError } from "./api-client";
import { components, paths } from "../types/api";

// Extração cirúrgica de tipos da árvore de caminhos (O "Pulo do Gato")
type PostDetailResponse = paths["/posts/{post_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type CommentCreateRequest = components["schemas"]["CommentCreateRequest"];
type CommentResponse = paths["/posts/{post_id}/comments"]["post"]["responses"]["201"]["content"]["application/json"];
type UploadIntentRequest = components["schemas"]["UploadIntentRequest"];
type UploadIntentResponse = paths["/posts/upload-intent"]["post"]["responses"]["201"]["content"]["application/json"];

// --- SERVICES (Usando o Base Client) ---
export const createUploadIntent = async (request: UploadIntentRequest): Promise<UploadIntentResponse> => {
  return fetchClient<UploadIntentResponse>("/posts/upload-intent", {
    method: "POST",
    body: JSON.stringify(request),
  });
};

export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  return fetchClient<PostDetailResponse>(`/posts/${postId}`);
};

export const fetchPendingPosts = async (): Promise<PostDetailResponse[]> => {
  // TODO: Quando backend tiver GET /posts real com a rota paths["/posts"]["get"]["responses"]["200"]
  // Bastará retornar fetchClient<GetPostsResponse>("/posts?status=AGUARDANDO_APROVACAO");
  
  // Mock temporário compatível com a interface restrita PostDetailResponse
  return [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      calendar_id: "00000000-0000-0000-0000-000000000000",
      media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      status: "AGUARDANDO_APROVACAO",
      comments: [
        {
          id: "c1",
          post_id: "123e4567-e89b-12d3-a456-426614174000",
          user_id: "u1",
          content: "Ajustar o contraste dessa cena.",
          coord_x: 20.5,
          coord_y: 45.2,
        }
      ]
    }
  ];
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

export const approvePost = async (postId: string): Promise<void> => {
  return fetchClient<void>(`/posts/${postId}/approve`, {
    method: "POST",
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

export const useUploadIntent = () => {
  return useMutation<UploadIntentResponse, ApiError, UploadIntentRequest>({
    mutationFn: createUploadIntent,
  });
};
