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
  sino_token:{title:"Fragmento do sino antigo",text:"Uma peça enterrada no cemitério reage à mesma ressonância do sino da igreja."},
  vidrotestemunhas:{title:"A mesma frase em bocas diferentes",text:"Testemunhas de Casas rivais lembram a mesma frase ausente do juramento oficial."},
  vidrocustodia:{title:"Caixas fora da cadeia de custódia",text:"Volumes dinásticos foram retirados dos Arquivos por uma rota administrativa ligada ao Porto Seco."},
  vidrolinhagem:{title:"Ramo apagado da dinastia",text:"Registros funerários confirmam que um ramo real existiu e foi removido de genealogias posteriores."},
  vidroescriba:{title:"Margens que sobreviveram",text:"Uma cópia clandestina preserva notas sobre o soberano omitido, feitas antes da censura oficial."},
  vidroconcilio:{title:"A Coroa já sabia",text:"A corte conhecia a contradição e escolheu administrá-la em segredo para evitar uma crise sucessória."},
  vidrointeresse:{title:"Casas exploram a ausência",text:"Parte da nobreza não busca a verdade; usa o soberano apagado para renegociar poder e privilégios."},
  corofebre:{title:"Não é uma doença comum",text:"Pulso, respiração e sono dos mineiros sincronizam com vibração mineral, não com contágio biológico."},
  cororitmo:{title:"Yara ouve antes dos outros",text:"A jovem mineira antecipa versos porque sua memória está conectada a uma camada mais profunda da rede."},
  coromapa:{title:"A mina cresceu para dentro",text:"Os novos túneis não são escavações recentes; parecem reorganizações de estruturas antigas sob a montanha."},
  corofrequencia:{title:"Frequência de prospecção",text:"O diapasão da forja identifica uma nota capaz de interromper ou redirecionar a ressonância do veio."},
  coropedra:{title:"Liturgia da Pedra",text:"O santuário descreve um rito antigo para devolver vozes à montanha sem destruir as memórias contidas nela."},
  coromemoria:{title:"Vidas gravadas no veio",text:"O minério preserva fragmentos de experiência de gerações de mineiros, não apenas o canto atual."},
  corofonte:{title:"O Coro busca continuidade",text:"A rede mineral tenta completar padrões interrompidos usando mentes vivas como pontes."},
  coropressao:{title:"Produção acima das vidas",text:"O clã sabia de incidentes menores e manteve a mina aberta por pressão econômica."}
});


const EVIDENCE={
  ev_no_exodus:{title:"Rastros que não saem da vila",text:"Pegadas e marcas chegam ao portão, mas não formam uma rota de evacuação."},
  ev_locked_inside:{title:"Travas abandonadas por dentro",text:"O portão não apresenta sinais de arrombamento ou abertura apressada para uma fuga coletiva."},
  ev_square_interrupt:{title:"Tarefa interrompida na praça",text:"Carga e objetos foram abandonados no meio de uma rotina comum."},
  ev_inn_times:{title:"Horários interrompidos na hospedaria",text:"Registros mostram atividades normais cessando num intervalo muito curto."},
  ev_house_interrupt:{title:"Rotinas domésticas interrompidas",text:"Casas diferentes foram abandonadas durante tarefas cotidianas."},
  ev_bell_foundation:{title:"Ressonância sob a praça",text:"O som do sino parece viajar pelas fundações em vez de apenas pelo ar."},
  ev_bell_mechanism:{title:"Sino mecanicamente imóvel",text:"Corda e engrenagens não explicam os toques ou vibrações observados."},
  ev_bell_response:{title:"Bronze reage a lembranças",text:"O sino vibra quando nomes e memórias pessoais são mencionados."},
  ev_hollow_altar:{title:"Estrutura sob o altar",text:"O piso da igreja esconde um encaixe e uma cavidade mais antiga que a construção."},
  ev_parish_names:{title:"Nomes cruzados na paróquia",text:"Registros religiosos conectam famílias da vila a escola, hospedaria e cemitério."},
  ev_drawings:{title:"Desenhos repetidos",text:"Crianças diferentes desenharam a mesma casa impossível e as mesmas árvores."},
  ev_school_names:{title:"Lista escolar preservada",text:"Alguns nomes ainda aparecem inteiros na escola enquanto falham em outros lugares."},
  ev_map_pattern:{title:"Padrão entre os desenhos",text:"Ao sobrepor páginas, caminhos e árvores formam uma disposição repetível."},
  ev_wrong_voice:{title:"Voz com lembrança incorreta",text:"A voz do poço imita alguém conhecido, mas erra detalhes íntimos."},
  ev_well_channel:{title:"Abertura lateral no poço",text:"Há um canal antigo ligando o poço a estruturas sob a vila."},
  ev_wrong_reflection:{title:"Reflexo que não pertence ao observador",text:"A água mostra rostos e cenas que não correspondem a quem está diante dela."},
  ev_names_erasing:{title:"Nomes desaparecendo da pedra",text:"Inscrições funerárias se apagam de dentro para fora."},
  ev_bronze_resonance:{title:"Fragmento de bronze ressonante",text:"Um pedaço antigo de sino enterrado reage à torre da igreja."},
  ev_nhal_symbol:{title:"Geometria de Nhal",text:"O padrão da capela corresponde a técnicas antigas de separação entre matéria e memória."},
  ev_tunnel_church:{title:"Passagem entre capela e igreja",text:"Fundações antigas conectam fisicamente os dois edifícios."},
  ev_personal_objects:{title:"Objetos preservam detalhes",text:"Presentes, brinquedos e lembranças pessoais mantêm informações que documentos começam a perder."},
  ev_mill_delivery:{title:"Entregas ligam moinho e vila",text:"Registros de carga conectam moinho, hospedaria e igreja pouco antes do desaparecimento."},
  ev_mill_time:{title:"Anomalias anteriores no moinho",text:"A engrenagem registra pequenos comportamentos impossíveis anteriores ao desaparecimento geral."},
  ev_mill_channel:{title:"Canal do moinho cruza estruturas antigas",text:"A água passa perto do poço e da capela por uma rede anterior à vila."},
  ev_forest_echo:{title:"Vozes fora de ordem no bosque",text:"As vozes repetem cenas coerentes, mas em tempos e contextos misturados."},
  ev_animals_avoid:{title:"Animais contornam um limite",text:"Rastros animais evitam sistematicamente uma área do bosque."},
  ev_residents_identity:{title:"Moradores vivos sem identidade completa",text:"Pessoas desaparecidas estão presentes na Fenda, mas não reconhecem nomes, casas ou parentes."},
  ev_luminous_links:{title:"Fios ligam pessoas a objetos e nomes",text:"Conexões luminosas partem dos moradores para elementos significativos de suas vidas."},
  ev_entity_threads:{title:"Entidade conectada aos fios",text:"A criatura do salão está ligada à rede luminosa que atravessa o local."},
  ev_entity_statement:{title:"A entidade admite dependência",text:"O Colecionador afirma que deixar os fios desaparecerem ameaça a própria estabilidade."}
};
const REVELATION_RULES=[
  {id:"silencio",allEvidence:["ev_no_exodus"],anyEvidence:["ev_locked_inside","ev_square_interrupt"]},
  {id:"simultaneo",minEvidence:{ids:["ev_square_interrupt","ev_inn_times","ev_house_interrupt"],count:2}},
  {id:"sino",allEvidence:["ev_bell_mechanism"],anyEvidence:["ev_bell_foundation","ev_bell_response","ev_bronze_resonance"]},
  {id:"fundacao",allEvidence:["ev_hollow_altar"],anyEvidence:["ev_bell_foundation","ev_nhal_symbol","ev_tunnel_church","ev_bronze_resonance"]},
  {id:"paroquia",allEvidence:["ev_parish_names"]},
  {id:"desenhos",allEvidence:["ev_drawings"]},
  {id:"lista",allEvidence:["ev_school_names"]},
  {id:"mapa_memoria",allEvidence:["ev_map_pattern"],requiresCluesAll:["desenhos"],requiresCluesAny:["lista","paroquia"]},
  {id:"memoria",minEvidence:{ids:["ev_wrong_voice","ev_wrong_reflection","ev_forest_echo","ev_names_erasing","ev_residents_identity"],count:2}},
  {id:"canal",minEvidence:{ids:["ev_well_channel","ev_mill_channel","ev_tunnel_church"],count:2}},
  {id:"nhal",allEvidence:["ev_nhal_symbol"]},
  {id:"lapides",allEvidence:["ev_names_erasing"]},
  {id:"sino_token",allEvidence:["ev_bronze_resonance"]},
  {id:"moinho",minEvidence:{ids:["ev_mill_delivery","ev_mill_time"],count:1}},
  {id:"eco_relogio",allEvidence:["ev_mill_time"]},
  {id:"tunel_igreja",allEvidence:["ev_tunnel_church"]},
  {id:"moradores",allEvidence:["ev_residents_identity"]},
  {id:"afetos",allEvidence:["ev_personal_objects"],requiresCluesAny:["memoria","lapides","moradores"]},
  {id:"ancoras",allEvidence:["ev_luminous_links"],requiresCluesAll:["moradores"],requiresCluesAny:["afetos","lista","paroquia","livro"]},
  {id:"colecionador",allEvidence:["ev_entity_threads","ev_entity_statement"]}
];
function evidenceIds(){if(!state||!Array.isArray(state.rawEvidence))return[];return state.rawEvidence.map(function(e){return typeof e==="string"?e:e.id})}
function hasEvidence(id){return evidenceIds().includes(id)}
function addEvidence(id,source){
  ensureStateShapeBase();
  if(!EVIDENCE[id]||hasEvidence(id))return false;
  state.rawEvidence.push({id:id,source:source||state.location||null,at:Date.now()});
  const e=EVIDENCE[id];
  addStory("system","Evidência guardada",e.title+": "+e.text);
  tryResolveRevelations();
  return true;
}
function revelationReady(rule){
  if(!(rule.allEvidence||[]).every(hasEvidence))return false;
  if(rule.anyEvidence&&rule.anyEvidence.length&&!rule.anyEvidence.some(hasEvidence))return false;
  if(rule.minEvidence){
    const count=(rule.minEvidence.ids||[]).filter(hasEvidence).length;
    if(count<(rule.minEvidence.count||1))return false;
  }
  if(rule.requiresCluesAll&&!(rule.requiresCluesAll||[]).every(hasClue))return false;
  if(rule.requiresCluesAny&&rule.requiresCluesAny.length&&!rule.requiresCluesAny.some(hasClue))return false;
  return true;
}
function revealClue(id){
  if(!CLUES[id]||hasClue(id))return false;
  state.clues.push(id);
  const c=CLUES[id];
  addStory("system","Conexão compreendida",c.title+": "+c.text);
  return true;
}
function tryResolveRevelations(){
  if(!state)return;
  let changed=true,safety=0;
  while(changed&&safety++<8){
    changed=false;
    REVELATION_RULES.forEach(function(rule){
      if(!hasClue(rule.id)&&revelationReady(rule)){
        if(revealClue(rule.id))changed=true;
      }
    });
  }
}

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


const MASTER_DB_NAME="CronicasNerdoraMasterMemory";
const MASTER_DB_VERSION=1;
let masterDbPromise=null;
let masterMemoryProfile=null;
let masterRoutePatterns={};

function openMasterDB(){
  if(masterDbPromise)return masterDbPromise;
  masterDbPromise=new Promise(function(resolve,reject){
    if(!("indexedDB" in window)){resolve(null);return}
    const req=indexedDB.open(MASTER_DB_NAME,MASTER_DB_VERSION);
    req.onupgradeneeded=function(){
      const db=req.result;
      if(!db.objectStoreNames.contains("player_memory"))db.createObjectStore("player_memory",{keyPath:"playerId"});
      if(!db.objectStoreNames.contains("route_patterns"))db.createObjectStore("route_patterns",{keyPath:"key"});
      if(!db.objectStoreNames.contains("session_events"))db.createObjectStore("session_events",{keyPath:"id"});
    };
    req.onsuccess=function(){resolve(req.result)};
    req.onerror=function(){reject(req.error)};
  });
  return masterDbPromise;
}
async function dbGet(store,key){
  const db=await openMasterDB();if(!db)return null;
  return new Promise(function(resolve,reject){
    const tx=db.transaction(store,"readonly"),req=tx.objectStore(store).get(key);
    req.onsuccess=function(){resolve(req.result||null)};req.onerror=function(){reject(req.error)};
  });
}
async function dbGetAll(store){
  const db=await openMasterDB();if(!db)return[];
  return new Promise(function(resolve,reject){
    const tx=db.transaction(store,"readonly"),req=tx.objectStore(store).getAll();
    req.onsuccess=function(){resolve(req.result||[])};req.onerror=function(){reject(req.error)};
  });
}
async function dbPut(store,value){
  const db=await openMasterDB();if(!db)return;
  return new Promise(function(resolve,reject){
    const tx=db.transaction(store,"readwrite"),req=tx.objectStore(store).put(value);
    req.onsuccess=function(){resolve(value)};req.onerror=function(){reject(req.error)};
  });
}
function blankMasterProfile(actor){
  return {
    playerId:actor?.id||persistentPlayerId(),displayName:actor?.name||"Aventureiro",version:1,totalActions:0,
    tendencies:{exploration:0,social:0,combat:0,stealth:0,magic:0,support:0,risk:0},
    facts:[],lastActions:[],successes:0,failures:0,lastSeenAt:Date.now()
  };
}
function actionStyle(text){
  const n=norm(text);
  if(/curar|proteger|ajudar|salvar|estabil|defender|apoiar/.test(n))return "support";
  if(/mag|eter|feiti|ritual|selo|invoc|arcano/.test(n))return "magic";
  if(/furt|silenc|escon|sombra|distrair|roubar|infiltr/.test(n))return "stealth";
  if(/atac|golpe|matar|destruir|arrombar|quebrar|lutar/.test(n))return "combat";
  if(/falar|pergunt|negoci|convenc|persu|engan|convers|interrogar/.test(n))return "social";
  if(/investig|procur|exam|observar|rastre|ler|analis|mapear|escut|vasculh/.test(n))return "exploration";
  if(/saltar|arriscar|correr|atravessar|descer|entrar|tentar/.test(n))return "risk";
  return "exploration";
}
function extractCharacterFacts(text){
  const raw=String(text||"").trim(),lower=norm(raw),out=[];
  const patterns=[
    {type:"fear",rx:/(?:tenho medo de|eu temo|meu personagem teme)\s+([^.!?]{2,60})/i,label:"Teme"},
    {type:"protect",rx:/(?:quero proteger|vou proteger|meu personagem quer proteger)\s+([^.!?]{2,60})/i,label:"Quer proteger"},
    {type:"trust",rx:/(?:confio em|meu personagem confia em)\s+([^.!?]{2,60})/i,label:"Confia em"},
    {type:"distrust",rx:/(?:não confio em|nao confio em|desconfio de)\s+([^.!?]{2,60})/i,label:"Desconfia de"},
    {type:"like",rx:/(?:gosto de|meu personagem gosta de)\s+([^.!?]{2,60})/i,label:"Gosta de"},
    {type:"dislike",rx:/(?:odeio|detesto|meu personagem odeia)\s+([^.!?]{2,60})/i,label:"Não gosta de"},
    {type:"goal",rx:/(?:meu objetivo é|meu objetivo e|eu quero encontrar|quero descobrir)\s+([^.!?]{2,60})/i,label:"Objetivo pessoal"}
  ];
  patterns.forEach(function(p){
    const m=raw.match(p.rx);if(m&&m[1])out.push({key:p.type+":"+norm(m[1]).slice(0,50),type:p.type,label:p.label,value:m[1].trim().slice(0,60),confidence:.9,lastSeenAt:Date.now()});
  });
  if(/nunca abandono|jamais abandono/.test(lower))out.push({key:"trait:leal",type:"trait",label:"Traço",value:"Demonstra forte lealdade",confidence:.75,lastSeenAt:Date.now()});
  return out;
}
function mergeFacts(profile,facts){
  facts.forEach(function(f){
    const found=profile.facts.find(function(x){return x.key===f.key});
    if(found){found.confidence=Math.min(1,(found.confidence||.6)+.08);found.lastSeenAt=Date.now()}
    else profile.facts.unshift(f);
  });
  profile.facts=profile.facts.slice(0,18);
}
async function initMasterMemory(actor){
  const base=actor||player||{id:persistentPlayerId(),name:"Aventureiro"};
  try{
    masterMemoryProfile=await dbGet("player_memory",base.id)||blankMasterProfile(base);
    masterMemoryProfile.displayName=base.name||masterMemoryProfile.displayName;
    const patterns=await dbGetAll("route_patterns");masterRoutePatterns={};patterns.forEach(function(p){masterRoutePatterns[p.key]=p});
    renderMasterMemory();
  }catch(e){
    console.warn("Memória do Mestre indisponível",e);masterMemoryProfile=blankMasterProfile(base);renderMasterMemory();
  }
}
async function observePlayerAction(actor,text){
  if(!actor)return;
  if(!masterMemoryProfile||masterMemoryProfile.playerId!==actor.id)await initMasterMemory(actor);
  const style=actionStyle(text),facts=extractCharacterFacts(text);
  masterMemoryProfile.totalActions=(masterMemoryProfile.totalActions||0)+1;
  masterMemoryProfile.tendencies[style]=(masterMemoryProfile.tendencies[style]||0)+1;
  masterMemoryProfile.displayName=actor.name||masterMemoryProfile.displayName;
  masterMemoryProfile.lastSeenAt=Date.now();
  masterMemoryProfile.lastActions.unshift({text:String(text).slice(0,120),style:style,location:state?.location||null,campaignId:state?.campaignId||null,at:Date.now()});
  masterMemoryProfile.lastActions=masterMemoryProfile.lastActions.slice(0,24);
  mergeFacts(masterMemoryProfile,facts);
  dbPut("player_memory",masterMemoryProfile).catch(function(){});
  dbPut("session_events",{id:uid(),playerId:actor.id,type:"action",style:style,text:String(text).slice(0,160),campaignId:state?.campaignId||null,location:state?.location||null,at:Date.now()}).catch(function(){});
  renderMasterMemory();
}
async function observeRollOutcome(actor,result,context){
  if(!actor||!result)return;
  if(!masterMemoryProfile||masterMemoryProfile.playerId!==actor.id)await initMasterMemory(actor);
  if(result.success)masterMemoryProfile.successes=(masterMemoryProfile.successes||0)+1;
  else masterMemoryProfile.failures=(masterMemoryProfile.failures||0)+1;
  dbPut("player_memory",masterMemoryProfile).catch(function(){});
  const actionKey=context?.actionId||context?.kind||"generic";
  const key=[state?.campaignId||"unknown",state?.location||"unknown",actionKey].join("|");
  const rec=masterRoutePatterns[key]||{key:key,campaignId:state?.campaignId||null,location:state?.location||null,actionKey:actionKey,attempts:0,successes:0,failures:0,lastAt:0};
  rec.attempts++;if(result.success)rec.successes++;else rec.failures++;rec.lastAt=Date.now();
  masterRoutePatterns[key]=rec;dbPut("route_patterns",rec).catch(function(){});
  renderMasterMemory();
}
function dominantTendencies(){
  if(!masterMemoryProfile)return[];
  return Object.entries(masterMemoryProfile.tendencies||{}).sort(function(a,b){return b[1]-a[1]}).filter(function(x){return x[1]>0}).slice(0,2);
}
function tendencyLabel(key){
  return {exploration:"investigação",social:"interação social",combat:"combate direto",stealth:"furtividade",magic:"soluções arcanas",support:"proteção do grupo",risk:"ações arriscadas"}[key]||key;
}
function renderMasterMemory(){
  if(!ui.masterMemoryTitle||!ui.masterMemoryList)return;
  const p=masterMemoryProfile;
  if(!p){ui.masterMemoryTitle.textContent="Memória local ainda vazia";ui.masterMemoryCount.textContent="0";return}
  const tops=dominantTendencies();
  ui.masterMemoryCount.textContent=String((p.facts?.length||0)+(p.totalActions||0));
  ui.masterMemoryTitle.textContent=p.totalActions?("Observou "+p.totalActions+" ações"):"Aprendendo seu estilo";
  ui.masterMemoryInsight.textContent=tops.length?("O Mestre percebe preferência por "+tops.map(function(x){return tendencyLabel(x[0])}).join(" e ")+". Ele usa isso para variar ganchos, não para limitar suas opções."):"O Mestre ainda não possui dados suficientes para reconhecer seu estilo.";
  const facts=(p.facts||[]).slice(0,5);
  ui.masterMemoryList.innerHTML=facts.length?facts.map(function(f){return "<div class='memory-fact'><strong>"+esc(f.label)+"</strong><span>"+esc(f.value)+"</span></div>"}).join(""):"<p class='muted'>Fatos declarados pelo personagem aparecerão aqui quando forem relevantes.</p>";
}
function memoryScoreAction(action){
  if(!masterMemoryProfile)return 0;
  const txt=(action.label||"")+" "+(action.keywords||[]).join(" ");
  const style=actionStyle(txt),pref=masterMemoryProfile.tendencies?.[style]||0;
  const key=[state?.campaignId||"unknown",action.location||state?.location||"unknown",action.id||action.label].join("|");
  const pat=masterRoutePatterns[key];const successBonus=pat&&pat.attempts?pat.successes/pat.attempts:0;
  const recent=(masterMemoryProfile.lastActions||[]).slice(0,5).filter(function(x){return x.style===style}).length;
  return pref*.12+successBonus-recent*.35;
}
function rankActionsWithMemory(actions){
  return actions.slice().sort(function(a,b){return memoryScoreAction(b)-memoryScoreAction(a)});
}
function normalizedActionKey(text){return norm(text).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim().slice(0,80)}
function registerRepetition(actor,text){
  if(!state)return 1;
  if(!Array.isArray(state.recentPlayerActions))state.recentPlayerActions=[];
  const key=normalizedActionKey(text),loc=state.location,pid=actor?.id||"unknown";
  state.recentPlayerActions.push({playerId:pid,key:key,location:loc,at:Date.now()});
  state.recentPlayerActions=state.recentPlayerActions.slice(-30);
  return state.recentPlayerActions.filter(function(x){return x.playerId===pid&&x.location===loc&&x.key===key}).length;
}
function triggerAdaptiveRecovery(actor,text){
  if(!state)return false;
  const candidates=state.campaignId==="derenfall"?rankActionsWithMemory(currentDerenActions()).filter(function(a){return !norm(a.label).includes(normalizedActionKey(text))}):[];
  if(candidates.length){
    const a=candidates[0];
    addStory("system","Mestre Adaptativo","A cena não permanece parada: a insistência chama atenção para outro detalhe. "+actor.name+" percebe uma alternativa concreta — "+a.label+". Você pode seguir essa pista ou tentar algo totalmente diferente.");
    state.pressure=Math.min(5,(state.pressure||0)+1);
    return true;
  }
  const exits=connectedLocations(state.location||"");
  if(exits.length){
    addStory("system","Mestre Adaptativo","A situação muda antes que a cena entre em repetição. Um novo sinal aponta para "+exits[0]+", mas o grupo continua livre para permanecer e tentar outra abordagem.");
    return true;
  }
  addStory("system","Mestre Adaptativo","A insistência produz uma mudança observável no ambiente. O Mestre abre uma nova complicação em vez de repetir a mesma resposta.");
  state.pressure=Math.min(5,(state.pressure||0)+1);
  return true;
}
function rememberCampaignEnding(title){
  if(!masterMemoryProfile)return;
  const fact={key:"ending:"+(state?.campaignId||"unknown")+":"+norm(title),type:"ending",label:"Desfecho vivido",value:title,confidence:1,lastSeenAt:Date.now()};
  mergeFacts(masterMemoryProfile,[fact]);dbPut("player_memory",masterMemoryProfile).catch(function(){});renderMasterMemory();
}


