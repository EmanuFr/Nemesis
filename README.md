# Projeto Nêmesis (Título Provisório)

<div align="center">
  <img src="public/assets/logo.png" alt="Logo Nêmesis" width="200"/>
</div>

## 📖 Visão Geral do Jogo

**Nêmesis** é um jogo Indie 2D em Pixel Art (visão Top-Down) focado em narrativa ambiental (*environmental storytelling*). Ele mescla elementos de *Thriller Psicológico*, *Escape Room* Narrativo e conteúdo educacional.

O objetivo do jogador é explorar um apartamento, resolvendo puzzles baseados nas metáforas do abuso. Adquirindo conhecimento com a ajuda da entidade **Nêmesis** (Deusa da Justiça), o jogador quebra as "correntes" que trancam os cômodos, avançando até alcançar a porta da rua e a tão esperada liberdade.

---

## ⚖️ Tema Principal e Conscientização

Desenvolvido com um viés profundamente educativo, o jogo aborda os **cinco tipos de violência contra a mulher** (estipulados pela Lei Maria da Penha), a interseccionalidade e a cultura do machismo. 

A tensão não é construída pela presença física de um agressor (que não aparece no jogo para evitar gatilhos diretos), mas pela atmosfera pesada, iluminação escura e a pressão verbal que a protagonista reviveu naquele ambiente.

### As Fases (Os 5 Tipos de Violência):
1. **Quarto/Banheiro:** Violência Psicológica (Manipulação da autoestima e da autoimagem).
2. **Corredor/Área de Serviço:** Violência Física (O peso de ter que esconder as próprias marcas).
3. **Escritório:** Violência Patrimonial (Controle abusivo e retenção de documentos/recursos).
4. **Quarto de Casal:** Violência Sexual (Perda de território corporal e desrespeito ao consentimento).
5. **Sala de Estar (Clímax):** Violência Moral (Difamação, humilhação e isolamento através de calúnias).

---

## 🎨 Direção de Arte e Técnica

- **Plataforma/Motor:** Web (HTML5) construído com [Phaser 3](https://phaser.io) (JavaScript).
- **Estilo Visual:** Pixel Art clássico inspirado nas gerações 16-bits (resolução nativa de 320x240 pixels).
- **Paleta de Cores:** Focada em tons sutis (*Dark Gray, Russet, MSU Green, Deep Space Sparkle e Zinnwaldite Brown*) com o uso estratégico de cores escuras para contornos, fugindo do preto puro para gerar um clima orgânico e poético.
- **Animações e Interface:** Design minimalista. Muito pautado na iluminação dinâmica (*Blend Modes* e Sombras) suportadas pelo Phaser.

---

## 💻 Como rodar este projeto localmente

Este repositório foi criado com um template do Phaser + Vite. 

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado na sua máquina.

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/EmanuFr/Nemesis.git
cd Nemesis
```

2. Instale as dependências usando o NPM (ou yarn/pnpm se preferir):
```bash
npm install
```

3. Inicie o servidor de desenvolvimento local:
```bash
npm run dev
```

4. Acesse o URL gerado no seu terminal (geralmente `http://localhost:8080` ou similar) no seu navegador.

---

## 📂 Documentação Extra
Dentro da pasta `Documentacao/` (na rede externa ou no seu ambiente local) você encontra guias detalhados:
- **`roteiro.md`**: GDD Completo com interações e diálogos de cada fase.
- **`paleta_cores.md`**: Cores exatas para confecção de sprites e *tilesets* de cenário.
- **`roadmap_aprendizado.md`**: Guia passo a passo de desenvolvimento utilizado para os estudos base do Phaser.

---

*“A história está cheia de mulheres que foram chamadas de loucas, histéricas ou vilãs. Mas muitas delas estavam apenas tentando sobreviver... e buscar justiça. Acorde.” – Nêmesis*
