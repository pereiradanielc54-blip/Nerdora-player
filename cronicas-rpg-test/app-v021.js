const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const clone=v=>JSON.parse(JSON.stringify(v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);

const ATTRS={
  VIG:{name:"Vigor",desc:"Vida, resistência, veneno e exaustão."},
  FOR:{name:"Força",desc:"Impacto, carga, agarrar e armas pesadas."},
  INT:{name:"Intelecto",desc:"Magia, análise, conhecimento e engenharia."},
  AGI:{name:"Agilidade",desc:"Iniciativa, esquiva, furtividade e precisão."},
  PER:{name:"Percepção",desc:"Rastreio, sentidos e leitura de cena."},
  PRE:{name:"Presença",desc:"Persuasão, comando, blefe e empatia social."}
};

const ORIGINS={
  Asterfall:{icon:"♜",name:"Asterfall",text:"Estradas, cidades, nobres e academias. Você conhece leis, etiqueta e vida urbana."},
  Drakar:{icon:"⛰️",name:"Drakar",text:"Fortalezas, clãs e minas. Você cresceu onde palavra e resistência têm peso."},
  Sylvaris:{icon:"🌿",name:"Sylvaris",text:"Floresta ancestral, espíritos e pactos. Você lê sinais naturais com facilidade."},
  Vael:{icon:"☀️",name:"Vael",text:"Deserto, ruínas e tempestades de Éter. Sobrevivência e relíquias fazem parte da vida."},
  Brumas:{icon:"⚓",name:"Costa das Brumas",text:"Portos, ilhas e rotas incertas. Você conhece comércio, rumores e viagem."},
  Marchas:{icon:"🏕️",name:"Marchas Cinzentas",text:"Fronteira instável. Você aprendeu a improvisar longe de autoridades fortes."}
};

const CLASS_DATA={
  Guerreiro:{icon:"⚔️",role:"Frente, proteção e controle físico.",recommend:["VIG","FOR"],hint:"Priorize VIG e FOR. Técnicas defensivas exigem resistência; golpes pesados dependem de FOR.",baseHp:72,baseMp:16},
  Mago:{icon:"🔮",role:"Controle, dano e utilidade arcana.",recommend:["INT","PER"],hint:"INT alimenta fórmulas, selos e poder arcano. PER ajuda a ler Éter e evitar instabilidade.",baseHp:44,baseMp:54},
  Assassino:{icon:"🗡️",role:"Mobilidade, precisão e infiltração.",recommend:["AGI","PER"],hint:"AGI sustenta furtividade, reposicionamento e esquiva. PER ajuda a encontrar vulnerabilidades.",baseHp:52,baseMp:26},
  Curandeiro:{icon:"✨",role:"Cura, proteção e suporte.",recommend:["INT","PRE"],hint:"INT fortalece técnicas vitais; PRE ajuda vínculos, estabilização e suporte social.",baseHp:56,baseMp:48},
  Invocador:{icon:"👹",role:"Criaturas, pactos e controle indireto.",recommend:["INT","PRE"],hint:"INT mantém estruturas de invocação; PRE é importante para pactos, ordens e entidades conscientes.",baseHp:48,baseMp:58},
  Caçador:{icon:"🏹",role:"Rastreio, distância, terreno e sobrevivência.",recommend:["PER","AGI"],hint:"PER encontra pistas e fraquezas. AGI melhora precisão, deslocamento e técnicas de distância.",baseHp:58,baseMp:22}
};

const SKILLS={
  Guerreiro:[
    {id:"war_preciso",name:"Golpe Preciso",level:1,req:{FOR:3},cost:"1 Fôlego",desc:"Ataque controlado que reduz penalidades de posição ou cobertura."},
    {id:"war_aparar",name:"Aparar",level:1,req:{VIG:3},cost:"Reação",desc:"Reduz o impacto de um ataque corpo a corpo que você consegue perceber."},
    {id:"war_investida",name:"Investida",level:1,req:{FOR:2,AGI:2},cost:"1 Fôlego",desc:"Avança e ataca em uma única ação quando houver espaço para ganhar impulso."},
    {id:"war_guardiao",name:"Postura de Guarda",level:1,req:{VIG:3},cost:"Postura",desc:"Você protege uma zona próxima e dificulta que inimigos passem por você."},
    {id:"war_provocar",name:"Provocar",level:2,req:{PRE:2,VIG:3},cost:"Ação",desc:"Pressiona um inimigo inteligente a lidar com você ou perder posição."},
    {id:"war_avanco",name:"Avanço Irredutível",level:3,req:{VIG:4},cost:"1 Fôlego",desc:"Ignora a primeira tentativa de empurrar, parar ou derrubar você no turno."},
    {id:"war_quebra",name:"Quebra-Guarda",level:5,req:{FOR:5},cost:"2 Fôlego",desc:"Troca dano bruto por abrir a defesa do alvo para a companhia."},
    {id:"war_folego",name:"Segundo Fôlego",level:5,req:{VIG:5},cost:"1/descanso",desc:"Recupera parte dos PV e remove uma condição física leve."},
    {id:"war_interpor",name:"Interpor",level:8,req:{VIG:5,AGI:3},cost:"Reação",desc:"Move-se para receber ou desviar um ataque que atingiria um aliado próximo."},
    {id:"war_circular",name:"Ataque Circular",level:10,req:{FOR:5,AGI:4},cost:"2 Fôlego",desc:"Pressiona vários inimigos adjacentes, útil contra grupos."},
    {id:"war_desarmar",name:"Desarmar Mestre",level:15,req:{FOR:6,PER:4},cost:"Ação",desc:"Usa leitura e força para retirar arma, foco ou ferramenta de um oponente."},
    {id:"war_heroico",name:"Momento Heroico",level:20,req:{VIG:7,FOR:7},cost:"1/cena",desc:"Realiza uma segunda ação principal em um momento decisivo, pagando exaustão depois."}
  ],
  Mago:[
    {id:"mag_rajada",name:"Rajada Arcana",level:1,req:{INT:3},cost:"4 Mana",desc:"Projétil de Éter confiável, adaptável a diferentes assinaturas."},
    {id:"mag_barreira",name:"Barreira",level:1,req:{INT:3},cost:"5 Mana",desc:"Cria proteção breve para você ou um aliado visível."},
    {id:"mag_luz",name:"Luz de Éter",level:1,req:{INT:2},cost:"2 Mana",desc:"Ilumina, marca resíduos arcanos e revela pequenas alterações de Éter."},
    {id:"mag_sonda",name:"Sonda Arcana",level:1,req:{PER:3},cost:"3 Mana",desc:"Investiga assinatura, intensidade e direção provável de um efeito mágico."},
    {id:"mag_passo",name:"Passo Curto",level:2,req:{INT:3,AGI:2},cost:"6 Mana",desc:"Desloca-se alguns metros por uma dobra curta e visível."},
    {id:"mag_leitura",name:"Leitura de Éter",level:3,req:{INT:4,PER:3},cost:"Foco",desc:"Distingue camadas de magia, âncoras e instabilidade em uma cena."},
    {id:"mag_selo",name:"Selo",level:5,req:{INT:5},cost:"8 Mana",desc:"Restringe passagem, criatura ou fenômeno com uma condição definida."},
    {id:"mag_contra",name:"Contrafeitiço",level:5,req:{INT:5,PER:4},cost:"Reação + Mana",desc:"Interfere em magia durante a formação, sem garantir cancelamento automático."},
    {id:"mag_lento",name:"Campo Lento",level:8,req:{INT:5},cost:"10 Mana",desc:"Altera movimento dentro de uma pequena área por curto período."},
    {id:"mag_forma",name:"Forma Elemental",level:10,req:{INT:6},cost:"12 Mana",desc:"Converte parte do corpo em uma manifestação elemental controlada."},
    {id:"mag_eco",name:"Janela de Eco",level:15,req:{INT:6,PER:6},cost:"14 Mana",desc:"Observa um eco recente de evento ligado ao local sem tratá-lo como verdade absoluta."},
    {id:"mag_conv",name:"Convergência",level:20,req:{INT:7,PER:6},cost:"Toda Mana disponível",desc:"Combina múltiplas fórmulas em um único fenômeno de grande escala e risco."}
  ],
  Assassino:[
    {id:"ass_sombra",name:"Ataque pelas Sombras",level:1,req:{AGI:3},cost:"Posição",desc:"Ganha benefício ao atacar sem estar plenamente percebido pelo alvo."},
    {id:"ass_evasao",name:"Evasão",level:1,req:{AGI:3},cost:"Reação",desc:"Troca posição por reduzir ou evitar um efeito que permita esquiva."},
    {id:"ass_fio",name:"Lâmina Oculta",level:1,req:{AGI:2,PER:2},cost:"Ação",desc:"Saque e golpe discretos, úteis em espaços apertados ou sociais."},
    {id:"ass_passos",name:"Passos Leves",level:1,req:{AGI:3},cost:"Passivo",desc:"Reduz ruído e rastros em deslocamentos cuidadosos."},
    {id:"ass_finta",name:"Finta",level:2,req:{AGI:3,PRE:2},cost:"Ação",desc:"Cria abertura enganando leitura corporal do oponente."},
    {id:"ass_marca",name:"Marca Vulnerável",level:3,req:{PER:4},cost:"Observação",desc:"Estuda um alvo e descobre uma fraqueza prática explorável."},
    {id:"ass_fantasma",name:"Passo Fantasma",level:5,req:{AGI:5},cost:"2 Fôlego",desc:"Reposicionamento veloz entre coberturas ou pontos cegos."},
    {id:"ass_veneno",name:"Veneno Preparado",level:5,req:{INT:3,PER:4},cost:"Preparação",desc:"Prepara toxina de efeito conhecido; exige ingredientes e alvo compatível."},
    {id:"ass_silenciar",name:"Silenciar",level:8,req:{AGI:5,PER:4},cost:"Ação",desc:"Interrompe voz, fórmula ou alarme por tempo curto quando alcança o alvo."},
    {id:"ass_contra",name:"Contra-Golpe",level:10,req:{AGI:6,PER:5},cost:"Reação",desc:"Transforma uma abertura criada pelo inimigo em ataque imediato."},
    {id:"ass_exec",name:"Execução Condicional",level:15,req:{AGI:6,PER:6},cost:"Requer alvo exposto",desc:"Golpe extremo disponível apenas contra alvo já vulnerável e preparado."},
    {id:"ass_sumir",name:"Desaparecer na Multidão",level:20,req:{AGI:7,PRE:5},cost:"1/cena",desc:"Quebra perseguição social e visual quando houver pessoas, rotas ou cobertura plausíveis."}
  ],
  Curandeiro:[
    {id:"cur_cura",name:"Cura",level:1,req:{INT:3},cost:"5 Mana",desc:"Restaura PV de um alvo vivo ao alcance da técnica."},
    {id:"cur_purificar",name:"Purificar",level:1,req:{INT:3,PER:2},cost:"4 Mana",desc:"Reduz toxina, corrupção ou condição quando a origem puder ser tratada."},
    {id:"cur_vinculo",name:"Vínculo Vital",level:1,req:{PRE:3},cost:"Concentração",desc:"Liga-se a um aliado e melhora suporte direcionado enquanto o vínculo persistir."},
    {id:"cur_bencao",name:"Bênção Serena",level:1,req:{PRE:3},cost:"3 Mana",desc:"Ajuda um aliado a resistir medo, pressão ou desorganização."},
    {id:"cur_escudo",name:"Escudo Vital",level:2,req:{INT:3,VIG:2},cost:"5 Mana",desc:"Converte energia em proteção temporária contra dano imediato."},
    {id:"cur_estab",name:"Estabilizar",level:3,req:{INT:4,PER:3},cost:"Ação",desc:"Interrompe piora de Estado Crítico e Feridas em condições possíveis."},
    {id:"cur_dor",name:"Partilhar Dor",level:5,req:{VIG:4,PRE:4},cost:"Vínculo",desc:"Divide parte do dano de um aliado com você antes que ele seja aplicado."},
    {id:"cur_sopro",name:"Sopro Renovador",level:5,req:{INT:5},cost:"8 Mana",desc:"Recupera PV moderados de vários aliados próximos."},
    {id:"cur_trauma",name:"Anular Trauma",level:8,req:{INT:5,PRE:5},cost:"10 Mana",desc:"Suspende temporariamente efeitos de uma Ferida Grave para permitir ação."},
    {id:"cur_pulso",name:"Pulso de Esperança",level:10,req:{PRE:6},cost:"1/cena",desc:"Reorganiza moral do grupo e remove condições mentais leves compatíveis."},
    {id:"cur_queda",name:"Recusar a Queda",level:15,req:{VIG:6,INT:6},cost:"Reação",desc:"Impede que um aliado próximo caia imediatamente a 0 PV uma vez por cena."},
    {id:"cur_retorno",name:"Retorno Limitado",level:20,req:{INT:7,PRE:7},cost:"Ritual raro",desc:"Tenta devolver uma vida recentemente perdida sob custo, condição e consequência explícitos."}
  ],
  Invocador:[
    {id:"inv_familiar",name:"Invocar Familiar",level:1,req:{INT:3},cost:"6 Mana",desc:"Materializa ou chama um familiar persistente de função escolhida."},
    {id:"inv_troca",name:"Troca de Lugar",level:1,req:{INT:3,AGI:2},cost:"5 Mana",desc:"Troca sua posição com a do familiar se ambos estiverem acessíveis."},
    {id:"inv_ordem",name:"Ordem Instintiva",level:1,req:{PRE:3},cost:"Bônus",desc:"Dá ao familiar uma instrução simples sem consumir sua ação principal."},
    {id:"inv_selo",name:"Selo de Vínculo",level:1,req:{INT:2,PRE:3},cost:"Preparação",desc:"Marca objeto ou local como âncora temporária para invocação."},
    {id:"inv_pacto",name:"Pacto Menor",level:2,req:{PRE:4},cost:"Acordo",desc:"Negocia um benefício limitado com entidade capaz de consentir."},
    {id:"inv_eco",name:"Forma Eco",level:3,req:{INT:4,PER:3},cost:"6 Mana",desc:"Familiar assume propriedades de um eco ou ambiente por curto período."},
    {id:"inv_sacrificio",name:"Sacrifício de Vínculo",level:5,req:{PRE:4,VIG:3},cost:"Vínculo",desc:"Desfaz temporariamente um vínculo para absorver um impacto ou efeito."},
    {id:"inv_dupla",name:"Invocação Dupla",level:5,req:{INT:5},cost:"10 Mana",desc:"Mantém duas entidades menores ao mesmo tempo com maior pressão de controle."},
    {id:"inv_portal",name:"Portal Breve",level:8,req:{INT:5,PER:4},cost:"10 Mana",desc:"Abre passagem curta entre duas âncoras preparadas."},
    {id:"inv_nome",name:"Nome Verdadeiro",level:10,req:{PRE:6,PER:5},cost:"Descoberta",desc:"Conhecer o nome essencial de uma entidade concede opções de pacto e resistência."},
    {id:"inv_cortejo",name:"Cortejo Impossível",level:15,req:{INT:6,PRE:6},cost:"Ritual",desc:"Convoca várias presenças menores para cumprir uma tarefa complexa."},
    {id:"inv_trono",name:"Trono de Pactos",level:20,req:{INT:7,PRE:7},cost:"1/arco",desc:"Coordena vínculos múltiplos sem apagar a vontade das entidades participantes."}
  ],
  Caçador:[
    {id:"cac_tiro",name:"Tiro Preciso",level:1,req:{PER:3},cost:"Ação",desc:"Ataque à distância que usa observação e cobertura com eficiência."},
    {id:"cac_armadilha",name:"Armadilha",level:1,req:{PER:3,INT:2},cost:"Preparação",desc:"Cria uma armadilha de efeito definido usando materiais plausíveis."},
    {id:"cac_rastro",name:"Leitura de Rastros",level:1,req:{PER:3},cost:"Exploração",desc:"Distingue direção, número aproximado e alterações recentes em trilhas."},
    {id:"cac_refugio",name:"Refúgio Rápido",level:1,req:{PER:2,VIG:2},cost:"Tempo",desc:"Prepara abrigo ou ponto seguro simples em terreno apropriado."},
    {id:"cac_olho",name:"Olho do Caçador",level:2,req:{PER:4},cost:"Observação",desc:"Converte estudo de uma presa em bônus situacional contra ela."},
    {id:"cac_trilha",name:"Passo de Trilha",level:3,req:{AGI:3,PER:4},cost:"Movimento",desc:"Avança por terreno difícil reduzindo perda de posição."},
    {id:"cac_interromper",name:"Flecha de Interrupção",level:5,req:{AGI:4,PER:5},cost:"Reação",desc:"Tenta interromper ação visível de um alvo à distância."},
    {id:"cac_comp",name:"Companheiro",level:5,req:{PRE:3,PER:4},cost:"Vínculo",desc:"Estabelece vínculo persistente com criatura compatível e voluntária."},
    {id:"cac_camu",name:"Camuflagem",level:8,req:{AGI:5,PER:5},cost:"Preparação",desc:"Usa terreno e materiais para dificultar detecção do grupo parado."},
    {id:"cac_chuva",name:"Chuva de Projéteis",level:10,req:{AGI:6},cost:"Munição + Fôlego",desc:"Controla pequena área com múltiplos disparos em vez de dano concentrado."},
    {id:"cac_quebra",name:"Quebra de Padrão",level:15,req:{PER:6,INT:4},cost:"Estudo",desc:"Identifica repetição em criatura ou anomalia e cria uma contramedida."},
    {id:"cac_final",name:"Presa Final",level:20,req:{PER:7,AGI:6},cost:"1/cena",desc:"Ao completar estudo profundo, transforma uma abertura real em ação decisiva."}
  ]
};

const CAMPAIGNS={
  derenfall:{
    id:"derenfall",theme:"derenfall",icon:"🔔",title:"O Vilarejo Sem Amanhã",tone:"Mistério • Fantasia sombria",
    summary:"Derenfall está silenciosa. Centenas desapareceram sem sangue, fuga ou despedida.",
    premise:"Vocês foram atraídos a Derenfall por motivos diferentes. A chuva os reúne na mesma estrada, e a vila deveria estar cheia de vida — mas todas as rotinas foram interrompidas de uma vez.",
    location:"Estrada de Derenfall",objective:"Entrar em Derenfall e descobrir por que a vila inteira silenciou.",
    opening:[
      "Vhalora, ano 487 Após a Ruptura. Nas últimas semanas, mercadores que atravessam as Marchas Cinzentas falam de estradas vazias e pequenos lapsos de memória. Nada, porém, parecia grave o bastante para interromper o comércio.",
      "Ao cair da tarde, uma tempestade força a companhia a seguir pela rota de Derenfall. Alguns vieram por trabalho, outros por abrigo, curiosidade ou promessas pessoais. Todos esperavam encontrar uma vila comum de aproximadamente seiscentos habitantes.",
      "A primeira coisa estranha não é o que vocês veem — é o que não ouvem. Nenhuma conversa. Nenhum animal chamando pelos donos. Nenhum martelo, sino ou porta. Apenas chuva. Uma única janela da hospedaria continua acesa."
    ],
    locations:{
      "Estrada de Derenfall":["Entrar na vila","Procurar rastros","Observar a vila"],
      "Praça de Derenfall":["Ir à igreja","Ir à hospedaria","Investigar a praça","Ir ao cemitério"],
      "Igreja":["Investigar o sino","Examinar o altar","Procurar passagem","Tocar o sino"],
      "Hospedaria":["Ler o livro-caixa","Procurar quartos","Examinar a cozinha","Voltar à praça"],
      "Cemitério":["Examinar lápides","Procurar pegadas","Abrir a capela","Voltar à praça"],
      "Escola":["Examinar desenhos","Procurar registros","Voltar à praça"],
      "Poço":["Responder à voz","Baixar uma corda","Examinar o poço","Voltar à praça"],
      "Capela Antiga":["Examinar o selo","Procurar entrada","Tocar o símbolo","Voltar ao cemitério"],
      "Fenda Memorial":["Seguir as vozes","Procurar moradores","Chamar o responsável","Examinar a Fenda"],
      "Salão das Memórias":["Conversar com o Colecionador","Exigir os moradores","Atacar","Propor um acordo"]
    }
  },
  vidro:{
    id:"vidro",theme:"vidro",icon:"👑",title:"A Coroa de Vidro",tone:"Intriga • Investigação política",
    summary:"Uma relíquia de Arken mostrou um soberano que não existe nos registros oficiais.",
    premise:"A companhia chega a Arken durante a Semana dos Juramentos, quando Casas nobres renovam publicamente sua lealdade à Coroa. Cada personagem tem um motivo para estar próximo da cerimônia: serviço, estudo, proteção, comércio ou convite.",
    location:"Salão dos Juramentos",objective:"Entender por que a Coroa de Vidro revelou um segundo soberano.",
    opening:[
      "Arken raramente parece tão organizada quanto durante a Semana dos Juramentos. Ruas são lavadas, estandartes escondem rachaduras e cada Casa importante finge que a sucessão do reino jamais foi assunto de conflito.",
      "A companhia está no Salão dos Juramentos quando a rainha Maeryn ergue a Coroa de Vidro — um artefato cerimonial que registra promessas dinásticas. Por um instante, o cristal reflete outra pessoa sentada no trono.",
      "O salão inteiro vê. Na manhã seguinte, três Casas apresentam documentos de sucessão incompatíveis, todos aparentemente autênticos. Guardas fecham os arquivos reais antes que alguém possa comparar as cópias."
    ],
    locations:{
      "Salão dos Juramentos":["Examinar a Coroa","Ouvir testemunhas","Observar as Casas","Ir aos Arquivos"],
      "Arquivos Reais":["Procurar juramentos antigos","Comparar selos","Falar com arquivistas","Voltar ao palácio"],
      "Distrito das Casas":["Visitar uma Casa","Seguir mensageiro","Investigar rumores","Voltar ao palácio"],
      "Cripta Dinástica":["Examinar inscrições","Procurar passagem","Comparar nomes","Voltar aos Arquivos"]
    }
  },
  coro:{
    id:"coro",theme:"coro",icon:"⛏️",title:"O Coro Abaixo",tone:"Horror arcano • Exploração",
    summary:"Mineiros de Drakar cantam a mesma melodia dormindo. Túneis inexistentes surgiram sob a montanha.",
    premise:"Um clã de Drakar contratou a companhia depois que trabalhadores começaram a voltar da mina conhecendo versos que nunca aprenderam. Outros clãs querem manter a produção aberta a qualquer custo.",
    location:"Acampamento de Khar-Dor",objective:"Descobrir a origem do canto e impedir que os mineiros percam a própria identidade.",
    opening:[
      "Nas montanhas de Drakar, uma mina fechada significa fome para centenas de famílias. Por isso o clã Khar-Dor manteve os turnos mesmo depois dos primeiros relatos de sonambulismo.",
      "A companhia chega ao acampamento ao anoitecer. Vinte e três mineiros dormem em tendas separadas por ordem dos curandeiros. Quando o sino do turno toca, todos começam a cantar a mesma melodia sem abrir os olhos.",
      "Minutos depois, uma equipe emerge da mina. O capataz afirma que encontrou um corredor que não estava ali pela manhã. Atrás dele, uma jovem mineira completa o próximo verso da canção antes que os adormecidos o cantem."
    ],
    locations:{
      "Acampamento de Khar-Dor":["Examinar os mineiros","Falar com o capataz","Ouvir a canção","Entrar na mina"],
      "Galeria Principal":["Examinar marcas","Seguir o novo túnel","Verificar mapas","Retornar ao acampamento"],
      "Túnel Impossível":["Seguir o canto","Examinar o minério","Procurar sobreviventes","Marcar o caminho"],
      "Câmara do Coro":["Escutar a rede","Tentar comunicar","Interromper o canto","Procurar um núcleo"]
    }
  }
};

const CLUES={
  silencio:{title:"Silêncio impossível",text:"O desaparecimento não deixou sinais normais de evacuação ou combate."},
  livro:{title:"O nome ausente",text:"O livro-caixa termina com alguém incapaz de registrar o próprio nome."},
  sino:{title:"Sino sem mecanismo",text:"O sino toca apesar de a corda e as engrenagens estarem incapazes de movê-lo."},
  lapides:{title:"Nomes por dentro",text:"Lápides parecem perder nomes a partir da própria pedra."},
  desenhos:{title:"Casa com céu dentro",text:"Crianças desenharam repetidamente uma arquitetura impossível antes do desaparecimento."},
  nhal:{title:"Selo de Nhal",text:"A fundação contém engenharia antiga ligada a isolamento de memória."},
  fundacao:{title:"Passagem sob a igreja",text:"Uma estrutura selada existe sob o altar."},
  memoria:{title:"Fenda de memória",text:"A anomalia parece separar identidade e lembrança em vez de simplesmente matar."},
  colecionador:{title:"O Colecionador",text:"Uma entidade usa memórias humanas para estabilizar a própria existência."},
  vidroeco:{title:"Reflexo dinástico",text:"A Coroa não mostra apenas imagem; ela reage a juramentos apagados da história."},
  vidroselos:{title:"Selos autênticos",text:"Documentos rivais possuem materiais e selos compatíveis com arquivos legítimos."},
  cororesp:{title:"Canto compartilhado",text:"Pessoas separadas conhecem a mesma sequência musical sem terem se encontrado."},
  corominerio:{title:"Minério memorial",text:"Veios novos carregam padrões de Éter semelhantes a memória gravada."}
};

const ui={};
[
"introScreen","modeScreen","characterScreen","lobbyScreen","gameScreen","onlineBtn","soloBtn","modeTitle","campaignGrid","onlineControls","soloControls",
"createRoomBtn","roomCodeInput","joinRoomBtn","startSoloCreateBtn","charBackBtn","charName","sexChoices","originChoices","classGrid","classAdvice",
"portraitSigil","previewName","previewMeta","previewBars","previewStats","charStep1","charStep2","charStep3","creationPoints","attributeBuilder","skillPoints",
"skillClassHint","availableSkills","learnedSkills","lockedSkills","toStatsBtn","backIdentityBtn","toSkillsBtn","backStatsBtn","finishCharacterBtn",
"lobbyCampaign","lobbyCode","copyLobbyBtn","lobbyPremise","lobbyPlayers","lobbyVoiceStatus","lobbyVoiceBtn","readyBtn","startCampaignBtn","lobbyRule",
"campaignTitle","modeBadge","roomCode","copyInviteBtn","partyList","connectionStatus","voiceBtn","voiceStatus","selfAvatar","selfName","selfClass","selfStats",
"hpBar","mpBar","hpText","mpText","locationName","worldDay","worldTime","storyLog","dicePrompt","dicePromptLabel","dicePromptHelp","interactiveDie",
"quickActions","actionInput","speechBtn","freeRollBtn","sendActionBtn","objectiveText","clueList","mysteryLabel","mysteryBar","sheetSummary","sheetStats",
"unspentBox","sheetSkills","sheetAvailableSkills","alphaLevelBtn","chatLog","chatInput","chatSendBtn","toast","diceOverlay","diceCard","diceWho","diceResult","diceFormula","audioMount"
].forEach(k=>ui[k]=$(k));

let mode="online";
let selectedCampaign="derenfall";
let selectedSex="Masculino";
let selectedOrigin="Asterfall";
let selectedClass="Guerreiro";
let draft=null;
let player=null;
let state=null;
let room=null;
let roomId="";
let isHost=false;
let p2pReady=false;
let hostPeerId=null;
let localStream=null;
let participants=new Map();
let actions={};
let renderedStoryIds=new Set();
let narrationQueue=Promise.resolve();
let lastRollShown=null;
let currentCharStep=1;

function showScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id)?.classList.add("active");
  window.scrollTo({top:0,behavior:"instant"});
}
function setTheme(id){
  const c=CAMPAIGNS[id]||CAMPAIGNS.derenfall;
  document.body.dataset.theme=c.theme;
}
function toast(msg){
  ui.toast.textContent=msg;ui.toast.classList.add("show");
  clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove("show"),2200);
}
function randomCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";
  for(let i=0;i<4;i++)s+=chars[Math.floor(Math.random()*chars.length)];
  return "NRD-"+s;
}
function persistentPlayerId(){
  let id=localStorage.getItem("cn_player_id");
  if(!id){id=uid();localStorage.setItem("cn_player_id",id)}
  return id;
}
function roomFromUrl(){return new URL(location.href).searchParams.get("room")?.toUpperCase()||""}