const CAMPAIGN_ACTIONS={
  vidro:[
    {id:"vidro_coroa",location:"Salão dos Juramentos",label:"Examinar a Coroa de Vidro",stat:"PER",df:12,keywords:["coroa","cristal","examinar"],clue:"vidroeco",item:"crown_imprint",success:"O reflexo não é profecia: ele reage à fórmula do juramento. Existe uma memória dinástica que a versão oficial não consegue apagar.",fail:"O cristal responde, mas o reflexo se desfaz antes de mostrar contexto suficiente."},
    {id:"vidro_testemunhas",location:"Salão dos Juramentos",label:"Comparar os relatos das testemunhas",stat:"PRE",df:12,keywords:["testemunhas","relatos","juramentados"],clue:"vidrotestemunhas",success:"Pessoas de Casas rivais repetem a mesma frase que não existe na transcrição oficial. Elas discordam sobre política, mas não sobre o que ouviram.",fail:"Os relatos parecem contaminados pelo pânico. Ainda assim, duas expressões se repetem de forma incômoda."},
    {id:"vidro_rainha",location:"Palácio Real",label:"Pedir uma audiência reservada com Maeryn",stat:"PRE",df:14,keywords:["maeryn","rainha","audiencia"],clue:"vidroconcilio",npc:"maeryn",requiresAnyClue:["vidroeco","vidrotestemunhas"],success:"Maeryn não confirma um herdeiro, mas admite que a Coroa já apresentou o mesmo reflexo em uma cerimônia privada anos atrás. O Conselho decidiu silenciar o caso.",fail:"A rainha mantém a versão oficial, mas sua escolha cuidadosa de palavras confirma que aquilo não foi a primeira ocorrência."},
    {id:"vidro_selos",location:"Arquivos Reais",label:"Comparar selos e numeração dos juramentos",stat:"INT",df:12,keywords:["selos","numeracao","documentos","comparar"],clue:"vidroselos",item:"archive_seal",success:"As cópias incompatíveis usam papel, cera e numeração internos. A contradição nasceu dentro dos Arquivos, não numa falsificação recente.",fail:"Nada prova fraude comum. Os documentos resistem ao primeiro exame e exigem reconstruir a cadeia de custódia."},
    {id:"vidro_caixas",location:"Arquivos Reais",label:"Rastrear as caixas retiradas do catálogo",stat:"PER",df:13,keywords:["caixas","catalogo","custodia"],clue:"vidrocustodia",success:"Três caixas saíram dos Arquivos usando autorização real e seguiram para um depósito do Porto Seco. A data coincide com a última revisão da genealogia oficial.",fail:"A trilha burocrática foi limpa, mas uma assinatura de transporte aponta para fora do palácio."},
    {id:"vidro_ilyan",location:"Arquivos Reais",label:"Confrontar Ilyan sobre as rasuras",stat:"PRE",df:13,keywords:["ilyan","rasuras","arquivista"],flag:"ilyan_abriu_jogo",npc:"ilyan",success:"Ilyan admite que aprendeu a reconhecer documentos censurados pelo espaço deixado no catálogo. Ele entrega o nome de Sera Valen, uma escriba que copiou margens antes do expurgo.",fail:"Ilyan se fecha, mas menciona sem querer que 'as margens foram copiadas'. O nome da escriba ainda precisa ser descoberto."},
    {id:"vidro_sera",location:"Bairro dos Escribas",label:"Encontrar Sera e a cópia clandestina",stat:"PRE",df:13,keywords:["sera","copia","escriba","clandestina"],clue:"vidroescriba",npc:"sera",requiresAnyClue:["vidrocustodia","vidroselos"],success:"Sera mostra uma cópia anterior à censura. Nas margens, um escriba registra que o segundo soberano jurou renunciar ao nome, não ao sangue.",fail:"Sera testa a companhia com informações falsas antes de mostrar que possui algo real. Será preciso ganhar sua confiança ou voltar com prova."},
    {id:"vidro_mensageiro",location:"Distrito das Casas",label:"Seguir o mensageiro de Cassian",stat:"AGI",df:13,keywords:["mensageiro","seguir","cassian"],clue:"vidrointeresse",npc:"cassian",success:"O mensageiro entrega propostas a duas Casas: ambas pretendem usar o soberano apagado para reabrir antigos privilégios, independentemente de quem tenha direito ao trono.",fail:"O mensageiro percebe a perseguição e muda de rota, mas a reação de Cassian revela que existe negociação paralela."},
    {id:"vidro_cassian",location:"Mercado Alto",label:"Pressionar Cassian sobre as alianças",stat:"PRE",df:14,keywords:["cassian","aliancas","casas"],clue:"vidrointeresse",npc:"cassian",success:"Cassian admite que metade das Casas não quer um novo rei: quer usar a dúvida para enfraquecer Maeryn. A verdade histórica e o jogo político não são a mesma coisa.",fail:"Cassian não entrega nomes, mas deixa claro que a Coroa de Vidro virou moeda de negociação."},
    {id:"vidro_catedral",location:"Catedral da Aurora",label:"Comparar o livro de memoriais reais",stat:"INT",df:13,keywords:["memoriais","catedral","livro"],flag:"pista_cripta",success:"O livro de memoriais pula uma numeração inteira e referencia uma capela funerária que oficialmente nunca existiu.",fail:"As páginas foram reencadernadas. A ausência é visível, mas ainda não identifica quem foi apagado."},
    {id:"vidro_cripta",location:"Cripta Dinástica",label:"Reconstruir a genealogia pelas inscrições",stat:"PER",df:14,keywords:["genealogia","inscricoes","cripta"],clue:"vidrolinhagem",requiresAnyClue:["vidrotestemunhas","vidrocustodia"],success:"Datas, brasões e espaços raspados confirmam um ramo real entre dois reinados conhecidos. A pessoa da Coroa pertencia à dinastia e foi apagada depois de viver.",fail:"As inscrições foram mutiladas, mas o padrão de datas prova que a genealogia oficial possui um intervalo deliberado."},
    {id:"vidro_porto",location:"Porto Seco",label:"Localizar a remessa dos Arquivos",stat:"PER",df:13,keywords:["remessa","caixas","porto"],clue:"vidrocustodia",requiresAnyClue:["vidroselos","vidrotestemunhas"],success:"Uma caixa ainda está no depósito. O manifesto prova que documentos dinásticos foram enviados para fora do circuito real antes da revisão oficial.",fail:"A caixa desapareceu, mas o manifesto permanece e confirma a rota."},
    {id:"vidro_tuneis",location:"Passagens Subterrâneas",label:"Seguir a rota secreta até o palácio",stat:"AGI",df:13,keywords:["rota secreta","passagens","seguir"],flag:"rota_salao_velado",requiresAnyClue:["vidrocustodia","vidroescriba"],success:"As passagens ligam depósitos, cripta e uma sala sem registro no palácio. Alguém criou uma infraestrutura física para administrar segredos dinásticos.",fail:"O caminho termina em grades recentes, prova de que a rota ainda é usada."},
    {id:"vidro_velado",location:"Salão Velado",label:"Examinar os registros do Conselho secreto",stat:"INT",df:15,keywords:["conselho","registros","velado"],clue:"vidroconcilio",requiresAnyFlag:["rota_salao_velado"],success:"Atas lacradas mostram que três gerações da Coroa mantiveram o apagamento para preservar uma sucessão negociada. O segredo era política de Estado.",fail:"As atas usam cifras, mas datas e lacres bastam para demonstrar continuidade institucional."},
    {id:"vidro_jardins",location:"Jardins Reais",label:"Ouvir a conversa dos conselheiros",stat:"AGI",df:13,keywords:["conselheiros","ouvir","jardins"],clue:"vidroconcilio",success:"Dois conselheiros discutem como conter a 'segunda aparição'. O termo prova que o fenômeno era conhecido dentro do palácio.",fail:"A conversa termina cedo, mas 'segunda aparição' é dito claramente antes de eles se separarem."}
  ],
  coro:[
    {id:"coro_mineiros",location:"Acampamento de Khar-Dor",label:"Examinar os mineiros adormecidos",stat:"PER",df:12,keywords:["mineiros","adormecidos","examinar"],clue:"cororesp",success:"Os mineiros cantam no mesmo compasso apesar da distância. Uma voz começa cada verso antes das demais, como se uma fonte comum distribuísse a sequência.",fail:"O padrão não parece aprendido nem coordenado por som comum."},
    {id:"coro_borik",location:"Acampamento de Khar-Dor",label:"Questionar Borik sobre incidentes anteriores",stat:"PRE",df:13,keywords:["borik","incidentes","capataz"],clue:"coropressao",npc:"borik",success:"Borik admite pequenos apagões, ferramentas devolvidas ao lugar errado e turnos esquecidos semanas antes. A produção continuou por ordem do clã.",fail:"Borik minimiza tudo, mas cita acidentes anteriores que não estavam no relatório oficial."},
    {id:"coro_yara",location:"Alojamentos dos Mineiros",label:"Conversar com Yara sobre o próximo verso",stat:"PRE",df:12,keywords:["yara","verso","conversar"],clue:"cororitmo",npc:"yara",success:"Yara ouve o verso antes que ele exista no ar. Ela descreve a sensação como lembrar de algo que outra pessoa ainda vai pensar.",fail:"Yara não consegue explicar, mas antecipa novamente uma nota que ninguém cantou."},
    {id:"coro_beliches",location:"Alojamentos dos Mineiros",label:"Comparar objetos pessoais dos turnos",stat:"PER",df:12,keywords:["objetos","beliches","turnos"],flag:"memorias_trocadas",success:"Objetos foram trocados entre pessoas que juram reconhecê-los como seus. O problema já afeta identidade, não apenas sono.",fail:"Há confusão real sobre propriedade, embora ainda falte saber se é causa ou efeito."},
    {id:"coro_enfermaria",location:"Enfermaria",label:"Comparar pulso, respiração e canto",stat:"INT",df:13,keywords:["pulso","respiracao","enfermaria"],clue:"corofebre",npc:"sella",success:"Os corpos sincronizam quando a pedra vibra e se desfazem quando o minério é isolado. Isso não se comporta como infecção comum.",fail:"Os sintomas mudam quando fragmentos de minério são afastados dos pacientes."},
    {id:"coro_sella",location:"Enfermaria",label:"Ajudar Sella a estabilizar um mineiro",stat:"VIG",df:12,keywords:["sella","estabilizar","curar"],flag:"sella_confia",npc:"sella",success:"Ao estabilizar o paciente, Sella percebe que interromper a vibração reduz o canto. Ela oferece acesso aos registros médicos completos.",fail:"O paciente estabiliza apenas parcialmente, mas a reação à vibração fica evidente."},
    {id:"coro_diapasao",location:"Forja",label:"Calibrar o diapasão de prospecção",stat:"INT",df:13,keywords:["diapasao","calibrar","forja"],clue:"corofrequencia",item:"khar_tuning_fork",npc:"dorran",success:"Dorran e vocês isolam uma frequência que faz o veio responder sem ativar os mineiros. Existe uma forma de falar com a montanha sem usar pessoas.",fail:"A frequência ainda é instável, mas uma faixa específica reduz o canto por alguns segundos."},
    {id:"coro_mapas",location:"Galeria Principal",label:"Comparar os mapas antigos com a galeria",stat:"PER",df:13,keywords:["mapas","galeria","comparar"],clue:"coromapa",success:"O túnel 'novo' ocupa um vazio cartográfico citado há décadas. A mina não abriu uma passagem: algo antigo reorganizou o acesso.",fail:"As medidas não fecham. A galeria atual possui comprimento impossível para a rocha removida."},
    {id:"coro_escoras",location:"Galeria Principal",label:"Inspecionar o desabamento recente",stat:"FOR",df:12,keywords:["desabamento","escoras","inspecionar"],flag:"atalho_reservatorio",success:"Atrás da pedra quebrada existe um canal antigo levando ao reservatório. O colapso revelou uma rota que a mina moderna desconhecia.",fail:"O desabamento não é natural; as pedras parecem ter sido empurradas de dentro."},
    {id:"coro_agua",location:"Reservatório Subterrâneo",label:"Testar a ressonância na água",stat:"INT",df:13,keywords:["agua","reservatorio","ressonancia"],flag:"agua_carrega_canto",success:"A água transporta a vibração sem reproduzir memórias. Isso explica por que áreas distantes da mina entram em sincronia.",fail:"A superfície repete a nota do veio com atraso constante, revelando um canal de transmissão."},
    {id:"coro_santuario",location:"Santuário de Pedra",label:"Decifrar a Liturgia da Pedra",stat:"INT",df:14,keywords:["liturgia","santuario","decifrar"],clue:"coropedra",success:"O rito antigo não destruía o veio: ensinava a devolver nomes e vozes à pedra, separando memória de hospedeiro vivo.",fail:"O texto está quebrado, mas a repetição de 'devolver a voz à pedra' é inequívoca."},
    {id:"coro_tunel",location:"Túnel Impossível",label:"Examinar o minério que canta",stat:"INT",df:13,keywords:["minerio","tunel","examinar"],clue:"corominerio",item:"resonant_shard",success:"O veio guarda padrões semelhantes a lembranças. O canto atual é apenas a camada mais recente de uma memória mineral muito mais antiga.",fail:"A pedra reage a nomes e ritmos pessoais. Não é um mineral inerte."},
    {id:"coro_veio",location:"Veio Memorial",label:"Rastrear as memórias mais antigas",stat:"PER",df:14,keywords:["memorias","veio","rastrear"],clue:"coromemoria",success:"Vocês encontram fragmentos de gerações de trabalhadores, juramentos de clã e acidentes esquecidos. O Coro é uma biblioteca viva e ferida.",fail:"Vozes antigas atravessam o veio; algumas pertencem a pessoas mortas há décadas."},
    {id:"coro_camara",location:"Câmara do Coro",label:"Escutar a rede sem responder",stat:"VIG",df:14,keywords:["escutar","rede","camara"],clue:"corofonte",requiresAnyClue:["corominerio","cororitmo"],success:"A rede não pede obediência: procura continuidade. Ela usa os vivos porque perdeu partes de si durante a Ruptura e tenta completar lacunas.",fail:"O Coro tenta preencher seus silêncios com lembranças da companhia. Resistir revela que ele busca padrões faltantes."},
    {id:"coro_poco",location:"Poço Profundo",label:"Descer até as fundações pré-mina",stat:"AGI",df:13,keywords:["descer","poco","fundacoes"],flag:"rota_santuario",success:"Nas fundações existe uma passagem talhada antes de Khar-Dor, conectando o poço ao santuário de pedra.",fail:"A descida é interrompida por instabilidade, mas marcas antigas apontam claramente para o santuário."},
    {id:"coro_nucleo",location:"Núcleo Mineral",label:"Observar como o núcleo usa as vozes",stat:"PER",df:15,keywords:["nucleo","vozes","observar"],clue:"corofonte",requiresAnyClue:["corominerio","coropedra"],success:"Cada voz humana funciona como ponte temporária entre partes quebradas da rede. O núcleo não precisa das pessoas se receber outro padrão de continuidade.",fail:"A pressão mental é forte, mas fica claro que o núcleo depende de conexões, não de corpos específicos."}
  ]
};
function campaignActionsFor(cid=state?.campaignId){return CAMPAIGN_ACTIONS[cid]||[]}
function campaignActionAvailable(a){
  ensureStateShapeBase();
  if(state.completedActions.includes(a.id))return false;
  if(a.requiresCluesAll&& !a.requiresCluesAll.every(hasClue))return false;
  if(a.requiresAnyClue&& a.requiresAnyClue.length && !a.requiresAnyClue.some(hasClue))return false;
  if(a.requiresFlagsAll&& !a.requiresFlagsAll.every(hasFlag))return false;
  if(a.requiresAnyFlag&& a.requiresAnyFlag.length && !a.requiresAnyFlag.some(hasFlag))return false;
  return true;
}
function currentCampaignActions(){
  return rankActionsWithMemory(campaignActionsFor().filter(function(a){return a.location===state.location&&campaignActionAvailable(a)}));
}
function findCampaignAction(text){
  const n=norm(text),list=currentCampaignActions();
  return list.find(function(a){return norm(a.label)===n})||list.find(function(a){return (a.keywords||[]).some(function(k){return n.includes(norm(k))})})||null;
}
function campaignCaseReady(cid=state?.campaignId){
  if(cid==="vidro"){
    const core=hasClue("vidroeco")&&hasClue("vidroselos")&&hasClue("vidrolinhagem");
    const secondary=["vidrotestemunhas","vidrocustodia","vidroescriba","vidroconcilio","vidrointeresse"].filter(hasClue).length;
    return core&&secondary>=3;
  }
  if(cid==="coro"){
    const core=hasClue("cororesp")&&hasClue("corominerio")&&hasClue("coropedra");
    const secondary=["corofebre","cororitmo","coromapa","corofrequencia","coromemoria","corofonte"].filter(hasClue).length;
    return core&&secondary>=3;
  }
  return false;
}
function updateCampaignObjective(){
  if(!state||state.campaignId==="derenfall")return;
  if(state.campaignId==="vidro"){
    const count=["vidroeco","vidroselos","vidrolinhagem","vidrotestemunhas","vidrocustodia","vidroescriba","vidroconcilio","vidrointeresse"].filter(hasClue).length;
    state.objective=campaignCaseReady("vidro")
      ?"Vocês já possuem base para decidir como revelar, negociar ou controlar a verdade dinástica."
      :count<2?"Reconstruir o que a Coroa mostrou e separar testemunho de oportunismo político."
      :count<4?"Cruzar documentos, testemunhos e genealogia para provar quem foi apagado e por quê."
      :"Encontrar a peça que liga a linhagem apagada ao encobrimento institucional.";
  }else if(state.campaignId==="coro"){
    const count=["cororesp","corominerio","coropedra","corofebre","cororitmo","coromapa","corofrequencia","coromemoria","corofonte"].filter(hasClue).length;
    state.objective=campaignCaseReady("coro")
      ?"Vocês entendem o bastante para escolher o destino do Coro e dos mineiros."
      :count<2?"Entender por que os mineiros compartilham a mesma canção."
      :count<4?"Descobrir como corpo, mina e memória estão ligados."
      :"Encontrar um método capaz de separar os mineiros da rede sem destruir tudo que ela guarda.";
  }
}
function resolveCampaignActionRoll(actor,r,actionId){
  const a=campaignActionsFor().find(function(x){return x.id===actionId});if(!a)return;
  if(!r.success){
    state.failedActions[a.id]=(state.failedActions[a.id]||0)+1;
    if(state.failedActions[a.id]>=2){
      completeAction(a.id);
      if(a.clue)addClue(a.clue);if(a.flag)addRouteFlag(a.flag);if(a.item&&!hasItem(a.item))addItem(a.item);
      if(a.npc)adjustNpcRelation(a.npc,{trust:1,respect:1},"A companhia persistiu e obteve informação apesar do custo.");
      state.pressure=Math.min(5,(state.pressure||0)+1);
      addStory("master","Mestre Máquina",(a.fail||"A tentativa encontra resistência.")+" A segunda abordagem produz progresso com custo: a peça necessária é obtida, mas o mundo avança e alguém percebe o interesse da companhia.",r.formula);
      advanceTime(10);updateCampaignObjective();return;
    }
    addStory("master","Mestre Máquina",a.fail||"A tentativa não fecha a questão, mas deixa um caminho claro para outra abordagem.",r.formula);advanceTime(6);return;
  }
  completeAction(a.id);if(a.clue)addClue(a.clue);if(a.flag)addRouteFlag(a.flag);if(a.item&&!hasItem(a.item))addItem(a.item);
  if(a.npc)adjustNpcRelation(a.npc,{trust:1,respect:1},"A companhia conduziu uma interação importante com sucesso.");
  addStory("master","Mestre Máquina",a.success||"A ação produz uma nova peça concreta para a investigação.",r.formula);
  advanceTime(7);updateCampaignObjective();
}
const NPC_CATALOG={
  derenfall:{
    colecionador:{name:"O Colecionador",role:"Entidade da Fenda",locations:["Salão das Memórias"]}
  },
  vidro:{
    maeryn:{name:"Rainha Maeryn",role:"Soberana de Asterfall",locations:["Salão dos Juramentos","Palácio Real"]},
    ilyan:{name:"Ilyan Voss",role:"Arquivista Real",locations:["Arquivos Reais"]},
    cassian:{name:"Cassian Dorel",role:"Representante de uma Casa nobre",locations:["Distrito das Casas","Mercado Alto"]},
    sera:{name:"Sera Valen",role:"Escriba clandestina",locations:["Bairro dos Escribas","Porto Seco"]},
    arven:{name:"Arven Sol",role:"Guardião dos memoriais reais",locations:["Catedral da Aurora","Cripta Dinástica"]},
    elia:{name:"Elia Varn",role:"Capitã da guarda palaciana",locations:["Palácio Real","Passagens Subterrâneas"]}
  },
  coro:{
    borik:{name:"Borik Khar",role:"Capataz da mina",locations:["Acampamento de Khar-Dor","Galeria Principal"]},
    sella:{name:"Sella",role:"Curandeira do acampamento",locations:["Enfermaria","Acampamento de Khar-Dor"]},
    yara:{name:"Yara",role:"Mineira que antecipa o canto",locations:["Alojamentos dos Mineiros","Enfermaria"]},
    dorran:{name:"Dorran",role:"Mestre da Forja",locations:["Forja"]},
    tarek:{name:"Tarek",role:"Cartógrafo da mina",locations:["Galeria Principal","Reservatório Subterrâneo"]},
    nura:{name:"Nura",role:"Anciã das liturgias de pedra",locations:["Santuário de Pedra"]}
  }
};

