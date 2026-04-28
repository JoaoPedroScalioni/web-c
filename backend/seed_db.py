import asyncio
from sqlalchemy import delete
from src.infrastructure.security import PasswordHasher
from src.infrastructure.database import AsyncSessionLocal
from src.infrastructure.models import UserModel, PostModel, CalendarModel, CommentModel
from src.domain.entities import UserRole, PostStatus
from src.infrastructure.utils.time_service import TimeService

async def seed():
    async with AsyncSessionLocal() as db:
        print("🚀 Iniciando Seeding Narrativo: Elevva Marketing (Storytelling Mode)...")
        
        # 1. Limpeza Idempotente
        print("🧹 Limpando dados antigos...")
        await db.execute(delete(CommentModel))
        await db.execute(delete(PostModel))
        await db.execute(delete(CalendarModel))
        await db.execute(delete(UserModel))
        
        # 2. Usuários
        print("👤 Criando Personagens...")
        agency = UserModel(
            name='João Pedro (Agência Elevva)',
            email='joao@elevva.com',
            password_hash=PasswordHasher.hash('elevva2026'),
            role=UserRole.AGENCY,
            created_at=TimeService.get_now()
        )
        client = UserModel(
            name='Mayane (Diretora de Marca)',
            email='mayane@cliente.com',
            password_hash=PasswordHasher.hash('cliente123'),
            role=UserRole.CLIENT,
            created_at=TimeService.get_now()
        )
        db.add_all([agency, client])
        await db.flush()

        # 3. Calendário
        print("📅 Criando Calendário: Lançamento Outono 2026...")
        calendar = CalendarModel(
            client_id=client.id,
            month="Abril/2026 - Lançamento Outono"
        )
        db.add(calendar)
        await db.flush()

        # 4. Posts (Pipeline Kanban Realista)
        print("🎬 Gerando Mídias no Pipeline...")
        
        # Caso 1: Aguardando Aprovação (Vídeo Principal)
        post_video = PostModel(
            calendar_id=calendar.id,
            media_url='https://storage.elevva.com/campanha-video-outono.mp4',
            status=PostStatus.AGUARDANDO_APROVACAO,
            created_at=TimeService.get_now()
        )
        
        # Caso 2: Em Criação (Foto de Look 01)
        post_foto = PostModel(
            calendar_id=calendar.id,
            media_url='https://storage.elevva.com/foto-look-01.jpg',
            status=PostStatus.CRIADO,
            created_at=TimeService.get_now()
        )

        # Caso 3: Já Aprovado (Teaser de Lançamento)
        post_teaser = PostModel(
            calendar_id=calendar.id,
            media_url='https://storage.elevva.com/teaser-outono.mp4',
            status=PostStatus.APROVADO,
            created_at=TimeService.get_now()
        )

        # Caso 4: Rejeitado (Banner Lateral)
        post_banner = PostModel(
            calendar_id=calendar.id,
            media_url='https://storage.elevva.com/banner-lateral.jpg',
            status=PostStatus.REJEITADO,
            created_at=TimeService.get_now()
        )

        db.add_all([post_video, post_foto, post_teaser, post_banner])
        await db.flush()

        # 5. Pins Visuais (Feedbacks Contextualizados)
        print("📍 Transfixando Pins Visuais (Feedbacks)...")
        
        # Feedback no Vídeo (Aguardando Aprovação)
        db.add_all([
            CommentModel(
                post_id=post_video.id,
                user_id=client.id,
                content="Mayane: O logotipo no canto superior está muito pequeno, precisa de mais destaque.",
                coord_x=12.5, coord_y=15.0,
                created_at=TimeService.get_now()
            ),
            CommentModel(
                post_id=post_video.id,
                user_id=agency.id,
                content="João (Agência): Ajuste de brilho necessário no frame 05.",
                coord_x=85.0, coord_y=42.5,
                created_at=TimeService.get_now()
            )
        ])

        # Feedback no Banner (Rejeitado)
        db.add_all([
            CommentModel(
                post_id=post_banner.id,
                user_id=client.id,
                content="Mayane: As cores estão fora da paleta da marca. Precisamos refazer usando o azul institucional.",
                coord_x=50.0, coord_y=50.0,
                created_at=TimeService.get_now()
            )
        ])
        
        await db.commit()
        print("\n" + "="*50)
        print("✅ SEEDING CONCLUÍDO COM SUCESSO!")
        print(f"📧 Login Agency: joao@elevva.com / elevva2026")
        print(f"📧 Login Client: mayane@cliente.com / cliente123")
        print("="*50)

if __name__ == "__main__":
    asyncio.run(seed())
