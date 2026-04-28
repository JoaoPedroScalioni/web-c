import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { components } from "../types/api";

type PostDetailResponse = components["schemas"]["PostDetailResponse"];
type CommentCreateRequest = components["schemas"]["CommentCreateRequest"];
type CommentResponse = components["schemas"]["CommentResponse"];

const API_URL = "http://localhost:8000"; // Usaremos env na vida real

// --- SERVICES (Fetch puros) ---
export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  const response = await fetch(`${API_URL}/posts/${postId}`);
  if (!response.ok) {
    throw new Error("Erro ao buscar o post");
  }
  return response.json();
};

export const fetchPendingPosts = async (): Promise<PostDetailResponse[]> => {
  // TODO: Como o backend ainda não tem GET /posts, estamos mockando para a UI do Frontend ganhar vida!
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
  const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comment),
  });
  if (!response.ok) {
    throw new Error("Erro ao adicionar comentário");
  }
  return response.json();
};

export const approvePost = async (postId: string): Promise<void> => {
  // O endpoint de aprovar precisa existir no backend. Se não existir, 
  // simularemos aqui com PATCH /posts/{id}/status (ou similar)
  const response = await fetch(`${API_URL}/posts/${postId}/approve`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Erro ao aprovar o post");
  }
};

// --- REACT QUERY HOOKS (O que os componentes usam) ---
export const usePostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostDetail(postId),
  });
};

export const usePendingPosts = () => {
  return useQuery({
    queryKey: ["pendingPosts"],
    queryFn: () => fetchPendingPosts(),
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCommentToPost,
    onSuccess: (_, variables) => {
      // Invalida o cache do post para buscar os novos pins na hora
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
    },
  });
};