const DIRECTOR_WORLD_EVENTS={
  derenfall:[
    {id:"deren_beat_5",beat:5,text:"Uma vela que permanecia acesa numa janela distante se apaga. Segundos depois, outra acende em uma casa que vocês juravam estar vazia.",pressure:1},
    {id:"deren_beat_10",beat:10,text:"O sino toca uma vez sem que ninguém esteja na torre. Desta vez, o eco vem de dois pontos diferentes da vila.",pressure:1},
    {id:"deren_beat_15",beat:15,text:"Perto do portão surge uma pegada fresca voltada para dentro da vila. Não havia ninguém ali quando vocês chegaram.",pressure:1}
  ],
  vidro:[
    {id:"vidro_beat_4",beat:4,text:"Antes que a investigação esfrie, um novo rumor atravessa Arken: uma das Casas nobres afirma possuir uma cópia anterior do juramento real. A cidade começa a tomar partido.",pressure:1,npc:"cassian"},
    {id:"vidro_beat_8",beat:8,text:"Os Arquivos Reais suspendem o acesso público. Um funcionário desapareceu durante a troca de turno e alguém removeu três caixas do catálogo.",pressure:1,npc:"ilyan"},
    {id:"vidro_beat_12",beat:12,text:"A Coroa convoca uma reunião extraordinária para a noite. As Casas agora negociam como se a sucessão pudesse mudar antes do amanhecer.",pressure:1,npc:"maeryn"},
    {id:"vidro_beat_16",beat:16,text:"Panfletos anônimos aparecem no Mercado Alto com um brasão que não existe na genealogia oficial. A população começa a discutir o nome que a corte tentou apagar.",pressure:1,npc:"sera"},
    {id:"vidro_beat_20",beat:20,text:"Guardas fecham as pontes internas do palácio. A crise deixou de ser acadêmica: cada Casa prepara sua própria versão da sucessão.",pressure:1,npc:"elia"}
  ],
  coro:[
    {id:"coro_beat_4",beat:4,text:"Mesmo acordados, dois mineiros começam a murmurar a melodia do sono. A enfermaria percebe que o fenômeno já não depende de inconsciência.",pressure:1,npc:"sella"},
    {id:"coro_beat_8",beat:8,text:"Um desabamento fecha uma galeria antiga e revela uma parede de pedra que não aparece em nenhum mapa da mina.",pressure:1,npc:"borik"},
    {id:"coro_beat_12",beat:12,text:"O clã recebe ordem para retomar parte da produção apesar dos desaparecimentos. A ameaça agora também é política e econômica.",pressure:1,npc:"dorran"},
    {id:"coro_beat_16",beat:16,text:"A água do reservatório começa a vibrar sem som. Mineiros acordados repetem lembranças de colegas que estão em outra galeria.",pressure:1,npc:"sella"},
    {id:"coro_beat_20",beat:20,text:"O canto alcança a forja e faz ferramentas ressoarem com nomes de mortos do clã. A montanha começa a misturar passado e presente.",pressure:1,npc:"nura"}
  ]
};

