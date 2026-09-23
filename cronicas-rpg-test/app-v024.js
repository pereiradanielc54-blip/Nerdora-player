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

Object.assign(CLUES,{
  portao:{title:"Portão fechado por dentro",text:"As travas indicam que ninguém organizou uma fuga pela entrada principal."},
  simultaneo:{title:"Rotinas interrompidas juntas",text:"Tarefas distantes cessaram no mesmo intervalo, sugerindo um único evento abrangente."},
  paroquia:{title:"Registros da paróquia",text:"Os mesmos nomes aparecem entre igreja, escola, cemitério e hospedaria, permitindo cruzar identidades."},
  botas:{title:"Barro do moinho",text:"Um quarto da hospedaria contém barro e palha vindos da região do moinho."},
  lista:{title:"Lista das crianças",text:"A lista escolar preserva nomes que outros registros começaram a perder."},
  canal:{title:"Canal subterrâneo",text:"Água e pedra ligam o poço a estruturas antigas sob a vila."},
  animais:{title:"Animais evitam uma direção",text:"Pegadas e comportamento animal formam um arco em torno do Bosque da Lembrança."},
  moinho:{title:"Entrega interrompida",text:"Registros do moinho conectam farinha, igreja e hospedaria poucas horas antes do desaparecimento."},
  afetos:{title:"Objetos de afeto",text:"Objetos pessoais parecem resistir melhor ao apagamento de memória do que nomes escritos."},
  ancoras:{title:"Âncoras de memória",text:"Certos objetos, nomes e lugares mantêm vínculos entre moradores e lembranças."},
  moradores:{title:"Moradores ainda vivos",text:"As pessoas desaparecidas existem dentro da Fenda, mas não reconhecem plenamente suas identidades."},
  mapa_memoria:{title:"Mapa desenhado pelas crianças",text:"Os desenhos combinados formam um caminho simbólico até um limiar no bosque."},
  eco_relogio:{title:"O tempo não falhou de uma vez",text:"O moinho registra pequenas anomalias anteriores ao desaparecimento geral."},
  tunel_igreja:{title:"Túnel entre capela e igreja",text:"Uma passagem antiga interliga fundações religiosas e oferece outro acesso ao sistema de Éter."},
  agua_espelho:{title:"Água que devolve nomes errados",text:"A água usada na hospedaria reflete memórias de pessoas que não estão presentes."},
  sino_token:{title:"Fragmento do sino antigo",text:"Uma peça enterrada no cemitério reage à mesma ressonância do sino da igreja."}
});

const WORLD_MAPS={
  derenfall:{
    title:"Derenfall e arredores",
    nodes:{
      road:{name:"Estrada de Derenfall",x:9,y:50,icon:"🛤️"},gate:{name:"Portão de Derenfall",x:20,y:50,icon:"🚪"},
      square:{name:"Praça de Derenfall",x:36,y:50,icon:"⛲"},inn:{name:"Hospedaria",x:34,y:24,icon:"🍺"},
      church:{name:"Igreja",x:50,y:23,icon:"🔔"},school:{name:"Escola",x:52,y:48,icon:"📚"},well:{name:"Poço",x:34,y:72,icon:"🪣"},
      cemetery:{name:"Cemitério",x:52,y:73,icon:"🪦"},outskirts:{name:"Casas Periféricas",x:66,y:48,icon:"🏚️"},
      mill:{name:"Moinho Velho",x:80,y:30,icon:"⚙️"},grove:{name:"Bosque da Lembrança",x:81,y:66,icon:"🌲"},
      chapel:{name:"Capela Antiga",x:67,y:80,icon:"⛪"},fissure:{name:"Fenda Memorial",x:91,y:50,icon:"🜂",secret:true},
      hall:{name:"Salão das Memórias",x:96,y:50,icon:"🎭",secret:true}
    },
    edges:[
      ["Estrada de Derenfall","Portão de Derenfall"],["Portão de Derenfall","Praça de Derenfall"],
      ["Praça de Derenfall","Hospedaria"],["Praça de Derenfall","Igreja"],["Praça de Derenfall","Escola"],["Praça de Derenfall","Poço"],
      ["Praça de Derenfall","Cemitério"],["Praça de Derenfall","Casas Periféricas"],["Cemitério","Capela Antiga"],["Cemitério","Bosque da Lembrança"],
      ["Casas Periféricas","Moinho Velho"],["Casas Periféricas","Bosque da Lembrança"],["Poço","Moinho Velho"],["Moinho Velho","Bosque da Lembrança"],
      ["Bosque da Lembrança","Capela Antiga"],["Igreja","Capela Antiga","route_tunnel"],["Igreja","Fenda Memorial","route_igreja"],
      ["Capela Antiga","Fenda Memorial","route_capela"],["Bosque da Lembrança","Fenda Memorial","route_bosque"],["Poço","Fenda Memorial","route_poco"],
      ["Fenda Memorial","Salão das Memórias","route_hall"]
    ]
  },
  vidro:{
    title:"Arken — coração de Asterfall",
    nodes:{
      oath:{name:"Salão dos Juramentos",x:47,y:15,icon:"👑"},palace:{name:"Palácio Real",x:47,y:34,icon:"🏰"},
      archives:{name:"Arquivos Reais",x:28,y:35,icon:"📜"},gardens:{name:"Jardins Reais",x:67,y:34,icon:"🌿"},
      houses:{name:"Distrito das Casas",x:22,y:58,icon:"🏛️"},market:{name:"Mercado Alto",x:42,y:58,icon:"⚖️"},
      cathedral:{name:"Catedral da Aurora",x:66,y:57,icon:"☀️"},scribes:{name:"Bairro dos Escribas",x:14,y:78,icon:"✒️"},
      dryport:{name:"Porto Seco",x:43,y:80,icon:"📦"},crypt:{name:"Cripta Dinástica",x:72,y:78,icon:"⚰️"},
      tunnels:{name:"Passagens Subterrâneas",x:55,y:93,icon:"🕯️"},veiled:{name:"Salão Velado",x:86,y:53,icon:"🎭"}
    },
    edges:[
      ["Salão dos Juramentos","Palácio Real"],["Palácio Real","Arquivos Reais"],["Palácio Real","Jardins Reais"],["Arquivos Reais","Distrito das Casas"],
      ["Arquivos Reais","Bairro dos Escribas"],["Distrito das Casas","Mercado Alto"],["Mercado Alto","Catedral da Aurora"],["Mercado Alto","Porto Seco"],
      ["Catedral da Aurora","Cripta Dinástica"],["Bairro dos Escribas","Porto Seco"],["Porto Seco","Passagens Subterrâneas"],
      ["Cripta Dinástica","Passagens Subterrâneas"],["Jardins Reais","Salão Velado"],["Passagens Subterrâneas","Salão Velado"]
    ]
  },
  coro:{
    title:"Complexo mineiro de Khar-Dor",
    nodes:{
      camp:{name:"Acampamento de Khar-Dor",x:18,y:28,icon:"⛺"},bunks:{name:"Alojamentos dos Mineiros",x:18,y:55,icon:"🛏️"},
      infirmary:{name:"Enfermaria",x:34,y:45,icon:"🩹"},forge:{name:"Forja",x:34,y:20,icon:"🔥"},gallery:{name:"Galeria Principal",x:50,y:35,icon:"⛏️"},
      reservoir:{name:"Reservatório Subterrâneo",x:51,y:67,icon:"💧"},impossible:{name:"Túnel Impossível",x:67,y:35,icon:"🌀"},
      shrine:{name:"Santuário de Pedra",x:68,y:68,icon:"🗿"},vein:{name:"Veio Memorial",x:82,y:54,icon:"💎"},
      choir:{name:"Câmara do Coro",x:82,y:28,icon:"🎶"},pit:{name:"Poço Profundo",x:65,y:88,icon:"⬇️"},core:{name:"Núcleo Mineral",x:94,y:40,icon:"🔻"}
    },
    edges:[
      ["Acampamento de Khar-Dor","Alojamentos dos Mineiros"],["Acampamento de Khar-Dor","Enfermaria"],["Acampamento de Khar-Dor","Forja"],
      ["Forja","Galeria Principal"],["Enfermaria","Galeria Principal"],["Galeria Principal","Reservatório Subterrâneo"],["Galeria Principal","Túnel Impossível"],
      ["Galeria Principal","Poço Profundo"],["Reservatório Subterrâneo","Santuário de Pedra"],["Túnel Impossível","Câmara do Coro"],
      ["Túnel Impossível","Veio Memorial"],["Santuário de Pedra","Veio Memorial"],["Poço Profundo","Santuário de Pedra"],["Câmara do Coro","Núcleo Mineral"],["Veio Memorial","Núcleo Mineral"]
    ]
  }
};

