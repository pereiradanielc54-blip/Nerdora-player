# Mestre Máquina — Memória Adaptativa v0.1

## Objetivo
Permitir que o Mestre aprenda com sessões anteriores sem reescrever as próprias regras.

## O que o Mestre aprende
- estilo de ação: investigação, social, combate, furtividade, magia, suporte e risco;
- fatos declarados pelo personagem, como medos, objetivos, vínculos e desconfianças;
- rotas que produziram progresso;
- ações que frequentemente causaram dead-end;
- finais já vividos e caminhos pouco explorados;
- pontos onde o sistema precisou acionar recuperação anti-loop.

## O que o Mestre NÃO aprende automaticamente
- novas regras;
- resultados de dados;
- HP, mana ou inventário inventados;
- alterações de cânone;
- fatos secretos que o jogador nunca descobriu.

## Ciclo
1. Jogador age.
2. O sistema classifica a abordagem.
3. Fatos explícitos relevantes são extraídos.
4. A ação e o resultado são registrados.
5. O Mestre consulta memória antes de ordenar opções futuras.
6. A memória favorece variedade e coerência, mas todas as alternativas válidas continuam acessíveis.
7. Se a mesma cena/ação se repetir sem mudança, o protocolo anti-loop abre uma nova saída.

## Alpha 0.2.5
A versão web estática usa IndexedDB no navegador. Isso persiste no mesmo dispositivo e navegador.

## Backend futuro
Ao migrar para servidor, o esquema em master-memory-schema.sql permite:
- memória por jogador;
- padrões agregados por campanha;
- aprendizado entre sessões;
- análise de rotas;
- resumos persistentes de campanha.

Para compartilhar aprendizado entre todos os jogadores será necessário backend autenticado. O banco central deve usar IDs pseudônimos e não precisa guardar áudio bruto.
