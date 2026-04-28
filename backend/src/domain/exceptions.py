class DomainException(Exception):
    """Base para todas as exceções de regra de negócio da Elevva"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class PostNotFoundError(DomainException):
    """Lançado quando uma mídia não é localizada no banco ou tenant"""
    def __init__(self, post_id: str):
        super().__init__(f"Post {post_id} não localizado na infraestrutura Elevva.")

class InvalidCoordinateError(DomainException):
    """Lançado quando um Pin Visual está fora dos limites (0-100)"""
    def __init__(self, detail: str = "Coordenadas do Pin inválidas para o Canvas."):
        super().__init__(detail)

class UnauthorizedDomainError(DomainException):
    """Lançado quando uma regra de acesso de Negócio é violada"""
    def __init__(self, detail: str = "Ação não permitida para este perfil de usuário."):
        super().__init__(detail)
