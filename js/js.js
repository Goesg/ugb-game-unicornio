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

    // Velocidades
    VELOCIDADE_FUNDO: 1,
    VELOCIDADE_JOGADOR: 10,
    VELOCIDADE_INIMIGO1: 5,
    VELOCIDADE_INIMIGO2: 3,
    VELOCIDADE_AMIGO: 1,
    VELOCIDADE_DISPARO: 15,

    // Limites de movimento do jogador
    JOGADOR_LIMITE_SUPERIOR: 0,
    JOGADOR_LIMITE_INFERIOR: 580,  // 700 - 120 (altura do jogador)

    // Inimigo1 - Oscilação senoidal
    INIMIGO1_AMPLITUDE: 120,
    INIMIGO1_VELOCIDADE_ONDA: 0.05,
    INIMIGO1_CENTRO_Y: 320,  // Ajustado para nova altura
    INIMIGO1_X_INICIAL: 950,  // Ajustado para nova largura

    // Inimigo2 - Vai-e-vem
    INIMIGO2_VELOCIDADE_VERTICAL: 2,
    INIMIGO2_LIMITE_SUPERIOR: 100,
    INIMIGO2_LIMITE_INFERIOR: 600,
    INIMIGO2_X_INICIAL: 1050,  // Ajustado para nova largura
    INIMIGO2_Y_INICIAL: 350,

    // Amigo (Power-up)
    AMIGO_X_INICIAL: 0,
    AMIGO_Y_INICIAL: 500,  // Ajustado para nova altura

    // Power-up
    POWERUP_MULTIPLICADOR_VELOCIDADE: 2,
    POWERUP_DURACAO: 5000,

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