function freshDraft(){
  const stats={};Object.keys(ATTRS).forEach(k=>stats[k]=1);
  return {id:persistentPlayerId(),name:"",sex:"Masculino",origin:"Asterfall",className:"Guerreiro",level:1,stats,creationPoints:10,attributePoints:0,skillPoints:2,skills:[],ready:false,characterReady:false};
}
function classSkills(cls=selectedClass){return SKILLS[cls]||[]}
function getSkill(id,cls=player?.className||selectedClass){return classSkills(cls).find(s=>s.id===id)}
function meetsReq(skill,char=draft){
  return Object.entries(skill.req||{}).every(([a,v])=>(char.stats?.[a]||0)>=v);
}
function resourcesFor(char){
  const c=CLASS_DATA[char.className],vig=char.stats.VIG||1,int=char.stats.INT||1;
  const maxHp=c.baseHp+vig*9+(char.level-1)*4;
  const maxMp=c.baseMp+int*6+(char.level-1)*3;
  return {maxHp,maxMp,hp:char.hp==null?maxHp:Math.min(char.hp,maxHp),mp:char.mp==null?maxMp:Math.min(char.mp,maxMp)};
}
function finalizeDraft(){
  const r=resourcesFor(draft);
  player={...clone(draft),...r,characterReady:true,ready:false,icon:CLASS_DATA[draft.className].icon};
  localStorage.setItem("cn_character",JSON.stringify(player));
}

