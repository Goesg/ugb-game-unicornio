// ========================================
// JOGO: UNICÓRNIO RAMBO FOFO
// Refatoração com qualidade sênior
// Mantém filosofia do professor: setInterval, jQuery, jquery-collision
// ========================================

// ========== CONSTANTES DO JOGO ==========
const CONFIG_JOGO = {
    // Dimensões
    LARGURA_JOGO: 1200,
    ALTURA_JOGO: 700,

    // Velocidades base
    VELOCIDADE_FUNDO: 1,
    VELOCIDADE_JOGADOR: 10,
    VELOCIDADE_INIMIGO1_BASE: 15,  // 3x mais rápido (antes: 5)
    VELOCIDADE_INIMIGO2_BASE: 9,   // 3x mais rápido (antes: 3)
    VELOCIDADE_AMIGO: 1,
    VELOCIDADE_DISPARO: 15,

    // Limites de movimento do jogador
    JOGADOR_LIMITE_SUPERIOR: 0,
    JOGADOR_LIMITE_INFERIOR: 580,  // 700 - 120 (altura do jogador)

    // Inimigo1 - Oscilação senoidal
    INIMIGO1_AMPLITUDE: 120,
    INIMIGO1_VELOCIDADE_ONDA: 0.05,
    INIMIGO1_CENTRO_Y: 320,
    INIMIGO1_X_INICIAL: 950,

    // Inimigo2 - Vai-e-vem
    INIMIGO2_VELOCIDADE_VERTICAL: 6,  // 3x mais rápido (antes: 2)
    INIMIGO2_LIMITE_SUPERIOR: 100,
    INIMIGO2_LIMITE_INFERIOR: 600,
    INIMIGO2_X_INICIAL: 1050,
    INIMIGO2_Y_INICIAL: 350,

    // Amigo (Power-up)
    AMIGO_X_INICIAL: -100,  // Fora da tela à esquerda
    AMIGO_Y_MINIMO: 50,
    AMIGO_Y_MAXIMO: 550,
    AMIGO_INTERVALO_SPAWN: 1000,  // 1 segundo

    // Power-up
    POWERUP_MULTIPLICADOR_VELOCIDADE: 2,
    POWERUP_DURACAO: 5000,

    // Gameplay
    VIDAS_INICIAIS: 5,
    TEMPO_INVENCIBILIDADE: 1000,  // 1 segundo
    PONTOS_POR_INIMIGO: 10,

    // Dificuldade Progressiva
    INTERVALO_SPAWN_INICIAL: 2000,  // 3x mais rápido (antes: 3000)
    INTERVALO_SPAWN_MINIMO: 300,    // 3x mais rápido (antes: 600)
    REDUCAO_SPAWN_POR_NIVEL: 150,   // Reduz mais rápido (antes: 300)
    INCREMENTO_VELOCIDADE_POR_NIVEL: 0.25,  // 25% por nível (antes: 20%)
    VELOCIDADE_MAXIMA_MULTIPLICADOR: 3.0,   // Maior velocidade máxima (antes: 3.0)
    PONTOS_POR_NIVEL: 100,  // A cada 100 pontos aumenta 1 nível

    // Timings
    INTERVALO_LOOP: 30,
    TEMPO_EXPLOSAO: 1000,
    TEMPO_REPOSICAO_INIMIGO2: 5000,
    TEMPO_REPOSICAO_AMIGO: 6000,
};

const TECLAS = {
    W: 87,
    S: 83,
    D: 68
};

// ========== VARIÁVEL GLOBAL DO JOGO ==========
let Jogo = null;

