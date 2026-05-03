from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0002_conversation_user"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            create extension if not exists vector with schema extensions;

            create table if not exists chat_memory (
              id bigserial primary key,
              user_id text not null,
              session_id text not null,
              role text not null,
              content text not null,
              embedding extensions.vector not null,
              created_at timestamptz default now()
            );

            create index if not exists chat_memory_user_session_idx
              on chat_memory (user_id, session_id);

            create or replace function match_chat_memory(
              query_embedding extensions.vector,
              match_count int,
              filter jsonb
            )
            returns table (
              id bigint,
              content text,
              role text,
              similarity float
            )
            language plpgsql as $$
            begin
              return query
              select
                cm.id,
                cm.content,
                cm.role,
                1 - (cm.embedding <=> query_embedding) as similarity
              from chat_memory cm
              where (filter->>'user_id' is null or cm.user_id = filter->>'user_id')
                and (filter->>'session_id' is null or cm.session_id = filter->>'session_id')
              order by cm.embedding <=> query_embedding
              limit match_count;
            end;
            $$;
            """,
            reverse_sql="""
            drop function if exists match_chat_memory(extensions.vector, int, jsonb);
            drop table if exists chat_memory;
            """,
        ),
    ]