function ensureDirectorState(){
  if(!state)return;
  if(!state.npcRelations)state.npcRelations={};
  if(!state.director)state.director={beats:0,stagnation:0,tension:1,restNeed:0,lastStyle:null,styleStreak:0,lastInterventionBeat:-99,worldBeat:0,personalHookUsed:false};
}
function discoverNpc(id){
  ensureDirectorState();
  const cat=NPC_CATALOG[state?.campaignId]||{},def=cat[id];
  if(!def||state.npcRelations[id])return state.npcRelations[id]||null;
  state.npcRelations[id]={id:id,name:def.name,role:def.role,trust:0,respect:0,fear:0,suspicion:0,metAt:state.location,notes:[]};
  return state.npcRelations[id];
}
function discoverNpcsForLocation(location){
  const cat=NPC_CATALOG[state?.campaignId]||{};
  Object.entries(cat).forEach(function(entry){
    const id=entry[0],def=entry[1];
    if((def.locations||[]).includes(location))discoverNpc(id);
  });
}
function relationshipLabel(rel){
  if(!rel)return"Neutro";
  if(rel.fear>=4&&rel.trust<1)return"Teme você";
  if(rel.trust>=4&&rel.suspicion<2)return"Confia em você";
  if(rel.suspicion>=4)return"Desconfia de você";
  if(rel.respect>=4)return"Respeita você";
  if(rel.trust<=-3)return"Hostil";
  if(rel.trust>=2)return"Receptivo";
  if(rel.suspicion>=2)return"Cauteloso";
  return"Neutro";
}
function adjustNpcRelation(id,changes,note){
  const rel=discoverNpc(id);if(!rel)return;
  Object.entries(changes||{}).forEach(function(entry){
    const k=entry[0],v=entry[1];rel[k]=Math.max(-6,Math.min(6,(rel[k]||0)+v));
  });
  if(note){rel.notes.unshift(note);rel.notes=rel.notes.slice(0,5)}
}
function npcIdsAtLocation(){
  const cat=NPC_CATALOG[state?.campaignId]||{};
  return Object.entries(cat).filter(function(entry){return (entry[1].locations||[]).includes(state.location)}).map(function(entry){return entry[0]});
}
function applyNpcInteraction(actor,text){
  if(!state)return;
  const n=norm(text),cat=NPC_CATALOG[state.campaignId]||{};
  let targets=Object.keys(cat).filter(function(id){return n.includes(norm(cat[id].name))});
  if(!targets.length&&/(falar|convers|pergunt|negoci|amea|ajud|curar|proteger|engan|mentir|atac)/.test(n))targets=npcIdsAtLocation();
  targets.forEach(function(id){
    discoverNpc(id);
    if(/ajud|curar|proteger|salvar|defender/.test(n))adjustNpcRelation(id,{trust:2,respect:1},"Recebeu ajuda direta do grupo.");
    else if(/amea|intimid|atac|ferir|matar/.test(n))adjustNpcRelation(id,{trust:-2,fear:2,suspicion:1},"Foi ameaçado ou atacado pelo grupo.");
    else if(/engan|mentir|fingir/.test(n))adjustNpcRelation(id,{suspicion:2,trust:-1},"Percebeu ou suspeita de manipulação.");
    else if(/negoci|acordo|ouvir|respeit/.test(n))adjustNpcRelation(id,{trust:1,respect:1},"O grupo tratou seus interesses como relevantes.");
    else if(/falar|convers|pergunt/.test(n))adjustNpcRelation(id,{trust:1},"Teve uma conversa direta com o grupo.");
  });
}
function renderNpcRelations(){
  if(!ui.npcRelationList)return;
  ensureDirectorState();
  const rels=Object.values(state.npcRelations||{});
  ui.npcRelationList.innerHTML=rels.length?rels.map(function(rel){
    return "<div class='npc-relation'><div class='npc-portrait'>"+npcSigil(rel)+"</div><div class='npc-relation-copy'><strong>"+esc(rel.name)+"</strong><small>"+esc(rel.role)+"</small></div><span>"+esc(relationshipLabel(rel))+"</span></div>";
  }).join(""):"<p class='muted'>Nenhuma relação relevante ainda.</p>";
}
function renderWorldEventCards(){
  if(!ui.worldEventCards||!state)return;
  const cards=(state.worldEventLog||[]).slice(0,4);
  ui.worldEventCards.innerHTML=cards.length?cards.map(function(ev){
    const icon=ev.kind==="pressure"?"⏳":ev.kind==="location"?"⌖":"☾";
    return "<article class='world-event-card "+esc(ev.kind)+"'><div class='event-thumb event-"+locationVisualKey(ev.location||state.location)+"'><span>"+icon+"</span></div><div><strong>"+esc(ev.title)+"</strong><small>"+esc(ev.location||"Vhalora")+"</small><p>"+esc(ev.text)+"</p></div></article>";
  }).join(""):"<p class='muted'>Nenhum evento mundial registrado ainda.</p>";
}
function directorSignature(){
  if(!state)return"";
  ensureDirectorState();
  return [
    state.location,
    (state.clues||[]).length,
    (state.rawEvidence||[]).length,
    (state.completedActions||[]).length,
    (state.routeFlags||[]).length,
    state.pressure||0,
    state.pendingRoll?.id||"",
    state.ending||"",
    Object.values(state.npcRelations||{}).map(function(r){return [r.id,r.trust,r.respect,r.fear,r.suspicion].join(":")}).join("|")
  ].join(";");
}
function directorBeforeAction(actor,text){
  ensureDirectorState();
  const d=state.director,style=actionStyle(text);
  d.beats=(d.beats||0)+1;d.restNeed=(d.restNeed||0)+1;
  if(d.lastStyle===style)d.styleStreak=(d.styleStreak||0)+1;else{d.lastStyle=style;d.styleStreak=1}
  if(style==="combat"||style==="risk")d.tension=Math.min(10,(d.tension||0)+2);
  else if(style==="stealth"||style==="magic")d.tension=Math.min(10,(d.tension||0)+1);
  else if(style==="support")d.tension=Math.max(0,(d.tension||0)-1);
  applyNpcInteraction(actor,text);
}
function recordWorldEvent(title,text,kind="world",location=null){
  ensureDirectorState();
  if(!Array.isArray(state.worldEventLog))state.worldEventLog=[];
  ensureInventoryState();
  if(!state.metrics)state.metrics={startedAt:Date.now(),decisions:0,rolls:0,travels:0,endedAt:null};
  state.worldEventLog.unshift({id:uid(),title:title,text:text,kind:kind,location:location||state.location,at:Date.now()});
  state.worldEventLog=state.worldEventLog.slice(0,12);
}
function fireDirectorWorldEvents(){
  ensureDirectorState();
  const events=DIRECTOR_WORLD_EVENTS[state.campaignId]||[],d=state.director;
  events.forEach(function(ev){
    const key="director:"+ev.id;
    if((d.beats||0)>=ev.beat&&!state.eventFired.includes(key)){
      state.eventFired.push(key);
      if(ev.pressure)state.pressure=Math.min(5,(state.pressure||0)+ev.pressure);
      if(ev.npc)discoverNpc(ev.npc);
      recordWorldEvent("O mundo continua",ev.text,"world",state.location);addStory("system","O mundo continua",ev.text);
    }
  });
}
function directorPersonalPrompt(){
  if(!player||!state||state.director.personalHookUsed)return"";
  const parts=[];
  if(player.personalGoal)parts.push("seu objetivo de "+player.personalGoal);
  if(player.importantPerson)parts.push("a pessoa importante para você: "+player.importantPerson);
  if(player.fear)parts.push("o medo que você definiu: "+player.fear);
  if(!parts.length)return"";
  state.director.personalHookUsed=true;
  return " Se quiser, esta pausa também é um bom momento para seu personagem falar sobre "+parts[0]+".";
}
function resolveRestScene(actor){
  ensureDirectorState();
  const d=state.director;
  addStory("master","Mestre Máquina","A companhia encontra alguns minutos de segurança relativa. O mundo não para, mas a tensão da cena diminui e vocês podem conversar, comparar pistas, reorganizar equipamentos ou simplesmente observar o ambiente."+directorPersonalPrompt());
  d.restNeed=0;d.tension=Math.max(0,(d.tension||0)-3);d.stagnation=0;
  advanceTime(12);
}
function directorIntervention(actor,text){
  ensureDirectorState();
  const d=state.director;if((d.beats||0)-(d.lastInterventionBeat||-99)<2)return false;
  d.lastInterventionBeat=d.beats||0;d.stagnation=0;
  if(state.campaignId==="derenfall"){
    const options=currentDerenActions();
    if(options.length){
      const a=options[0];
      addStory("system","Diretor Narrativo","A cena muda antes de ficar parada: um detalhe do ambiente chama atenção para outra possibilidade — "+a.label+". Isso é uma oportunidade, não uma obrigação.");
      return true;
    }
  }
  const exits=connectedLocations(state.location||"");
  if(exits.length){
    addStory("system","Diretor Narrativo","Enquanto vocês reconsideram a situação, algo muda no ambiente e torna "+exits[0]+" uma alternativa mais atraente. O grupo continua livre para permanecer aqui.");
    return true;
  }
  state.pressure=Math.min(5,(state.pressure||0)+1);
  addStory("system","Diretor Narrativo","A situação não permanece congelada. Uma consequência externa avança o relógio da história e cria uma nova condição para agir.");
  return true;
}
function directorAfterResolution(actor,text,beforeSignature){
  ensureDirectorState();
  const d=state.director,after=directorSignature();
  if(after===beforeSignature)d.stagnation=(d.stagnation||0)+1;else d.stagnation=0;
  fireDirectorWorldEvents();
  if((d.stagnation||0)>=2&&!state.pendingRoll)directorIntervention(actor,text);
}
function canFailForwardAction(a){
  if(!a)return false;
  return !/^hall_(seal|attack|break|negotiate|offer)$/.test(a.id);
}

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
{id:"fenda_anchors",location:"Fenda Memorial",label:"Examinar os fios luminosos",stat:"INT",df:13,keywords:["fio","luminoso","conexao"],once:true,requiresCluesAll:["moradores"]},
{id:"fenda_voices",location:"Fenda Memorial",label:"Seguir as vozes até o centro",stat:"PER",df:12,keywords:["vozes","centro"],once:true},
{id:"hall_observe",location:"Salão das Memórias",label:"Estudar a rede luminosa do salão",stat:"PER",df:12,keywords:["fio","memoria"],once:true},
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
"unspentBox","sheetSkills","sheetAvailableSkills","alphaLevelBtn","chatLog","chatInput","chatSendBtn","toast","diceOverlay","diceCard","diceWho","diceResult","diceFormula","audioMount","mobileGameNav","orientationHint","orientationLandscapeBtn","orientationContinueBtn","orientationDontShow","masterMemoryTitle","masterMemoryCount","masterMemoryInsight","masterMemoryList","evidenceList","importantPerson","characterFear","personalGoal","npcRelationList","sceneSigil","sceneBannerLabel","lobbyEmblem","campaignSeal","sceneBanner","worldEventCards","sceneArtUse","goldCount","equipmentSlots","inventoryList","campaignThreads","lobbyVoiceTechStatus","voiceTechStatus"
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
let rawMicStream=null;
let localStream=null;
let voiceCtx=null;
let voiceGraph=null;
let voiceMeterRAF=0;
let voiceWanted=false;
let voiceMuted=false;
let voiceMode=localStorage.getItem("cn_voice_mode")||"open";
let pttHeld=false;
let masterVoiceVolume=Math.max(0,Math.min(1,Number(localStorage.getItem("cn_voice_master")||1)));
let peerVoiceState=new Map();
let remoteVoice=new Map();
let voiceStatsTimer=null;
let voiceRecoveryTimer=null;
let voiceRecoveryAttempts=0;
let voiceLastActive=0;
let lastLocalSpeaking=false;
let lastVoiceStateKey="";
let peerStatsBaseline=new Map();
let tunedPeerConnections=new WeakSet();
let voiceAutoplayWarned=false;
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