// ========== FUNÇÃO PRINCIPAL START() ==========
function start() {
    // Ocultar tela inicial e game over
    $('#inicio').hide();
    $('#gameOver').hide();

    // Criar elementos fixos do jogo
    $('#fundoGame').append('<div id="jogador" class="anima1"></div>');

    // Configurar posições iniciais
    $('#jogador').css({ left: 50, top: 300 });

    // ========== INICIALIZAR ESTADO DO JOGO ==========
    Jogo = {
        // Timers
        timer: null,
        timerSpawn: null,
        timerPowerUp: null,
        timerSpawnAmigo: null,

        // Controles
        teclasPressionadas: [],
        podeAtirar: true,

        // Estado do jogador
        vidas: CONFIG_JOGO.VIDAS_INICIAIS,
        pontuacao: 0,
        invencivelAte: 0,
        temPowerUp: false,

        // Dificuldade
        nivel: 1,
        tempoInicio: Date.now(),

        // Inimigos ativos
        inimigos: [],
        proximoIdInimigo: 1,

        // Flags
        fimDeJogo: false,
        amigoAtivo: false
    };

    // ========== CACHE DE ELEMENTOS ==========
    const elementos = {
        fundoGame: $('#fundoGame'),
        jogador: $('#jogador'),
        hud: {
            vidas: $('#vidas'),
            placar: $('#placar')
        }
    };

    // ========== INICIALIZAR HUD ==========
    inicializarHud();

    // ========== CONFIGURAÇÃO DE CONTROLES ==========
    $(document).keydown(function(e) {
        Jogo.teclasPressionadas[e.which] = true;
    });

    $(document).keyup(function(e) {
        Jogo.teclasPressionadas[e.which] = false;
    });

    // ========== INICIAR LOOPS ==========
    Jogo.timer = setInterval(loop, CONFIG_JOGO.INTERVALO_LOOP);
    iniciarSpawnInimigos();
    iniciarSpawnAmigo();

    // ========== FUNÇÕES DE HUD ==========

    /**
     * Inicializa o HUD com vidas e placar
     */
    function inicializarHud() {
        atualizarVidasHud();
        atualizarPlacarHud();
    }

    /**
     * Atualiza a exibição de vidas no HUD
     */
    function atualizarVidasHud() {
        elementos.hud.vidas.empty();
        for (let i = 0; i < Jogo.vidas; i++) {
            elementos.hud.vidas.append('<div class="coracao"></div>');
        }
    }

    /**
     * Atualiza o placar no HUD
     */
    function atualizarPlacarHud() {
        elementos.hud.placar.text(Jogo.pontuacao);
    }

    // ========== LOOP PRINCIPAL ==========

    function loop() {
        moverFundo();
        moverJogador();
        if (Jogo.amigoAtivo) {
            moverAmigo();
        }
        moverInimigos();
        verificarColisoes();
        atualizarDificuldade();
    }

    // ========== FUNÇÕES DE MOVIMENTO ==========

    /**
     * Move o fundo para criar efeito de scrolling
     */
    function moverFundo() {
        const posicaoAtual = parseInt(elementos.fundoGame.css('background-position'));
        elementos.fundoGame.css('background-position', posicaoAtual - CONFIG_JOGO.VELOCIDADE_FUNDO);
    }

    /**
     * Move o jogador baseado nas teclas pressionadas
     * W = cima, S = baixo, D = atirar
     */
    function moverJogador() {
        // Movimento para cima (W)
        if (Jogo.teclasPressionadas[TECLAS.W]) {
            const topoAtual = parseInt(elementos.jogador.css('top'));
            const novoTopo = topoAtual - CONFIG_JOGO.VELOCIDADE_JOGADOR;

            if (novoTopo >= CONFIG_JOGO.JOGADOR_LIMITE_SUPERIOR) {
                elementos.jogador.css('top', novoTopo);
            }
        }

        // Movimento para baixo (S)
        if (Jogo.teclasPressionadas[TECLAS.S]) {
            const topoAtual = parseInt(elementos.jogador.css('top'));
            const novoTopo = topoAtual + CONFIG_JOGO.VELOCIDADE_JOGADOR;

            if (novoTopo <= CONFIG_JOGO.JOGADOR_LIMITE_INFERIOR) {
                elementos.jogador.css('top', novoTopo);
            }
        }

        // Disparar (D)
        if (Jogo.teclasPressionadas[TECLAS.D]) {
            disparar();
        }
    }

    /**
     * Move o amigo (power-up) da esquerda para direita
     */
    function moverAmigo() {
        const $amigo = $('#amigo');
        if ($amigo.length === 0) {
            return;
        }

        const posicaoXAtual = parseInt($amigo.css('left'));
        const novaPosicaoX = posicaoXAtual + CONFIG_JOGO.VELOCIDADE_AMIGO;

        $amigo.css('left', novaPosicaoX);

        // Remover quando sair da tela pela direita
        if (novaPosicaoX >= CONFIG_JOGO.LARGURA_JOGO) {
            $amigo.remove();
            Jogo.amigoAtivo = false;
        }
    }

    /**
     * Move todos os inimigos ativos
     */
    function moverInimigos() {
        Jogo.inimigos.forEach(function(inimigo) {
            if (inimigo.tipo === 1) {
                moverInimigo1(inimigo);
            } else {
                moverInimigo2(inimigo);
            }
        });
    }

    /**
     * Move inimigo tipo 1 (oscilação senoidal)
     */
    function moverInimigo1(inimigo) {
        const $elem = inimigo.elemento;
        const posicaoXAtual = parseInt($elem.css('left'));
        const novaPosicaoX = posicaoXAtual - inimigo.velocidade;

        // Movimento vertical (oscilação senoidal)
        inimigo.anguloOscilacao += CONFIG_JOGO.INIMIGO1_VELOCIDADE_ONDA;
        const posicaoY = CONFIG_JOGO.INIMIGO1_CENTRO_Y +
                         CONFIG_JOGO.INIMIGO1_AMPLITUDE *
                         Math.sin(inimigo.anguloOscilacao);

        $elem.css({ left: novaPosicaoX, top: posicaoY });

        // Reposicionar quando sair da tela
        if (novaPosicaoX <= -150) {
            $elem.css('left', CONFIG_JOGO.INIMIGO1_X_INICIAL);
            inimigo.anguloOscilacao = Math.random() * Math.PI * 2;
        }
    }

    /**
     * Move inimigo tipo 2 (vai-e-vem vertical)
     */
    function moverInimigo2(inimigo) {
        const $elem = inimigo.elemento;
        const posicaoXAtual = parseInt($elem.css('left'));
        const posicaoYAtual = parseInt($elem.css('top'));

        const novaPosicaoX = posicaoXAtual - inimigo.velocidade;
        const novaPosicaoY = posicaoYAtual +
                             (CONFIG_JOGO.INIMIGO2_VELOCIDADE_VERTICAL *
                              inimigo.direcaoVertical);

        // Inverter direção vertical nos limites
        if (novaPosicaoY <= CONFIG_JOGO.INIMIGO2_LIMITE_SUPERIOR) {
            inimigo.direcaoVertical = 1;
        } else if (novaPosicaoY >= CONFIG_JOGO.INIMIGO2_LIMITE_INFERIOR) {
            inimigo.direcaoVertical = -1;
        }

        $elem.css({ left: novaPosicaoX, top: novaPosicaoY });

        // Reposicionar quando sair da tela
        if (novaPosicaoX <= -150) {
            $elem.css({
                left: CONFIG_JOGO.INIMIGO2_X_INICIAL,
                top: CONFIG_JOGO.INIMIGO2_Y_INICIAL
            });
            inimigo.direcaoVertical = 1;
        }
    }

    // ========== SISTEMA DE DISPARO ==========

    /**
     * Cria e anima um disparo do jogador
     */
    function disparar() {
        if (!Jogo.podeAtirar) {
            return;
        }

        Jogo.podeAtirar = false;

        // Calcular posição inicial do disparo
        const topoJogador = parseInt(elementos.jogador.css('top'));
        const esquerdaJogador = parseInt(elementos.jogador.css('left'));
        const posicaoXDisparo = esquerdaJogador + 120;
        const posicaoYDisparo = topoJogador + 30;

        // Criar elemento de disparo
        elementos.fundoGame.append('<div id="disparo"></div>');
        const disparo = $('#disparo');
        disparo.css('top', posicaoYDisparo);
        disparo.css('left', posicaoXDisparo);

        // Velocidade do disparo (aumentada se tiver power-up)
        const velocidadeDisparo = Jogo.temPowerUp ?
                                  CONFIG_JOGO.VELOCIDADE_DISPARO * CONFIG_JOGO.POWERUP_MULTIPLICADOR_VELOCIDADE :
                                  CONFIG_JOGO.VELOCIDADE_DISPARO;

        // Animar movimento do disparo
        const timerDisparo = setInterval(function() {
            const posicaoAtual = parseInt(disparo.css('left'));
            const novaPosicao = posicaoAtual + velocidadeDisparo;

            disparo.css('left', novaPosicao);

            // Remover quando sair da tela
            if (novaPosicao > CONFIG_JOGO.LARGURA_JOGO) {
                clearInterval(timerDisparo);
                disparo.remove();
                Jogo.podeAtirar = true;
            }
        }, CONFIG_JOGO.INTERVALO_LOOP);
    }

    // ========== SISTEMA DE SPAWN DE INIMIGOS ==========

    /**
     * Inicia o sistema de spawn automático de inimigos
     */
    function iniciarSpawnInimigos() {
        spawnarInimigo();
        ajustarIntervalSpawn();
    }

    /**
     * Ajusta o intervalo de spawn baseado no nível
     */
    function ajustarIntervalSpawn() {
        if (Jogo.timerSpawn) {
            clearInterval(Jogo.timerSpawn);
        }

        const intervalo = calcularIntervaloSpawn();

        Jogo.timerSpawn = setInterval(function() {
            spawnarInimigo();
        }, intervalo);
    }

    /**
     * Calcula o intervalo de spawn baseado no nível
     */
    function calcularIntervaloSpawn() {
        const reducao = CONFIG_JOGO.REDUCAO_SPAWN_POR_NIVEL * (Jogo.nivel - 1);
        const intervalo = CONFIG_JOGO.INTERVALO_SPAWN_INICIAL - reducao;
        return Math.max(intervalo, CONFIG_JOGO.INTERVALO_SPAWN_MINIMO);
    }

    /**
     * Spawna um novo inimigo (tipo aleatório)
     */
    function spawnarInimigo() {
        const tipo = Math.random() < 0.5 ? 1 : 2;
        const velocidadeBase = tipo === 1 ?
                               CONFIG_JOGO.VELOCIDADE_INIMIGO1_BASE :
                               CONFIG_JOGO.VELOCIDADE_INIMIGO2_BASE;

        // Calcular velocidade com base no nível
        const multiplicador = 1 + (CONFIG_JOGO.INCREMENTO_VELOCIDADE_POR_NIVEL * (Jogo.nivel - 1));
        const velocidade = Math.min(
            velocidadeBase * multiplicador,
            velocidadeBase * CONFIG_JOGO.VELOCIDADE_MAXIMA_MULTIPLICADOR
        );

        // Criar elemento
        const id = 'inimigo-' + Jogo.proximoIdInimigo++;
        const classe = tipo === 1 ? 'anima2' : '';
        elementos.fundoGame.append('<div id="' + id + '" class="inimigo-dinamico ' + classe + '"></div>');

        const $elem = $('#' + id);

        // Configurar posição inicial
        if (tipo === 1) {
            $elem.css({
                left: CONFIG_JOGO.INIMIGO1_X_INICIAL,
                top: CONFIG_JOGO.INIMIGO1_CENTRO_Y,
                width: '120px',
                height: '120px',
                position: 'absolute',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat'
            });
        } else {
            $elem.css({
                left: CONFIG_JOGO.INIMIGO2_X_INICIAL,
                top: CONFIG_JOGO.INIMIGO2_Y_INICIAL,
                width: '100px',
                height: '100px',
                position: 'absolute',
                backgroundImage: 'url(../img/inimigo2.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat'
            });
        }

        // Adicionar ao array de inimigos
        const inimigo = {
            id: id,
            tipo: tipo,
            elemento: $elem,
            velocidade: velocidade,
            anguloOscilacao: Math.random() * Math.PI * 2,
            direcaoVertical: 1
        };

        Jogo.inimigos.push(inimigo);
    }

    // ========== SISTEMA DE SPAWN DO AMIGO (POWER-UP) ==========

    /**
     * Inicia o sistema de spawn automático do amigo
     */
    function iniciarSpawnAmigo() {
        Jogo.timerSpawnAmigo = setInterval(function() {
            spawnarAmigo();
        }, CONFIG_JOGO.AMIGO_INTERVALO_SPAWN);
    }

    /**
     * Spawna o amigo em posição vertical aleatória
     */
    function spawnarAmigo() {
        // Não spawnar se já existe um amigo ativo
        if (Jogo.amigoAtivo || $('#amigo').length > 0) {
            return;
        }

        // Posição Y aleatória (lado esquerdo)
        const posicaoY = CONFIG_JOGO.AMIGO_Y_MINIMO +
                        Math.random() * (CONFIG_JOGO.AMIGO_Y_MAXIMO - CONFIG_JOGO.AMIGO_Y_MINIMO);

        // Criar elemento
        elementos.fundoGame.append('<div id="amigo" class="anima3"></div>');
        const $amigo = $('#amigo');

        $amigo.css({
            left: CONFIG_JOGO.AMIGO_X_INICIAL,
            top: Math.floor(posicaoY)
        });

        Jogo.amigoAtivo = true;
    }

    // ========== SISTEMA DE COLISÕES ==========

    /**
     * Verifica todas as colisões do jogo
     */
    function verificarColisoes() {
        // Colisão jogador vs inimigos
        verificarColisaoJogadorInimigos();

        // Colisão disparo vs inimigos
        verificarColisaoDisparoInimigos();

        // Colisão jogador vs power-up
        if (Jogo.amigoAtivo) {
            const $amigo = $('#amigo');
            if ($amigo.length > 0) {
                const colisaoJogadorAmigo = elementos.jogador.collision($amigo);
                if (colisaoJogadorAmigo.length > 0) {
                    tratarColisaoJogadorPowerUp();
                }

                // Colisão inimigos vs power-up
                verificarColisaoInimigosAmigo();
            }
        }
    }

    /**
     * Verifica colisão entre jogador e todos os inimigos
     */
    function verificarColisaoJogadorInimigos() {
        if (estaInvencivel()) {
            return;
        }

        Jogo.inimigos.forEach(function(inimigo) {
            const colisao = elementos.jogador.collision(inimigo.elemento);
            if (colisao.length > 0) {
                aplicarDanoAoJogador();
                destruirInimigo(inimigo);
            }
        });
    }

    /**
     * Verifica colisão entre disparo e todos os inimigos
     */
    function verificarColisaoDisparoInimigos() {
        const $disparo = $('#disparo');
        if ($disparo.length === 0) {
            return;
        }

        Jogo.inimigos.forEach(function(inimigo) {
            const colisao = $disparo.collision(inimigo.elemento);
            if (colisao.length > 0) {
                registrarInimigoDestruido();
                destruirInimigo(inimigo);
                $disparo.css('left', CONFIG_JOGO.LARGURA_JOGO);
            }
        });
    }

    /**
     * Verifica colisão entre inimigos e power-up
     */
    function verificarColisaoInimigosAmigo() {
        const $amigo = $('#amigo');
        if ($amigo.length === 0) {
            return;
        }

        Jogo.inimigos.forEach(function(inimigo) {
            const colisao = inimigo.elemento.collision($amigo);
            if (colisao.length > 0) {
                // Remove o amigo quando atingido por inimigo
                $amigo.remove();
                Jogo.amigoAtivo = false;
            }
        });
    }

    // ========== SISTEMA DE VIDAS E DANO ==========

    /**
     * Verifica se o jogador está invencível
     */
    function estaInvencivel() {
        return Date.now() < Jogo.invencivelAte;
    }

    /**
     * Aplica dano ao jogador
     */
    function aplicarDanoAoJogador() {
        Jogo.vidas--;
        atualizarVidasHud();
        ativarInvencibilidade();

        if (Jogo.vidas <= 0) {
            gameOver();
        }
    }

    /**
     * Ativa invencibilidade temporária
     */
    function ativarInvencibilidade() {
        Jogo.invencivelAte = Date.now() + CONFIG_JOGO.TEMPO_INVENCIBILIDADE;
        elementos.jogador.addClass('invencivel');

        setTimeout(function() {
            elementos.jogador.removeClass('invencivel');
        }, CONFIG_JOGO.TEMPO_INVENCIBILIDADE);
    }

    // ========== SISTEMA DE PONTUAÇÃO ==========

    /**
     * Registra a destruição de um inimigo e atualiza pontuação
     */
    function registrarInimigoDestruido() {
        Jogo.pontuacao += CONFIG_JOGO.PONTOS_POR_INIMIGO;
        atualizarPlacarHud();
    }

    // ========== SISTEMA DE DIFICULDADE PROGRESSIVA ==========

    /**
     * Atualiza o nível de dificuldade baseado na pontuação
     */
    function atualizarDificuldade() {
        const nivelCalculado = 1 + Math.floor(Jogo.pontuacao / CONFIG_JOGO.PONTOS_POR_NIVEL);

        if (nivelCalculado > Jogo.nivel) {
            Jogo.nivel = nivelCalculado;
            ajustarIntervalSpawn();
        }
    }

    // ========== DESTRUIÇÃO DE INIMIGOS ==========

    /**
     * Destrói um inimigo (remove e cria explosão)
     */
    function destruirInimigo(inimigo) {
        const posicaoX = parseInt(inimigo.elemento.css('left'));
        const posicaoY = parseInt(inimigo.elemento.css('top'));

        criarExplosao(posicaoX, posicaoY);
        removerInimigo(inimigo);
    }

    /**
     * Remove um inimigo do jogo
     */
    function removerInimigo(inimigo) {
        inimigo.elemento.remove();
        Jogo.inimigos = Jogo.inimigos.filter(function(i) {
            return i.id !== inimigo.id;
        });
    }

    // ========== SISTEMA DE POWER-UP ==========

    /**
     * Trata colisão entre jogador e power-up (amigo)
     */
    function tratarColisaoJogadorPowerUp() {
        const $amigo = $('#amigo');
        if ($amigo.length > 0) {
            $amigo.remove();
            Jogo.amigoAtivo = false;
            ativarPowerUp();
        }
    }

    /**
     * Ativa o power-up temporário no jogador
     */
    function ativarPowerUp() {
        if (Jogo.timerPowerUp) {
            clearTimeout(Jogo.timerPowerUp);
        }

        Jogo.temPowerUp = true;
        elementos.jogador.addClass('com-powerup');

        Jogo.timerPowerUp = setTimeout(function() {
            desativarPowerUp();
        }, CONFIG_JOGO.POWERUP_DURACAO);
    }

    /**
     * Desativa o power-up do jogador
     */
    function desativarPowerUp() {
        Jogo.temPowerUp = false;
        Jogo.timerPowerUp = null;
        elementos.jogador.removeClass('com-powerup');
    }

    // ========== EFEITOS VISUAIS ==========

    /**
     * Cria uma explosão animada
     */
    function criarExplosao(posicaoX, posicaoY) {
        const id = 'explosao-' + Date.now() + '-' + Math.random();
        elementos.fundoGame.append('<div id="' + id + '" class="explosao"></div>');
        const $explosao = $('#' + id);

        $explosao.css({
            width: '150px',
            height: '150px',
            position: 'absolute',
            backgroundImage: 'url(../img/explosao.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            top: posicaoY,
            left: posicaoX
        });

        $explosao.animate({
            width: 200,
            opacity: 0
        }, 'slow');

        setTimeout(function() {
            $explosao.remove();
        }, CONFIG_JOGO.TEMPO_EXPLOSAO);
    }

    // ========== GAME OVER ==========

    /**
     * Finaliza o jogo
     */
    function gameOver() {
        Jogo.fimDeJogo = true;

        // Parar todos os loops
        clearInterval(Jogo.timer);
        clearInterval(Jogo.timerSpawn);
        clearInterval(Jogo.timerSpawnAmigo);
        if (Jogo.timerPowerUp) {
            clearTimeout(Jogo.timerPowerUp);
        }

        // Remover listeners de teclado
        $(document).off('keydown');
        $(document).off('keyup');

        // Exibir tela de game over
        $('#pontuacaoFinal').text(Jogo.pontuacao);
        $('#gameOver').show();
    }

} // fim da função start()

// ========== FUNÇÃO REINICIAR JOGO ==========
function reiniciarJogo() {
    // Limpar tela
    $('#gameOver').hide();
    $('#fundoGame').empty();
    $('#hud #vidas').empty();
    $('#hud #placar').text('0');

    // Remover listeners antigos
    $(document).off('keydown');
    $(document).off('keyup');

    // Mostrar tela inicial
    $('#fundoGame').append('<div id="inicio" onclick="start()"><h1>Unicórnio Rambo Fofo</h1><p>W para mover para cima, S para mover para baixo, D para disparar míssil</p></div>');
}
