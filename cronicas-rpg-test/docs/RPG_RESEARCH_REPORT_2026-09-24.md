# Crônicas de Nerdora — Pesquisa comparativa de RPG de mesa
**Data:** 24/09/2026  
**Status:** documento aditivo; não substitui o cânone do Livro do Mestre Máquina.

## Resumo executivo
A pesquisa confirmou que a direção central do Mestre Máquina já está alinhada com práticas robustas de RPG: situações em vez de roteiro linear, múltiplas rotas, pistas redundantes, fail-forward, consequências persistentes, mundo que avança, memória estruturada e separação entre estado autoritativo e narração.

A maior diferença não está mais no design narrativo, e sim na **arquitetura da Alpha**: a versão atual ainda é host-authoritative/P2P. Isso impede segredo real por jogador, rolagem verdadeiramente oculta e fog-of-war seguro. Esses recursos devem esperar o Game Server autoritativo previsto na especificação.

## Matriz de comparação

| Referência | Mecânica útil | Nerdora antes da 0.3.7 | Decisão |
|---|---|---|---|
| Blades in the Dark | progress clocks e consequências | pressão global + eventos | manter pressão como ameaça e separar trilhas de progresso; futuramente relógios nomeados por obstáculo |
| Dungeon World | fronts, grim portents, impending doom | eventos por beats + NPC/facções | 0.3.7 adiciona presságios; futuro: fronts como objeto de dados |
| Fate | aspectos e compels negociáveis | ganchos pessoais e relações | não copiar economia de Fate Points; estudar barganha opcional de consequência |
| Mythic GME 2e | oracle, random events, scene structure, chaos | Diretor + pressão + memória | futuro Oracle interno, limitado por cânone/estado |
| Pathfinder 2e | graus de sucesso, secret checks, research/influence | D20 binário na Alpha | 0.3.7 corrige para resultados graduados; secret checks aguardam servidor |
| The Alexandrian | situações, nós, Three Clue Rule | já fortemente implementado | manter; futura validação automática do grafo pista→conclusão |
| Foundry VTT | exploração/fog por usuário | mapa compartilhado | futuro: visibilidade individual/compartilhada após servidor |
| Fóruns RPG/solo/AI-GM | mixed success, memória persistente, evitar turnos vazios | fail-forward, anti-loop, memória IndexedDB | manter como validação; não tratar fórum como regra canônica |

## O que já está forte
O protótipo já possui evidências separadas de conclusões, REVELATION_RULES como grafo explícito, múltiplas rotas e finais, ações concluídas removidas, recuperação anti-loop, pressão do mundo, eventos por tempo narrativo, relações de NPC, memória local estruturada e hooks pessoais sem retirar agência.

## Divergências relevantes
1. **Arquitetura:** P2P/host-authoritative na Alpha versus servidor autoritativo na arquitetura final.
2. **Segredos:** estado compartilhado impede GM-only real, pistas privadas e fog seguro.
3. **Memória:** IndexedDB local versus PostgreSQL central planejado.
4. **Combate:** investigação/social estão mais maduros que economia de combate, condições, ferimentos, moral e descanso.
5. **Facções:** relações e beats existem, mas fronts/agendas/clocks ainda não são entidades reutilizáveis.
6. **Oracle:** ainda não existe uma camada formal separada para incerteza narrativa.
7. **Sessão:** falta resumo/export estruturado de fim de sessão.

## Alterações aplicadas na Web Alpha 0.3.7
- D20 com cinco faixas: sucesso crítico, sucesso forte, sucesso, falha com progresso e falha severa.
- Consequências de falha estreita versus falha severa diferenciadas.
- Anti-loop reconhece tempo, objetivo e eventos como mudança real de estado.
- Recuperação adaptativa funciona em todas as campanhas.
- Presságios aparecem um beat antes de eventos mundiais relevantes.
- Derenfall ganha trilhas de progresso no diário; Coroa de Vidro e Coro Abaixo mantêm suas frentes, agora tratadas como progresso separado da ameaça.
- Versão anterior preservada; a página passa a carregar app-v037.js.

## Ordem técnica recomendada
Primeiro tornar o estado servidor-autoritativo; depois implementar escopos de visibilidade, fog por jogador, clocks/fronts de facções, Oracle interno com auditoria, resumos de sessão e só então aprofundar combate/ferimentos/moral. Essa ordem evita construir “segredos” que qualquer cliente P2P poderia inspecionar.
