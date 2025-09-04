// SEEDS DA BÍBLIA EXPLICADA
// Cria posts de exemplo diversos com explicações completas

const { BiblePost, User } = require('../models');

// Posts de exemplo com explicações estruturadas
const biblePostsData = [
  {
    title: "Salmos 119:105 - Lâmpada para os meus pés",
    verse_reference: "Salmos 119:105",
    original_text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.",
    
    historical_context: "Na época bíblica, as pessoas andavam à noite com lamparinas de azeite - pequenas luzes que iluminavam apenas alguns metros à frente. Não existia iluminação pública, então era essencial ter essa luz para não tropeçar ou se perder. O Salmo 119 é o capítulo mais longo da Bíblia, todo dedicado à importância da Palavra de Deus na vida do crente.",
    
    modern_translation: "A Bíblia é como uma lanterna que ilumina meus próximos passos na vida e me dá direção geral para onde estou indo. Ela não revela todo o futuro de uma vez, mas me guia passo a passo nas decisões do dia a dia.",
    
    practical_meaning: "O versículo nos ensina que a orientação de Deus não funciona como um holofote gigante que revela tudo de uma só vez, mas como uma lanterna que ilumina o suficiente para o próximo passo. Isso nos ensina a confiar em Deus mesmo quando não vemos todo o plano, apenas a próxima etapa.",
    
    modern_application: "Quando você está confuso sobre o que fazer, a Bíblia oferece orientação prática para as decisões imediatas e sabedoria para entender o propósito maior da sua vida. É como um GPS espiritual que te guia uma instrução por vez, não todo o percurso de uma só vez.",
    
    curiosities: "É interessante notar que o salmista usa duas imagens: 'lâmpada para os pés' (direção imediata) e 'luz para o caminho' (direção geral). Isso mostra que precisamos tanto de orientação para o momento presente quanto visão para o futuro.",
    
    category: "sabedoria",
    tags: ["orientação", "sabedoria", "direção", "confiança", "palavra"]
  },
  
  {
    title: "Provérbios 3:5-6 - Confia no Senhor de todo o coração",
    verse_reference: "Provérbios 3:5-6",
    original_text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
    
    historical_context: "O livro de Provérbios foi escrito principalmente por Salomão, conhecido como o homem mais sábio que já existiu. Na cultura judaica, o 'coração' representava não apenas emoções, mas o centro de toda a pessoa - mente, vontade e sentimentos. 'Estribar-se' significava apoiar-se completamente, como se apoiar numa bengala.",
    
    modern_translation: "Confie em Deus com toda sua personalidade, não apenas com suas emoções. Não se apoie exclusivamente na sua própria capacidade de entender as situações. Reconheça que Deus está presente em todas as áreas da sua vida, e Ele vai tornar claros os caminhos que você deve seguir.",
    
    practical_meaning: "Este versículo é um convite para abandonar a necessidade de controlar tudo e entender perfeitamente cada situação antes de agir. É sobre confiar que Deus tem uma perspectiva maior e pode ver coisas que não conseguimos ver.",
    
    modern_application: "Na prática, significa orar antes de tomar decisões importantes, buscar orientação bíblica para os dilemas da vida, e estar disposto a seguir a direção de Deus mesmo quando não faz sentido para nós no momento. É como seguir as instruções de alguém que pode ver todo o labirinto de cima.",
    
    curiosities: "A palavra 'endireitará' no original hebraico também pode ser traduzida como 'aplanará' ou 'tornará liso', como quando se prepara uma estrada para o rei passar. Deus prepara nosso caminho à nossa frente.",
    
    category: "fe",
    tags: ["confiança", "fé", "sabedoria", "direção", "coração"]
  },
  
  {
    title: "Filipenses 4:19 - Deus suprirá todas as necessidades",
    verse_reference: "Filipenses 4:19",
    original_text: "E o meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus.",
    
    historical_context: "Paulo escreveu esta carta aos filipenses enquanto estava preso em Roma. Os cristãos de Filipos haviam enviado ajuda financeira para Paulo através de Epafrodito. Este versículo é parte do agradecimento de Paulo pela generosidade deles, prometendo que Deus cuidaria deles da mesma forma.",
    
    modern_translation: "O Deus que eu sirvo vai cuidar de todas as coisas que vocês realmente precisam para viver. Ele fará isso usando as riquezas infinitas que Ele tem disponíveis, e através do relacionamento que vocês têm com Jesus Cristo.",
    
    practical_meaning: "Este versículo trata sobre provisão divina, mas é importante entender que fala de 'necessidades', não 'desejos'. Deus promete cuidar do que precisamos para viver e cumprir Seu propósito, não necessariamente tudo o que queremos ter.",
    
    modern_application: "Quando você está preocupado com dinheiro, trabalho, saúde, ou outras necessidades básicas, pode confiar que Deus conhece suas necessidades e tem recursos infinitos para cuidar de você. Isso não significa que será sempre fácil, mas que Ele não te abandonará.",
    
    curiosities: "Paulo usa a expressão 'segundo as suas riquezas' (kata to ploutos), não 'das suas riquezas' (apo to ploutos). Isso significa que Deus dá de acordo com o tamanho das riquezas que possui (infinitas), não apenas uma pequena parte delas.",
    
    category: "fe",
    tags: ["provisão", "confiança", "necessidades", "cuidado", "abundância"]
  },
  
  {
    title: "1 Coríntios 13:4-5 - O amor é paciente e bondoso",
    verse_reference: "1 Coríntios 13:4-5",
    original_text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece, não se porta com indecência, não busca os seus interesses, não se irrita, não suspeita mal.",
    
    historical_context: "Paulo escreveu sobre o amor no contexto dos dons espirituais e das divisões na igreja de Corinto. Os coríntios estavam competindo sobre quem tinha os melhores dons espirituais, e Paulo mostra que sem amor, todos os dons são inúteis. Este é considerado um dos textos mais belos sobre o amor em toda a literatura mundial.",
    
    modern_translation: "O amor verdadeiro é paciente com as falhas das pessoas e demonstra bondade em ações práticas. Não sente ciúmes das conquistas dos outros, não se vangloria das próprias realizações, não se considera superior. Age com respeito, não pensa apenas em si mesmo, não explode de raiva facilmente, e não assume más intenções nas ações dos outros.",
    
    practical_meaning: "Paulo está descrevendo como o amor se comporta na prática. Não é apenas um sentimento, mas uma escolha de agir de certas maneiras específicas. É um amor que decide ser paciente, bondoso e desprendido, mesmo quando não se sente assim no momento.",
    
    modern_application: "Em seus relacionamentos - casamento, amizade, família, trabalho - você pode usar estes versículos como um checklist. Quando alguém te irrita, pergunte: 'Como o amor reagiria?' Quando alguém é promovido e você não, o amor não sente inveja. Quando alguém te magoa, o amor não assume má intenção imediatamente.",
    
    curiosities: "Interessante que Paulo usa 15 características para descrever o amor - 8 do que o amor faz e 7 do que o amor não faz. A palavra grega para amor aqui é 'ágape', que se refere ao amor incondicional e altruísta, não ao amor romântico (eros) ou amizade (philos).",
    
    category: "amor",
    tags: ["amor", "paciência", "bondade", "relacionamentos", "caráter"]
  },
  
  {
    title: "Mateus 6:26 - Olhai para as aves do céu",
    verse_reference: "Mateus 6:26",
    original_text: "Olhai para as aves do céu, que nem semeiam, nem segam, nem ajuntam em celeiros; e vosso Pai celestial as alimenta. Não tendes vós muito mais valor do que elas?",
    
    historical_context: "Jesus está ensinando no Sermão do Monte sobre a ansiedade e preocupação. Na cultura agrícola da época, semear, segar e armazenar grãos eram as atividades mais importantes para sobrevivência. Jesus usa um exemplo da natureza que todos podiam observar diariamente - os pássaros não fazem agricultura, mas não passam fome.",
    
    modern_translation: "Observem os pássaros - eles não plantam comida, não fazem colheita, nem constroem depósitos para guardar alimento. Mesmo assim, Deus cuida da alimentação deles todos os dias. Vocês não são infinitamente mais importantes para Deus do que os pássaros?",
    
    practical_meaning: "Jesus está usando um argumento 'do menor para o maior'. Se Deus cuida dos pássaros, que têm valor limitado, quanto mais cuidará dos seres humanos, que são criados à Sua imagem. Não é um convite à preguiça, mas à confiança de que Deus não nos abandonará.",
    
    modern_application: "Quando você está ansioso sobre dinheiro, trabalho, ou necessidades básicas, pode se lembrar de que Deus conhece suas necessidades e tem capacidade e desejo de cuidar de você. Isso não elimina a responsabilidade de trabalhar, mas remove a ansiedade que paralisa.",
    
    curiosities: "É interessante que Jesus não escolhe um animal grande e impressionante para fazer a comparação, mas pássaros - criaturas pequenas e aparentemente insignificantes. Isso torna o argumento ainda mais poderoso sobre o valor que temos para Deus.",
    
    category: "paz",
    tags: ["ansiedade", "preocupação", "confiança", "cuidado", "valor"]
  },
  
  {
    title: "Romanos 8:28 - Todas as coisas contribuem para o bem",
    verse_reference: "Romanos 8:28",
    original_text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.",
    
    historical_context: "Paulo está escrevendo aos cristãos em Roma sobre o sofrimento e a esperança futura. Roma era o centro do império que perseguia cristãos, então eles enfrentavam dificuldades reais. Paulo não está minimizando o sofrimento, mas mostrando que Deus pode usar até as situações ruins para um propósito maior.",
    
    modern_translation: "Nós sabemos com certeza que Deus faz com que todas as situações da vida - até as ruins - trabalhem juntas para produzir algo bom na vida daqueles que amam a Deus e foram chamados de acordo com o plano dele.",
    
    practical_meaning: "Este versículo não diz que todas as coisas são boas (claramente algumas são ruins), mas que Deus pode usar todas as coisas para o bem. É como um chef que pode pegar ingredientes amargos e criar um prato delicioso - os ingredientes continuam amargos, mas o resultado final é bom.",
    
    modern_application: "Quando você passa por perdas, decepções, doenças ou traições, pode confiar que Deus não desperdiçará sua dor. Ele pode usar essas experiências para desenvolver seu caráter, dar-lhe empatia para ajudar outros, ou direcioná-lo para oportunidades que não teria descoberto de outra forma.",
    
    curiosities: "A palavra grega 'synergei' (contribuem) é de onde vem nossa palavra 'sinergia'. Sugere que Deus está ativamente trabalhando para fazer com que as circunstâncias da vida cooperem para um propósito maior, não apenas observando passivamente.",
    
    category: "fe",
    tags: ["sofrimento", "propósito", "esperança", "confiança", "plano"]
  },
  
  {
    title: "Efésios 4:32 - Sede uns para com os outros",
    verse_reference: "Efésios 4:32",
    original_text: "Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.",
    
    historical_context: "Paulo está escrevendo sobre como viver em comunidade cristã. Éfeso era uma cidade cosmopolita com pessoas de muitas culturas diferentes, então conflitos interpessoais eram comuns. Paulo está dando instruções práticas sobre como tratar uns aos outros na igreja.",
    
    modern_translation: "Em vez disso, sejam bondosos uns com os outros, demonstrem compaixão, e perdoem uns aos outros da mesma forma generosa que Deus perdoou vocês através de Cristo.",
    
    practical_meaning: "Paulo está estabelecendo o perdão de Deus como o padrão para como devemos perdoar outros. Não perdoamos porque as pessoas merecem, mas porque fomos perdoados primeiro. É um perdão baseado na graça recebida, não na justiça merecida.",
    
    modern_application: "Quando alguém te magoa, te trai, ou te decepciona, lembre-se de quanto você já foi perdoado por Deus. Isso não significa aceitar abuso ou não estabelecer limites saudáveis, mas significa escolher não guardar rancor e desejar o melhor para a pessoa, mesmo que ela tenha te machucado.",
    
    curiosities: "As três palavras - benigno (gentil), misericordioso (compassivo), e perdoando - formam uma progressão: a gentileza evita causar dor, a misericórdia responde com compaixão quando alguém está sofrendo, e o perdão restaura relacionamentos quando foram quebrados.",
    
    category: "perdao",
    tags: ["perdão", "bondade", "misericórdia", "relacionamentos", "graça"]
  },
  
  {
    title: "Salmos 23:1 - O Senhor é o meu pastor",
    verse_reference: "Salmos 23:1",
    original_text: "O Senhor é o meu pastor, nada me faltará.",
    
    historical_context: "Davi escreveu este salmo baseado em sua experiência como pastor de ovelhas na juventude. Na cultura antiga, pastores eram responsáveis pela proteção total das ovelhas - encontrar comida, água, abrigo, e protegê-las de predadores. Era um trabalho 24/7 que exigia dedicação total.",
    
    modern_translation: "O Senhor cuida de mim como um pastor dedicado cuida de suas ovelhas. Como Ele está cuidando de mim, não vou ficar sem as coisas que realmente preciso na vida.",
    
    practical_meaning: "Davi está usando a metáfora do pastor para expressar confiança total no cuidado de Deus. Ovelhas são completamente dependentes do pastor para tudo - não podem encontrar água ou comida sozinhas, nem se defender de predadores. Assim somos em relação a Deus.",
    
    modern_application: "Quando você se sente perdido, sozinho, ou sem recursos, pode lembrar que tem um Pastor que conhece exatamente onde você está e o que você precisa. Ele não é um pastor distante, mas um que chama cada ovelha pelo nome e dá a vida por elas.",
    
    curiosities: "É significativo que Davi use o artigo definido - 'O Senhor é O MEU pastor', não 'um pastor'. Isso indica um relacionamento pessoal e exclusivo. Cada pessoa pode dizer 'meu pastor', mesmo que Ele seja pastor de todos.",
    
    category: "paz",
    tags: ["cuidado", "provisão", "proteção", "confiança", "relacionamento"]
  },
  
  {
    title: "Tiago 1:2-3 - Tende por motivo de gozo",
    verse_reference: "Tiago 1:2-3",
    original_text: "Meus irmãos, tende por motivo de gozo o passardes por várias tentações, sabendo que a prova da vossa fé produz a perseverança.",
    
    historical_context: "Tiago está escrevendo para cristãos que estavam enfrentando perseguições e dificuldades por causa de sua fé. A palavra 'tentações' aqui se refere a provações e dificuldades externas, não tentações morais internas. Tiago era meio-irmão de Jesus e líder da igreja em Jerusalém.",
    
    modern_translation: "Irmãos e irmãs, quando vocês passarem por diferentes tipos de dificuldades e provações, considerem isso motivo de alegria, porque vocês sabem que quando sua fé é testada, isso desenvolve perseverança e resistência em vocês.",
    
    practical_meaning: "Tiago não está dizendo para fingir que problemas são divertidos, mas para reconhecer que dificuldades podem produzir crescimento de caráter. É como exercício físico - não é prazeroso no momento, mas sabemos que está nos fortalecendo.",
    
    modern_application: "Quando você enfrenta desemprego, problemas de saúde, conflitos familiares, ou outras crises, pode escolher ver essas situações como oportunidades de crescimento. Pergunte: 'O que Deus quer desenvolver em mim através desta situação?' Em vez de apenas 'Por que isso está acontecendo comigo?'",
    
    curiosities: "A palavra grega para 'gozo' (chara) é diferente de felicidade superficial. É uma alegria profunda baseada na confiança de que Deus está trabalhando, mesmo quando as circunstâncias são difíceis. Não é emoção, mas uma escolha de perspectiva.",
    
    category: "crescimento",
    tags: ["provações", "perseverança", "crescimento", "alegria", "fé"]
  },
  
  {
    title: "João 14:27 - Deixo-vos a paz",
    verse_reference: "João 14:27",
    original_text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
    
    historical_context: "Jesus está falando com seus discípulos na noite antes de ser crucificado. Eles estão confusos e assustados porque Jesus acabou de dizer que vai deixá-los. Este discurso acontece durante a Última Ceia, momentos antes de Jesus ir para o Getsêmani.",
    
    modern_translation: "Eu deixo paz com vocês - não qualquer paz, mas a minha própria paz interior eu dou para vocês. A paz que eu ofereço é completamente diferente da paz que o mundo tenta oferecer. Não deixem seus corações ficarem agitados ou com medo.",
    
    practical_meaning: "A paz que Jesus oferece não depende das circunstâncias estarem calmas, mas da presença dele conosco mesmo no meio das tempestades. É uma paz que pode coexistir com dificuldades externas, porque vem de uma fonte que está além das circunstâncias.",
    
    modern_application: "Quando você está ansioso, estressado, ou com medo sobre situações que não pode controlar, pode acessar essa paz através da oração e lembrança das promessas de Deus. Não é ausência de problemas, mas presença de Deus no meio dos problemas.",
    
    curiosities: "Jesus diz 'minha paz' (ten eirenen ten emen), enfatizando que não é uma paz genérica, mas especificamente a paz que ele mesmo experimentava - mesmo sabendo que seria crucificado no dia seguinte. Essa é uma paz sobrenatural.",
    
    category: "paz",
    tags: ["paz", "ansiedade", "medo", "presença", "confiança"]
  },
  
  {
    title: "Provérbios 27:17 - Ferro com ferro se afia",
    verse_reference: "Provérbios 27:17",
    original_text: "Ferro com ferro se afia, assim como o homem afia o rosto do seu amigo.",
    
    historical_context: "Este provérbio vem da sabedoria prática sobre ferramentas e relacionamentos. Na época, ferramentas de ferro eram afiadas esfregando uma contra a outra - um processo que envolvia atrito, mas resultava em lâminas mais eficazes. Salomão aplica este princípio aos relacionamentos humanos.",
    
    modern_translation: "Assim como duas lâminas de ferro se tornam mais afiadas quando são esfregadas uma contra a outra, duas pessoas se tornam melhores quando têm um relacionamento próximo que inclui desafio mútuo e feedback honesto.",
    
    practical_meaning: "Relacionamentos saudáveis envolvem mais do que apenas concordar com tudo. Assim como o ferro precisa de atrito para ser afiado, as pessoas precisam de desafio amoroso e feedback honesto para crescer. Isso requer humildade para receber crítica e coragem para dá-la com amor.",
    
    modern_application: "Procure amigos que te desafiem a ser melhor, não apenas que te digam o que você quer ouvir. Seja o tipo de amigo que fala a verdade em amor quando necessário. Permita que pessoas próximas questionem suas decisões e apontem pontos cegos que você pode ter.",
    
    curiosities: "A palavra hebraica para 'afia' (hadad) sugere não apenas tornar mais afiado, mas também mais brilhante e polido. Bons relacionamentos não apenas nos tornam mais eficazes, mas também revelam melhor quem realmente somos.",
    
    category: "relacionamentos",
    tags: ["amizade", "crescimento", "feedback", "relacionamentos", "sabedoria"]
  },
  
  {
    title: "Gálatas 6:2 - Levai as cargas uns dos outros",
    verse_reference: "Gálatas 6:2",
    original_text: "Levai as cargas uns dos outros, e assim cumprireis a lei de Cristo.",
    
    historical_context: "Paulo está escrevendo sobre como lidar com pessoas que pecaram na comunidade cristã. O contexto imediato fala sobre restaurar alguém que caiu em pecado, mas Paulo expande para o princípio geral de ajudar uns aos outros com qualquer tipo de peso que estejam carregando.",
    
    modern_translation: "Ajudem a carregar os fardos pesados que outros estão carregando, e quando vocês fizerem isso, estarão cumprindo o mandamento principal que Cristo nos deu - amar uns aos outros como ele nos amou.",
    
    practical_meaning: "Paulo está falando sobre comunidade prática, não apenas teórica. Algumas cargas na vida são pesadas demais para uma pessoa carregar sozinha - luto, doença, problemas financeiros, crises familiares. A comunidade cristã deve funcionar como uma rede de apoio mútuo.",
    
    modern_application: "Quando você souber que alguém está passando por dificuldades, procure maneiras práticas de ajudar - oferecer uma refeição, cuidar dos filhos, ajudar financeiramente, ou simplesmente ouvir sem tentar resolver tudo. E quando você estiver sobrecarregado, tenha humildade para aceitar ajuda dos outros.",
    
    curiosities: "É interessante que alguns versículos depois (v.5), Paulo diz que 'cada um levará a sua própria carga'. A palavra grega é diferente - aqui é 'baros' (fardos pesados), lá é 'phortion' (responsabilidades pessoais). Alguns pesos devemos dividir, outros devemos carregar sozinhos.",
    
    category: "relacionamentos",
    tags: ["comunidade", "ajuda", "apoio", "amor", "responsabilidade"]
  },
  
  {
    title: "2 Coríntios 12:9 - A minha graça te basta",
    verse_reference: "2 Coríntios 12:9",
    original_text: "E disse-me: A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza. De boa vontade, pois, me gloriarei nas minhas fraquezas, para que em mim habite o poder de Cristo.",
    
    historical_context: "Paulo estava lidando com um 'espinho na carne' - alguma dificuldade persistente (possivelmente física) que ele havia pedido três vezes para Deus remover. Em vez de remover a dificuldade, Deus respondeu que Sua graça seria suficiente para Paulo suportar a situação.",
    
    modern_translation: "Deus me disse: 'Minha graça é tudo o que você precisa para lidar com essa situação, porque meu poder funciona melhor quando você reconhece sua fraqueza.' Por isso eu aceito minhas limitações com boa disposição, para que o poder de Cristo possa trabalhar através de mim.",
    
    practical_meaning: "Às vezes Deus não remove nossas dificuldades, mas nos dá força para lidar com elas. Nossa fraqueza reconhecida se torna o lugar onde o poder de Deus pode ser mais claramente demonstrado. Não é sobre ser forte o suficiente, mas sobre deixar Deus ser forte através de nossas fraquezas.",
    
    modern_application: "Quando você tem limitações - físicas, emocionais, financeiras, ou outras - em vez de apenas pedir para Deus removê-las, pergunte como Ele pode usar essa situação para demonstrar Seu poder. Às vezes nossas maiores fraquezas se tornam os canais através dos quais Deus faz Sua obra mais poderosa.",
    
    curiosities: "A palavra grega para 'aperfeiçoa' (teleioo) significa 'completar' ou 'atingir o objetivo'. O poder de Deus não apenas funciona apesar de nossas fraquezas, mas é completado através delas - como se nossas limitações fossem o lugar perfeito para Seu poder ser exibido.",
    
    category: "crescimento",
    tags: ["fraqueza", "graça", "poder", "limitações", "suficiência"]
  },
  
  {
    title: "Hebreus 11:1 - A fé é o firme fundamento",
    verse_reference: "Hebreus 11:1",
    original_text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.",
    
    historical_context: "O autor de Hebreus está escrevendo para cristãos judeus que estavam considerando voltar ao judaísmo por causa da perseguição. O capítulo 11 é chamado de 'hall da fé' porque lista vários heróis do Antigo Testamento que viveram pela fé mesmo não vendo o cumprimento completo das promessas de Deus.",
    
    modern_translation: "A fé é ter certeza absoluta sobre as coisas que esperamos que Deus fará, e ter convicção sobre realidades que não podemos ver fisicamente no momento, mas sabemos que são verdadeiras.",
    
    practical_meaning: "Fé não é 'esperança cega' ou 'pensamento positivo'. É confiança baseada no caráter confiável de Deus. É como ter certeza de que o sol vai nascer amanhã - não porque podemos vê-lo agora, mas porque conhecemos a consistência da criação de Deus.",
    
    modern_application: "Quando você ora por algo e não vê resultados imediatos, a fé te permite continuar confiando no caráter de Deus mesmo sem evidências visíveis. É como confiar que um amigo cumprirá uma promessa mesmo quando ele está atrasado - você conhece o caráter dele.",
    
    curiosities: "As palavras gregas usadas aqui são muito ricas: 'hypostasis' (firme fundamento) era um termo legal para 'título de propriedade', e 'elegchos' (prova) era usada para evidência que convence um juiz. A fé é como ter o título de propriedade de algo que ainda não está em sua posse física.",
    
    category: "fe",
    tags: ["fé", "confiança", "esperança", "convicção", "invisível"]
  },
  
  {
    title: "1 João 4:18 - O amor perfeito lança fora o temor",
    verse_reference: "1 João 4:18",
    original_text: "No amor não há temor, antes o perfeito amor lança fora o temor; porque o temor tem consigo a pena, e o que teme não é perfeito no amor.",
    
    historical_context: "João está escrevendo sobre a natureza de Deus e como isso afeta nossos relacionamentos. Ele acabou de dizer que 'Deus é amor' e está explicando como esse amor se manifesta em nossas vidas. João estava escrevendo contra falsos mestres que criavam medo nos cristãos.",
    
    modern_translation: "Onde existe amor genuíno, não há lugar para medo. Na verdade, o amor completo e maduro expulsa o medo completamente, porque o medo sempre está relacionado com expectativa de punição ou rejeição. Quem ainda tem medo não experimentou completamente o amor.",
    
    practical_meaning: "João está falando principalmente sobre nosso relacionamento com Deus - quando entendemos verdadeiramente o amor incondicional de Deus por nós, não precisamos ter medo dele. Mas isso se aplica também aos relacionamentos humanos - relacionamentos baseados em amor genuíno criam segurança, não medo.",
    
    modern_application: "Se você tem medo de Deus (medo de punição, não reverência respeitosa), isso indica que você ainda não compreendeu completamente o amor dele por você. Em relacionamentos humanos, se você está constantemente com medo de como a outra pessoa vai reagir, isso pode indicar que falta amor genuíno na relação.",
    
    curiosities: "A palavra grega 'teleios' (perfeito) não significa 'sem defeitos', mas 'maduro' ou 'completo'. Não é sobre amor sem erros, mas sobre amor que atingiu maturidade suficiente para expulsar o medo. É um processo de crescimento, não um estado instantâneo.",
    
    category: "amor",
    tags: ["amor", "medo", "perfeição", "segurança", "relacionamento"]
  }
];