function renderCampaigns(){
  ui.campaignGrid.innerHTML="";
  Object.values(CAMPAIGNS).forEach(c=>{
    const b=document.createElement("button");b.className="campaign-card"+(c.id===selectedCampaign?" active":"");
    b.innerHTML=`<span class="campaign-icon">${c.icon}</span><small>${esc(c.tone)}</small><strong>${esc(c.title)}</strong><p>${esc(c.summary)}</p>`;
    b.onclick=()=>{selectedCampaign=c.id;setTheme(c.id);renderCampaigns()};
    ui.campaignGrid.appendChild(b);
  });
}
window.CN_openMode = which => openMode(which);\nfunction openMode(which){
  mode=which;setTheme(selectedCampaign);
  ui.modeTitle.textContent=which==="solo"?"Campanha Solo":"Campanha Online";
  ui.onlineControls.classList.toggle("hidden",which!=="online");
  ui.soloControls.classList.toggle("hidden",which!=="solo");
  renderCampaigns();showScreen("modeScreen");
}

function resetDraft(){
  draft=freshDraft();selectedSex=draft.sex;selectedOrigin=draft.origin;selectedClass=draft.className;currentCharStep=1;
  ui.charName.value="";renderCharacterBuilder();goCharStep(1);
}
function beginCharacter(){
  resetDraft();showScreen("characterScreen");
}
function renderCharacterBuilder(){
  renderSexes();renderOrigins();renderClasses();renderAttributes();renderSkills();renderPreview();
}
function renderSexes(){
  const options=["Masculino","Feminino","Não especificar"];ui.sexChoices.innerHTML="";
  options.forEach(v=>{const b=document.createElement("button");b.className="choice-chip"+(selectedSex===v?" active":"");b.textContent=v;b.onclick=()=>{selectedSex=v;draft.sex=v;renderSexes();renderPreview()};ui.sexChoices.appendChild(b)});
}
function renderOrigins(){
  ui.originChoices.innerHTML="";
  Object.entries(ORIGINS).forEach(([id,o])=>{const b=document.createElement("button");b.className="origin-card"+(selectedOrigin===id?" active":"");b.innerHTML=`<strong>${o.icon} ${esc(o.name)}</strong><small>${esc(o.text)}</small>`;b.onclick=()=>{selectedOrigin=id;draft.origin=id;renderOrigins();renderPreview()};ui.originChoices.appendChild(b)});
}
function renderClasses(){
  ui.classGrid.innerHTML="";
  Object.entries(CLASS_DATA).forEach(([name,c])=>{const b=document.createElement("button");b.className="class-choice"+(selectedClass===name?" active":"");b.innerHTML=`<b>${c.icon} ${name}</b><small>${c.role}</small>`;b.onclick=()=>{selectedClass=name;draft.className=name;draft.skills=[];draft.skillPoints=2;renderClasses();renderClassAdvice();renderSkills();renderPreview()};ui.classGrid.appendChild(b)});
  renderClassAdvice();
}
function renderClassAdvice(){
  const c=CLASS_DATA[selectedClass];
  ui.classAdvice.innerHTML=`<strong>Dica para ${selectedClass}:</strong> ${c.hint}<br><strong>Atributos recomendados:</strong> ${c.recommend.map(a=>ATTRS[a].name).join(" + ")}.`;
  ui.skillClassHint.innerHTML=`<strong>Como ler os requisitos:</strong> habilidades mostram os atributos mínimos necessários. ${c.hint} Você pode montar uma versão diferente da classe; os requisitos existem para manter coerência mecânica.`;
}
function renderAttributes(){
  ui.creationPoints.textContent=draft.creationPoints;ui.attributeBuilder.innerHTML="";
  Object.entries(ATTRS).forEach(([key,a])=>{
    const rec=CLASS_DATA[selectedClass].recommend.includes(key);
    const row=document.createElement("div");row.className="attribute-row";
    row.innerHTML=`<div class="attribute-top"><div><strong>${a.name} (${key})</strong><span>${esc(a.desc)}</span></div>${rec?'<span class="attr-note">RECOMENDADO</span>':""}</div><div class="attribute-controls"><button class="attr-btn minus">−</button><span class="attr-value">${draft.stats[key]}</span><button class="attr-btn plus">+</button></div>`;
    row.querySelector(".minus").onclick=()=>changeCreationAttr(key,-1);
    row.querySelector(".plus").onclick=()=>changeCreationAttr(key,1);
    ui.attributeBuilder.appendChild(row);
  });
}
function changeCreationAttr(key,delta){
  const cur=draft.stats[key];
  if(delta>0&&(draft.creationPoints<=0||cur>=5))return;
  if(delta<0&&cur<=1)return;
  draft.stats[key]+=delta;draft.creationPoints-=delta;
  renderAttributes();renderSkills();renderPreview();
}
function skillCard(skill,type="available",char=draft){
  const req=Object.entries(skill.req||{}).map(([a,v])=>`${a} ${v}`).join(" • ");
  const can=meetsReq(skill,char);
  return `<article class="skill-card ${type} ${!can&&type==="available"?"locked":""}" data-skill="${skill.id}"><strong>${esc(skill.name)}</strong><p>${esc(skill.desc)}</p><div class="tags"><span>Nv. ${skill.level}</span><span>${esc(skill.cost)}</span>${req?`<span>${req}</span>`:""}</div>${type==="available"&&can?'<button title="Aprender">+</button>':""}</article>`;
}
function renderSkills(){
  if(!draft)return;
  const skills=classSkills(selectedClass);
  const learned=new Set(draft.skills);
  const available=skills.filter(s=>s.level<=draft.level&&!learned.has(s.id));
  const locked=skills.filter(s=>s.level>draft.level);
  ui.skillPoints.textContent=draft.skillPoints;
  ui.availableSkills.innerHTML=available.length?available.map(s=>skillCard(s,"available")).join(""):'<p class="muted">Nenhuma habilidade disponível.</p>';
  ui.learnedSkills.innerHTML=draft.skills.length?draft.skills.map(id=>getSkill(id,selectedClass)).filter(Boolean).map(s=>skillCard(s,"learned")).join(""):'<p class="muted">Nenhuma habilidade aprendida.</p>';
  ui.lockedSkills.innerHTML=locked.map(s=>skillCard(s,"locked")).join("");
  ui.availableSkills.querySelectorAll(".skill-card.available button").forEach(b=>b.onclick=()=>learnDraftSkill(b.closest(".skill-card").dataset.skill));
}
function learnDraftSkill(id){
  if(draft.skillPoints<=0)return toast("Você já gastou seus pontos de habilidade iniciais.");
  const s=getSkill(id,selectedClass);if(!s||!meetsReq(s,draft))return toast("Os atributos ainda não atendem aos requisitos.");
  if(!draft.skills.includes(id)){draft.skills.push(id);draft.skillPoints--;renderSkills();renderPreview()}
}
function renderPreview(){
  if(!draft)return;
  draft.name=ui.charName.value.trim();
  const c=CLASS_DATA[selectedClass],r=resourcesFor(draft);
  ui.portraitSigil.innerHTML=`<span>${c.icon}</span>`;
  ui.previewName.textContent=draft.name||"Aventureiro";
  ui.previewMeta.textContent=`${selectedClass} • ${ORIGINS[selectedOrigin].name} • ${selectedSex}`;
  ui.previewBars.innerHTML=`<div class="preview-bar"><span>HP</span><i><b style="width:100%"></b></i><strong>${r.maxHp}</strong></div><div class="preview-bar"><span>MP</span><i><b style="width:100%"></b></i><strong>${r.maxMp}</strong></div>`;
  ui.previewStats.innerHTML=Object.entries(draft.stats).map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join("");
}
function goCharStep(n){
  currentCharStep=n;
  [1,2,3].forEach(i=>$("charStep"+i).classList.toggle("active",i===n));
  document.querySelectorAll(".step-pills span").forEach((x,i)=>x.classList.toggle("active",i===n-1));
  if(n===2){draft.name=ui.charName.value.trim();renderAttributes();renderPreview()}
  if(n===3)renderSkills();
}
function validateIdentity(){
  draft.name=ui.charName.value.trim();draft.sex=selectedSex;draft.origin=selectedOrigin;draft.className=selectedClass;
  if(draft.name.length<2){toast("Escolha um nome para o personagem.");return false}
  return true;
}
function validateStats(){
  if(draft.creationPoints!==0){toast("Distribua todos os 10 pontos antes de continuar.");return false}
  return true;
}
function finishCharacter(){
  if(draft.skillPoints!==0){toast("Escolha as 2 habilidades iniciais.");return}
  finalizeDraft();
  if(mode==="solo"){startSoloCampaign()}
  else{showLobby();hello()}
}