const DEREN_ACTIONS=[
{id:"road_tracks",location:"Estrada de Derenfall",label:"Procurar rastros na lama",stat:"PER",df:10,keywords:["rastro","lama"],once:true},
{id:"road_marker",location:"Estrada de Derenfall",label:"Examinar os marcos da estrada",stat:"INT",df:11,keywords:["marco","estrada"],once:true},
{id:"gate_lock",location:"Portão de Derenfall",label:"Examinar as travas do portão",stat:"PER",df:10,keywords:["trava","portao"],once:true},
{id:"gate_cart",location:"Portão de Derenfall",label:"Investigar a carroça abandonada",stat:"PER",df:11,keywords:["carroca","carga"],once:true},
{id:"square_cart",location:"Praça de Derenfall",label:"Examinar a carroça tombada",stat:"PER",df:10,keywords:["carroca","tombada"],once:true},
{id:"square_sound",location:"Praça de Derenfall",label:"Rastrear o som do sino",stat:"PER",df:11,keywords:["som","sino"],once:true},
{id:"square_routes",location:"Praça de Derenfall",label:"Mapear as rotas da vila",stat:"PER",df:10,keywords:["mapear","rotas","vila"],once:true},
{id:"church_bell",location:"Igreja",label:"Investigar o sino imóvel",stat:"PER",df:12,keywords:["sino","mecanismo"],once:true},
{id:"church_altar",location:"Igreja",label:"Examinar o altar e o piso",stat:"PER",df:12,keywords:["altar","piso"],once:true},
{id:"church_records",location:"Igreja",label:"Ler os registros da paróquia",stat:"INT",df:11,keywords:["registro","paroquia"],once:true},
{id:"church_passage",location:"Igreja",label:"Abrir a passagem sob o altar",stat:"INT",df:13,keywords:["passagem","altar"],once:true,requiresCluesAll:["fundacao"],requiresAnyClue:["sino","nhal","desenhos","memoria","sino_token"]},
{id:"inn_ledger",location:"Hospedaria",label:"Ler o livro-caixa",stat:"INT",df:10,keywords:["livro","caixa"],once:true},
{id:"inn_rooms",location:"Hospedaria",label:"Vasculhar os quartos",stat:"PER",df:11,keywords:["quarto","vasculhar"],once:true},
{id:"inn_kitchen",location:"Hospedaria",label:"Examinar água e comida",stat:"PER",df:10,keywords:["cozinha","agua","comida"],once:true},
{id:"inn_compare",location:"Hospedaria",label:"Cruzar hóspedes com os registros da vila",stat:"INT",df:12,keywords:["cruzar","hospede","nome"],once:true,requiresAnyClue:["paroquia","lista"]},
{id:"school_drawings",location:"Escola",label:"Examinar os desenhos infantis",stat:"PER",df:11,keywords:["desenho","crianca"],once:true},
{id:"school_register",location:"Escola",label:"Conferir a lista de presença",stat:"INT",df:10,keywords:["lista","presenca"],once:true},
{id:"school_decode",location:"Escola",label:"Sobrepor os desenhos como um mapa",stat:"INT",df:13,keywords:["sobrepor","mapa","desenhos"],once:true,requiresCluesAll:["desenhos"],requiresAnyClue:["lista","paroquia"]},
{id:"well_voice",location:"Poço",label:"Responder à voz no poço",stat:"PRE",df:12,keywords:["responder","voz"],once:true},
{id:"well_rope",location:"Poço",label:"Baixar uma corda até a água",stat:"PER",df:11,keywords:["corda","agua"],once:true},
{id:"well_reflection",location:"Poço",label:"Seguir o reflexo impossível",stat:"INT",df:13,keywords:["reflexo","impossivel"],once:true,requiresCluesAll:["memoria","canal"]},
{id:"cemetery_graves",location:"Cemitério",label:"Examinar as lápides",stat:"PER",df:11,keywords:["lapide","tumulo"],once:true},
{id:"cemetery_tracks",location:"Cemitério",label:"Seguir pegadas entre os túmulos",stat:"PER",df:10,keywords:["pegada","tumulo"],once:true},
{id:"cemetery_token",location:"Cemitério",label:"Investigar o túmulo sem nome",stat:"PER",df:12,keywords:["tumulo sem nome","sem nome"],once:true,requiresAnyClue:["livro","lista","paroquia"]},
{id:"chapel_seal",location:"Capela Antiga",label:"Decifrar o selo de Nhal",stat:"INT",df:12,keywords:["selo","nhal"],once:true},
{id:"chapel_crypt",location:"Capela Antiga",label:"Explorar a cripta antiga",stat:"PER",df:12,keywords:["cripta","explorar"],once:true},
{id:"chapel_activate",location:"Capela Antiga",label:"Ativar o mecanismo de memória",stat:"INT",df:14,keywords:["ativar","mecanismo"],once:true,requiresCluesAll:["nhal"],requiresAnyClue:["lapides","fundacao","mapa_memoria","canal"]},
{id:"outskirts_houses",location:"Casas Periféricas",label:"Comparar as casas abandonadas",stat:"PER",df:10,keywords:["casas","comparar"],once:true},
{id:"outskirts_belongings",location:"Casas Periféricas",label:"Examinar objetos pessoais",stat:"PRE",df:11,keywords:["objeto","pessoal"],once:true},
{id:"outskirts_tracks",location:"Casas Periféricas",label:"Seguir rastros para fora da vila",stat:"PER",df:10,keywords:["rastro","fora"],once:true},
{id:"mill_ledger",location:"Moinho Velho",label:"Ler o registro de entregas",stat:"INT",df:10,keywords:["registro","entrega"],once:true},
{id:"mill_wheel",location:"Moinho Velho",label:"Investigar a roda do moinho",stat:"PER",df:12,keywords:["roda","moinho"],once:true},
{id:"mill_channel",location:"Moinho Velho",label:"Seguir o canal de água",stat:"PER",df:12,keywords:["canal","agua"],once:true},
{id:"grove_animals",location:"Bosque da Lembrança",label:"Interpretar os rastros dos animais",stat:"PER",df:10,keywords:["animal","rastro"],once:true},
{id:"grove_echoes",location:"Bosque da Lembrança",label:"Escutar as memórias do bosque",stat:"PRE",df:13,keywords:["memoria","bosque","escutar"],once:true},
{id:"grove_threshold",location:"Bosque da Lembrança",label:"Atravessar o limiar dos desenhos",stat:"INT",df:14,keywords:["limiar","desenho"],once:true,requiresCluesAll:["desenhos","memoria"],requiresAnyClue:["mapa_memoria","afetos","animais"]},
{id:"fenda_residents",location:"Fenda Memorial",label:"Procurar os moradores desaparecidos",stat:"PER",df:11,keywords:["morador","desaparecido"],once:true},
{id:"fenda_anchors",location:"Fenda Memorial",label:"Identificar âncoras de memória",stat:"INT",df:13,keywords:["ancora","memoria"],once:true},
{id:"fenda_voices",location:"Fenda Memorial",label:"Seguir as vozes até o centro",stat:"PER",df:12,keywords:["vozes","centro"],once:true},
{id:"hall_observe",location:"Salão das Memórias",label:"Estudar os fios de memória",stat:"PER",df:12,keywords:["fio","memoria"],once:true},
{id:"hall_talk",location:"Salão das Memórias",label:"Conversar com o Colecionador",stat:"PRE",df:10,keywords:["conversar","colecionador"],once:true},
{id:"hall_negotiate",location:"Salão das Memórias",label:"Negociar a devolução das memórias",stat:"PRE",df:14,keywords:["negociar","devolucao"],once:true,requiresFlagsAll:["colecionador_dialogo"],requiresAnyClue:["afetos","moradores","ancoras"]},
{id:"hall_reconstruct",location:"Salão das Memórias",label:"Reconstruir as identidades pelos registros",stat:"INT",df:15,keywords:["reconstruir","identidade","registro"],once:true,requiresCluesAll:["moradores"],requiresAnyClue:["lista","livro","paroquia"],requiresAnyFlag:["route_igreja","route_capela","route_bosque","route_poco"]},
{id:"hall_seal",location:"Salão das Memórias",label:"Selar a Fenda com o padrão de Nhal",stat:"INT",df:16,keywords:["selar","nhal"],once:true,requiresCluesAll:["nhal","ancoras"]},
{id:"hall_attack",location:"Salão das Memórias",label:"Ferir o núcleo do Colecionador",stat:"FOR",df:14,keywords:["atacar","nucleo","ferir"],once:true},
{id:"hall_break",location:"Salão das Memórias",label:"Romper o núcleo enfraquecido",stat:"FOR",df:15,keywords:["romper","nucleo"],once:true,requiresFlagsAll:["colecionador_ferido"]},
{id:"hall_offer",location:"Salão das Memórias",label:"Oferecer uma lembrança voluntariamente",stat:"PRE",df:12,keywords:["oferecer","lembranca"],once:true,requiresFlagsAll:["colecionador_dialogo"]}
];

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
"unspentBox","sheetSkills","sheetAvailableSkills","alphaLevelBtn","chatLog","chatInput","chatSendBtn","toast","diceOverlay","diceCard","diceWho","diceResult","diceFormula","audioMount","mobileGameNav","orientationHint","orientationLandscapeBtn","orientationContinueBtn","orientationDontShow"
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
window.CN_openMode = which => openMode(which);
function openMode(which){
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
  const c=CAMPAIGNS[campaignId],map=WORLD_MAPS[campaignId];
  let unlocked=[c.location],visited=[c.location];
  if(campaignId==="derenfall")unlocked=["Estrada de Derenfall","Portão de Derenfall"];
  else if(map)unlocked=Object.values(map.nodes).map(function(n){return n.name});
  return {version:"0.3",campaignId:campaignId,campaign:c.title,location:c.location,worldMinutes:18*60+40,day:1,pressure:0,
    clues:[],objective:c.objective,ended:false,ending:null,pendingRoll:null,lastRoll:null,completedActions:[],failedActions:{},
    routeFlags:[],eventFired:[],unlockedLocations:unlocked,visitedLocations:visited,
    story:c.opening.map(function(text,i){return {id:uid(),type:i===0?"system":"master",who:i===0?"Prólogo":"Mestre Máquina",text:text,ts:Date.now()+i}})
  };
}
function ensureStateShape(){
  if(!state)return;
  if(!Array.isArray(state.completedActions))state.completedActions=[];
  if(!state.failedActions)state.failedActions={};
  if(!Array.isArray(state.routeFlags))state.routeFlags=[];
  if(!Array.isArray(state.eventFired))state.eventFired=[];
  if(!Array.isArray(state.unlockedLocations))state.unlockedLocations=[state.location];
  if(!Array.isArray(state.visitedLocations))state.visitedLocations=[state.location];
  if(state.campaignId==="derenfall"){
    unlockLocations("Estrada de Derenfall","Portão de Derenfall");
    if(state.location!=="Estrada de Derenfall"&&state.location!=="Portão de Derenfall")unlockDerenSurface();
  }else{
    const map=WORLD_MAPS[state.campaignId];
    if(map)Object.values(map.nodes).forEach(function(n){if(!state.unlockedLocations.includes(n.name))state.unlockedLocations.push(n.name)});
  }
}
function worldTime(){
  if(!state)return {day:1,time:"--:--"};
  const total=state.worldMinutes,extra=Math.floor(total/1440),m=total%1440;
  return {day:state.day+extra,time:String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")};
}
function advanceTime(n=5){
  if(!state)return;
  const before=state.pressure||0;
  state.worldMinutes+=n;
  state.pressure=Math.min(5,Math.max(before,Math.floor(Math.max(0,state.worldMinutes-(18*60+40))/95)));
  if(state.campaignId==="derenfall"&&state.pressure>before)triggerDerenPressureEvent(state.pressure);
}
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
  ensureStateShape();unlockLocations(dest);state.location=dest;
  if(!state.visitedLocations.includes(dest))state.visitedLocations.push(dest);
  advanceTime(6);
  if(state.campaignId==="derenfall"&&dest==="Praça de Derenfall")unlockDerenSurface();
  addStory("master","Mestre Máquina",text||(state.campaignId==="derenfall"?derenfallArrival(dest):"A companhia segue para "+dest+". O lugar muda as pessoas, informações e riscos disponíveis."));
  triggerLocationEvent(dest);
  if(state.campaignId==="derenfall")updateDerenObjective();
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

function unlockLocations(){
  ensureStateShapeBase();
  for(let i=0;i<arguments.length;i++){
    const name=arguments[i];if(name&&!state.unlockedLocations.includes(name))state.unlockedLocations.push(name);
  }
}
function ensureStateShapeBase(){
  if(!state)return;
  if(!Array.isArray(state.completedActions))state.completedActions=[];
  if(!state.failedActions)state.failedActions={};
  if(!Array.isArray(state.routeFlags))state.routeFlags=[];
  if(!Array.isArray(state.eventFired))state.eventFired=[];
  if(!Array.isArray(state.unlockedLocations))state.unlockedLocations=[state.location];
  if(!Array.isArray(state.visitedLocations))state.visitedLocations=[state.location];
}
function unlockDerenSurface(){
  ensureStateShapeBase();
  ["Praça de Derenfall","Igreja","Hospedaria","Escola","Poço","Cemitério","Casas Periféricas"].forEach(function(n){
    if(!state.unlockedLocations.includes(n))state.unlockedLocations.push(n);
  });
}
function addRouteFlag(flag){ensureStateShapeBase();if(flag&&!state.routeFlags.includes(flag))state.routeFlags.push(flag)}
function hasClue(id){return !!state&&Array.isArray(state.clues)&&state.clues.includes(id)}
function hasFlag(id){return !!state&&Array.isArray(state.routeFlags)&&state.routeFlags.includes(id)}
function completeAction(id){ensureStateShapeBase();if(!state.completedActions.includes(id))state.completedActions.push(id)}
function actionAvailable(a){
  ensureStateShapeBase();
  if(a.once&&state.completedActions.includes(a.id))return false;
  if(a.requiresCluesAll&&!a.requiresCluesAll.every(hasClue))return false;
  if(a.requiresAnyClue&&!a.requiresAnyClue.some(hasClue))return false;
  if(a.requiresFlagsAll&&!a.requiresFlagsAll.every(hasFlag))return false;
  if(a.requiresAnyFlag&&!a.requiresAnyFlag.some(hasFlag))return false;
  return true;
}
function currentDerenActions(){
  ensureStateShapeBase();
  return DEREN_ACTIONS.filter(function(a){return a.location===state.location&&actionAvailable(a)});
}
function findDerenAction(text){
  const n=norm(text),list=currentDerenActions();
  let exact=list.find(function(a){return norm(a.label)===n});if(exact)return exact;
  return list.find(function(a){return (a.keywords||[]).some(function(k){return n.includes(norm(k))})})||null;
}
function mapForCampaign(){return WORLD_MAPS[state?.campaignId]||null}
function mapNodeByName(name){
  const map=mapForCampaign();if(!map)return null;
  return Object.values(map.nodes).find(function(n){return n.name===name})||null;
}
function edgeIsOpen(edge){
  const flag=edge[2];return !flag||hasFlag(flag);
}
function connectedLocations(name){
  const map=mapForCampaign();if(!map)return[];
  const out=[];
  map.edges.forEach(function(e){
    if(!edgeIsOpen(e))return;
    if(e[0]===name)out.push(e[1]);else if(e[1]===name)out.push(e[0]);
  });
  return out.filter(function(n){return state.unlockedLocations.includes(n)});
}
function canTravelTo(dest){return connectedLocations(state.location).includes(dest)}
function travelFromMap(dest){
  if(!state||dest===state.location)return;
  if(!state.unlockedLocations.includes(dest))return toast("Esse local ainda não foi descoberto.");
  if(!canTravelTo(dest))return toast("Não há uma rota direta aberta daqui. Use o mapa para seguir pelos locais conectados.");
  moveTo(dest,state.campaignId==="derenfall"?derenfallArrival(dest):null);
  saveHostState();renderState();broadcastState();
}
function triggerLocationEvent(dest){
  if(!state||state.campaignId!=="derenfall")return;
  const key="visit:"+dest;if(state.eventFired.includes(key))return;state.eventFired.push(key);
  const events={
    "Portão de Derenfall":"A corrente do portão está caída do lado de dentro. Seja o que for que aconteceu, não parece uma evacuação organizada.",
    "Praça de Derenfall":"Uma bola de madeira rola sozinha por dois metros e para. Logo depois, o sino da igreja vibra uma única vez.",
    "Hospedaria":"No andar superior, uma porta bate. Quando vocês olham, todas continuam abertas.",
    "Escola":"O giz no quadro está quebrado no meio de uma palavra: 'lembr...'.",
    "Poço":"O reflexo na água demora uma fração de segundo para imitar os movimentos de quem olha.",
    "Cemitério":"Uma das lápides ainda tem flores frescas. O nome, porém, está quase apagado.",
    "Casas Periféricas":"Em várias casas, objetos pessoais foram deixados juntos perto das portas, como se alguém tentasse lembrar a quem pertenciam.",
    "Moinho Velho":"A roda está parada apesar da correnteza. Um único dente da engrenagem gira para trás a cada poucos segundos.",
    "Bosque da Lembrança":"O vento traz vozes da vila, mas cada frase parece pertencer a um dia diferente.",
    "Capela Antiga":"As pedras da capela vibram no mesmo ritmo distante do sino da igreja.",
    "Fenda Memorial":"Aqui a chuva cai para cima em alguns trechos, e ruas conhecidas terminam em lembranças que não pertencem a vocês.",
    "Salão das Memórias":"O Colecionador não avança. Ele observa a companhia como alguém avaliando quais histórias valem ser guardadas."
  };
  if(events[dest])addStory("system","Evento do local",events[dest]);
}
function triggerDerenPressureEvent(level){
  if(!state||state.campaignId!=="derenfall")return;
  const key="pressure:"+level;if(state.eventFired.includes(key))return;state.eventFired.push(key);
  const events={
    1:"O sino toca duas vezes. Em algum lugar da vila, uma voz começa a repetir um nome que nenhum de vocês conhece.",
    2:"Reflexos em janelas passam a mostrar moradores por um instante, sempre realizando a última tarefa que lembravam.",
    3:"A anomalia começa a vazar para as bordas da vila. Placas de rua perdem letras e pequenas lembranças parecem fora de lugar.",
    4:"Objetos ligados a memórias fortes começam a emitir um brilho violeta discreto. A Fenda está procurando novas âncoras.",
    5:"Ao longe, além do portão, um viajante para na estrada e pergunta qual é o próprio nome. O problema começou a se espalhar."
  };
  if(events[level])addStory("system","O mundo avança",events[level]);
}
function updateDerenObjective(){
  if(!state||state.campaignId!=="derenfall"||state.ended)return;
  if(state.location==="Salão das Memórias"){state.objective="Entender o que o Colecionador quer e escolher como devolver as identidades de Derenfall.";return}
  if(state.location==="Fenda Memorial"){state.objective="Encontrar os moradores, compreender as âncoras e localizar o centro da Fenda.";return}
  if(state.unlockedLocations.includes("Fenda Memorial")){state.objective="Escolher um dos acessos descobertos e entrar na Fenda Memorial.";return}
  const strong=["fundacao","nhal","mapa_memoria","memoria","canal"].filter(hasClue).length;
  if(strong>=2){state.objective="Cruzar as pistas e abrir uma rota até a origem da anomalia.";return}
  if(state.location==="Estrada de Derenfall"||state.location==="Portão de Derenfall"){state.objective="Entrar na vila e descobrir se os moradores fugiram ou desapareceram.";return}
  state.objective="Investigar locais diferentes e cruzar pistas sobre o desaparecimento de Derenfall.";
}
function actionFailureNarrative(a){
  const fail=state.failedActions[a.id]||0;
  const suffix=fail>1?" A tentativa anterior, porém, ajuda a entender melhor o problema; outra abordagem pode funcionar.":" A ação continua disponível porque a falha não encerrou essa possibilidade.";
  return "A tentativa não resolve "+a.label.toLowerCase()+". Ainda assim, vocês percebem um detalhe incompleto que confirma que há algo ali."+suffix;
}
function executeDerenAction(actor,a){
  const fails=state.failedActions[a.id]||0;
  const effective=Math.max(8,a.df-Math.min(1,fails));
  requestRoll(actor,a.stat,effective,a.label,{kind:"deren_action",actionId:a.id});
}
function resolveDerenActionRoll(actor,r,actionId){
  const a=DEREN_ACTIONS.find(function(x){return x.id===actionId});if(!a)return;
  if(!r.success){
    state.failedActions[a.id]=(state.failedActions[a.id]||0)+1;
    addStory("master","Mestre Máquina",actionFailureNarrative(a),r.formula);advanceTime(4);return;
  }
  completeAction(a.id);applyDerenActionSuccess(actor,a,r);updateDerenObjective();
}
function applyDerenActionSuccess(actor,a,r){
  let text="";
  switch(a.id){
    case "road_tracks": addClue("silencio");unlockLocations("Portão de Derenfall");text="Os rastros chegam até o portão, mas não continuam pela estrada. Nenhuma multidão deixou Derenfall por aqui.";break;
    case "road_marker": addRouteFlag("road_symbol");text="Um marco antigo sob o musgo exibe geometria pré-Ruptura. O símbolo não explica o desaparecimento, mas prova que a região já era importante antes da vila existir.";break;
    case "gate_lock": addClue("portao");unlockLocations("Praça de Derenfall");text="As travas foram soltas por dentro e depois simplesmente abandonadas. Não há sinais de pânico, multidão ou arrombamento.";break;
    case "gate_cart": addClue("moinho");unlockLocations("Moinho Velho");text="Sacos rasgados carregam o selo do Moinho Velho. A carga chegou poucas horas antes do silêncio.";break;
    case "square_cart": addClue("simultaneo");unlockDerenSurface();text="A carroça caiu no meio do descarregamento. Pela posição dos objetos e das casas ao redor, muitas tarefas pararam praticamente ao mesmo tempo.";break;
    case "square_sound": addClue("sino");unlockLocations("Igreja");text="O som não vem apenas da torre: ele parece viajar pelas fundações da vila, como se pedra e metal compartilhassem a mesma vibração.";break;
    case "square_routes": unlockDerenSurface();text="Do centro, vocês identificam rotas claras para igreja, hospedaria, escola, poço, cemitério e casas periféricas.";break;
    case "church_bell": addClue("sino");text="O mecanismo não poderia tocar o sino. Quando um de vocês lembra em voz alta o nome de alguém importante, o bronze responde com uma vibração própria.";break;
    case "church_altar": addClue("fundacao");text="Sob o altar existe um encaixe circular muito mais antigo que a igreja. O piso esconde uma estrutura subterrânea.";break;
    case "church_records": addClue("paroquia");unlockLocations("Escola","Cemitério","Hospedaria");text="Os registros conectam famílias da vila a escola, cemitério e hospedaria. Alguns nomes começam a desaparecer de documentos diferentes na mesma ordem.";break;
    case "church_passage": addRouteFlag("route_igreja");unlockLocations("Fenda Memorial");text="O encaixe cede. A escada sob o altar desce mais do que a profundidade da igreja permitiria. Vocês abriram uma rota direta para a Fenda.";break;
    case "inn_ledger": addClue("livro");unlockLocations("Moinho Velho");text="A última anotação termina antes do nome do próprio autor. Entre as despesas do dia há uma entrega do moinho e hospedagem de um viajante cuja assinatura também sumiu.";break;
    case "inn_rooms": addClue("botas");unlockLocations("Moinho Velho","Casas Periféricas");text="Num quarto, botas ainda molhadas carregam barro escuro e palha do caminho do moinho. O hóspede esteve lá pouco antes de desaparecer.";break;
    case "inn_kitchen": addClue("agua_espelho");unlockLocations("Poço");text="A água do jarro reflete por um instante o rosto de outra pessoa. O balde ao lado traz a marca do poço da praça.";break;
    case "inn_compare": addClue("simultaneo");text="Ao cruzar horários, fica claro que pessoas em pontos distantes perderam a continuidade da própria rotina quase no mesmo minuto.";break;
    case "school_drawings": addClue("desenhos");unlockLocations("Bosque da Lembrança");text="Quando os desenhos são colocados lado a lado, portas e árvores se repetem. O Bosque da Lembrança aparece como referência constante.";break;
    case "school_register": addClue("lista");unlockLocations("Cemitério","Hospedaria");text="A lista de presença preservou nomes que já estão falhando em outros documentos. Ela pode servir como âncora para reconstruir identidades.";break;
    case "school_decode": addClue("mapa_memoria");unlockLocations("Bosque da Lembrança");text="Sobrepostos, os desenhos formam um mapa simbólico. Um arco de árvores leva a um ponto marcado como 'casa com céu dentro'.";break;
    case "well_voice": addClue("memoria");unlockLocations("Bosque da Lembrança");text="A voz não é uma pessoa presa no fundo. É uma lembrança tentando se completar com informações de quem escuta.";break;
    case "well_rope": addClue("canal");unlockLocations("Moinho Velho","Capela Antiga");text="A corda alcança uma abertura lateral. O poço se conecta a um canal antigo que corre na direção do moinho e da capela.";break;
    case "well_reflection": addRouteFlag("route_poco");unlockLocations("Fenda Memorial");text="O reflexo se abre como uma superfície profunda. Por alguns segundos, o poço se torna uma passagem estável para a Fenda Memorial.";break;
    case "cemetery_graves": addClue("lapides");unlockLocations("Capela Antiga");text="As letras racham de dentro para fora. A trilha das fissuras aponta para pedras mais antigas junto à Capela Antiga.";break;
    case "cemetery_tracks": addClue("animais");unlockLocations("Bosque da Lembrança");text="Animais passaram pelo cemitério, mas todos desviaram da mesma direção: o bosque. O padrão é deliberado demais para ser acaso.";break;
    case "cemetery_token": addClue("sino_token");unlockLocations("Igreja");text="Sob a lápide sem nome há um fragmento de bronze. Ao segurá-lo, o sino da igreja vibra à distância.";break;
    case "chapel_seal": addClue("nhal");text="O selo pertence a Nhal e descreve uma técnica para separar memória, identidade e matéria sem destruir nenhuma das três.";break;
    case "chapel_crypt": addClue("tunel_igreja");addRouteFlag("route_tunnel");unlockLocations("Igreja");text="Uma passagem estreita segue sob o terreno até as fundações da igreja. Capela e altar faziam parte do mesmo sistema antigo.";break;
    case "chapel_activate": addRouteFlag("route_capela");unlockLocations("Fenda Memorial");text="O mecanismo reconhece as pistas reunidas e abre uma dobra silenciosa entre a capela e a Fenda.";break;
    case "outskirts_houses": addClue("simultaneo");text="Panelas, ferramentas e cartas foram abandonadas em estágios quase idênticos. A vila inteira foi atingida em uma janela muito curta.";break;
    case "outskirts_belongings": addClue("afetos");unlockLocations("Bosque da Lembrança");text="Fotos, brinquedos e presentes mantêm detalhes que documentos perderam. Afeto parece funcionar como uma âncora de memória.";break;
    case "outskirts_tracks": unlockLocations("Moinho Velho","Bosque da Lembrança");text="Pegadas isoladas seguem para o moinho e depois se perdem na borda do bosque. Não parecem uma fuga coletiva.";break;
    case "mill_ledger": addClue("moinho");unlockLocations("Igreja","Hospedaria");text="O registro confirma entregas para igreja e hospedaria no mesmo horário em que os relatos começaram a falhar.";break;
    case "mill_wheel": addClue("eco_relogio");text="As marcas da engrenagem mostram inversões pequenas ocorridas antes do desaparecimento. A anomalia vinha crescendo havia dias.";break;
    case "mill_channel": addClue("canal");unlockLocations("Poço","Capela Antiga");text="O canal passa sob a vila e toca estruturas antigas perto do poço e da capela. A água atravessa parte do mesmo sistema de Éter.";break;
    case "grove_animals": addClue("animais");unlockLocations("Capela Antiga");text="Os animais contornam um ponto específico e depois seguem para a capela, como se evitassem atravessar uma fronteira invisível.";break;
    case "grove_echoes": addClue("memoria");text="As vozes do bosque repetem lembranças autênticas, mas fora de ordem. Uma delas descreve moradores entrando numa 'rua atrás das árvores'.";break;
    case "grove_threshold": addRouteFlag("route_bosque");unlockLocations("Fenda Memorial");text="O padrão dos desenhos coincide com as árvores. Ao repetir a sequência correta, o espaço entre dois troncos se abre para a Fenda.";break;
    case "fenda_residents": addClue("moradores");text="Vocês encontram moradores vivos. Eles sabem falar e agir, mas muitos não reconhecem o próprio nome, casa ou família.";break;
    case "fenda_anchors": addClue("ancoras");text="Objetos de afeto, nomes preservados e lugares significativos mantêm fios luminosos ligados aos moradores. Essas âncoras podem devolver identidades.";break;
    case "fenda_voices": addRouteFlag("route_hall");unlockLocations("Salão das Memórias");text="As vozes convergem. Seguindo o padrão, vocês encontram uma porta feita de lembranças sobrepostas.";moveTo("Salão das Memórias",derenfallArrival("Salão das Memórias"));break;
    case "hall_observe": addClue("colecionador");text="Os fios mostram a verdade: o Colecionador não criou todas as memórias, mas aprendeu a sobreviver armazenando as que a Fenda arrancou.";break;
    case "hall_talk": addRouteFlag("colecionador_dialogo");text="A entidade admite que libertar todos sem substituir as âncoras ameaça sua existência. Ela aceita discutir preço, pacto ou outra forma de estabilização.";break;
    case "hall_negotiate": text="Usando as âncoras reunidas, vocês oferecem ao Colecionador um pacto: memórias serão devolvidas e a entidade permanecerá vinculada a lembranças doadas voluntariamente, não roubadas.";addStory("master","Mestre Máquina",text,r.formula);finishEnding("Pacto das Memórias","Derenfall retorna. O Colecionador continua existindo sob regras novas, e a vila passa a guardar um ritual voluntário de memória para manter a Fenda adormecida.");return;
    case "hall_reconstruct": text="Vocês usam nomes, objetos e registros como uma rede de referências. Um por um, os moradores reconhecem pessoas, casas e histórias, retirando do Colecionador a necessidade de segurá-las.";addStory("master","Mestre Máquina",text,r.formula);finishEnding("A Vila Reensinada","Derenfall é recuperada sem destruir a entidade. A restauração leva tempo e algumas lembranças voltam por caminhos inesperados, criando futuros ganchos.");return;
    case "hall_seal": text="O padrão de Nhal usa as âncoras como ponte. As memórias retornam aos moradores enquanto a Fenda se fecha ao redor do Colecionador.";addStory("master","Mestre Máquina",text,r.formula);finishEnding("Selo de Nhal","A maioria das lembranças retorna intacta. O grupo, porém, agora carrega conhecimento de uma tecnologia que várias facções desejariam controlar.");return;
    case "hall_attack": addRouteFlag("colecionador_ferido");text="O golpe rompe parte do núcleo e os fios ficam instáveis. A entidade está vulnerável, mas destruí-la agora pode arrancar memórias ainda não ancoradas.";break;
    case "hall_break": text="Com o núcleo já exposto, o golpe final desfaz o Colecionador. As memórias sem âncora se espalham como faíscas antes que a Fenda comece a colapsar.";addStory("master","Mestre Máquina",text,r.formula);finishEnding("Ruptura do Colecionador","Os moradores retornam, mas algumas lembranças nunca encontram o caminho de volta. Derenfall sobrevive carregando lacunas reais.");return;
    case "hall_offer": text="A lembrança escolhida é entregue voluntariamente. O Colecionador cumpre o acordo e solta os fios que mantinham a vila presa.";addStory("master","Mestre Máquina",text,r.formula);finishEnding("O Preço de uma Lembrança","Derenfall retorna quase inteira. Um aventureiro deixa a Fenda sabendo que algo importante existiu, mas sem conseguir mais recordá-lo.");return;
  }
  addStory("master","Mestre Máquina",text,r.formula);advanceTime(5);
}
function renderCampaignMap(){
  const root=$("campaignMap"),title=$("mapTitle"),progress=$("mapProgress"),hint=$("mapPathHint");if(!root||!state)return;
  ensureStateShape();const map=WORLD_MAPS[state.campaignId];if(!map){root.innerHTML="<p class='muted'>Mapa indisponível.</p>";return}
  title.textContent=map.title;
  const visible=Object.values(map.nodes).filter(function(n){return state.unlockedLocations.includes(n.name)||n.name===state.location});
  const byName={};Object.values(map.nodes).forEach(function(n){byName[n.name]=n});
  let svg="<svg class='map-lines' viewBox='0 0 100 100' preserveAspectRatio='none'>";
  map.edges.forEach(function(e){
    const a=byName[e[0]],b=byName[e[1]];if(!a||!b||!edgeIsOpen(e))return;
    if(!visible.includes(a)||!visible.includes(b))return;
    const active=e[0]===state.location||e[1]===state.location;
    svg+="<line x1='"+a.x+"' y1='"+a.y+"' x2='"+b.x+"' y2='"+b.y+"' class='"+(active?"active":"")+"'/>";
  });
  svg+="</svg>";
  let nodes=visible.map(function(n){
    const current=n.name===state.location,visited=state.visitedLocations.includes(n.name),open=canTravelTo(n.name);
    const cls=current?"current":visited?"visited":open?"open":"known";
    return "<button class='map-node "+cls+"' style='left:"+n.x+"%;top:"+n.y+"%' data-map-dest='"+esc(n.name)+"' "+(current||!open?"disabled":"")+"><span>"+n.icon+"</span><small>"+esc(n.name)+"</small></button>";
  }).join("");
  root.innerHTML="<div class='map-canvas'>"+svg+nodes+"</div>";
  root.querySelectorAll("[data-map-dest]:not([disabled])").forEach(function(b){b.onclick=function(){travelFromMap(b.dataset.mapDest)}});
  progress.textContent=state.visitedLocations.length+" visitados • "+visible.length+" descobertos";
  if(state.campaignId==="derenfall"){
    const routes=["route_igreja","route_capela","route_bosque","route_poco"].filter(hasFlag).length;
    hint.textContent=routes?"Rotas conhecidas para a Fenda: "+routes+"/4. Você pode continuar investigando mesmo após encontrar um acesso.":"Pistas de lugares diferentes podem se cruzar e abrir rotas secretas para a mesma origem.";
  }else hint.textContent="Clique em um local conectado para viajar. Cada região da campanha possui acontecimentos próprios.";
}
function resolveDerenfall(actor,text){
  ensureStateShape();const n=norm(text);
  if(/sair da vila|ir embora|abandonar derenfall|seguir viagem/.test(n)){
    state.pressure=Math.min(5,state.pressure+1);advanceTime(75);
    addStory("master","Mestre Máquina","Vocês deixam Derenfall. O mundo não impede a escolha. Horas depois, um viajante cruza a estrada sem lembrar de onde veio — a anomalia começou a ultrapassar a vila.");
    state.objective="Decidir se retornam a Derenfall ou investigam a propagação da anomalia.";return;
  }
  const dest=inferDestination("derenfall",text);
  if(dest&&dest!==state.location&&(/ir|entrar|seguir|andar|voltar|visitar|aproxim|portao|praça|praca/.test(n)||n===norm(dest))){
    if(canTravelTo(dest)){moveTo(dest,derenfallArrival(dest));return}
    if(state.unlockedLocations.includes(dest)){addStory("master","Mestre Máquina","Esse lugar já é conhecido, mas não há uma rota direta aberta a partir daqui. O mapa mostra os pontos intermediários.");return}
  }
  const action=findDerenAction(text);if(action){executeDerenAction(actor,action);return}
  if(/investig|procur|exam|observar|rastre|escut|ler|analis|vasculh/.test(n)){
    const available=currentDerenActions();if(available.length){executeDerenAction(actor,available[0]);return}
  }
  if(/tentar|forcar|forçar|convenc|saltar|escalar|arrombar|enganar|atacar/.test(n)){requestRoll(actor,statFor(text),12,"Resolver a ação",{kind:"generic",text:text});return}
  advanceTime(2);addStory("master","Mestre Máquina","A ação é possível e muda a situação local. O Mestre registra a consequência sem empurrar a companhia para uma rota predeterminada.");
}
function derenfallArrival(dest){
  const texts={
    "Portão de Derenfall":"O portão está entreaberto. Correntes e travas permanecem do lado de dentro, e uma carroça de mantimentos foi deixada atravessada perto da muralha.",
    "Praça de Derenfall":"A praça está congelada no meio de tarefas comuns. Uma carroça tombada, portas abertas e o sino distante transformam o silêncio em algo deliberado.",
    "Igreja":"A igreja está vazia. Uma corda do sino está rompida e as engrenagens não poderiam movê-lo, mas o bronze vibra como se escutasse.",
    "Hospedaria":"Canecas ainda contêm bebida e um prato continua morno. No balcão, o livro-caixa está aberto em uma página cheia de nomes incompletos.",
    "Cemitério":"A chuva corre pelas lápides. Algumas inscrições estão rachando de dentro para fora, apagando nomes em ritmos diferentes.",
    "Escola":"Carteiras permanecem alinhadas. Desenhos infantis mostram uma casa impossível, árvores repetidas e um céu violeta no lugar do teto.",
    "Poço":"A água está imóvel demais. Uma voz familiar sobe da escuridão, mas conta uma lembrança com um detalhe errado.",
    "Casas Periféricas":"Aqui o abandono parece íntimo: cartas abertas, brinquedos, ferramentas e roupas deixadas como se os moradores fossem retornar em minutos.",
    "Moinho Velho":"A corrente passa forte sob o moinho, mas a roda não acompanha. Registros de entrega ainda estão presos por um prego junto à porta.",
    "Bosque da Lembrança":"O bosque começa comum e rapidamente deixa de obedecer distância. Vozes aparecem entre árvores que vocês juram já ter passado.",
    "Capela Antiga":"Raízes cobrem uma construção anterior à vila. Símbolos geométricos sobrevivem sob reformas mais recentes.",
    "Fenda Memorial":"A passagem abre para ruas de Derenfall reconstruídas por lembranças imperfeitas. Portas levam a dias diferentes e moradores caminham sem reconhecer suas próprias casas.",
    "Salão das Memórias":"Fios luminosos cruzam um salão impossível. No centro, uma figura feita de máscaras incompletas organiza lembranças como um bibliotecário diante de um arquivo vivo."
  };
  return texts[dest]||"Vocês chegam a "+dest+".";
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
  const n=norm(text),map=WORLD_MAPS[campaignId],c=CAMPAIGNS[campaignId];
  if(map){
    const found=Object.values(map.nodes).find(function(node){return n.includes(norm(node.name))});
    if(found)return found.name;
  }
  if(c&&c.locations){for(const loc of Object.keys(c.locations)){if(n.includes(norm(loc)))return loc}}
  if(campaignId==="derenfall"){
    if(/portao/.test(n))return "Portão de Derenfall";if(/igreja|altar|sino/.test(n))return "Igreja";
    if(/hosped|taverna|estalagem/.test(n))return "Hospedaria";if(/cemiter|lapide/.test(n))return "Cemitério";
    if(/escola|desenho/.test(n))return "Escola";if(/poco/.test(n))return "Poço";if(/capela/.test(n))return "Capela Antiga";
    if(/moinho/.test(n))return "Moinho Velho";if(/bosque|floresta/.test(n))return "Bosque da Lembrança";
    if(/casa|perifer/.test(n))return "Casas Periféricas";if(/praca|centro/.test(n))return "Praça de Derenfall";
  }
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
  if(ctx.kind==="deren_action"){resolveDerenActionRoll(actor,r,ctx.actionId);return;}
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
  ensureStateShape();
  const c=CAMPAIGNS[state.campaignId];
  setTheme(state.campaignId);ui.campaignTitle.textContent=c.title;ui.locationName.textContent=state.location;ui.objectiveText.textContent=state.objective;
  const wt=worldTime();ui.worldDay.textContent="Dia "+wt.day;ui.worldTime.textContent=wt.time;
  const labels=state.campaignId==="vidro"?["Cerimônia","Rumores","Pressão","Alianças","Crise","Ruptura"]:state.campaignId==="coro"?["Sussurros","Canção","Contágio","Descida","Convergência","Assimilação"]:["Silêncio","Ecos","Substituições","Vazamento","Ancoragem","Propagação"];
  ui.mysteryLabel.textContent=labels[state.pressure]||labels[0];ui.mysteryBar.style.width=(8+state.pressure*18)+"%";
  renderStory();renderClues();renderQuickActions();renderCampaignMap();renderDicePrompt();renderSheet();checkLastRoll();
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
  ensureStateShape();let list=[];
  if(state.campaignId==="derenfall"){
    list=currentDerenActions().map(function(a){return {label:a.label,type:"action"}});
    connectedLocations(state.location).forEach(function(dest){list.push({label:"Ir para "+dest,type:"travel",dest:dest})});
  }else{
    const base=CAMPAIGNS[state.campaignId].locations[state.location]||["Observar ao redor","Conversar com a companhia","Investigar"];
    list=base.map(function(label){return {label:label,type:"action"}});
    connectedLocations(state.location).forEach(function(dest){
      if(!list.some(function(x){return norm(x.label).includes(norm(dest))}))list.push({label:"Ir para "+dest,type:"travel",dest:dest});
    });
  }
  ui.quickActions.innerHTML="";
  list.forEach(function(item){
    const b=document.createElement("button");b.textContent=item.label;
    b.onclick=function(){if(item.type==="travel")travelFromMap(item.dest);else submitIntent(item.label)};
    ui.quickActions.appendChild(b);
  });
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
function isPhoneViewport(){
  return window.matchMedia("(max-width: 900px)").matches;
}
function setMobileGamePanel(panel){
  if(!ui.gameScreen?.classList.contains("active"))return;
  document.body.dataset.mobilePanel=panel;
  ui.mobileGameNav?.querySelectorAll(".mobile-nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.mobilePanel===panel));

  const party=document.querySelector(".party-panel");
  const story=document.querySelector(".story-panel");
  const info=document.querySelector(".info-panel");
  party?.classList.toggle("mobile-active",panel==="party");
  story?.classList.toggle("mobile-active",panel==="story");
  info?.classList.toggle("mobile-active",["journal","character","chat"].includes(panel));

  if(["journal","character","chat"].includes(panel)){
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===panel));
    document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    $("tab-"+panel)?.classList.add("active");
  }
}
function maybeShowOrientationHint(){
  if(!isPhoneViewport())return;
  if(localStorage.getItem("cn_hide_orientation_hint")==="1")return;
  if(window.matchMedia("(orientation: landscape)").matches)return;
  setTimeout(()=>ui.orientationHint?.classList.remove("hidden"),380);
}
async function tryLandscapeMode(){
  try{
    if(document.documentElement.requestFullscreen && !document.fullscreenElement){
      await document.documentElement.requestFullscreen();
    }
  }catch{}
  try{
    if(screen.orientation?.lock) await screen.orientation.lock("landscape");
    toast("Modo paisagem solicitado.");
    ui.orientationHint?.classList.add("hidden");
  }catch{
    toast("Gire o celular para o lado. A interface se adapta automaticamente.");
    ui.orientationHint?.classList.add("hidden");
  }
}
function closeOrientationHint(){
  if(ui.orientationDontShow?.checked)localStorage.setItem("cn_hide_orientation_hint","1");
  ui.orientationHint?.classList.add("hidden");
}
function enterGameScreen(){
  renderedStoryIds=new Set();narrationQueue=Promise.resolve();lastRollShown=null;setTheme(state.campaignId);ui.modeBadge.textContent=mode==="solo"?"SOLO":"ONLINE";ui.roomCode.textContent=mode==="solo"?"AVENTURA":roomId;showScreen("gameScreen");renderSelf();renderParty();renderState();
  setMobileGamePanel("story");
  maybeShowOrientationHint();
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
function setupTabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active");if(isPhoneViewport())setMobileGamePanel(b.dataset.tab)})}

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
  ui.chatSendBtn.onclick=sendChat;ui.chatInput.addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});ui.alphaLevelBtn.onclick=levelUpAlpha;ui.diceOverlay.onclick=()=>ui.diceOverlay.classList.add("hidden");
  ui.mobileGameNav?.querySelectorAll(".mobile-nav-btn").forEach(b=>b.onclick=()=>setMobileGamePanel(b.dataset.mobilePanel));
  ui.orientationLandscapeBtn.onclick=tryLandscapeMode;
  ui.orientationContinueBtn.onclick=closeOrientationHint;
  window.addEventListener("orientationchange",()=>setTimeout(()=>{ if(window.matchMedia("(orientation: landscape)").matches) ui.orientationHint?.classList.add("hidden"); setMobileGamePanel(document.body.dataset.mobilePanel||"story"); },180));
  setupTabs();
}
function boot(){
  window.__CN_BOOT_OK = true;
  bind();renderCampaigns();setTheme(selectedCampaign);
  const incoming=roomFromUrl();if(incoming){mode="online";ui.roomCodeInput.value=incoming;openMode("online");toast("Convite detectado. Crie seu personagem e entre na sala "+incoming)}
}
boot();