// Função para criar usuário admin se não existir
async function createAdminUser() {
  try {
    let admin = await User.findOne({ where: { role: 'admin' } });
    
    if (!admin) {
      console.log('🔧 Criando usuário admin para testes...');
      admin = await User.create({
        username: 'admin_santoo',
        email: 'admin@santoo.app',
        password: 'admin123', // Será criptografada automaticamente
        displayName: 'Admin Santoo',
        bio: 'Administrador da plataforma Santoo - Bíblia Explicada',
        role: 'admin',
        isVerified: true,
        spiritual_level: 'avancado'
      });
      console.log('✅ Usuário admin criado com sucesso!');
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  }
}

// Função principal de seed
async function seedBiblePosts() {
  try {
    console.log('🌱 INICIANDO SEED DA BÍBLIA EXPLICADA...\n');
    
    // 1. Criar usuário admin
    const admin = await createAdminUser();
    
    // 2. Verificar se já existem posts
    const existingPosts = await BiblePost.count();
    if (existingPosts > 0) {
      console.log(`ℹ️  Já existem ${existingPosts} posts da Bíblia Explicada no banco`);
      console.log('💡 Use --force para recriar os seeds');
      return;
    }
    
    // 3. Criar posts da Bíblia
    console.log(`📖 Criando ${biblePostsData.length} posts da Bíblia Explicada...`);
    
    for (let i = 0; i < biblePostsData.length; i++) {
      const postData = {
        ...biblePostsData[i],
        author_admin_id: admin.id,
        is_active: true,
        publish_date: new Date()
      };
      
      try {
        const post = await BiblePost.create(postData);
        console.log(`   ✅ ${i + 1}. ${post.title}`);
      } catch (error) {
        console.log(`   ❌ ${i + 1}. ERRO ao criar: ${postData.title}`);
        console.error('      Erro:', error.message);
      }
    }
    
    // 4. Estatísticas finais
    const totalPosts = await BiblePost.count();
    const categoriesStats = await BiblePost.findAll({
      attributes: [
        'category',
        [BiblePost.sequelize.fn('COUNT', BiblePost.sequelize.col('id')), 'count']
      ],
      group: ['category']
    });
    
    console.log('\n📊 SEED CONCLUÍDO:');
    console.log(`   📖 Total de posts criados: ${totalPosts}`);
    console.log('   📂 Posts por categoria:');
    categoriesStats.forEach(stat => {
      console.log(`      ${stat.category}: ${stat.get('count')} posts`);
    });
    
    console.log('\n🎉 SEED DA BÍBLIA EXPLICADA FINALIZADO COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Testar: npm run db:migrate');
    console.log('   2. Verificar: Abrir banco e confirmar tabelas criadas');
    console.log('   3. Continuar: Implementar APIs (Checkpoint 1.3)');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO no seed da Bíblia:', error);
    throw error;
  }
}

// Se executado diretamente
if (require.main === module) {
  seedBiblePosts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 SEED FALHOU:', error);
      process.exit(1);
    });
}

module.exports = { seedBiblePosts, biblePostsData };