function createInitialState(campaignId){
  const c=CAMPAIGNS[campaignId];
  return {version:"0.2",campaignId,campaign:c.title,location:c.location,worldMinutes:18*60+40,day:1,pressure:0,clues:[],objective:c.objective,ended:false,ending:null,pendingRoll:null,lastRoll:null,
    story:c.opening.map((text,i)=>({id:uid(),type:i===0?"system":"master",who:i===0?"Prólogo":"Mestre Máquina",text,ts:Date.now()+i}))
  };
}
function worldTime(){
  if(!state)return {day:1,time:"--:--"};
  const total=state.worldMinutes,extra=Math.floor(total/1440),m=total%1440;
  return {day:state.day+extra,time:String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")};
}
function advanceTime(n=5){if(state){state.worldMinutes+=n;state.pressure=Math.min(5,Math.max(state.pressure,Math.floor(Math.max(0,state.worldMinutes-(18*60+40))/95)))}}
function addStory(type,who,text,roll=null){
  state.story.push({id:uid(),type,who,text,roll,ts:Date.now()});
  if(state.story.length>220)state.story=state.story.slice(-220);
}
function addClue(id){
  if(!state.clues.includes(id)){state.clues.push(id);const c=CLUES[id];if(c)addStory("system","Pista descoberta",c.title+": "+c.text)}
}
function finishEnding(title,text){
  state.ended=true;state.ending=title;state.objective="Desfecho alcançado: "+title;addStory("system","DESFECHO — "+title,text);
}
function moveTo(dest,text=null){
  state.location=dest;advanceTime(6);
  addStory("master","Mestre Máquina",text||`A companhia segue para ${dest}. O ambiente muda e novas possibilidades se abrem.`);
}

function statFor(text){
  const n=norm(text);
  if(/forca|arrom|quebr|ergu|segur|golpe|atac/.test(n))return "FOR";
  if(/mag|eter|ritual|selo|arcano|estud|formula/.test(n))return "INT";
  if(/corr|esquiv|furt|silenc|subir|saltar|equilibr/.test(n))return "AGI";
  if(/convenc|persu|engan|falar|negoci|lider/.test(n))return "PRE";
  if(/resist|veneno|aguent|segurar/.test(n))return "VIG";
  return "PER";
}
function requestRoll(actor,stat,df,label,context){
  if(state.pendingRoll){return false}
  state.pendingRoll={id:uid(),assignedPlayerId:actor.id,assignedName:actor.name,stat,df,label,context};
  addStory("system","Teste necessário",`${actor.name} precisa realizar um teste de ${ATTRS[stat].name} (DF ${df}). O resultado só será gerado quando o jogador tocar no D20.`);
  broadcastState();renderState();return true;
}
function handleRollTap(playerId){
  if(!isHost&&mode==="online")return;
  const p=state?.pendingRoll;if(!p||p.assignedPlayerId!==playerId)return;
  const actor=findActorById(playerId);if(!actor)return;
  const d20=1+Math.floor(Math.random()*20),bonus=actor.stats?.[p.stat]||0,total=d20+bonus;
  const result={id:uid(),rollId:p.id,playerId,who:actor.name,d20,bonus,total,stat:p.stat,df:p.df,success:total>=p.df,critical:d20===20,fumble:d20===1,formula:`1d20 (${d20}) + ${p.stat} ${bonus>=0?"+":""}${bonus} = ${total} vs DF ${p.df}`};
  state.lastRoll=result;const context=clone(p.context);state.pendingRoll=null;
  addStory("system","Resultado do dado",`${actor.name}: ${result.formula}`,result.formula);
  resolveRollContext(actor,result,context);saveHostState();renderState();broadcastState();
}
function findActorById(id){
  if(player?.id===id)return player;
  for(const p of participants.values())if(p.id===id)return p;
  return null;
}

function resolveDerenfall(actor,text){
  const n=norm(text),loc=state.location;
  if(/sair da vila|ir embora|abandonar derenfall|seguir viagem/.test(n)){state.pressure=Math.min(5,state.pressure+1);advanceTime(75);addStory("master","Mestre Máquina","Vocês deixam Derenfall. O mundo permite a escolha. Horas depois, porém, um viajante cruza a estrada sem lembrar de onde veio. A anomalia não ficou confinada à vila.");state.objective="Decidir se retornam a Derenfall ou acompanham a propagação da anomalia.";return}
  if(loc==="Estrada de Derenfall"&&/entrar|vila|portao|praça|praca/.test(n)){moveTo("Praça de Derenfall","Ao atravessar o portão, a sensação piora. Uma carroça tombada bloqueia parte da praça. Comida ainda está servida em uma casa aberta. Então o sino da igreja toca uma vez — embora ninguém esteja na torre.");return}
  if(loc==="Igreja"&&/tocar|puxar.*sino/.test(n)){advanceTime(3);addClue("sino");addStory("master","Mestre Máquina","O sino toca sem que o badalo se mova. Por um instante, cada aventureiro se lembra de uma casa da infância. Sob o altar, alguma coisa responde com três batidas abafadas.");addClue("fundacao");return}
  if(/descer|entrar.*passagem|subsolo|cripta|abrir.*fundacao/.test(n)&&(loc==="Igreja"||loc==="Capela Antiga")){
    if(state.clues.includes("fundacao")){moveTo("Fenda Memorial","A passagem não termina em terra. Ela se abre para ruas de Derenfall repetidas como lembranças imperfeitas, portas suspensas no vazio e vozes que chamam nomes esquecidos.");state.objective="Encontrar os moradores e descobrir quem controla a Fenda.";addClue("memoria")}else addStory("master","Mestre Máquina","Vocês suspeitam de uma estrutura subterrânea, mas ainda não identificaram o acesso. A igreja e a capela antiga oferecem pistas.");return}
  if(loc==="Fenda Memorial"&&/seguir|vozes|morador|chamar|avancar|avançar|responsavel/.test(n)){requestRoll(actor,"PER",11,"Encontrar o coração da Fenda",{kind:"deren_fenda"});return}
  if(loc==="Salão das Memórias"){
    if(/negoci|acordo|convers|pergunt|falar/.test(n)){advanceTime(4);addStory("master","Colecionador","— Posso devolver cada pessoa. Posso devolver quase tudo. Mas uma memória que realmente tenha peso deve ficar comigo. Uma lembrança oferecida por alguém que ainda sabe quem é.");state.objective="Escolher entre negociar, selar a Fenda ou enfrentar o Colecionador.";return}
    if(/selar|ritual|selo/.test(n)){requestRoll(actor,"INT",16,"Selar a Fenda",{kind:"deren_seal"});return}
    if(/atac|destruir|matar|golpe/.test(n)){requestRoll(actor,"FOR",14,"Romper o núcleo do Colecionador",{kind:"deren_attack"});return}
    if(/ofere|memoria|lembranca|sacrific/.test(n)){addStory("master","Mestre Máquina","O Colecionador aceita a oferta. Um fio de luz deixa o aventureiro e centenas de moradores começam a lembrar seus nomes. A lembrança oferecida, porém, não volta.");finishEnding("O Preço de uma Lembrança","Derenfall retorna quase inteira, mas uma ausência pessoal acompanha a companhia para histórias futuras.");return}
  }
  const dest=inferDestination("derenfall",text);
  if(dest&&dest!==loc&&(/ir|entrar|seguir|andar|voltar|visitar|aproxim/.test(n)||n.includes(norm(dest)))){moveTo(dest,derenfallArrival(dest));return}
  if(/investig|procur|exam|observar|rastre|escut|ler|analis|vasculh/.test(n)){requestRoll(actor,statFor(text),12,"Investigar "+loc,{kind:"deren_investigate",location:loc,text});return}
  if(/tentar|forcar|forçar|convenc|saltar|escalar|arrombar|enganar/.test(n)){requestRoll(actor,statFor(text),12,"Resolver a ação",{kind:"generic",text});return}
  advanceTime(2);addStory("master","Mestre Máquina","A ação é possível e altera a posição da companhia. O ambiente responde sem forçar um caminho único. O que vocês fazem com essa nova situação?");
}
function derenfallArrival(dest){
  return {
    "Igreja":"A igreja está vazia. Três cordas descem da torre, mas uma está rompida e as engrenagens parecem travadas. Mesmo assim, o bronze vibra suavemente.",
    "Hospedaria":"Canecas ainda contêm bebida. Um prato de ensopado está morno. Sobre o balcão, o livro-caixa permanece aberto.",
    "Cemitério":"A chuva corre pelas lápides. Algumas inscrições parecem estranhamente incompletas, como se nomes estivessem desaparecendo da pedra.",
    "Escola":"Carteiras pequenas permanecem alinhadas. Dezenas de desenhos infantis mostram a mesma casa com um céu violeta no lugar do teto.",
    "Poço":"A água está imóvel. Ao se aproximarem, uma voz familiar sobe da escuridão — mas erra um detalhe que essa pessoa jamais erraria.",
    "Capela Antiga":"Atrás do cemitério, raízes cobrem uma estrutura mais antiga que a vila. Sob o musgo existe geometria pré-Ruptura.",
    "Praça de Derenfall":"A praça continua congelada no meio de tarefas interrompidas."
  }[dest]||`Vocês chegam a ${dest}.`;
}
function resolveGenericCampaign(actor,text){
  const c=CAMPAIGNS[state.campaignId],n=norm(text),dest=inferDestination(state.campaignId,text);
  if(dest&&dest!==state.location&&(/ir|entrar|seguir|andar|voltar|visitar|aproxim/.test(n)||n.includes(norm(dest)))){moveTo(dest,`A companhia segue para ${dest}. O tom da aventura muda com o lugar, e novas pessoas, riscos e evidências entram em cena.`);return}
  if(/investig|procur|exam|observar|rastre|escut|ler|analis|vasculh|compar/.test(n)){requestRoll(actor,statFor(text),12,"Investigar "+state.location,{kind:"campaign_investigate",campaignId:state.campaignId,location:state.location,text});return}
  if(/convenc|negoci|engan|interrogar|persu/.test(n)){requestRoll(actor,"PRE",13,"Influenciar a situação",{kind:"campaign_social",campaignId:state.campaignId,text});return}
  if(/tentar|forcar|forçar|saltar|escalar|arrombar|atacar/.test(n)){requestRoll(actor,statFor(text),13,"Resolver a ação",{kind:"generic",text});return}
  advanceTime(3);addStory("master","Mestre Máquina",`A ação muda o contexto em ${state.location}. O Mestre mantém o foco da campanha — ${c.tone} — mas aceita a direção escolhida pela companhia e apresenta uma consequência observável.`);
}
function inferDestination(campaignId,text){
  const n=norm(text),c=CAMPAIGNS[campaignId];
  for(const loc of Object.keys(c.locations)){if(n.includes(norm(loc)))return loc}
  if(campaignId==="derenfall"){
    if(/igreja|altar|sino/.test(n))return "Igreja";if(/hosped|taverna|estalagem/.test(n))return "Hospedaria";if(/cemiter|lapide/.test(n))return "Cemitério";if(/escola|desenho/.test(n))return "Escola";if(/poco/.test(n))return "Poço";if(/capela/.test(n))return "Capela Antiga";if(/praca|centro/.test(n))return "Praça de Derenfall";
  }
  if(campaignId==="vidro"){if(/arquivo/.test(n))return "Arquivos Reais";if(/casa|distrito/.test(n))return "Distrito das Casas";if(/cripta/.test(n))return "Cripta Dinástica";if(/salao|salão|coroa/.test(n))return "Salão dos Juramentos"}
  if(campaignId==="coro"){if(/acamp/.test(n))return "Acampamento de Khar-Dor";if(/galeria|mina principal/.test(n))return "Galeria Principal";if(/tunel|túnel/.test(n))return "Túnel Impossível";if(/camara|câmara|coro/.test(n))return "Câmara do Coro"}
  return null;
}
function processIntent(actor,text){
  if(!state||state.ended)return;
  if(state.pendingRoll){toast("Há um teste aguardando o D20 antes da próxima ação.");return}
  addStory("player",actor.name,text);
  if(state.campaignId==="derenfall")resolveDerenfall(actor,text);else resolveGenericCampaign(actor,text);
  saveHostState();renderState();broadcastState();
}
function resolveRollContext(actor,r,ctx){
  if(!ctx)return;
  if(ctx.kind==="generic"){
    addStory("master","Mestre Máquina",r.success?"A tentativa funciona. O resultado altera a cena a favor da companhia, respeitando o método descrito.":"A tentativa não alcança o objetivo completo. Em vez de bloquear a aventura, surge um custo, atraso ou nova pressão.",r.formula);advanceTime(5);return;
  }
  if(ctx.kind==="deren_fenda"){
    addStory("master","Mestre Máquina",r.success?"Seguindo ecos que repetem nomes incompletos, vocês atravessam uma porta suspensa e alcançam um salão atravessado por fios de luz. Uma criatura feita de máscaras se ergue no centro.\n\n— Vocês ainda carregam seus nomes — ela diz. — Que desperdício.":"As ruas se repetem e tentam separar o grupo usando vozes conhecidas. Vocês permanecem juntos, mas chegam ao centro da anomalia depois de perder a noção de distância.",r.formula);
    moveTo("Salão das Memórias");addClue("colecionador");state.objective="Decidir como recuperar as memórias de Derenfall.";return;
  }
  if(ctx.kind==="deren_seal"){
    if(r.success&&state.clues.includes("nhal")){addStory("master","Mestre Máquina","O padrão de Nhal funciona como âncora. Os fios de memória retornam aos moradores enquanto a Fenda perde forma.",r.formula);finishEnding("Selo de Nhal","Os moradores retornam com a maior parte das memórias preservada. A tecnologia descoberta pode atrair facções em campanhas futuras.")}
    else addStory("master","Mestre Máquina","O ritual encontra resistência. Vocês entendem parte do mecanismo, mas falta uma âncora mais precisa — conhecimento de Nhal, um objeto ligado à vila ou preparação adicional.",r.formula);return;
  }
  if(ctx.kind==="deren_attack"){
    if(r.success){addStory("master","Mestre Máquina","O golpe rompe máscaras e os fios de luz entram em colapso. Fica claro que destruir a entidade também pode destruir memórias armazenadas.",r.formula);state.objective="Continuar o ataque aceitando perdas, ou mudar de estratégia.";if(r.critical)finishEnding("Ruptura do Colecionador","O núcleo cede. Derenfall retorna, mas algumas pessoas perdem lembranças importantes.")}
    else addStory("master","Mestre Máquina","A entidade dobra o espaço e o golpe atravessa uma lembrança em vez do núcleo. Ela agora trata a companhia como ameaça direta.",r.formula);return;
  }
  if(ctx.kind==="deren_investigate"){
    resolveDerenInvestigation(actor,r,ctx.location,ctx.text);return;
  }
  if(ctx.kind==="campaign_investigate"){
    resolveCampaignInvestigation(actor,r,ctx.campaignId,ctx.location,ctx.text);return;
  }
  if(ctx.kind==="campaign_social"){
    addStory("master","Mestre Máquina",r.success?"A abordagem encontra uma abertura real. O NPC ou grupo não muda de personalidade, mas aceita conversar, revelar um interesse ou fazer uma proposta.":"A pressão social não convence de imediato. Em vez de encerrar a conversa, a outra parte estabelece uma condição, pede prova ou endurece sua posição.",r.formula);advanceTime(5);return;
  }
}
function resolveDerenInvestigation(actor,r,loc,text){
  let result="";
  if(loc==="Estrada de Derenfall"){result=r.success?"Na lama há marcas de carroça e passos interrompidos perto do portão. Ninguém parece ter fugido pela estrada.":"A chuva destruiu quase todos os rastros, mas não existem marcas suficientes para uma evacuação.";addClue("silencio")}
  else if(loc==="Praça de Derenfall"){result=r.success?"A carroça caiu enquanto era descarregada. Nada foi saqueado. Tarefas em casas diferentes foram interrompidas quase no mesmo momento.":"O lugar parece congelado no meio de uma rotina. Não há sinais de batalha.";addClue("silencio")}
  else if(loc==="Hospedaria"){result=r.success?"A última anotação do livro começa firme: 'Cobrei dois quartos. Preparei a ceia. Meu nome é...' Depois há dezenas de tentativas vazias.":"O livro confirma atividade recente, mas a última assinatura está estranhamente incompleta.";addClue("livro")}
  else if(loc==="Igreja"){result=r.success?"Sob o altar, a pedra responde com eco oco. Um encaixe circular esconde uma abertura lacrada por símbolos quase apagados.":"O piso do altar não pertence à construção original. Há algo sob a igreja, mas o acesso ainda não está claro.";addClue("sino");if(r.success)addClue("fundacao")}
  else if(loc==="Cemitério"){result=r.success?"As fissuras partem de dentro das letras das lápides, como se a pedra tivesse esquecido quem deveria registrar.":"Vários nomes estão parcialmente apagados de modo impossível para ferramentas comuns.";addClue("lapides")}
  else if(loc==="Escola"){result=r.success?"As datas mostram que a 'casa com céu dentro' começou a aparecer semanas antes do desaparecimento. Crianças diferentes desenharam a mesma figura de muitos rostos.":"Desenhos repetem a mesma arquitetura impossível vezes demais para ser coincidência.";addClue("desenhos")}
  else if(loc==="Capela Antiga"){result=r.success?"O símbolo corresponde a técnicas de Nhal para separar memória de matéria. Uma linha aponta para a fundação da igreja.":"O símbolo é pré-Ruptura e foi coberto deliberadamente por reformas.";addClue("nhal");if(r.success)addClue("fundacao")}
  else if(loc==="Poço"){result=r.success?"O som não nasce do fundo. A voz se forma acima da água como lembrança reproduzida no lugar errado.":"A voz imita alguém importante, mas erra detalhes íntimos.";addClue("memoria")}
  else if(loc==="Fenda Memorial"){result=r.success?"As ruas repetidas estão ligadas a memórias dos moradores. Silhuetas humanas caminham sem reconhecer as próprias casas.":"Vocês encontram moradores vivos, mas eles olham seus lares como cenários desconhecidos.";addClue("memoria")}
  else if(loc==="Salão das Memórias"){result=r.success?"Fios luminosos conectam máscaras do Colecionador às lembranças humanas. Destruí-lo sem preparar a devolução pode romper vínculos.":"O Colecionador não apenas guarda memórias; ele depende delas.";addClue("colecionador")}
  else result=r.success?"A investigação encontra uma evidência útil que reduz hipóteses possíveis.":"A busca revela apenas sinais incompletos, mas não bloqueia a continuação.";
  if(r.critical)result+=" Um segundo detalhe aparece com clareza extraordinária.";
  if(r.fumble)result+=" A busca também causa ruído, atraso ou deixa um sinal da presença do grupo.";
  addStory("master","Mestre Máquina",result,r.formula);advanceTime(7);
}
function resolveCampaignInvestigation(actor,r,cid,loc,text){
  if(cid==="vidro"){
    if(loc==="Salão dos Juramentos"){addClue("vidroeco");addStory("master","Mestre Máquina",r.success?"O cristal possui uma assinatura de memória, não de profecia. O segundo soberano parece ligado a um juramento real que foi retirado dos registros.":"A Coroa reage a palavras de juramento e nomes dinásticos. Ela não se comporta como simples objeto cerimonial.",r.formula)}
    else if(loc==="Arquivos Reais"){addClue("vidroselos");addStory("master","Mestre Máquina",r.success?"Papel, cera e numeração indicam que ao menos dois documentos rivais nasceram dentro do próprio sistema de arquivos. A contradição é histórica, não uma falsificação recente comum.":"Os selos resistem a verificações simples. Será necessário comparar cadeia de custódia, juramentos e cópias antigas.",r.formula)}
    else addStory("master","Mestre Máquina",r.success?"A investigação encontra uma ligação entre interesses atuais e um juramento apagado da história do reino.":"Você encontra versões conflitantes. A verdade política continua acessível por outras fontes.",r.formula);
  }else{
    if(loc==="Acampamento de Khar-Dor"){addClue("cororesp");addStory("master","Mestre Máquina",r.success?"Os mineiros cantam exatamente no mesmo ritmo, mesmo dormindo em tendas afastadas. Um deles antecipa notas que os outros ainda não emitiram.":"O padrão é coordenado demais para ser coincidência ou canção comum.",r.formula)}
    else if(loc==="Túnel Impossível"||loc==="Câmara do Coro"){addClue("corominerio");addStory("master","Mestre Máquina",r.success?"O minério contém padrões repetitivos de Éter semelhantes a registros mentais. A montanha está armazenando algo que tenta se recompor usando os vivos.":"O veio reage a voz e memória. Não parece um predador simples.",r.formula)}
    else addStory("master","Mestre Máquina",r.success?"A investigação revela que o canto acompanha uma estrutura física abaixo da mina, dando ao grupo uma direção concreta.":"Os sinais continuam ambíguos, mas a hipótese de uma causa subterrânea ganha força.",r.formula);
  }
  advanceTime(7);
}

function renderState(){
  if(!state)return;
  const c=CAMPAIGNS[state.campaignId];
  setTheme(state.campaignId);ui.campaignTitle.textContent=c.title;ui.locationName.textContent=state.location;ui.objectiveText.textContent=state.objective;
  const wt=worldTime();ui.worldDay.textContent="Dia "+wt.day;ui.worldTime.textContent=wt.time;
  const labels=state.campaignId==="vidro"?["Cerimônia","Rumores","Pressão","Alianças","Crise","Ruptura"]:state.campaignId==="coro"?["Sussurros","Canção","Contágio","Descida","Convergência","Assimilação"]:["Silêncio","Ecos","Substituições","Vazamento","Ancoragem","Propagação"];
  ui.mysteryLabel.textContent=labels[state.pressure]||labels[0];ui.mysteryBar.style.width=(8+state.pressure*18)+"%";
  renderStory();renderClues();renderQuickActions();renderDicePrompt();renderSheet();checkLastRoll();
}
function renderStory(){
  for(const e of state.story){
    if(renderedStoryIds.has(e.id))continue;renderedStoryIds.add(e.id);
    narrationQueue=narrationQueue.then(()=>appendStoryEntry(e,e.type==="master"||e.type==="system"));
  }
}
async function appendStoryEntry(e,animate){
  const div=document.createElement("article");div.className="story-entry "+e.type;
  div.innerHTML=`<div class="entry-head"><strong>${esc(e.who)}</strong><span>${new Date(e.ts||Date.now()).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div><p></p>${e.roll?`<span class="roll-line">${esc(e.roll)}</span>`:""}`;
  ui.storyLog.appendChild(div);const p=div.querySelector("p");
  if(!animate){p.textContent=e.text;ui.storyLog.scrollTop=ui.storyLog.scrollHeight;return}
  p.classList.add("cursor-word");const words=String(e.text).split(/(\s+)/);let out="";
  for(const w of words){out+=w;p.textContent=out;ui.storyLog.scrollTop=ui.storyLog.scrollHeight;if(w.trim())await sleep(46)}
  p.classList.remove("cursor-word");ui.storyLog.scrollTop=ui.storyLog.scrollHeight;
}
function renderClues(){
  const arr=state.clues.map(id=>CLUES[id]).filter(Boolean);
  ui.clueList.innerHTML=arr.length?arr.map(c=>`<div class="clue"><b>✦ ${esc(c.title)}</b>${esc(c.text)}</div>`).join(""):'<p class="muted">Nenhuma pista registrada ainda.</p>';
}
function renderQuickActions(){
  const list=CAMPAIGNS[state.campaignId].locations[state.location]||["Observar ao redor","Conversar com a companhia","Investigar"];
  ui.quickActions.innerHTML="";list.forEach(label=>{const b=document.createElement("button");b.textContent=label;b.onclick=()=>submitIntent(label);ui.quickActions.appendChild(b)});
}
function renderDicePrompt(){
  const p=state.pendingRoll;if(!p){ui.dicePrompt.classList.add("hidden");return}
  ui.dicePrompt.classList.remove("hidden");ui.dicePromptLabel.textContent=`${p.label} • ${ATTRS[p.stat].name} • DF ${p.df}`;
  const mine=p.assignedPlayerId===player.id;ui.interactiveDie.disabled=!mine;ui.dicePromptHelp.textContent=mine?"Toque no D20 para realizar o teste.":`Aguardando ${p.assignedName} rolar o D20.`;
}
function checkLastRoll(){
  const r=state.lastRoll;if(!r||r.id===lastRollShown)return;lastRollShown=r.id;showDiceOverlay(r.who,r.d20,r.formula);
}
function showDiceOverlay(who,result,formula){
  ui.diceWho.textContent=who;ui.diceResult.textContent=result;ui.diceFormula.textContent=formula;ui.diceOverlay.classList.remove("hidden");ui.diceCard.classList.add("rolling");
  setTimeout(()=>ui.diceCard.classList.remove("rolling"),760);setTimeout(()=>ui.diceOverlay.classList.add("hidden"),1500);
}
function renderSelf(){
  if(!player)return;const r=resourcesFor(player);player={...player,...r};
  ui.selfAvatar.textContent=(player.name[0]||"N").toUpperCase();ui.selfName.textContent=player.name;ui.selfClass.textContent=`${CLASS_DATA[player.className].icon} ${player.className} • Nv. ${player.level}`;
  ui.hpText.textContent=`${player.hp}/${player.maxHp}`;ui.mpText.textContent=`${player.mp}/${player.maxMp}`;ui.hpBar.style.width=(player.hp/player.maxHp*100)+"%";ui.mpBar.style.width=(player.mp/player.maxMp*100)+"%";
  ui.selfStats.innerHTML=Object.entries(player.stats).map(([k,v])=>`<span>${k}<b>${v}</b></span>`).join("");
}
function renderParty(){
  if(!player)return;
  const all=[{...player,isHost},...Array.from(participants.values())];const seen=new Set();ui.partyList.innerHTML="";
  all.filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return true}).forEach(p=>{const el=document.createElement("div");el.className="party-person";el.innerHTML=`<div class="mini-avatar">${esc((p.name||"?")[0].toUpperCase())}</div><span class="dot"></span><div><strong>${esc(p.name||"Jogador")}${p.isHost?" 👑":""}</strong><small>${CLASS_DATA[p.className]?.icon||"⚔️"} ${esc(p.className||"Aventureiro")} • Nv. ${p.level||1}</small></div>`;ui.partyList.appendChild(el)});
}
function renderSheet(){
  if(!player)return;
  ui.sheetSummary.innerHTML=`<div class="sheet-hero"><strong>${esc(player.name)}</strong><span>${esc(player.sex)} • ${esc(ORIGINS[player.origin]?.name||player.origin)} • ${esc(player.className)} • Nível ${player.level}</span></div>`;
  ui.sheetStats.innerHTML=Object.entries(player.stats).map(([k,v])=>`<div class="sheet-stat"><span>${ATTRS[k].name}</span><b>${v}</b></div>`).join("");
  if(player.attributePoints>0){ui.unspentBox.classList.remove("hidden");ui.unspentBox.innerHTML=`<strong>${player.attributePoints} ponto(s) de atributo disponível(is).</strong><br><small>Use + ao lado do atributo abaixo:</small>`+Object.keys(ATTRS).map(k=>`<div style="margin-top:5px">${ATTRS[k].name} (${player.stats[k]}) <button data-attr="${k}">+</button></div>`).join("");ui.unspentBox.querySelectorAll("button").forEach(b=>b.onclick=()=>spendAttributePoint(b.dataset.attr))}
  else ui.unspentBox.classList.add("hidden");
  ui.sheetSkills.innerHTML=player.skills.length?player.skills.map(id=>getSkill(id,player.className)).filter(Boolean).map(s=>`<div class="mini-skill"><strong>${esc(s.name)}</strong>${esc(s.desc)}</div>`).join(""):'<p class="muted">Nenhuma habilidade aprendida.</p>';
  const avail=classSkills(player.className).filter(s=>s.level<=player.level&&!player.skills.includes(s.id));
  ui.sheetAvailableSkills.innerHTML=avail.length?avail.map(s=>`<div class="mini-skill"><button data-skill="${s.id}" ${player.skillPoints>0&&meetsReq(s,player)?"":"disabled"}>Aprender</button><strong>${esc(s.name)}</strong>Nv. ${s.level} • ${Object.entries(s.req).map(([a,v])=>a+" "+v).join(" • ")}</div>`).join(""):'<p class="muted">Nenhuma habilidade disponível.</p>';
  ui.sheetAvailableSkills.querySelectorAll("button:not([disabled])").forEach(b=>b.onclick=()=>learnGameSkill(b.dataset.skill));
}
function spendAttributePoint(attr){
  if(!player.attributePoints||player.stats[attr]>=7)return;player.stats[attr]++;player.attributePoints--;Object.assign(player,resourcesFor(player));persistCharacter();renderSelf();renderSheet();hello();
}
function learnGameSkill(id){
  if(player.skillPoints<=0)return toast("Você não tem pontos de habilidade.");
  const s=getSkill(id,player.className);if(!s||player.skills.includes(id)||s.level>player.level||!meetsReq(s,player))return;
  player.skills.push(id);player.skillPoints--;persistCharacter();renderSheet();hello();toast("Habilidade aprendida: "+s.name);
}
function levelUpAlpha(){
  if(!player||player.level>=20)return toast("Nível máximo desta progressão.");
  player.level++;player.attributePoints=(player.attributePoints||0)+1;player.skillPoints=(player.skillPoints||0)+1;Object.assign(player,resourcesFor(player));persistCharacter();renderSelf();renderSheet();hello();
  toast(`Nível ${player.level}! +1 atributo e +1 habilidade.`);
}
function persistCharacter(){localStorage.setItem("cn_character",JSON.stringify(player))}