const ITEMS={
  worn_blade:{name:"Lâmina Gasta",icon:"⚔",type:"weapon",rarity:"Comum",desc:"Arma simples e confiável.",bonuses:{FOR:1}},
  arcane_staff:{name:"Cajado de Foco",icon:"✦",type:"weapon",rarity:"Comum",desc:"Canaliza fórmulas e leituras de Éter.",bonuses:{INT:1}},
  twin_knives:{name:"Lâminas Gêmeas",icon:"◈",type:"weapon",rarity:"Comum",desc:"Leves e discretas.",bonuses:{AGI:1}},
  pilgrim_mace:{name:"Maça de Peregrino",icon:"✚",type:"weapon",rarity:"Comum",desc:"Símbolo de proteção e arma de defesa.",bonuses:{VIG:1}},
  pact_talisman:{name:"Talismã de Pacto",icon:"◉",type:"accessory",rarity:"Comum",desc:"Ajuda a estabilizar invocações.",bonuses:{INT:1}},
  hunter_bow:{name:"Arco de Trilha",icon:"➶",type:"weapon",rarity:"Comum",desc:"Feito para precisão e rastreio.",bonuses:{PER:1}},
  traveler_coat:{name:"Casaco de Viagem",icon:"♜",type:"armor",rarity:"Comum",desc:"Couro reforçado contra clima e impacto.",bonuses:{VIG:1}},
  bandage:{name:"Bandagem de Campo",icon:"✚",type:"consumable",rarity:"Comum",desc:"Recupera 18 HP.",heal:18},
  ether_vial:{name:"Frasco de Éter",icon:"◌",type:"consumable",rarity:"Raro",desc:"Recupera 14 MP.",mana:14},
  rope:{name:"Corda de 15 m",icon:"⌁",type:"tool",rarity:"Comum",desc:"Pode criar soluções de travessia e exploração."},
  bell_fragment:{name:"Fragmento do Sino",icon:"🔔",type:"quest",rarity:"Raro",desc:"Bronze antigo que responde à ressonância de Derenfall.",bonuses:{PER:1}},
  parish_registry:{name:"Cópia do Registro Paroquial",icon:"▤",type:"quest",rarity:"Raro",desc:"Nomes de famílias preservados em papel."},
  archive_seal:{name:"Lacre Autêntico dos Arquivos",icon:"♛",type:"quest",rarity:"Épico",desc:"Prova material de que os documentos rivais nasceram dentro do sistema real.",bonuses:{PRE:1}},
  crown_imprint:{name:"Impressão da Coroa de Vidro",icon:"◇",type:"quest",rarity:"Raro",desc:"Registro do reflexo dinástico observado na cerimônia."},
  khar_tuning_fork:{name:"Diapasão de Prospecção",icon:"♬",type:"tool",rarity:"Raro",desc:"Ferramenta de mineiro capaz de comparar ressonâncias do veio.",bonuses:{INT:1}},
  resonant_shard:{name:"Fragmento de Minério Memorial",icon:"◆",type:"quest",rarity:"Épico",desc:"Vibra com a mesma cadência do Coro.",bonuses:{PER:1}}
};
const STARTER_KITS={
  Guerreiro:["worn_blade","traveler_coat","bandage","rope"],
  Mago:["arcane_staff","traveler_coat","ether_vial","rope"],
  Assassino:["twin_knives","traveler_coat","bandage","rope"],
  Curandeiro:["pilgrim_mace","traveler_coat","bandage","ether_vial"],
  Invocador:["pact_talisman","traveler_coat","ether_vial","rope"],
  Caçador:["hunter_bow","traveler_coat","bandage","rope"]
};
function starterEquipment(className){
  const item=(STARTER_KITS[className]||STARTER_KITS.Guerreiro)[0];
  const def=ITEMS[item];
  return {weapon:def?.type==="weapon"?item:null,armor:"traveler_coat",accessory:def?.type==="accessory"?item:null};
}
function starterInventory(className){
  return (STARTER_KITS[className]||STARTER_KITS.Guerreiro).map(function(id){return {id:id,qty:1}});
}
function ensureInventoryState(){
  if(!state)return;
  if(!Array.isArray(state.inventory))state.inventory=starterInventory(player?.className||"Guerreiro");
  if(!state.equipmentByPlayer)state.equipmentByPlayer={};
  if(player&&!state.equipmentByPlayer[player.id])state.equipmentByPlayer[player.id]=starterEquipment(player.className);
  if(typeof state.gold!=="number")state.gold=24;
}
function itemQty(id){ensureInventoryState();const row=state.inventory.find(function(x){return x.id===id});return row?.qty||0}
function hasItem(id){return itemQty(id)>0}
function addItem(id,qty=1,announce=true){
  ensureInventoryState();if(!ITEMS[id])return;
  let row=state.inventory.find(function(x){return x.id===id});
  if(row)row.qty+=qty;else state.inventory.push({id:id,qty:qty});
  if(announce)addStory("system","Loot obtido",ITEMS[id].name+" foi adicionado à mochila da companhia.");
}
function removeItem(id,qty=1){
  ensureInventoryState();const row=state.inventory.find(function(x){return x.id===id});if(!row)return false;
  row.qty-=qty;if(row.qty<=0)state.inventory=state.inventory.filter(function(x){return x.id!==id});return true;
}
function equipmentFor(actor){ensureInventoryState();return state.equipmentByPlayer[actor?.id]||starterEquipment(actor?.className||"Guerreiro")}
function equipmentBonus(actor,stat){
  if(!state||!actor)return 0;const eq=equipmentFor(actor);let total=0;
  Object.values(eq||{}).filter(Boolean).forEach(function(id){total+=(ITEMS[id]?.bonuses?.[stat]||0)});
  return total;
}
function equipItem(id){
  ensureInventoryState();const item=ITEMS[id];if(!item||!["weapon","armor","accessory"].includes(item.type))return;
  state.equipmentByPlayer[player.id]=state.equipmentByPlayer[player.id]||starterEquipment(player.className);
  state.equipmentByPlayer[player.id][item.type]=id;addStory("system","Equipamento",player.name+" equipou "+item.name+".");saveHostState();renderState();broadcastState();
}
function useItem(id){
  ensureInventoryState();const item=ITEMS[id];if(!item||!hasItem(id))return;
  if(item.heal){player.hp=Math.min(player.maxHp,player.hp+item.heal);removeItem(id);persistCharacter();addStory("system","Item usado",player.name+" recuperou "+item.heal+" HP com "+item.name+".")}
  else if(item.mana){player.mp=Math.min(player.maxMp,player.mp+item.mana);removeItem(id);persistCharacter();addStory("system","Item usado",player.name+" recuperou "+item.mana+" MP com "+item.name+".")}
  else if(["weapon","armor","accessory"].includes(item.type)){equipItem(id);return}
  else return toast("Esse item é usado pelo Mestre quando a situação permitir.");
  saveHostState();renderState();broadcastState();
}
function runMetrics(){
  ensureStateShape();
  const m=state.metrics||{};
  const elapsedMs=(m.endedAt||Date.now())-(m.startedAt||Date.now());
  const storyWords=(state.story||[]).reduce(function(sum,e){return sum+String(e.text||"").trim().split(/\s+/).filter(Boolean).length},0);
  const fastMinutes=storyWords/220+(m.decisions||0)*0.18+(m.rolls||0)*0.07+(m.travels||0)*0.08;
  return {...m,elapsedMs:elapsedMs,storyWords:storyWords,estimatedFastMinutes:Math.max(1,fastMinutes)};
}
function freshDraft(){
  const stats={};Object.keys(ATTRS).forEach(k=>stats[k]=1);
  return {id:persistentPlayerId(),name:"",sex:"Masculino",origin:"Asterfall",className:"Guerreiro",level:1,stats,creationPoints:10,attributePoints:0,skillPoints:2,skills:[],importantPerson:"",fear:"",personalGoal:"",ready:false,characterReady:false};
}
function classSkills(cls=selectedClass){return SKILLS[cls]||[]}
function getSkill(id,cls=player?.className||selectedClass){return classSkills(cls).find(s=>s.id===id)}
function skillIcon(skill){
  const id=skill?.id||"";
  return id?`<svg class="skill-svg" viewBox="0 0 32 32" aria-hidden="true"><use href="./assets/skill-icons.svg#${esc(id)}"></use></svg>`:"✦";
}
function assetSlug(value){
  return norm(value||"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
function locationVisualKey(location){
  const n=norm(location||"");
  if(/fenda|salao das memorias|tunel impossivel|nucleo|coro/.test(n))return "anomaly";
  if(/igreja|capela|catedral|cripta|santuario/.test(n))return "sacred";
  if(/bosque|floresta|jardins/.test(n))return "wild";
  if(/palacio|juramentos|casas|arquivos|escribas|mercado/.test(n))return "court";
  if(/moinho|mina|galeria|forja|poco profundo|reservatorio/.test(n))return "mine";
  if(/estrada|portao|porto|acampamento/.test(n))return "road";
  return "village";
}
function npcSigil(rel){
  const known={colecionador:true,maeryn:true,ilyan:true,cassian:true,sera:true,borik:true,sella:true,yara:true,dorran:true};
  const id=String(rel?.id||"");
  if(known[id])return `<img src="./assets/npcs/${id}.svg" alt="" loading="lazy"/>`;
  return esc((rel?.name||"?").slice(0,1).toUpperCase());
}
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
  localStorage.setItem("cn_character",JSON.stringify(player));initMasterMemory(player).catch(function(){});
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
  ui.charName.value="";if(ui.importantPerson)ui.importantPerson.value="";if(ui.characterFear)ui.characterFear.value="";if(ui.personalGoal)ui.personalGoal.value="";renderCharacterBuilder();goCharStep(1);
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
  return `<article class="skill-card ${type} ${!can&&type==="available"?"locked":""}" data-skill="${skill.id}"><div class="skill-icon">${skillIcon(skill)}</div><div class="skill-copy"><strong>${esc(skill.name)}</strong><p>${esc(skill.desc)}</p><div class="tags"><span>Nv. ${skill.level}</span><span>${esc(skill.cost)}</span>${req?`<span>${req}</span>`:""}</div></div>${type==="available"&&can?'<button title="Aprender">+</button>':""}</article>`;
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
  draft.name=ui.charName.value.trim();draft.sex=selectedSex;draft.origin=selectedOrigin;draft.className=selectedClass;draft.importantPerson=(ui.importantPerson?.value||"").trim();draft.fear=(ui.characterFear?.value||"").trim();draft.personalGoal=(ui.personalGoal?.value||"").trim();
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
    clues:[],rawEvidence:[],objective:c.objective,ended:false,ending:null,pendingRoll:null,lastRoll:null,completedActions:[],failedActions:{},
    routeFlags:[],eventFired:[],worldEventLog:[],inventory:starterInventory(player?.className||"Guerreiro"),equipmentByPlayer:player?{[player.id]:starterEquipment(player.className)}:{},gold:24,metrics:{startedAt:Date.now(),decisions:0,rolls:0,travels:0,endedAt:null},unlockedLocations:unlocked,visitedLocations:visited,npcRelations:{},director:{beats:0,stagnation:0,tension:1,restNeed:0,lastStyle:null,styleStreak:0,lastInterventionBeat:-99,worldBeat:0,personalHookUsed:false},
    story:c.opening.map(function(text,i){return {id:uid(),type:i===0?"system":"master",who:i===0?"Prólogo":"Mestre Máquina",text:text,ts:Date.now()+i}})
  };
}
function ensureStateShape(){
  if(!state)return;
  if(!Array.isArray(state.completedActions))state.completedActions=[];
  if(!Array.isArray(state.rawEvidence))state.rawEvidence=[];
  if(!state.failedActions)state.failedActions={};
  if(!Array.isArray(state.routeFlags))state.routeFlags=[];
  if(!Array.isArray(state.eventFired))state.eventFired=[];
  if(!Array.isArray(state.worldEventLog))state.worldEventLog=[];
  if(!Array.isArray(state.unlockedLocations))state.unlockedLocations=[state.location];
  if(!Array.isArray(state.visitedLocations))state.visitedLocations=[state.location];
  if(!state.npcRelations)state.npcRelations={};
  if(!state.director)state.director={beats:0,stagnation:0,tension:1,restNeed:0,lastStyle:null,styleStreak:0,lastInterventionBeat:-99,worldBeat:0,personalHookUsed:false};
  if(state.campaignId==="derenfall"){
    unlockLocations("Estrada de Derenfall","Portão de Derenfall");
    if(state.location==="Portão de Derenfall")unlockLocations("Praça de Derenfall");
    if(state.location!=="Estrada de Derenfall"&&state.location!=="Portão de Derenfall")unlockDerenSurface();
    if(state.location==="Fenda Memorial"){
      unlockLocations("Fenda Memorial");
      if(!state.routeFlags.some(function(flag){return /^route_(igreja|capela|bosque|poco)$/.test(flag)}))addRouteFlag("route_igreja");
    }
    if(state.location==="Salão das Memórias"){
      unlockLocations("Fenda Memorial","Salão das Memórias");
      addRouteFlag("route_hall");
      if(!state.routeFlags.some(function(flag){return /^route_(igreja|capela|bosque|poco)$/.test(flag)}))addRouteFlag("route_igreja");
    }
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
  ensureStateShapeBase();
  if(revealClue(id))tryResolveRevelations();
}
function finishEnding(title,text){
  state.ended=true;state.ending=title;state.objective="Desfecho alcançado: "+title;state.metrics.endedAt=Date.now();addStory("system","DESFECHO — "+title,text);const rm=runMetrics();addStory("system","Resumo da run",`Decisões: ${rm.decisions||0} • Rolagens: ${rm.rolls||0} • Viagens: ${rm.travels||0} • Tempo no mundo: ${Math.max(0,state.worldMinutes-(18*60+40))} min • Ritmo rápido estimado: ${rm.estimatedFastMinutes.toFixed(1)} min.`);rememberCampaignEnding(title);
}
function moveTo(dest,text=null){
  ensureStateShape();unlockLocations(dest);state.location=dest;
  if(!state.visitedLocations.includes(dest))state.visitedLocations.push(dest);
  advanceTime(6);state.metrics.travels=(state.metrics.travels||0)+1;
  if(state.campaignId==="derenfall"&&dest==="Portão de Derenfall")unlockLocations("Praça de Derenfall");
  if(state.campaignId==="derenfall"&&dest==="Praça de Derenfall")unlockDerenSurface();
  addStory("master","Mestre Máquina",text||(state.campaignId==="derenfall"?derenfallArrival(dest):"A companhia segue para "+dest+". O lugar muda as pessoas, informações e riscos disponíveis."));
  triggerLocationEvent(dest);
  discoverNpcsForLocation(dest);
  if(state.campaignId==="derenfall")updateDerenObjective();else updateCampaignObjective();
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
  const d20=1+Math.floor(Math.random()*20),baseBonus=actor.stats?.[p.stat]||0,gearBonus=equipmentBonus(actor,p.stat),bonus=baseBonus+gearBonus,total=d20+bonus;state.metrics.rolls=(state.metrics.rolls||0)+1;
  const result={id:uid(),rollId:p.id,playerId,who:actor.name,d20,bonus,total,stat:p.stat,df:p.df,success:total>=p.df,critical:d20===20,fumble:d20===1,formula:`1d20 (${d20}) + ${p.stat} ${baseBonus>=0?"+":""}${baseBonus}${gearBonus?` + Equip. ${gearBonus}`:""} = ${total} vs DF ${p.df}`};
  observeRollOutcome(actor,result,p.context).catch(function(){});
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
  ensureDirectorState();
  if(!Array.isArray(state.completedActions))state.completedActions=[];
  if(!Array.isArray(state.rawEvidence))state.rawEvidence=[];
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
  if(a.requiresEvidenceAll&&!a.requiresEvidenceAll.every(hasEvidence))return false;
  if(a.requiresEvidenceAny&&a.requiresEvidenceAny.length&&!a.requiresEvidenceAny.some(hasEvidence))return false;
  if(a.requiresCluesAll&&!a.requiresCluesAll.every(hasClue))return false;
  if(a.requiresAnyClue&&!a.requiresAnyClue.some(hasClue))return false;
  if(a.requiresFlagsAll&&!a.requiresFlagsAll.every(hasFlag))return false;
  if(a.requiresAnyFlag&&!a.requiresAnyFlag.some(hasFlag))return false;
  return true;
}
function currentDerenActions(){
  ensureStateShapeBase();
  return rankActionsWithMemory(DEREN_ACTIONS.filter(function(a){return a.location===state.location&&actionAvailable(a)}));
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
  ensureStateShape();state.metrics.decisions=(state.metrics.decisions||0)+1;
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
  if(events[dest]){recordWorldEvent("Evento do local",events[dest],"location",dest);addStory("system","Evento do local",events[dest]);}
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
  if(events[level]){recordWorldEvent("O mundo avança",events[level],"pressure",state.location);addStory("system","O mundo avança",events[level]);}
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
    const failures=state.failedActions[a.id];
    if(failures>=2&&canFailForwardAction(a)){
      addStory("master","Mestre Máquina","A tentativa ainda cobra um preço, mas não bloqueia a aventura. Depois de insistir e gastar mais tempo, vocês conseguem a informação ou acesso necessário — com uma consequência: o mundo teve tempo para reagir.",r.formula);
      state.pressure=Math.min(5,(state.pressure||0)+1);
      advanceTime(8);completeAction(a.id);
      applyDerenActionSuccess(actor,a,{...r,success:true,compromised:true,formula:r.formula+" • progresso com custo"});
      updateDerenObjective();return;
    }
    addStory("master","Mestre Máquina",actionFailureNarrative(a),r.formula);advanceTime(4);return;
  }
  completeAction(a.id);applyDerenActionSuccess(actor,a,r);updateDerenObjective();
}
function applyDerenActionSuccess(actor,a,r){
  let text="";
  switch(a.id){
    case "road_tracks": addEvidence("ev_no_exodus","Estrada de Derenfall");unlockLocations("Portão de Derenfall");text="Os rastros chegam até o portão, mas não continuam pela estrada. Nenhuma multidão deixou Derenfall por aqui.";break;
    case "road_marker": addRouteFlag("road_symbol");text="Um marco antigo sob o musgo exibe geometria pré-Ruptura. O símbolo não explica o desaparecimento, mas prova que a região já era importante antes da vila existir.";break;
    case "gate_lock": addEvidence("ev_locked_inside","Portão de Derenfall");addClue("portao");unlockLocations("Praça de Derenfall");text="As travas foram soltas por dentro e depois simplesmente abandonadas. Não há sinais de pânico, multidão ou arrombamento.";break;
    case "gate_cart": addClue("moinho");unlockLocations("Moinho Velho");text="Sacos rasgados carregam o selo do Moinho Velho. A carga chegou poucas horas antes do silêncio.";break;
    case "square_cart": addEvidence("ev_square_interrupt","Praça de Derenfall");unlockDerenSurface();text="A carroça caiu no meio do descarregamento. Pela posição dos objetos e das casas ao redor, muitas tarefas pararam praticamente ao mesmo tempo.";break;
    case "square_sound": addEvidence("ev_bell_foundation","Praça de Derenfall");unlockLocations("Igreja");text="O som não vem apenas da torre: ele parece viajar pelas fundações da vila, como se pedra e metal compartilhassem a mesma vibração.";break;
    case "square_routes": unlockDerenSurface();text="Do centro, vocês identificam rotas claras para igreja, hospedaria, escola, poço, cemitério e casas periféricas.";break;
    case "church_bell": addEvidence("ev_bell_mechanism","Igreja");addEvidence("ev_bell_response","Igreja");text="O mecanismo não poderia tocar o sino. Quando um de vocês lembra em voz alta o nome de alguém importante, o bronze responde com uma vibração própria.";break;
    case "church_altar": addEvidence("ev_hollow_altar","Igreja");text="Sob o altar existe um encaixe circular muito mais antigo que a igreja. O piso esconde uma estrutura subterrânea.";break;
    case "church_records": addEvidence("ev_parish_names","Igreja");if(!hasItem("parish_registry"))addItem("parish_registry");unlockLocations("Escola","Cemitério","Hospedaria");text="Os registros conectam famílias da vila a escola, cemitério e hospedaria. Alguns nomes começam a desaparecer de documentos diferentes na mesma ordem.";break;
    case "church_passage": addRouteFlag("route_igreja");unlockLocations("Fenda Memorial");text="O encaixe cede. A escada sob o altar desce mais do que a profundidade da igreja permitiria. Vocês abriram uma rota direta para a Fenda.";break;
    case "inn_ledger": addClue("livro");unlockLocations("Moinho Velho");text="A última anotação termina antes do nome do próprio autor. Entre as despesas do dia há uma entrega do moinho e hospedagem de um viajante cuja assinatura também sumiu.";break;
    case "inn_rooms": addClue("botas");unlockLocations("Moinho Velho","Casas Periféricas");text="Num quarto, botas ainda molhadas carregam barro escuro e palha do caminho do moinho. O hóspede esteve lá pouco antes de desaparecer.";break;
    case "inn_kitchen": addEvidence("ev_wrong_reflection","Hospedaria");unlockLocations("Poço");text="A água do jarro reflete por um instante o rosto de outra pessoa. O balde ao lado traz a marca do poço da praça.";break;
    case "inn_compare": addEvidence("ev_inn_times","Hospedaria");text="Ao cruzar horários, fica claro que pessoas em pontos distantes perderam a continuidade da própria rotina quase no mesmo minuto.";break;
    case "school_drawings": addEvidence("ev_drawings","Escola");unlockLocations("Bosque da Lembrança");text="Quando os desenhos são colocados lado a lado, portas e árvores se repetem. O Bosque da Lembrança aparece como referência constante.";break;
    case "school_register": addEvidence("ev_school_names","Escola");unlockLocations("Cemitério","Hospedaria");text="A lista de presença preservou nomes que já estão falhando em outros documentos. Por enquanto, ela oferece apenas uma referência confiável para comparação.";break;
    case "school_decode": addEvidence("ev_map_pattern","Escola");unlockLocations("Bosque da Lembrança");text="Sobrepostos, os desenhos formam um mapa simbólico. Um arco de árvores leva a um ponto marcado como 'casa com céu dentro'.";break;
    case "well_voice": addEvidence("ev_wrong_voice","Poço");unlockLocations("Bosque da Lembrança");text="A voz mistura detalhes corretos e erros impossíveis. Ela parece recombinar informações de quem escuta, mas a origem ainda não está clara.";break;
    case "well_rope": addEvidence("ev_well_channel","Poço");unlockLocations("Moinho Velho","Capela Antiga");text="A corda alcança uma abertura lateral. O poço se conecta a um canal antigo que corre na direção do moinho e da capela.";break;
    case "well_reflection": addRouteFlag("route_poco");unlockLocations("Fenda Memorial");text="O reflexo se abre como uma superfície profunda. Por alguns segundos, o poço se torna uma passagem estável para a Fenda Memorial.";break;
    case "cemetery_graves": addEvidence("ev_names_erasing","Cemitério");unlockLocations("Capela Antiga");text="As letras racham de dentro para fora. A trilha das fissuras aponta para pedras mais antigas junto à Capela Antiga.";break;
    case "cemetery_tracks": addClue("animais");unlockLocations("Bosque da Lembrança");text="Animais passaram pelo cemitério, mas todos desviaram da mesma direção: o bosque. O padrão é deliberado demais para ser acaso.";break;
    case "cemetery_token": addEvidence("ev_bronze_resonance","Cemitério");if(!hasItem("bell_fragment"))addItem("bell_fragment");unlockLocations("Igreja");text="Sob a lápide sem nome há um fragmento de bronze. Ao segurá-lo, o sino da igreja vibra à distância.";break;
    case "chapel_seal": addEvidence("ev_nhal_symbol","Capela Antiga");text="O selo pertence a Nhal e descreve uma técnica para separar memória, identidade e matéria sem destruir nenhuma das três.";break;
    case "chapel_crypt": addEvidence("ev_tunnel_church","Capela Antiga");addRouteFlag("route_tunnel");unlockLocations("Igreja");text="Uma passagem estreita segue sob o terreno até as fundações da igreja. Capela e altar faziam parte do mesmo sistema antigo.";break;
    case "chapel_activate": addRouteFlag("route_capela");unlockLocations("Fenda Memorial");text="O mecanismo reconhece as pistas reunidas e abre uma dobra silenciosa entre a capela e a Fenda.";break;
    case "outskirts_houses": addEvidence("ev_house_interrupt","Casas Periféricas");text="Panelas, ferramentas e cartas foram abandonadas em estágios quase idênticos. A vila inteira foi atingida em uma janela muito curta.";break;
    case "outskirts_belongings": addEvidence("ev_personal_objects","Casas Periféricas");unlockLocations("Bosque da Lembrança");text="Fotos, brinquedos e presentes mantêm detalhes que documentos perderam. O padrão é real, mas ainda não há informação suficiente para explicar por quê.";break;
    case "outskirts_tracks": unlockLocations("Moinho Velho","Bosque da Lembrança");text="Pegadas isoladas seguem para o moinho e depois se perdem na borda do bosque. Não parecem uma fuga coletiva.";break;
    case "mill_ledger": addEvidence("ev_mill_delivery","Moinho Velho");unlockLocations("Igreja","Hospedaria");text="O registro confirma entregas para igreja e hospedaria no mesmo horário em que os relatos começaram a falhar.";break;
    case "mill_wheel": addEvidence("ev_mill_time","Moinho Velho");text="As marcas da engrenagem mostram pequenas inversões ocorridas antes do desaparecimento. Algo estranho já acontecia ali havia dias, mas sua relação com a vila ainda é incerta.";break;
    case "mill_channel": addEvidence("ev_mill_channel","Moinho Velho");unlockLocations("Poço","Capela Antiga");text="O canal passa sob a vila e toca estruturas antigas perto do poço e da capela. As construções parecem relacionadas, mas ainda não está claro qual era sua função.";break;
    case "grove_animals": addEvidence("ev_animals_avoid","Bosque da Lembrança");addClue("animais");unlockLocations("Capela Antiga");text="Os animais contornam um ponto específico e depois seguem para a capela, como se evitassem atravessar uma fronteira invisível.";break;
    case "grove_echoes": addEvidence("ev_forest_echo","Bosque da Lembrança");text="As vozes do bosque repetem cenas e nomes fora de ordem. Uma delas descreve moradores entrando numa 'rua atrás das árvores', mas vocês ainda não sabem o que essas vozes representam.";break;
    case "grove_threshold": addRouteFlag("route_bosque");unlockLocations("Fenda Memorial");text="O padrão dos desenhos coincide com as árvores. Ao repetir a sequência correta, o espaço entre dois troncos se abre para a Fenda.";break;
    case "fenda_residents": addEvidence("ev_residents_identity","Fenda Memorial");text="Vocês encontram moradores vivos. Eles sabem falar e agir, mas muitos não reconhecem o próprio nome, casa ou família.";break;
    case "fenda_anchors": addEvidence("ev_luminous_links","Fenda Memorial");text="Fios luminosos ligam alguns moradores a objetos, nomes e lugares. O padrão é consistente, mas sua função ainda precisa ser compreendida.";break;
    case "fenda_voices": addRouteFlag("route_hall");unlockLocations("Salão das Memórias");text="As vozes convergem. Seguindo o padrão, vocês encontram uma porta feita de lembranças sobrepostas.";moveTo("Salão das Memórias",derenfallArrival("Salão das Memórias"));break;
    case "hall_observe": addEvidence("ev_entity_threads","Salão das Memórias");text="Os fios do salão convergem na entidade, mas também seguem de volta até os moradores. Isso prova uma ligação direta, não ainda a origem nem a intenção do fenômeno.";break;
    case "hall_talk": addEvidence("ev_entity_statement","Salão das Memórias");addRouteFlag("colecionador_dialogo");text="A entidade admite que romper todos os fios ameaça sua existência. Ela aceita conversar sobre preço, pacto ou outra forma de manter-se estável.";break;
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
  const action=findCampaignAction(text);
  if(action){requestRoll(actor,action.stat,action.df,action.label,{kind:"campaign_action",campaignId:state.campaignId,actionId:action.id});return}
  if(state.campaignId==="vidro"&&/apresentar as provas|provas a coroa|expor os documentos|confrontar a coroa/.test(n)){
    if(!campaignCaseReady("vidro")){addStory("master","Mestre Máquina","Vocês já possuem peças importantes, mas ainda há brechas que a corte poderia explorar. Falta ligar a linhagem apagada ao encobrimento e cruzar pelo menos três frentes independentes da investigação.");updateCampaignObjective();return}
    const df=hasItem("archive_seal")?11:13;requestRoll(actor,"PRE",df,"Expor a verdade dinástica",{kind:"vidro_verdict"});return;
  }
  if(state.campaignId==="vidro"&&/vazar os dossies|publicar as provas|entregar a sera/.test(n)){
    if(!campaignCaseReady("vidro")||!hasClue("vidroescriba")){addStory("master","Mestre Máquina","Sera se recusa a publicar um caso que ainda possa ser desmontado como rumor. É preciso fechar melhor a genealogia e o encobrimento.");return}
    requestRoll(actor,"PRE",12,"Publicar o dossiê dinástico",{kind:"vidro_leak"});return;
  }
  if(state.campaignId==="coro"&&/harmonizar o coro|harmonizar a rede|desviar o canto|responder ao coro/.test(n)){
    if(!campaignCaseReady("coro")){addStory("master","Mestre Máquina","Interferir agora seria adivinhar. Vocês ainda precisam entender a memória da pedra, o ritual antigo e pelo menos três peças sobre como a rede alcança os vivos.");updateCampaignObjective();return}
    const df=hasItem("khar_tuning_fork")?12:14;requestRoll(actor,"INT",df,"Harmonizar o Coro",{kind:"coro_harmonize"});return;
  }
  if(state.campaignId==="coro"&&/selar o nucleo|silenciar o nucleo|fechar o nucleo/.test(n)){
    if(!campaignCaseReady("coro")){addStory("master","Mestre Máquina","O núcleo pode ser selado, mas fazê-lo sem compreender a Liturgia da Pedra arriscaria prender as memórias junto com os mineiros.");return}
    requestRoll(actor,"INT",14,"Selar o Núcleo Mineral",{kind:"coro_seal"});return;
  }
  if(dest&&dest!==state.location&&(/ir|entrar|seguir|andar|voltar|visitar|aproxim/.test(n)||n.includes(norm(dest)))){moveTo(dest,`A companhia segue para ${dest}. O lugar adiciona uma nova frente à investigação e pode contradizer o que parecia certo até agora.`);updateCampaignObjective();return}
  if(/investig|procur|exam|observar|rastre|escut|ler|analis|vasculh|compar/.test(n)){requestRoll(actor,statFor(text),13,"Investigar "+state.location,{kind:"campaign_investigate",campaignId:state.campaignId,location:state.location,text});return}
  if(/convenc|negoci|engan|interrogar|persu|convers|pergunt/.test(n)){requestRoll(actor,"PRE",13,"Influenciar a situação",{kind:"campaign_social",campaignId:state.campaignId,text});return}
  if(/tentar|forcar|forçar|saltar|escalar|arrombar|atacar/.test(n)){requestRoll(actor,statFor(text),13,"Resolver a ação",{kind:"generic",text});return}
  advanceTime(3);addStory("master","Mestre Máquina",`A ação muda o contexto em ${state.location}. O Mestre preserva o tom — ${c.tone} — e responde com uma consequência concreta ou nova oportunidade, sem fingir que toda ação precisa revelar uma pista.`);
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
  ensureStateShape();state.metrics.decisions=(state.metrics.decisions||0)+1;
  const beforeSignature=directorSignature();
  directorBeforeAction(actor,text);
  observePlayerAction(actor,text).catch(function(){});
  const repeatCount=registerRepetition(actor,text);
  addStory("player",actor.name,text);
  if(/fazer uma pausa|descansar um pouco|conversar com a companhia/.test(norm(text))){
    resolveRestScene(actor);directorAfterResolution(actor,text,beforeSignature);
    saveHostState();renderState();broadcastState();return;
  }
  if(repeatCount>=3){
    triggerAdaptiveRecovery(actor,text);directorAfterResolution(actor,text,beforeSignature);
    saveHostState();renderState();broadcastState();return;
  }
  if(state.campaignId==="derenfall")resolveDerenfall(actor,text);else resolveGenericCampaign(actor,text);
  directorAfterResolution(actor,text,beforeSignature);
  saveHostState();renderState();broadcastState();
}
function resolveRollContext(actor,r,ctx){
  if(!ctx)return;
  if(ctx.kind==="deren_action"){resolveDerenActionRoll(actor,r,ctx.actionId);return;}
  if(ctx.kind==="generic"){
    if(r.success){addStory("master","Mestre Máquina","A tentativa funciona. O resultado altera a cena a favor da companhia, respeitando o método descrito.",r.formula);advanceTime(5)}else{state.pressure=Math.min(5,(state.pressure||0)+1);addStory("master","Mestre Máquina","A tentativa não funciona como planejado, mas a cena avança: vocês conseguem uma informação parcial ou mudança de posição, enquanto o custo aparece como tempo perdido, exposição ou pressão adicional.",r.formula);advanceTime(8)}return;
  }
  if(ctx.kind==="deren_fenda"){
    addStory("master","Mestre Máquina",r.success?"Seguindo ecos que repetem nomes incompletos, vocês atravessam uma porta suspensa e alcançam um salão atravessado por fios de luz. Uma criatura feita de máscaras se ergue no centro.\n\n— Vocês ainda carregam seus nomes — ela diz. — Que desperdício.":"As ruas se repetem e tentam separar o grupo usando vozes conhecidas. Vocês permanecem juntos, mas chegam ao centro da anomalia depois de perder a noção de distância.",r.formula);
    moveTo("Salão das Memórias");state.objective="Investigar a entidade, os fios e os moradores antes de decidir como agir.";return;
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
  if(ctx.kind==="campaign_action"){resolveCampaignActionRoll(actor,r,ctx.actionId);return;}
  if(ctx.kind==="vidro_verdict"){
    if(r.success)finishEnding("A Verdade sob Juramento","As provas são apresentadas diante da Coroa e das Casas. Maeryn não consegue apagar a contradição sem romper publicamente o próprio juramento. O segundo soberano passa a ser reconhecido como parte censurada da história, abrindo uma crise política em vez de uma guerra imediata.");
    else finishEnding("A Verdade sob Censura","As provas não vencem a sala, mas são fortes demais para desaparecer. A Coroa impõe silêncio oficial; cópias começam a circular clandestinamente e Arken entra numa guerra de versões.");
    return;
  }
  if(ctx.kind==="vidro_leak"){
    if(r.success)finishEnding("O Nome nas Ruas","Sera distribui cópias verificáveis antes que a guarda consiga conter a notícia. A verdade deixa de pertencer à Coroa; Arken entra numa crise pública, mas nenhuma Casa pode controlar sozinha o que todos agora conhecem.");
    else finishEnding("Panfletos e Cinzas","Parte do dossiê é apreendida, mas cópias incompletas escapam. A cidade conhece o nome apagado sem conhecer toda a história, criando uma crise ainda mais imprevisível.");
    return;
  }
  if(ctx.kind==="coro_harmonize"){
    if(r.success)finishEnding("A Canção Desviada","Usando a cadência dos mineiros e a ressonância do veio, a companhia devolve ao Coro um padrão que não exige hospedeiros humanos. Os trabalhadores despertam, mas a montanha continua cantando para si mesma.");
    else finishEnding("Silêncio de Pedra","A tentativa quebra a sincronia, mas sela parte das vozes dentro do minério. Os mineiros sobrevivem; algumas memórias, porém, permanecem gravadas na montanha e podem voltar a responder no futuro.");
    return;
  }
  if(ctx.kind==="coro_seal"){
    if(r.success)finishEnding("Silêncio de Pedra","A Liturgia fecha o núcleo sem esmagar as memórias gravadas. Os mineiros despertam; a montanha fica muda, preservando dentro dela séculos de vozes que talvez um dia possam ser estudadas com segurança.");
    else finishEnding("A Última Nota","O selo funciona de forma incompleta. Os mineiros são libertados, mas parte da rede mineral se parte e algumas memórias antigas desaparecem para sempre.");
    return;
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
  if(!r.success){
    result="A investigação encontra sinais incompletos, mas ainda não há base suficiente para formar uma conclusão. A evidência continua disponível para ser cruzada depois.";
    addStory("master","Mestre Máquina",result,r.formula);advanceTime(6);return;
  }
  if(loc==="Estrada de Derenfall"){addEvidence("ev_no_exodus",loc);result="Os rastros chegam à vila, mas não registram uma saída coletiva pela estrada."}
  else if(loc==="Praça de Derenfall"){addEvidence("ev_square_interrupt",loc);result="Carga, objetos e tarefas foram interrompidos na praça sem sinais claros de luta."}
  else if(loc==="Hospedaria"){addEvidence("ev_inn_times",loc);result="Os horários do livro e da cozinha cessam quase juntos, mas isso sozinho ainda não explica o desaparecimento."}
  else if(loc==="Igreja"){addEvidence("ev_hollow_altar",loc);result="O piso do altar esconde uma estrutura mais antiga. Sua função ainda não está determinada."}
  else if(loc==="Cemitério"){addEvidence("ev_names_erasing",loc);result="As inscrições apresentam um apagamento impossível, mas a causa permanece desconhecida."}
  else if(loc==="Escola"){addEvidence("ev_drawings",loc);result="Desenhos de crianças diferentes repetem formas e lugares semelhantes."}
  else if(loc==="Capela Antiga"){addEvidence("ev_nhal_symbol",loc);result="Os símbolos podem ser identificados como geometria de Nhal, mas ainda falta contexto para saber por que estão aqui."}
  else if(loc==="Poço"){addEvidence("ev_wrong_voice",loc);result="A voz reproduz informações corretas e incorretas ao mesmo tempo. O fenômeno fica registrado sem interpretação definitiva."}
  else if(loc==="Fenda Memorial"){addEvidence("ev_residents_identity",loc);result="Os moradores estão vivos, porém demonstram falhas claras de identidade e reconhecimento."}
  else if(loc==="Salão das Memórias"){addEvidence("ev_entity_threads",loc);result="A entidade está fisicamente conectada à rede luminosa, mas isso ainda não explica sua origem ou intenção."}
  else result="A investigação produz uma observação concreta, mas ainda não existem peças suficientes para uma conclusão.";
  if(r.critical)result+=" Um detalhe adicional fica registrado para comparação futura.";
  addStory("master","Mestre Máquina",result,r.formula);advanceTime(7);
}
function resolveCampaignInvestigation(actor,r,cid,loc,text){
  const extras={
    vidro:{
      "Jardins Reais":"A disposição dos encontros e guardas mostra que a corte usa os jardins para conversas que não devem entrar em ata.",
      "Mercado Alto":"Rumores sobre o soberano apagado mudam de forma conforme passam entre mercadores, criados e agentes das Casas.",
      "Porto Seco":"Manifestos e depósitos confirmam que a cidade possui rotas perfeitas para mover documentos sem passar pelos Arquivos.",
      "Passagens Subterrâneas":"As passagens foram reformadas em épocas diferentes, sinal de uso continuado pela administração do palácio.",
      "Salão Velado":"O mobiliário e os lacres indicam reuniões formais que nunca aparecem nos calendários públicos."
    },
    coro:{
      "Reservatório Subterrâneo":"A água amplifica certas notas e abafa outras, transformando o reservatório num enorme instrumento natural.",
      "Santuário de Pedra":"Marcas de mãos e nomes antigos sugerem que o lugar foi usado para ritos de memória muito antes da mina moderna.",
      "Veio Memorial":"As camadas do veio respondem a nomes de épocas diferentes, como páginas sobrepostas.",
      "Poço Profundo":"As fundações descem além da exploração conhecida e carregam símbolos anteriores ao clã Khar-Dor.",
      "Núcleo Mineral":"A pressão do núcleo muda conforme os jogadores lembram pessoas e lugares, confirmando que memória é parte do mecanismo."
    }
  };
  const msg=extras[cid]?.[loc]||"A investigação amplia o contexto do lugar, mas nenhuma conclusão nova é segura sem cruzar essa observação com outra frente.";
  addStory("master","Mestre Máquina",r.success?msg:"Vocês encontram detalhes úteis, porém fragmentados. A informação não é perdida, mas precisa ser cruzada com uma ação mais específica neste ou em outro local.",r.formula);
  if(!r.success)state.pressure=Math.min(5,(state.pressure||0)+1);
  advanceTime(r.success?6:8);updateCampaignObjective();
}

function renderCampaignThreads(){
  if(!ui.campaignThreads||!state)return;
  let threads=[];
  if(state.campaignId==="vidro")threads=[
    ["Aparição da Coroa",hasClue("vidroeco")],
    ["Documentos oficiais",hasClue("vidroselos")||hasClue("vidrocustodia")],
    ["Testemunhos",hasClue("vidrotestemunhas")||hasClue("vidroescriba")],
    ["Genealogia",hasClue("vidrolinhagem")],
    ["Jogo político",hasClue("vidroconcilio")||hasClue("vidrointeresse")]
  ];
  else if(state.campaignId==="coro")threads=[
    ["Pacientes",hasClue("cororesp")||hasClue("corofebre")],
    ["Geometria da mina",hasClue("coromapa")],
    ["Ressonância",hasClue("corofrequencia")||hasClue("cororitmo")],
    ["Ritual antigo",hasClue("coropedra")],
    ["Memória mineral",hasClue("corominerio")||hasClue("coromemoria")||hasClue("corofonte")]
  ];
  else {ui.campaignThreads.innerHTML="";return}
  ui.campaignThreads.innerHTML="<div class='threads-head'><span>FRENTES DA INVESTIGAÇÃO</span><small>"+threads.filter(function(x){return x[1]}).length+"/"+threads.length+" conectadas</small></div><div class='thread-grid'>"+threads.map(function(t){return "<div class='thread-chip "+(t[1]?"done":"open")+"'><i>"+(t[1]?"✓":"?")+"</i><span>"+esc(t[0])+"</span></div>"}).join("")+"</div>";
}
function renderState(){
  if(!state)return;
  ensureStateShape();tryResolveRevelations();
  const c=CAMPAIGNS[state.campaignId];
  setTheme(state.campaignId);ui.campaignTitle.textContent=c.title;ui.locationName.textContent=state.location;ui.objectiveText.textContent=state.objective;
  if(ui.sceneSigil)ui.sceneSigil.textContent=c.icon||"✦";if(ui.campaignSeal)ui.campaignSeal.textContent=c.icon||"✦";
  if(ui.sceneBannerLabel)ui.sceneBannerLabel.textContent=(c.tone||"MESA DE AVENTURA").toUpperCase()+" • "+String(state.location||"").toUpperCase();if(ui.sceneBanner)ui.sceneBanner.className="scene-banner scene-"+locationVisualKey(state.location);if(ui.sceneArtUse)ui.sceneArtUse.setAttribute("href","./assets/location-scenes.svg#"+assetSlug(state.location));
  const wt=worldTime();ui.worldDay.textContent="Dia "+wt.day;ui.worldTime.textContent=wt.time;
  const labels=state.campaignId==="vidro"?["Cerimônia","Rumores","Pressão","Alianças","Crise","Ruptura"]:state.campaignId==="coro"?["Sussurros","Canção","Contágio","Descida","Convergência","Assimilação"]:["Silêncio","Ecos","Substituições","Vazamento","Ancoragem","Propagação"];
  ui.mysteryLabel.textContent=labels[state.pressure]||labels[0];ui.mysteryBar.style.width=(8+state.pressure*18)+"%";
  discoverNpcsForLocation(state.location);renderCampaignThreads();renderStory();renderClues();renderQuickActions();renderCampaignMap();renderDicePrompt();renderSheet();renderNpcRelations();renderWorldEventCards();renderMasterMemory();checkLastRoll();
}
function renderStory(){
  for(const e of state.story){
    if(renderedStoryIds.has(e.id))continue;renderedStoryIds.add(e.id);
    narrationQueue=narrationQueue.then(()=>appendStoryEntry(e,e.type==="master"||e.type==="system"));
  }
}
async function appendStoryEntry(e,animate){
  const div=document.createElement("article");
  let extra="";
  const who=norm(e.who||"");
  if(who.includes("evidencia guardada"))extra=" evidence-entry";
  else if(who.includes("conexao compreendida"))extra=" conclusion-entry";
  else if(who.includes("o mundo continua")||who.includes("evento do local"))extra=" world-event-entry";
  else if(who.includes("diretor narrativo")||who.includes("mestre adaptativo"))extra=" director-entry";
  div.className="story-entry "+e.type+extra;
  const icon=e.type==="player"?"◆":e.type==="master"?"✦":extra.includes("world-event")?"☾":extra.includes("conclusion")?"✧":extra.includes("evidence")?"◌":"•";
  div.innerHTML=`<div class="entry-head"><strong><span class="entry-icon">${icon}</span>${esc(e.who)}</strong><span>${new Date(e.ts||Date.now()).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div><p></p>${e.roll?`<span class="roll-line">${esc(e.roll)}</span>`:""}`;
  ui.storyLog.appendChild(div);const p=div.querySelector("p");
  if(!animate){p.textContent=e.text;ui.storyLog.scrollTop=ui.storyLog.scrollHeight;return}
  p.classList.add("cursor-word");const words=String(e.text).split(/(\s+)/);let out="";
  for(const w of words){out+=w;p.textContent=out;ui.storyLog.scrollTop=ui.storyLog.scrollHeight;if(w.trim())await sleep(46)}
  p.classList.remove("cursor-word");ui.storyLog.scrollTop=ui.storyLog.scrollHeight;
}
function renderClues(){
  ensureStateShapeBase();
  const evidence=(state.rawEvidence||[]).map(function(item){return EVIDENCE[typeof item==="string"?item:item.id]}).filter(Boolean);
  if(ui.evidenceList){
    ui.evidenceList.innerHTML=evidence.length
      ? evidence.map(function(e){return "<div class='clue evidence'><b>◌ "+esc(e.title)+"</b>"+esc(e.text)+"</div>"}).join("")
      : "<p class='muted'>Nenhuma evidência registrada ainda.</p>";
  }
  const arr=state.clues.map(function(id){return CLUES[id]}).filter(Boolean);
  ui.clueList.innerHTML=arr.length
    ? arr.map(function(c){return "<div class='clue conclusion'><b>✦ "+esc(c.title)+"</b>"+esc(c.text)+"</div>"}).join("")
    : "<p class='muted'>Ainda não há informações suficientes para formar uma conclusão.</p>";
}
function renderQuickActions(){
  ensureStateShape();let list=[];
  if(state.campaignId==="derenfall"){
    list=currentDerenActions().map(function(a){return {label:a.label,type:"action"}});
  }else{
    list=currentCampaignActions().map(function(a){return {label:a.label,type:"action"}});
  }
  connectedLocations(state.location).forEach(function(dest){list.push({label:"Ir para "+dest,type:"travel",dest:dest})});
  if(state.campaignId==="vidro"&&campaignCaseReady("vidro")&&["Palácio Real","Salão dos Juramentos"].includes(state.location))list.unshift({label:"Apresentar as provas à Coroa",type:"action"});
  if(state.campaignId==="vidro"&&campaignCaseReady("vidro")&&hasClue("vidroescriba")&&["Bairro dos Escribas","Porto Seco"].includes(state.location))list.unshift({label:"Vazar os dossiês com Sera",type:"action"});
  if(state.campaignId==="coro"&&campaignCaseReady("coro")&&["Câmara do Coro","Núcleo Mineral"].includes(state.location))list.unshift({label:"Harmonizar o Coro",type:"action"},{label:"Selar o Núcleo",type:"action"});
  if((state.director?.restNeed||0)>=6)list.push({label:"Fazer uma pausa com a companhia",type:"action"});
  ui.quickActions.innerHTML="";
  list.forEach(function(item){
    const b=document.createElement("button");b.classList.add(item.type==="travel"?"travel-token":"action-token");b.textContent=(item.type==="travel"?"↟ ":"✦ ")+item.label;
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
  const all=[{...player,isHost,peerId:"self"},...Array.from(participants.values())];const seen=new Set();ui.partyList.innerHTML="";
  all.filter(function(p){if(seen.has(p.id))return false;seen.add(p.id);return true}).forEach(function(p){
    const peerId=p.peerId||"self",st=peerId==="self"?{speaking:lastLocalSpeaking&&voiceTransmitting(),muted:voiceMode==="ptt"?!pttHeld:voiceMuted,quality:"great"}:(peerVoiceState.get(peerId)||{});
    const el=document.createElement("div");el.className="party-person voice-peer"+(st.speaking&&!st.muted?" speaking":"")+(st.muted?" voice-muted":"");el.dataset.peerId=peerId;
    const remoteControls=peerId!=="self"?`<div class="peer-voice-controls"><button data-peer-mute="${esc(peerId)}" title="Silenciar somente para você">🔊</button><input data-peer-volume="${esc(peerId)}" type="range" min="0" max="100" value="${Math.round((remoteVoice.get(peerId)?.volume??1)*100)}"/><span class="peer-quality">${peerQualityLabel(peerId)}</span></div>`:`<div class="peer-voice-controls self-voice"><span class="peer-quality">${localStream?(voiceMode==="ptt"?"PTT":"Local"):"Sem voz"}</span></div>`;
    el.innerHTML=`<div class="mini-avatar">${esc((p.name||"?")[0].toUpperCase())}<i class="speak-ring"></i></div><span class="dot"></span><div class="party-copy"><strong>${esc(p.name||"Jogador")}${p.isHost?" 👑":""}</strong><small>${CLASS_DATA[p.className]?.icon||"⚔️"} ${esc(p.className||"Aventureiro")} • Nv. ${p.level||1}</small>${remoteControls}</div>`;
    ui.partyList.appendChild(el);
  });
  bindPeerVoiceControls(ui.partyList);
}
function renderSheet(){
  if(!player)return;
  ui.sheetSummary.innerHTML=`<div class="sheet-hero"><strong>${esc(player.name)}</strong><span>${esc(player.sex)} • ${esc(ORIGINS[player.origin]?.name||player.origin)} • ${esc(player.className)} • Nível ${player.level}</span></div>`+((player.importantPerson||player.fear||player.personalGoal)?`<div class="character-hooks">${player.importantPerson?`<div><small>PESSOA IMPORTANTE</small><strong>${esc(player.importantPerson)}</strong></div>`:""}${player.fear?`<div><small>MEDO / FRAQUEZA</small><strong>${esc(player.fear)}</strong></div>`:""}${player.personalGoal?`<div><small>OBJETIVO PESSOAL</small><strong>${esc(player.personalGoal)}</strong></div>`:""}</div>`:"");
  ui.sheetStats.innerHTML=Object.entries(player.stats).map(([k,v])=>`<div class="sheet-stat"><span>${ATTRS[k].name}</span><b>${v}</b></div>`).join("");
  if(player.attributePoints>0){ui.unspentBox.classList.remove("hidden");ui.unspentBox.innerHTML=`<strong>${player.attributePoints} ponto(s) de atributo disponível(is).</strong><br><small>Use + ao lado do atributo abaixo:</small>`+Object.keys(ATTRS).map(k=>`<div style="margin-top:5px">${ATTRS[k].name} (${player.stats[k]}) <button data-attr="${k}">+</button></div>`).join("");ui.unspentBox.querySelectorAll("button").forEach(b=>b.onclick=()=>spendAttributePoint(b.dataset.attr))}
  else ui.unspentBox.classList.add("hidden");
  ui.sheetSkills.innerHTML=player.skills.length?player.skills.map(id=>getSkill(id,player.className)).filter(Boolean).map(s=>`<div class="mini-skill"><span class="mini-skill-icon">${skillIcon(s)}</span><div><strong>${esc(s.name)}</strong>${esc(s.desc)}</div></div>`).join(""):'<p class="muted">Nenhuma habilidade aprendida.</p>';
  const avail=classSkills(player.className).filter(s=>s.level<=player.level&&!player.skills.includes(s.id));
  ui.sheetAvailableSkills.innerHTML=avail.length?avail.map(s=>`<div class="mini-skill"><span class="mini-skill-icon">${skillIcon(s)}</span><div><strong>${esc(s.name)}</strong>Nv. ${s.level} • ${Object.entries(s.req).map(([a,v])=>a+" "+v).join(" • ")}</div><button data-skill="${s.id}" ${player.skillPoints>0&&meetsReq(s,player)?"":"disabled"}>Aprender</button></div>`).join(""):'<p class="muted">Nenhuma habilidade disponível.</p>';
  ui.sheetAvailableSkills.querySelectorAll("button:not([disabled])").forEach(b=>b.onclick=()=>learnGameSkill(b.dataset.skill));
  ensureInventoryState();if(ui.goldCount)ui.goldCount.textContent=state.gold+" ◈";
  const eq=equipmentFor(player);
  if(ui.equipmentSlots)ui.equipmentSlots.innerHTML=["weapon","armor","accessory"].map(function(slot){const id=eq[slot],it=id?ITEMS[id]:null;return "<div class='equip-slot'><small>"+({weapon:"ARMA",armor:"ARMADURA",accessory:"ACESSÓRIO"}[slot])+"</small><strong>"+(it?it.icon+" "+esc(it.name):"— vazio —")+"</strong></div>"}).join("");
  if(ui.inventoryList)ui.inventoryList.innerHTML=state.inventory.length?state.inventory.map(function(row){const it=ITEMS[row.id];if(!it)return"";const usable=it.type==="consumable"||["weapon","armor","accessory"].includes(it.type);return "<article class='inventory-item rarity-"+norm(it.rarity)+"'><span class='item-icon'>"+it.icon+"</span><div><strong>"+esc(it.name)+(row.qty>1?" ×"+row.qty:"")+"</strong><small>"+esc(it.rarity)+" • "+esc(it.type)+"</small><p>"+esc(it.desc)+"</p></div>"+(usable?"<button data-item='"+row.id+"'>"+(it.type==="consumable"?"Usar":"Equipar")+"</button>":"")+"</article>"}).join(""):"<p class='muted'>A mochila está vazia.</p>";
  ui.inventoryList?.querySelectorAll("button[data-item]").forEach(function(b){b.onclick=function(){useItem(b.dataset.item)}});

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
function publicCharacter(p){return {id:p.id,name:p.name,sex:p.sex,origin:p.origin,className:p.className,level:p.level,stats:p.stats,skills:p.skills,icon:p.icon,importantPerson:p.importantPerson||"",fear:p.fear||"",personalGoal:p.personalGoal||"",ready:p.ready,characterReady:p.characterReady}}
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
  const data=player?{...publicCharacter(player),isHost,voice:!!localStream,voiceMuted:voiceMuted,voiceMode:voiceMode}:{id:persistentPlayerId(),name:"Criando personagem...",characterReady:false,ready:false,isHost};
  actions.sendHello(data,target);
}
function sendCampaignInfo(target=null){if(isHost&&actions.sendCampaign)actions.sendCampaign({campaignId:selectedCampaign,title:CAMPAIGNS[selectedCampaign].title},target)}
async function beginOnline(host,code){
  mode="online";isHost=host;roomId=code;hostPeerId=host?"self":null;participants.clear();p2pReady=false;room=null;player=null;
  const url=new URL(location.href);url.searchParams.set("room",roomId);history.replaceState({},"",url);
  await connectP2P();beginCharacter();
}

function supportedVoiceConstraints(){
  const sup=navigator.mediaDevices?.getSupportedConstraints?.()||{};
  const audio={};
  if(sup.echoCancellation)audio.echoCancellation={ideal:true};
  if(sup.noiseSuppression)audio.noiseSuppression={ideal:true};
  if(sup.autoGainControl)audio.autoGainControl={ideal:true};
  if(sup.channelCount)audio.channelCount={ideal:1};
  if(sup.sampleRate)audio.sampleRate={ideal:48000};
  if(sup.sampleSize)audio.sampleSize={ideal:16};
  if(sup.latency)audio.latency={ideal:0.02};
  return audio;
}
function voiceTrack(){return localStream?.getAudioTracks?.()[0]||null}
function rawVoiceTrack(){return rawMicStream?.getAudioTracks?.()[0]||null}
function voiceTransmitting(){
  if(!localStream)return false;
  if(voiceMode==="ptt")return pttHeld;
  return !voiceMuted;
}
function setTrackTransmit(enabled){
  const track=voiceTrack();if(track)track.enabled=!!enabled;
}
function micTechSummary(){
  const track=rawVoiceTrack();if(!track)return {echo:"—",noise:"—",gain:"—",rate:null};
  const s=track.getSettings?.()||{};
  return {
    echo:s.echoCancellation===true?"ON":s.echoCancellation===false?"OFF":"—",
    noise:s.noiseSuppression===true?"ON":s.noiseSuppression===false?"OFF":"—",
    gain:s.autoGainControl===true?"ON":s.autoGainControl===false?"OFF":"—",
    rate:s.sampleRate||null
  };
}
function renderVoiceTechStatus(){
  const t=micTechSummary();
  const html="<span>Eco: "+t.echo+"</span><span>Ruído: "+t.noise+"</span><span>Ganho: "+t.gain+"</span>"+(t.rate?"<span>"+Math.round(t.rate/1000)+" kHz</span>":"");
  if(ui.voiceTechStatus)ui.voiceTechStatus.innerHTML=html;
  if(ui.lobbyVoiceTechStatus)ui.lobbyVoiceTechStatus.innerHTML=html;
}
function syncVoiceControls(){
  const active=!!localStream,transmit=voiceTransmitting();
  const status=!active?"Microfone desligado":voiceMode==="ptt"?(pttHeld?"Falando • PTT":"PTT pronto"):voiceMuted?"Silenciado • conexão mantida":"Microfone ativo • voz limpa";
  [ui.voiceStatus,ui.lobbyVoiceStatus].forEach(el=>{if(el)el.textContent=status});
  [ui.voiceBtn,ui.lobbyVoiceBtn].forEach(btn=>{if(!btn)return;btn.classList.toggle("active",active);btn.textContent=active?"🎙️":"🎙️";btn.title=active?"Microfone conectado":"Conectar microfone"});
  document.querySelectorAll(".voice-mode-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.voiceMode===voiceMode));
  document.querySelectorAll(".voice-mute-btn").forEach(btn=>{btn.disabled=!active||voiceMode==="ptt";btn.textContent=voiceMuted?"🎙️ Ativar":"🔇 Silenciar"});
  document.querySelectorAll(".ptt-hold").forEach(btn=>{btn.classList.toggle("hidden",voiceMode!=="ptt"||!active);btn.classList.toggle("talking",pttHeld);btn.textContent=pttHeld?"Falando…":"Segure para falar"});
  document.querySelectorAll(".voice-disconnect").forEach(btn=>btn.classList.toggle("hidden",!active));
  document.querySelectorAll(".voice-master-slider").forEach(slider=>slider.value=String(Math.round(masterVoiceVolume*100)));
  renderVoiceTechStatus();
  document.body.classList.toggle("local-speaking",active&&transmit&&lastLocalSpeaking);
}
function setVoiceMode(mode){
  voiceMode=mode==="ptt"?"ptt":"open";localStorage.setItem("cn_voice_mode",voiceMode);
  pttHeld=false;if(voiceMode==="ptt")setTrackTransmit(false);else setTrackTransmit(!voiceMuted);
  syncVoiceControls();sendVoiceState(true);
}
function setVoiceMuted(muted){
  voiceMuted=!!muted;
  if(voiceMode==="open")setTrackTransmit(!voiceMuted);else setTrackTransmit(pttHeld);
  syncVoiceControls();sendVoiceState(true);hello();
}
function startPTT(){
  if(!localStream||voiceMode!=="ptt")return;
  pttHeld=true;setTrackTransmit(true);syncVoiceControls();sendVoiceState(true);
}
function stopPTT(){
  if(voiceMode!=="ptt")return;
  pttHeld=false;setTrackTransmit(false);syncVoiceControls();sendVoiceState(true);
}
function setMasterVoiceVolume(value){
  masterVoiceVolume=Math.max(0,Math.min(1,Number(value)));localStorage.setItem("cn_voice_master",String(masterVoiceVolume));
  remoteVoice.forEach((_,peerId)=>applyPeerVolume(peerId));syncVoiceControls();
}
function getPeerVoicePrefs(peerId){
  const rec=remoteVoice.get(peerId);
  return {volume:rec?.volume??1,muted:rec?.muted??false};
}
function applyPeerVolume(peerId){
  const rec=remoteVoice.get(peerId);if(!rec?.audio)return;
  rec.audio.muted=!!rec.muted;rec.audio.volume=Math.max(0,Math.min(1,(rec.volume??1)*masterVoiceVolume));
}
function setPeerVolume(peerId,value){
  const rec=remoteVoice.get(peerId);if(!rec)return;rec.volume=Math.max(0,Math.min(1,Number(value)));applyPeerVolume(peerId);updatePeerVoiceDom(peerId);
}
function togglePeerMute(peerId){
  const rec=remoteVoice.get(peerId);if(!rec)return;rec.muted=!rec.muted;applyPeerVolume(peerId);updatePeerVoiceDom(peerId);
}
function peerQualityLabel(peerId){
  const q=peerVoiceState.get(peerId)?.quality;
  if(q==="great")return"Ótima";if(q==="good")return"Boa";if(q==="fair")return"Oscilando";if(q==="poor")return"Instável";return"—";
}
function updatePeerVoiceDom(peerId){
  document.querySelectorAll("[data-peer-id]").forEach(el=>{
    if(el.dataset.peerId!==peerId)return;
    const st=peerVoiceState.get(peerId)||{},rec=remoteVoice.get(peerId);
    el.classList.toggle("speaking",!!st.speaking&&!st.muted);
    el.classList.toggle("voice-muted",!!st.muted);
    const q=el.querySelector(".peer-quality");if(q){q.textContent=peerQualityLabel(peerId);q.title=st.ping!=null?("Ping "+Math.round(st.ping)+" ms • perda "+((st.loss||0)*100).toFixed(1)+"% • jitter "+Math.round(st.jitter||0)+" ms"):"Aguardando diagnóstico";}
    const b=el.querySelector("[data-peer-mute]");if(b)b.textContent=rec?.muted?"🔇":"🔊";
    const v=el.querySelector("[data-peer-volume]");if(v&&document.activeElement!==v)v.value=String(Math.round((rec?.volume??1)*100));
  });
}
function bindPeerVoiceControls(root=document){
  root.querySelectorAll("[data-peer-mute]").forEach(btn=>btn.onclick=e=>{e.stopPropagation();togglePeerMute(btn.dataset.peerMute)});
  root.querySelectorAll("[data-peer-volume]").forEach(slider=>slider.oninput=e=>{e.stopPropagation();setPeerVolume(slider.dataset.peerVolume,Number(slider.value)/100)});
}
function sendVoiceState(force=false){
  if(!p2pReady||!actions.sendVoice)return;
  const data={active:!!localStream,muted:voiceMode==="ptt"?!pttHeld:voiceMuted,speaking:!!(lastLocalSpeaking&&voiceTransmitting()),mode:voiceMode};
  const key=JSON.stringify(data);if(!force&&key===lastVoiceStateKey)return;lastVoiceStateKey=key;
  actions.sendVoice(data).catch?.(()=>{});
}
async function createCleanVoiceStream(raw){
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return {stream:raw,graph:null};
  try{
    const ctx=new Ctx({latencyHint:"interactive"});
    if(ctx.state==="suspended")await ctx.resume().catch(()=>{});
    const source=ctx.createMediaStreamSource(raw);
    const high=ctx.createBiquadFilter();high.type="highpass";high.frequency.value=85;high.Q.value=.7;
    const low=ctx.createBiquadFilter();low.type="lowpass";low.frequency.value=9000;low.Q.value=.55;
    const analyser=ctx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.45;
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-24;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.006;compressor.release.value=.22;
    const gate=ctx.createGain();gate.gain.value=1;
    const makeup=ctx.createGain();makeup.gain.value=1.04;
    const dest=ctx.createMediaStreamDestination();
    source.connect(high);high.connect(low);low.connect(analyser);analyser.connect(compressor);compressor.connect(gate);gate.connect(makeup);makeup.connect(dest);
    voiceCtx=ctx;voiceGraph={source,high,low,analyser,compressor,gate,makeup,dest};
    startVoiceMeter();
    return {stream:dest.stream,graph:voiceGraph};
  }catch(err){console.warn("Processamento de voz indisponível",err);return {stream:raw,graph:null}}
}
function startVoiceMeter(){
  cancelAnimationFrame(voiceMeterRAF);if(!voiceGraph?.analyser)return;
  const data=new Uint8Array(voiceGraph.analyser.fftSize);
  const tick=()=>{
    if(!voiceGraph?.analyser)return;
    voiceGraph.analyser.getByteTimeDomainData(data);
    let sum=0;for(let i=0;i<data.length;i++){const x=(data[i]-128)/128;sum+=x*x}
    const rms=Math.sqrt(sum/data.length),db=20*Math.log10(Math.max(rms,.00001)),now=performance.now();
    if(db>-50)voiceLastActive=now;
    const speech=now-voiceLastActive<280;
    if(voiceGraph.gate&&voiceCtx){
      const target=speech?1:.10;
      voiceGraph.gate.gain.setTargetAtTime(target,voiceCtx.currentTime,speech ? .008 : .045);
    }
    if(speech!==lastLocalSpeaking){lastLocalSpeaking=speech;syncVoiceControls();document.querySelectorAll('[data-peer-id="self"]').forEach(el=>el.classList.toggle("speaking",speech&&voiceTransmitting()));sendVoiceState()}
    voiceMeterRAF=requestAnimationFrame(tick);
  };tick();
}
async function acquireVoice(){
  if(mode!=="online")return toast("A voz da mesa é usada no modo online.");
  if(!navigator.mediaDevices?.getUserMedia)return toast("Este navegador não oferece captura de microfone.");
  voiceWanted=true;voiceRecoveryAttempts=0;
  const raw=await navigator.mediaDevices.getUserMedia({audio:supportedVoiceConstraints(),video:false});
  rawMicStream=raw;
  const rawTrack=raw.getAudioTracks()[0];if(rawTrack){try{rawTrack.contentHint="speech"}catch{}rawTrack.onended=()=>{if(voiceWanted)scheduleVoiceRecovery()}}
  const clean=await createCleanVoiceStream(raw);localStream=clean.stream;
  const track=voiceTrack();if(track){try{track.contentHint="speech"}catch{}track.enabled=voiceMode==="open"?!voiceMuted:false}
  if(room)room.addStream(localStream,{metadata:{kind:"voice",version:3}});
  syncVoiceControls();sendVoiceState(true);hello();setTimeout(tuneAllPeerAudio,300);
}
async function shutdownVoice(){
  voiceWanted=false;clearTimeout(voiceRecoveryTimer);voiceRecoveryAttempts=0;pttHeld=false;lastLocalSpeaking=false;
  if(room&&localStream)try{room.removeStream(localStream)}catch{}
  localStream?.getTracks?.().forEach(t=>t.stop());rawMicStream?.getTracks?.().forEach(t=>t.stop());
  localStream=null;rawMicStream=null;cancelAnimationFrame(voiceMeterRAF);voiceMeterRAF=0;voiceGraph=null;
  if(voiceCtx){try{await voiceCtx.close()}catch{}voiceCtx=null}
  syncVoiceControls();sendVoiceState(true);hello();
}
async function toggleVoice(){
  if(localStream){await shutdownVoice();return}
  try{await acquireVoice()}catch(err){console.warn(err);voiceWanted=false;syncVoiceControls();toast("Não foi possível acessar o microfone. Verifique a permissão do navegador.")}
}
function scheduleVoiceRecovery(){
  if(!voiceWanted||voiceRecoveryTimer)return;
  const delays=[1200,2800,5500];const delay=delays[Math.min(voiceRecoveryAttempts,delays.length-1)];
  voiceRecoveryTimer=setTimeout(async()=>{
    voiceRecoveryTimer=null;if(!voiceWanted)return;
    voiceRecoveryAttempts++;
    try{
      if(room&&localStream)try{room.removeStream(localStream)}catch{}
      localStream?.getTracks?.().forEach(t=>t.stop());rawMicStream?.getTracks?.().forEach(t=>t.stop());
      localStream=null;rawMicStream=null;if(voiceCtx){try{await voiceCtx.close()}catch{}voiceCtx=null;voiceGraph=null}
      await acquireVoice();toast("Microfone recuperado.");
    }catch(err){console.warn("Falha ao recuperar microfone",err);if(voiceRecoveryAttempts<4)scheduleVoiceRecovery();else{voiceWanted=false;syncVoiceControls();toast("O microfone foi desconectado. Toque para reconectar.")}}
  },delay);
}
function attachRemoteVoice(stream,peerId,metadata){
  if(metadata?.kind&&metadata.kind!=="voice")return;
  let rec=remoteVoice.get(peerId);
  if(!rec){
    const audio=document.createElement("audio");audio.autoplay=true;audio.playsInline=true;audio.dataset.peer=peerId;ui.audioMount.appendChild(audio);
    rec={audio,stream:null,volume:1,muted:false,blocked:false};remoteVoice.set(peerId,rec);
  }
  rec.stream=stream;rec.audio.srcObject=stream;applyPeerVolume(peerId);
  stream.getAudioTracks().forEach(track=>{
    try{track.contentHint="speech"}catch{}
    track.onmute=()=>{const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,muted:true});updatePeerVoiceDom(peerId)};
    track.onunmute=()=>{const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,muted:false});updatePeerVoiceDom(peerId)};
    track.onended=()=>{const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,active:false,speaking:false});updatePeerVoiceDom(peerId)};
  });
  rec.audio.play().then(()=>{rec.blocked=false}).catch(()=>{rec.blocked=true;if(!voiceAutoplayWarned){voiceAutoplayWarned=true;toast("Toque na tela para liberar o áudio da mesa.")}});
  const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,active:true});updatePeerVoiceDom(peerId);
}
function resumeBlockedVoice(){
  remoteVoice.forEach(rec=>{if(rec.blocked)rec.audio.play().then(()=>rec.blocked=false).catch(()=>{})});
  if(voiceCtx?.state==="suspended")voiceCtx.resume().catch(()=>{});
}
function cleanupPeerVoice(peerId){
  const rec=remoteVoice.get(peerId);if(rec){rec.audio.srcObject=null;rec.audio.remove();remoteVoice.delete(peerId)}
  peerVoiceState.delete(peerId);peerStatsBaseline.delete(peerId);
}
async function tunePeerAudio(peerId){
  const peers=room?.getPeers?.()||{},pc=peers[peerId];if(!pc)return;
  for(const sender of pc.getSenders?.()||[]){
    if(sender.track?.kind!=="audio")continue;
    try{
      sender.track.contentHint="speech";
      const params=sender.getParameters();if(!params.encodings?.length)params.encodings=[{}];
      params.encodings[0].maxBitrate=48000;
      await sender.setParameters(params);
    }catch{}
  }
}
function registerPeerConnection(peerId){
  const pc=room?.getPeers?.()?.[peerId];if(!pc||tunedPeerConnections.has(pc))return;
  tunedPeerConnections.add(pc);tunePeerAudio(peerId);
  pc.addEventListener("connectionstatechange",()=>{
    const st=peerVoiceState.get(peerId)||{};st.connection=pc.connectionState;
    if(pc.connectionState==="connected"){st.quality=st.quality||"good";tunePeerAudio(peerId)}
    if(["disconnected","failed"].includes(pc.connectionState)){st.quality="poor";st.speaking=false}
    peerVoiceState.set(peerId,st);updatePeerVoiceDom(peerId);
  });
}
function tuneAllPeerAudio(){const peers=room?.getPeers?.()||{};Object.keys(peers).forEach(id=>{registerPeerConnection(id);tunePeerAudio(id)})}
function qualityFromStats(ping,loss,jitterMs){
  if(ping==null)return"fair";
  if(ping>360||loss>.08||jitterMs>80)return"poor";
  if(ping>220||loss>.04||jitterMs>50)return"fair";
  if(ping>130||loss>.015||jitterMs>30)return"good";
  return"great";
}
async function updateVoiceNetworkStats(){
  if(!room?.getPeers)return;
  const peers=room.getPeers()||{};
  await Promise.all(Object.entries(peers).map(async([peerId,pc])=>{
    registerPeerConnection(peerId);
    let ping=null,loss=0,jitter=0;
    try{ping=await room.ping(peerId)}catch{}
    try{
      const stats=await pc.getStats();let inbound=null;
      stats.forEach(r=>{if(r.type==="inbound-rtp"&&(r.kind==="audio"||r.mediaType==="audio"))inbound=r});
      if(inbound){
        jitter=(inbound.jitter||0)*1000;
        const prev=peerStatsBaseline.get(peerId)||{recv:inbound.packetsReceived||0,lost:inbound.packetsLost||0};
        const dr=Math.max(0,(inbound.packetsReceived||0)-prev.recv),dl=Math.max(0,(inbound.packetsLost||0)-prev.lost);
        loss=(dr+dl)>0?dl/(dr+dl):0;peerStatsBaseline.set(peerId,{recv:inbound.packetsReceived||0,lost:inbound.packetsLost||0});
      }
    }catch{}
    const st=peerVoiceState.get(peerId)||{};st.ping=ping;st.loss=loss;st.jitter=jitter;st.quality=qualityFromStats(ping,loss,jitter);
    peerVoiceState.set(peerId,st);updatePeerVoiceDom(peerId);
  }));
}
function startVoiceStats(){
  clearInterval(voiceStatsTimer);voiceStatsTimer=setInterval(updateVoiceNetworkStats,7000);setTimeout(updateVoiceNetworkStats,1800);
}
async function connectP2P(){
  ui.connectionStatus.textContent="conectando";
  try{
    const {joinRoom}=await import("https://esm.sh/@trystero-p2p/torrent");
    const roomConfig={appId:"cronicas-de-nerdora-web-alpha-v03",trickleIce:true,relayConfig:{redundancy:3}};
    if(Array.isArray(window.CRONICAS_TURN_SERVERS)&&window.CRONICAS_TURN_SERVERS.length)roomConfig.turnConfig=window.CRONICAS_TURN_SERVERS;
    room=joinRoom(roomConfig,roomId,{onJoinError:details=>{console.warn("Falha WebRTC",details);ui.connectionStatus.textContent="conexão limitada";toast("Não foi possível conectar a um jogador. Uma rede restrita pode exigir relay TURN.")}});
    const helloA=room.makeAction("hello"),campaignA=room.makeAction("campaign"),startA=room.makeAction("start"),stateA=room.makeAction("state"),intentA=room.makeAction("intent"),chatA=room.makeAction("chat"),rollA=room.makeAction("rolltap"),voiceA=room.makeAction("voice");
    actions={
      sendHello:(d,t)=>helloA.send(d,t?{target:t}:undefined),sendCampaign:(d,t)=>campaignA.send(d,t?{target:t}:undefined),sendStart:(d,t)=>startA.send(d,t?{target:t}:undefined),
      sendState:(d,t)=>stateA.send(d,t?{target:t}:undefined),sendIntent:(d,t)=>intentA.send(d,t?{target:t}:undefined),sendChat:(d,t)=>chatA.send(d,t?{target:t}:undefined),sendRollTap:(d,t)=>rollA.send(d,t?{target:t}:undefined),
      sendVoice:(d,t)=>voiceA.send(d,t?{target:t}:undefined)
    };
    p2pReady=true;ui.connectionStatus.textContent="online";ui.connectionStatus.classList.add("online");
    room.onPeerJoin=peerId=>{
      registerPeerConnection(peerId);
      if(isHost){setTimeout(()=>sendCampaignInfo(peerId),120);if(state)setTimeout(()=>broadcastState(peerId),180)}
      setTimeout(()=>hello(peerId),220);
      if(localStream)room.addStream(localStream,{target:peerId,metadata:{kind:"voice",version:3}});
      setTimeout(()=>{tunePeerAudio(peerId);sendVoiceState(true)},350);
    };
    room.onPeerLeave=peerId=>{participants.delete(peerId);cleanupPeerVoice(peerId);renderLobby();renderParty();toast("Um jogador saiu da sala.")};
    helloA.onMessage=(data,{peerId})=>{
      participants.set(peerId,{...data,peerId});if(data.isHost)hostPeerId=peerId;
      const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,active:!!data.voice,muted:!!data.voiceMuted,mode:data.voiceMode||"open"});
      renderLobby();renderParty();if(isHost&&state)broadcastState(peerId);registerPeerConnection(peerId);
    };
    voiceA.onMessage=(data,{peerId})=>{
      const st=peerVoiceState.get(peerId)||{};peerVoiceState.set(peerId,{...st,...data});updatePeerVoiceDom(peerId);
    };
    campaignA.onMessage=(data,{peerId})=>{if(isHost)return;hostPeerId=peerId;selectedCampaign=data.campaignId||"derenfall";setTheme(selectedCampaign);if(ui.lobbyCampaign)ui.lobbyCampaign.textContent=CAMPAIGNS[selectedCampaign].title};
    startA.onMessage=(payload,{peerId})=>{if(isHost)return;hostPeerId=peerId;selectedCampaign=payload.campaignId;state=payload.state;enterGameScreen()};
    stateA.onMessage=(incoming,{peerId})=>{if(isHost)return;if(hostPeerId&&peerId!==hostPeerId)return;hostPeerId=peerId;state=incoming;if(ui.gameScreen.classList.contains("active"))renderState()};
    intentA.onMessage=(data,{peerId})=>{if(!isHost)return;const p=participants.get(peerId);const actor={...(p||{}),...(data.player||{})};processIntent(actor,data.text)};
    chatA.onMessage=(data,{peerId})=>appendChat(data.name||participants.get(peerId)?.name||"Jogador",data.text,false);
    rollA.onMessage=(data)=>{if(isHost)handleRollTap(data.playerId)};
    room.onPeerStream=(stream,peerId,metadata)=>attachRemoteVoice(stream,peerId,metadata);
    startVoiceStats();hello();if(isHost)sendCampaignInfo();syncVoiceControls();
  }catch(err){console.warn(err);ui.connectionStatus.textContent="modo local";toast("A conexão multiplayer não iniciou. Recarregue e tente novamente.")}
}
function showLobby(){
  setTheme(selectedCampaign);ui.lobbyCampaign.textContent=CAMPAIGNS[selectedCampaign].title;ui.lobbyCode.textContent=roomId;ui.lobbyPremise.textContent=CAMPAIGNS[selectedCampaign].premise;if(ui.lobbyEmblem)ui.lobbyEmblem.textContent=CAMPAIGNS[selectedCampaign].icon||"⚔";showScreen("lobbyScreen");renderLobby();
}
function allLobbyPlayers(){return player?[{...player,isHost},...Array.from(participants.values()).filter(p=>p.characterReady)]:Array.from(participants.values()).filter(p=>p.characterReady)}
function renderLobby(){
  if(!ui.lobbyScreen.classList.contains("active")||!player)return;
  const all=allLobbyPlayers();ui.lobbyPlayers.innerHTML=all.map(function(p){
    const peerId=p.peerId||"self",st=peerId==="self"?{speaking:lastLocalSpeaking&&voiceTransmitting(),muted:voiceMode==="ptt"?!pttHeld:voiceMuted}:(peerVoiceState.get(peerId)||{});
    const controls=peerId!=="self"?`<div class="peer-voice-controls"><button data-peer-mute="${esc(peerId)}">🔊</button><input data-peer-volume="${esc(peerId)}" type="range" min="0" max="100" value="${Math.round((remoteVoice.get(peerId)?.volume??1)*100)}"/><span class="peer-quality">${peerQualityLabel(peerId)}</span></div>`:"";
    return `<div class="lobby-player voice-peer ${p.ready?"ready":""} ${st.speaking&&!st.muted?"speaking":""} ${st.muted?"voice-muted":""}" data-peer-id="${esc(peerId)}"><div class="mini-avatar">${esc((p.name||"?")[0].toUpperCase())}<i class="speak-ring"></i></div><div class="party-copy"><strong>${esc(p.name)}${p.isHost?" 👑":""}</strong><small>${CLASS_DATA[p.className]?.icon||"⚔️"} ${esc(p.className)} • ${esc(ORIGINS[p.origin]?.name||"Origem")} • Nv. ${p.level||1}</small>${controls}</div><span class="ready-mark">${p.ready?"✓":""}</span></div>`;
  }).join("");
  bindPeerVoiceControls(ui.lobbyPlayers);
  ui.readyBtn.textContent=player.ready?"✓ Pronto":"Estou pronto";ui.readyBtn.classList.toggle("primary",player.ready);ui.readyBtn.classList.toggle("secondary",!player.ready);
  const enough=all.length>=2,allReady=enough&&all.every(p=>p.ready);
  ui.startCampaignBtn.classList.toggle("hidden",!isHost);ui.startCampaignBtn.disabled=!allReady;
  ui.lobbyRule.textContent=!isHost?"Aguardando o anfitrião iniciar a campanha.":!enough?`A sala precisa de pelo menos 2 jogadores. Agora: ${all.length}/2.`:!allReady?"Todos os jogadores precisam marcar que estão prontos.":"Companhia pronta. A campanha pode começar.";
  syncVoiceControls();
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
  renderedStoryIds=new Set();narrationQueue=Promise.resolve();lastRollShown=null;setTheme(state.campaignId);ui.modeBadge.textContent=mode==="solo"?"SOLO":"ONLINE";ui.roomCode.textContent=mode==="solo"?"AVENTURA":roomId;showScreen("gameScreen");renderSelf();renderParty();initMasterMemory(player).catch(function(){});renderState();
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
  ui.copyInviteBtn.onclick=copyInvite;ui.voiceBtn.onclick=toggleVoice;
  document.querySelectorAll(".voice-mode-btn").forEach(btn=>btn.onclick=()=>setVoiceMode(btn.dataset.voiceMode));
  document.querySelectorAll(".voice-mute-btn").forEach(btn=>btn.onclick=()=>setVoiceMuted(!voiceMuted));
  document.querySelectorAll(".voice-master-slider").forEach(slider=>slider.oninput=()=>setMasterVoiceVolume(Number(slider.value)/100));
  document.querySelectorAll(".voice-disconnect").forEach(btn=>btn.onclick=shutdownVoice);
  document.querySelectorAll(".ptt-hold").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);startPTT()});
    ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>btn.addEventListener(ev,stopPTT));
  });
  document.addEventListener("pointerdown",resumeBlockedVoice,{passive:true});
  document.addEventListener("keydown",e=>{
    if(e.code!=="Space"||voiceMode!=="ptt"||!localStream||e.repeat)return;
    const tag=document.activeElement?.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||document.activeElement?.isContentEditable)return;
    e.preventDefault();startPTT();
  });
  document.addEventListener("keyup",e=>{if(e.code==="Space"&&voiceMode==="ptt"){e.preventDefault();stopPTT()}});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){resumeBlockedVoice();if(voiceWanted&&rawVoiceTrack()?.readyState==="ended")scheduleVoiceRecovery()}});
ui.sendActionBtn.onclick=()=>submitIntent();ui.actionInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitIntent()}});
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
  bind();renderCampaigns();setTheme(selectedCampaign);syncVoiceControls();
  const incoming=roomFromUrl();if(incoming){mode="online";ui.roomCodeInput.value=incoming;openMode("online");toast("Convite detectado. Crie seu personagem e entre na sala "+incoming)}
}
boot();