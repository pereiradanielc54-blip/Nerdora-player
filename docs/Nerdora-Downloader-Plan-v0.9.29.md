# Nerdora Downloader — plano técnico v0.9.29

## Objetivo

Adicionar ao Nerdora Player um gerenciador de downloads Android de uso geral, inspirado na experiência de organização do SnapTube, sem extrair streams do YouTube nem contornar controles de acesso. A versão-base é a tag `v0.9.28` (commit `98bc78001cf36fc18943ab1381d87f80c490528e`).

## Decisão sobre YouTube

- A área YouTube existente continua sendo para pesquisa/navegação/reprodução pelos meios oficiais.
- Não implementar extração de URLs de mídia, scraping de endpoints privados, decifragem de URLs assinadas, remoção de DRM, nem proxy para contornar restrições.
- Não prometer download de vídeos do YouTube por URL colada. Quando o YouTube disponibilizar uma opção oficial de download offline, ela permanece dentro do app/fluxo oficial e sujeita às condições do serviço/conta.
- O downloader aceita URLs diretas de arquivos e fontes que autorizem explicitamente o download; para conteúdo próprio, preferir o arquivo original exportado pelo proprietário ou uma API oficial que conceda acesso ao arquivo.
- Bloquear por padrão URLs de páginas HTML como se fossem arquivos de vídeo; validar MIME type, extensão e resposta HTTP antes de iniciar/gravar.

## Experiência proposta

Nova área **Downloads**, integrada à navegação atual:

1. Campo para colar uma URL e botão **Analisar link**.
2. Prévia do recurso quando a fonte fornece metadados: nome, tipo, tamanho e origem.
3. Opções de destino: pasta padrão Downloads ou pasta escolhida pelo usuário com Storage Access Framework (SAF).
4. Fila com estados: aguardando, baixando, pausado, concluído, falhou e cancelado.
5. Progresso percentual, bytes recebidos/totais, velocidade, tempo restante estimado quando calculável e mensagem de erro compreensível.
6. Ações: pausar/retomar quando suportado pelo servidor, cancelar, repetir, remover do histórico, abrir arquivo e mostrar na pasta.
7. Histórico persistente após fechar/reabrir o app.
8. Detecção de nome duplicado com opções renomear, substituir após confirmação ou cancelar.
9. Verificação de integridade opcional por SHA-256 quando houver hash esperado ou como informação local pós-download.
10. Arquivos de vídeo/áudio concluídos são indexados pela biblioteca do Nerdora Player; não duplicar fisicamente o arquivo só para adicioná-lo à biblioteca.
11. Preferências: Wi-Fi apenas, downloads simultâneos limitados, notificação de progresso, destino padrão e limite de espaço livre.
12. Segurança: HTTPS preferencial; confirmar destinos HTTP inseguros; impedir traversal de caminho; nomes de arquivo saneados; limitar redirecionamentos; não enviar URLs ou dados pessoais para serviços de terceiros.

## Arquitetura sugerida

- `DownloadRepository`: persistência de tarefas e histórico (Room ou o mecanismo persistente já existente, após inspeção do código real).
- `DownloadEngine`: execução com WorkManager/foreground service conforme versão Android e duração, suporte a cancelamento e retomada.
- `HttpDownloadClient`: HTTP Range quando o servidor oferece `Accept-Ranges: bytes`; se não houver suporte, permitir retomar apenas reiniciando, sem alegar retomada real.
- `DestinationProvider`: armazenamento privado temporário e publicação final em MediaStore/SAF, respeitando permissões Android.
- `DownloadValidator`: MIME, tamanho, status HTTP, URL final, extensão e integridade.
- `MediaLibraryBridge`: atualizar índice e MediaStore somente depois de finalizar e validar o arquivo.
- `DownloadUi`: fila, detalhes, estados vazios, confirmação de conflitos e erros recuperáveis.

## Regras importantes de implementação

- Usar arquivo temporário `.part` e só publicar o arquivo final após resposta completa e validação.
- Não considerar HTTP 200 como retomada válida se a tarefa pediu Range; validar HTTP 206 e o Content-Range.
- Calcular progresso/velocidade com amostras; evitar ETA quando o tamanho total é desconhecido.
- Persistir estado após cada transição importante, sem gravar o banco em cada byte.
- Respeitar limites de execução em segundo plano e notificações exigidas pela versão Android.
- Não armazenar credenciais/cookies de navegador nem reutilizar sessão de sites sem autorização.
- Testar links inválidos, redirecionamentos, pouco espaço, rede interrompida, servidor sem Range, cancelamento, conflito de nome e reinício do app.

## Entrega por fases

### Fase 1 — downloader de arquivos diretos
- Modelo persistente de tarefa e estados.
- Download HTTP/HTTPS de arquivo direto autorizado.
- Barra de progresso, velocidade e tamanho; pausa/retomada real somente com Range.
- Cancelar, repetir, histórico, destino SAF/Downloads e tratamento de conflitos.
- Integração com biblioteca local após conclusão.

### Fase 2 — robustez
- Downloads em fila e limite de concorrência.
- Retomar tarefas após reinício do processo/dispositivo.
- Wi-Fi apenas, aviso de espaço insuficiente, checksum e diagnósticos.
- Testes automatizados de engine e cenários de falha.

### Fase 3 — provedores autorizados
- Adaptadores específicos apenas para serviços que documentem e autorizem o download.
- Cada adaptador declara permissões, tipos suportados e limites. Sem um adaptador oficial, tratar como URL de arquivo direto, não como página de vídeo.

## Critérios de aceite

- Um link direto autorizado baixa um arquivo real para o destino selecionado.
- O progresso e os estados persistem corretamente.
- Pausar/retomar só é mostrado como disponível quando o servidor suporta Range.
- Interrupções e erros não deixam arquivos incompletos apresentados como concluídos.
- O arquivo final aparece na biblioteca local sem cópia duplicada.
- Links de página do YouTube não são apresentados como downloads prontos nem enviados a extratores de terceiros.
- A implementação deve ser integrada ao mecanismo de build atual e testada antes de publicar APK.

## Nota sobre o repositório

A v0.9.28 contém artefatos e overlays de build. Antes de modificar o fluxo de build ou gerar um APK novo, é necessário localizar no workflow o payload-fonte canônico e confirmar como os overlays são aplicados, para evitar sobrescrever funções existentes ou publicar uma build não reproduzível.