function submitIntent(text=null){
  const v=(text??ui.actionInput.value).trim();if(!v||!state)return;ui.actionInput.value="";
  if(state.pendingRoll)return toast("Resolva o teste de D20 antes da próxima ação.");
  if(mode==="solo"||isHost)processIntent(player,v);
  else if(actions.sendIntent&&p2pReady){actions.sendIntent({text:v,player:publicCharacter(player)});toast("Ação enviada ao Mestre Máquina.");}
  else toast("Aguardando conexão com o anfitrião.");
}
function publicCharacter(p){return {id:p.id,name:p.name,sex:p.sex,origin:p.origin,className:p.className,level:p.level,stats:p.stats,skills:p.skills,icon:p.icon,ready:p.ready,characterReady:p.characterReady}}
function soloFreeRoll(){const d=1+Math.floor(Math.random()*20);showDiceOverlay(player?.name||"Jogador",d,"1d20 = "+d);if((mode==="solo"||isHost)&&state){addStory("system","Rolagem livre",`${player.name} rolou um D20.`,`1d20 = ${d}`);renderState();broadcastState()}}
function startSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return toast("Ditado não é suportado neste navegador.");
  const rec=new SR();rec.lang="pt-BR";rec.interimResults=false;ui.speechBtn.textContent="🔴 Ouvindo...";
  rec.onresult=e=>ui.actionInput.value=(ui.actionInput.value+" "+e.results[0][0].transcript).trim();rec.onerror=()=>toast("Não consegui reconhecer a fala.");rec.onend=()=>ui.speechBtn.textContent="🎤 Ditar";rec.start();
}