// ========== FUNÇÃO PRINCIPAL START() ==========
function start() {
    // Ocultar tela inicial
    $('#inicio').hide();

    // Criar elementos do jogo
    $('#fundoGame').append('<div id="jogador" class="anima1"></div>');
    $('#fundoGame').append('<div id="inimigo1" class="anima2"></div>');
    $('#fundoGame').append('<div id="inimigo2"></div>');
    $('#fundoGame').append('<div id="amigo" class="anima3"></div>');

    // Configurar posições iniciais dos elementos
    $('#jogador').css({ left: 50, top: 300 });
    $('#inimigo1').css({ left: 950, top: 320 });
    $('#inimigo2').css({ left: 1050, top: 350 });
    $('#amigo').css({ left: 10, top: 500 });

    // ========== ESTADO DO JOGO ==========
    const estadoJogo = {
        timer: null,
        teclasPressionadas: [],
        podeAtirar: true,
        temPowerUp: false,
        timerPowerUp: null,
        fimDeJogo: false,
        inimigo1: {
            anguloOscilacao: 0
        },
        inimigo2: {
            direcaoVertical: 1  // 1 = descendo, -1 = subindo
        }
    };

    // ========== CACHE DE ELEMENTOS ==========
    const elementos = {
        fundoGame: $('#fundoGame'),
        jogador: $('#jogador'),
        inimigo1: $('#inimigo1'),
        inimigo2: $('#inimigo2'),
        amigo: $('#amigo')
    };

    // ========== CONFIGURAÇÃO DE CONTROLES ==========
    $(document).keydown(function(e) {
        estadoJogo.teclasPressionadas[e.which] = true;
    });

    $(document).keyup(function(e) {
        estadoJogo.teclasPressionadas[e.which] = false;
    });

    // ========== LOOP PRINCIPAL ==========
    estadoJogo.timer = setInterval(loop, CONFIG_JOGO.INTERVALO_LOOP);

    function loop() {
        moverFundo();
        moverJogador();
        moverInimigo1();
        moverInimigo2();
        moverAmigo();
        verificarColisoes();
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
        if (estadoJogo.teclasPressionadas[TECLAS.W]) {
            const topoAtual = parseInt(elementos.jogador.css('top'));
            const novoTopo = topoAtual - CONFIG_JOGO.VELOCIDADE_JOGADOR;

            if (novoTopo >= CONFIG_JOGO.JOGADOR_LIMITE_SUPERIOR) {
                elementos.jogador.css('top', novoTopo);
            }
        }

        // Movimento para baixo (S)
        if (estadoJogo.teclasPressionadas[TECLAS.S]) {
            const topoAtual = parseInt(elementos.jogador.css('top'));
            const novoTopo = topoAtual + CONFIG_JOGO.VELOCIDADE_JOGADOR;

            if (novoTopo <= CONFIG_JOGO.JOGADOR_LIMITE_INFERIOR) {
                elementos.jogador.css('top', novoTopo);
            }
        }

        // Disparar (D)
        if (estadoJogo.teclasPressionadas[TECLAS.D]) {
            disparar();
        }
    }

    /**
     * Move inimigo1 com movimento horizontal e oscilação senoidal vertical
     * REQUISITO DA FACULDADE: Movimento vertical implementado
     */
    function moverInimigo1() {
        // Movimento horizontal (direita para esquerda)
        const posicaoXAtual = parseInt(elementos.inimigo1.css('left'));
        const novaPosicaoX = posicaoXAtual - CONFIG_JOGO.VELOCIDADE_INIMIGO1;

        // Movimento vertical (oscilação senoidal suave)
        estadoJogo.inimigo1.anguloOscilacao += CONFIG_JOGO.INIMIGO1_VELOCIDADE_ONDA;
        const posicaoY = CONFIG_JOGO.INIMIGO1_CENTRO_Y +
                         CONFIG_JOGO.INIMIGO1_AMPLITUDE *
                         Math.sin(estadoJogo.inimigo1.anguloOscilacao);

        elementos.inimigo1.css({ left: novaPosicaoX, top: posicaoY });

        // Reposicionar quando sair da tela
        if (novaPosicaoX <= 0) {
            elementos.inimigo1.css('left', CONFIG_JOGO.INIMIGO1_X_INICIAL);
            // Variar ponto inicial da oscilação para criar variação
            estadoJogo.inimigo1.anguloOscilacao = Math.random() * Math.PI * 2;
        }
    }

    /**
     * Move inimigo2 com movimento horizontal e vai-e-vem vertical
     * REQUISITO DA FACULDADE: Movimento vertical implementado
     */
    function moverInimigo2() {
        // Movimento horizontal (direita para esquerda)
        const posicaoXAtual = parseInt(elementos.inimigo2.css('left'));
        const posicaoYAtual = parseInt(elementos.inimigo2.css('top'));

        const novaPosicaoX = posicaoXAtual - CONFIG_JOGO.VELOCIDADE_INIMIGO2;
        const novaPosicaoY = posicaoYAtual +
                             (CONFIG_JOGO.INIMIGO2_VELOCIDADE_VERTICAL *
                              estadoJogo.inimigo2.direcaoVertical);

        // Inverter direção vertical nos limites
        if (novaPosicaoY <= CONFIG_JOGO.INIMIGO2_LIMITE_SUPERIOR) {
            estadoJogo.inimigo2.direcaoVertical = 1; // Começar a descer
        } else if (novaPosicaoY >= CONFIG_JOGO.INIMIGO2_LIMITE_INFERIOR) {
            estadoJogo.inimigo2.direcaoVertical = -1; // Começar a subir
        }

        elementos.inimigo2.css({ left: novaPosicaoX, top: novaPosicaoY });

        // Reposicionar quando sair da tela
        if (novaPosicaoX <= 0) {
            elementos.inimigo2.css('left', CONFIG_JOGO.INIMIGO2_X_INICIAL);
        }
    }

    /**
     * Move o amigo (power-up) da esquerda para direita
     */
    function moverAmigo() {
        const posicaoXAtual = parseInt(elementos.amigo.css('left'));
        const novaPosicaoX = posicaoXAtual + CONFIG_JOGO.VELOCIDADE_AMIGO;

        elementos.amigo.css('left', novaPosicaoX);

        // Reposicionar quando sair da tela pela direita
        if (novaPosicaoX >= CONFIG_JOGO.LARGURA_JOGO) {
            elementos.amigo.css('left', CONFIG_JOGO.AMIGO_X_INICIAL);
        }
    }

    // ========== SISTEMA DE DISPARO ==========

    /**
     * Cria e anima um disparo do jogador
     */
    function disparar() {
        if (!estadoJogo.podeAtirar) {
            return;
        }

        estadoJogo.podeAtirar = false;

        // Calcular posição inicial do disparo
        const topoJogador = parseInt(elementos.jogador.css('top'));
        const esquerdaJogador = parseInt(elementos.jogador.css('left'));
        const posicaoXDisparo = esquerdaJogador + 120; // Offset na frente do jogador (largura do jogador)
        const posicaoYDisparo = topoJogador + 30;      // Offset vertical (centro ajustado para 120px de altura)

        // Criar elemento de disparo
        elementos.fundoGame.append('<div id="disparo"></div>');
        const disparo = $('#disparo');
        disparo.css('top', posicaoYDisparo);
        disparo.css('left', posicaoXDisparo);

        // Velocidade do disparo (aumentada se tiver power-up)
        const velocidadeDisparo = estadoJogo.temPowerUp ?
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
                estadoJogo.podeAtirar = true;
            }
        }, CONFIG_JOGO.INTERVALO_LOOP);
    }

    // ========== SISTEMA DE COLISÕES ==========

    /**
     * Verifica todas as colisões do jogo
     */
    function verificarColisoes() {
        // Detectar todas as colisões
        const colisaoJogadorInimigo1 = elementos.jogador.collision(elementos.inimigo1);
        const colisaoJogadorInimigo2 = elementos.jogador.collision(elementos.inimigo2);
        const colisaoDisparoInimigo1 = $('#disparo').collision(elementos.inimigo1);
        const colisaoDisparoInimigo2 = $('#disparo').collision(elementos.inimigo2);
        const colisaoJogadorAmigo = elementos.jogador.collision(elementos.amigo);
        const colisaoInimigo2Amigo = elementos.inimigo2.collision(elementos.amigo);

        // Processar colisões
        if (colisaoJogadorInimigo1.length > 0) {
            tratarColisaoJogadorInimigo1();
        }

        if (colisaoJogadorInimigo2.length > 0) {
            tratarColisaoJogadorInimigo2();
        }

        if (colisaoDisparoInimigo1.length > 0) {
            tratarColisaoDisparoInimigo1();
        }

        if (colisaoDisparoInimigo2.length > 0) {
            tratarColisaoDisparoInimigo2();
        }

        if (colisaoJogadorAmigo.length > 0) {
            tratarColisaoJogadorPowerUp();
        }

        if (colisaoInimigo2Amigo.length > 0) {
            reposicionarAmigo();
        }
    }

    /**
     * Trata colisão entre jogador e inimigo1
     */
    function tratarColisaoJogadorInimigo1() {
        const posicaoX = parseInt(elementos.inimigo1.css('left'));
        const posicaoY = parseInt(elementos.inimigo1.css('top'));

        criarExplosao(posicaoX, posicaoY, 'explosao1');
        reposicionarInimigo1();
    }

    /**
     * Trata colisão entre jogador e inimigo2
     */
    function tratarColisaoJogadorInimigo2() {
        const posicaoX = parseInt(elementos.inimigo2.css('left'));
        const posicaoY = parseInt(elementos.inimigo2.css('top'));

        criarExplosao(posicaoX, posicaoY, 'explosao2');
        elementos.inimigo2.remove();
        reposicionarInimigo2Apos(CONFIG_JOGO.TEMPO_REPOSICAO_INIMIGO2);
    }

    /**
     * Trata colisão entre disparo e inimigo1
     */
    function tratarColisaoDisparoInimigo1() {
        const posicaoX = parseInt(elementos.inimigo1.css('left'));
        const posicaoY = parseInt(elementos.inimigo1.css('top'));

        criarExplosao(posicaoX, posicaoY, 'explosao1');
        $('#disparo').css('left', CONFIG_JOGO.LARGURA_JOGO);
        reposicionarInimigo1();
    }

    /**
     * Trata colisão entre disparo e inimigo2
     */
    function tratarColisaoDisparoInimigo2() {
        const posicaoX = parseInt(elementos.inimigo2.css('left'));
        const posicaoY = parseInt(elementos.inimigo2.css('top'));

        criarExplosao(posicaoX, posicaoY, 'explosao2');
        elementos.inimigo2.remove();
        $('#disparo').css('left', CONFIG_JOGO.LARGURA_JOGO);
        reposicionarInimigo2Apos(CONFIG_JOGO.TEMPO_REPOSICAO_INIMIGO2);
    }

    /**
     * Trata colisão entre jogador e power-up (amigo)
     */
    function tratarColisaoJogadorPowerUp() {
        elementos.amigo.remove();
        reposicionarAmigoApos(CONFIG_JOGO.TEMPO_REPOSICAO_AMIGO);
        ativarPowerUp();
    }

    // ========== SISTEMA DE POWER-UP ==========

    /**
     * Ativa o power-up temporário no jogador
     */
    function ativarPowerUp() {
        // Se já tem power-up ativo, renovar o timer
        if (estadoJogo.timerPowerUp) {
            clearTimeout(estadoJogo.timerPowerUp);
        }

        estadoJogo.temPowerUp = true;

        // Adicionar indicador visual
        elementos.jogador.addClass('com-powerup');

        // Desativar após duração
        estadoJogo.timerPowerUp = setTimeout(function() {
            desativarPowerUp();
        }, CONFIG_JOGO.POWERUP_DURACAO);
    }

    /**
     * Desativa o power-up do jogador
     */
    function desativarPowerUp() {
        estadoJogo.temPowerUp = false;
        estadoJogo.timerPowerUp = null;
        elementos.jogador.removeClass('com-powerup');
    }

    // ========== EFEITOS VISUAIS ==========

    /**
     * Cria uma explosão animada
     * @param {number} posicaoX - Posição X da explosão
     * @param {number} posicaoY - Posição Y da explosão
     * @param {string} idExplosao - ID do elemento de explosão ('explosao1' ou 'explosao2')
     */
    function criarExplosao(posicaoX, posicaoY, idExplosao) {
        // Criar elemento de explosão
        elementos.fundoGame.append('<div id="' + idExplosao + '"></div>');
        const explosao = $('#' + idExplosao);

        // Posicionar e configurar imagem
        explosao.css({
            'background-image': 'url(../img/explosao.png)',
            'top': posicaoY,
            'left': posicaoX
        });

        // Animar expansão e fade out
        explosao.animate({
            width: 200,
            opacity: 0
        }, 'slow');

        // Remover após animação
        setTimeout(function() {
            explosao.remove();
        }, CONFIG_JOGO.TEMPO_EXPLOSAO);
    }

    // ========== FUNÇÕES DE REPOSICIONAMENTO ==========

    /**
     * Reposiciona inimigo1 imediatamente
     */
    function reposicionarInimigo1() {
        elementos.inimigo1.css('left', CONFIG_JOGO.INIMIGO1_X_INICIAL);
        // Variar ponto de início da oscilação para criar variação
        estadoJogo.inimigo1.anguloOscilacao = Math.random() * Math.PI * 2;
    }

    /**
     * Reposiciona inimigo2 após um delay
     * @param {number} delay - Tempo de espera em milissegundos
     */
    function reposicionarInimigo2Apos(delay) {
        setTimeout(function() {
            if (!estadoJogo.fimDeJogo) {
                elementos.fundoGame.append('<div id="inimigo2"></div>');
                elementos.inimigo2 = $('#inimigo2');

                // Resetar posição e direção vertical
                elementos.inimigo2.css('top', CONFIG_JOGO.INIMIGO2_Y_INICIAL);
                estadoJogo.inimigo2.direcaoVertical = 1;
            }
        }, delay);
    }

    /**
     * Reposiciona amigo (power-up) imediatamente
     */
    function reposicionarAmigo() {
        elementos.amigo.css('left', CONFIG_JOGO.AMIGO_X_INICIAL);
    }

    /**
     * Reposiciona amigo (power-up) após um delay
     * @param {number} delay - Tempo de espera em milissegundos
     */
    function reposicionarAmigoApos(delay) {
        setTimeout(function() {
            if (!estadoJogo.fimDeJogo) {
                elementos.fundoGame.append('<div id="amigo" class="anima3"></div>');
                elementos.amigo = $('#amigo');
            }
        }, delay);
    }

} // fim da função start()
