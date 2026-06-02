import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvePostUseCase } from "../../di/containers";
import { Post } from "../../domain/entities/Post";

export const useApprovePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => approvePostUseCase.execute(postId),
    onSuccess: (updatedPost: Post) => {
      // Invalida cache e re-renderiza componentes atrelados
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
    },
    onError: () => {
      // silent
    }
  });
};