function saveHostState(){if(isHost&&state)localStorage.setItem("cn_room_"+roomId,JSON.stringify(state))}
function loadHostState(){try{return JSON.parse(localStorage.getItem("cn_room_"+roomId))}catch{return null}}
function broadcastState(target=null){if(!isHost||!state||!actions.sendState||!p2pReady)return;actions.sendState(state,target)}
function hello(target=null){
  if(mode!=="online"||!p2pReady||!actions.sendHello)return;
  const data=player?{...publicCharacter(player),isHost,voice:!!localStream}:{id:persistentPlayerId(),name:"Criando personagem...",characterReady:false,ready:false,isHost};
  actions.sendHello(data,target);
}
function sendCampaignInfo(target=null){if(isHost&&actions.sendCampaign)actions.sendCampaign({campaignId:selectedCampaign,title:CAMPAIGNS[selectedCampaign].title},target)}
async function beginOnline(host,code){
  mode="online";isHost=host;roomId=code;hostPeerId=host?"self":null;participants.clear();p2pReady=false;room=null;player=null;
  const url=new URL(location.href);url.searchParams.set("room",roomId);history.replaceState({},"",url);
  await connectP2P();beginCharacter();
}
async function connectP2P(){
  ui.connectionStatus.textContent="conectando";
  try{
    const {joinRoom}=await import("https://esm.sh/@trystero-p2p/torrent");
    room=joinRoom({appId:"cronicas-de-nerdora-web-alpha-v02"},roomId);
    const helloA=room.makeAction("hello"),campaignA=room.makeAction("campaign"),startA=room.makeAction("start"),stateA=room.makeAction("state"),intentA=room.makeAction("intent"),chatA=room.makeAction("chat"),rollA=room.makeAction("rolltap");
    actions={
      sendHello:(d,t)=>helloA.send(d,t?{target:t}:undefined),sendCampaign:(d,t)=>campaignA.send(d,t?{target:t}:undefined),sendStart:(d,t)=>startA.send(d,t?{target:t}:undefined),
      sendState:(d,t)=>stateA.send(d,t?{target:t}:undefined),sendIntent:(d,t)=>intentA.send(d,t?{target:t}:undefined),sendChat:(d,t)=>chatA.send(d,t?{target:t}:undefined),sendRollTap:(d,t)=>rollA.send(d,t?{target:t}:undefined)
    };
    p2pReady=true;ui.connectionStatus.textContent="online";ui.connectionStatus.classList.add("online");
    room.onPeerJoin=peerId=>{if(isHost){setTimeout(()=>sendCampaignInfo(peerId),120);if(state)setTimeout(()=>broadcastState(peerId),180)}setTimeout(()=>hello(peerId),220);if(localStream)room.addStream(localStream,{target:peerId})};
    room.onPeerLeave=peerId=>{participants.delete(peerId);renderLobby();renderParty();toast("Um jogador saiu da sala.")};
    helloA.onMessage=(data,{peerId})=>{participants.set(peerId,{...data,peerId});if(data.isHost)hostPeerId=peerId;renderLobby();renderParty();if(isHost&&state)broadcastState(peerId)};
    campaignA.onMessage=(data,{peerId})=>{if(isHost)return;hostPeerId=peerId;selectedCampaign=data.campaignId||"derenfall";setTheme(selectedCampaign);if(ui.lobbyCampaign)ui.lobbyCampaign.textContent=CAMPAIGNS[selectedCampaign].title};
    startA.onMessage=(payload,{peerId})=>{if(isHost)return;hostPeerId=peerId;selectedCampaign=payload.campaignId;state=payload.state;enterGameScreen()};
    stateA.onMessage=(incoming,{peerId})=>{if(isHost)return;if(hostPeerId&&peerId!==hostPeerId)return;hostPeerId=peerId;state=incoming;if(ui.gameScreen.classList.contains("active"))renderState()};
    intentA.onMessage=(data,{peerId})=>{if(!isHost)return;const p=participants.get(peerId);const actor={...(p||{}),...(data.player||{})};processIntent(actor,data.text)};
    chatA.onMessage=(data,{peerId})=>appendChat(data.name||participants.get(peerId)?.name||"Jogador",data.text,false);
    rollA.onMessage=(data)=>{if(isHost)handleRollTap(data.playerId)};
    room.onPeerStream=(stream,peerId)=>{let a=document.querySelector(`audio[data-peer="${peerId}"]`);if(!a){a=document.createElement("audio");a.autoplay=true;a.playsInline=true;a.dataset.peer=peerId;ui.audioMount.appendChild(a)}a.srcObject=stream;a.play?.().catch(()=>{})};
    hello();if(isHost)sendCampaignInfo();
  }catch(err){console.warn(err);ui.connectionStatus.textContent="modo local";toast("A conexão multiplayer não iniciou. Recarregue e tente novamente.")}
}
async function toggleVoice(){
  if(localStream){localStream.getTracks().forEach(t=>t.stop());if(room)try{room.removeStream(localStream)}catch{}localStream=null;ui.voiceBtn.classList.remove("active");ui.lobbyVoiceBtn.classList.remove("active");ui.voiceStatus.textContent="Microfone desligado";ui.lobbyVoiceStatus.textContent="Microfone desligado";hello();return}
  try{localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(room)room.addStream(localStream);ui.voiceBtn.classList.add("active");ui.lobbyVoiceBtn.classList.add("active");ui.voiceStatus.textContent="Microfone ativo";ui.lobbyVoiceStatus.textContent="Microfone ativo";hello()}catch{toast("Não foi possível acessar o microfone.")}
}
function showLobby(){
  setTheme(selectedCampaign);ui.lobbyCampaign.textContent=CAMPAIGNS[selectedCampaign].title;ui.lobbyCode.textContent=roomId;ui.lobbyPremise.textContent=CAMPAIGNS[selectedCampaign].premise;showScreen("lobbyScreen");renderLobby();
}
function allLobbyPlayers(){return player?[{...player,isHost},...Array.from(participants.values()).filter(p=>p.characterReady)]:Array.from(participants.values()).filter(p=>p.characterReady)}
function renderLobby(){
  if(!ui.lobbyScreen.classList.contains("active")||!player)return;
  const all=allLobbyPlayers();ui.lobbyPlayers.innerHTML=all.map(p=>`<div class="lobby-player ${p.ready?"ready":""}"><div class="mini-avatar">${esc((p.name||"?")[0].toUpperCase())}</div><div><strong>${esc(p.name)}${p.isHost?" 👑":""}</strong><small>${CLASS_DATA[p.className]?.icon||"⚔️"} ${esc(p.className)} • ${esc(ORIGINS[p.origin]?.name||"Origem")} • Nv. ${p.level||1}</small></div><span class="ready-mark">${p.ready?"✓":""}</span></div>`).join("");
  ui.readyBtn.textContent=player.ready?"✓ Pronto":"Estou pronto";ui.readyBtn.classList.toggle("primary",player.ready);ui.readyBtn.classList.toggle("secondary",!player.ready);
  const enough=all.length>=2,allReady=enough&&all.every(p=>p.ready);
  ui.startCampaignBtn.classList.toggle("hidden",!isHost);ui.startCampaignBtn.disabled=!allReady;
  ui.lobbyRule.textContent=!isHost?"Aguardando o anfitrião iniciar a campanha.":!enough?`A sala precisa de pelo menos 2 jogadores. Agora: ${all.length}/2.`:!allReady?"Todos os jogadores precisam marcar que estão prontos.":"Companhia pronta. A campanha pode começar.";
}
function toggleReady(){player.ready=!player.ready;persistCharacter();renderLobby();hello()}
function hostStartCampaign(){
  if(!isHost)return;const all=allLobbyPlayers();if(all.length<2||!all.every(p=>p.ready))return;
  state=loadHostState()||createInitialState(selectedCampaign);saveHostState();actions.sendStart({campaignId:selectedCampaign,state});enterGameScreen();broadcastState();
}
function startSoloCampaign(){
  mode="solo";isHost=true;roomId="SOLO";state=createInitialState(selectedCampaign);enterGameScreen();
}
function enterGameScreen(){
  renderedStoryIds=new Set();narrationQueue=Promise.resolve();lastRollShown=null;setTheme(state.campaignId);ui.modeBadge.textContent=mode==="solo"?"SOLO":"ONLINE";ui.roomCode.textContent=mode==="solo"?"AVENTURA":roomId;showScreen("gameScreen");renderSelf();renderParty();renderState();
}

function appendChat(name,text,broadcast=false){
  const d=document.createElement("div");d.className="chat-msg";d.innerHTML=`<strong>${esc(name)}</strong><p>${esc(text)}</p>`;ui.chatLog.appendChild(d);ui.chatLog.scrollTop=ui.chatLog.scrollHeight;
  if(broadcast&&mode==="online"&&actions.sendChat)actions.sendChat({name,text});
}
function sendChat(){const t=ui.chatInput.value.trim();if(!t)return;ui.chatInput.value="";appendChat(player.name,t,true)}
function copyInvite(){
  if(mode==="solo")return toast("A campanha solo não usa convite.");
  const url=new URL(location.href);url.searchParams.set("room",roomId);navigator.clipboard?.writeText(url.toString()).then(()=>toast("Link da sala copiado.")).catch(()=>toast("Código: "+roomId));
}
function setupTabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active")})}

function bind(){
  ui.onlineBtn.onclick=()=>openMode("online");ui.soloBtn.onclick=()=>openMode("solo");
  document.querySelectorAll("[data-back='introScreen']").forEach(b=>b.onclick=()=>showScreen("introScreen"));
  ui.createRoomBtn.onclick=()=>beginOnline(true,randomCode());
  ui.joinRoomBtn.onclick=()=>{const c=ui.roomCodeInput.value.toUpperCase().trim();if(!/^NRD-[A-Z0-9]{4}$/.test(c))return toast("Use um código no formato NRD-AB12.");beginOnline(false,c)};
  ui.startSoloCreateBtn.onclick=()=>beginCharacter();
  ui.charBackBtn.onclick=()=>currentCharStep>1?goCharStep(currentCharStep-1):showScreen("modeScreen");
  ui.charName.oninput=renderPreview;ui.toStatsBtn.onclick=()=>{if(validateIdentity())goCharStep(2)};ui.backIdentityBtn.onclick=()=>goCharStep(1);ui.toSkillsBtn.onclick=()=>{if(validateStats())goCharStep(3)};ui.backStatsBtn.onclick=()=>goCharStep(2);ui.finishCharacterBtn.onclick=finishCharacter;
  ui.copyLobbyBtn.onclick=copyInvite;ui.readyBtn.onclick=toggleReady;ui.startCampaignBtn.onclick=hostStartCampaign;ui.lobbyVoiceBtn.onclick=toggleVoice;
  ui.copyInviteBtn.onclick=copyInvite;ui.voiceBtn.onclick=toggleVoice;ui.sendActionBtn.onclick=()=>submitIntent();ui.actionInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitIntent()}});
  ui.speechBtn.onclick=startSpeech;ui.freeRollBtn.onclick=soloFreeRoll;ui.interactiveDie.onclick=()=>{const p=state?.pendingRoll;if(!p||p.assignedPlayerId!==player.id)return;ui.interactiveDie.classList.add("rolling");setTimeout(()=>ui.interactiveDie.classList.remove("rolling"),720);if(mode==="solo"||isHost)handleRollTap(player.id);else actions.sendRollTap({playerId:player.id,rollId:p.id})};
  ui.chatSendBtn.onclick=sendChat;ui.chatInput.addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});ui.alphaLevelBtn.onclick=levelUpAlpha;ui.diceOverlay.onclick=()=>ui.diceOverlay.classList.add("hidden");setupTabs();
}
function boot(){
  bind();renderCampaigns();setTheme(selectedCampaign);
  const incoming=roomFromUrl();if(incoming){mode="online";ui.roomCodeInput.value=incoming;openMode("online");toast("Convite detectado. Crie seu personagem e entre na sala "+incoming)}
}
boot();