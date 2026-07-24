# Guia de Cores - Projeto Nêmesis (Pixel Art)

Este documento centraliza a paleta de cores e diretrizes visuais para a arte do jogo.

## 1. Paleta Principal

| Cor                    | HEX       | RGB             | Uso Principal                                       |
| :--------------------- | :-------- | :-------------- | :-------------------------------------------------- |
| **Dark Gray (X11)**    | `#B1AB9F` | `177, 171, 159` | Paredes claras, betão, iluminação suave.            |
| **Russet**             | `#7B381E` | `123, 56, 30`   | Madeira, telhados, detalhes de ferrugem.            |
| **MSU Green**          | `#18453B` | `24, 69, 59`    | Folhagem densa, sombras profundas, tecidos.         |
| **Deep Space Sparkle** | `#476861` | `71, 104, 97`   | Água parada, metais oxidados, tons médios de verde. |
| **Zinnwaldite Brown**  | `#2C1A11` | `44, 26, 17`    | Sombras escuras, contornos (outlines), terra.       |

## 2. Cores Auxiliares Sugeridas

| Cor                  | HEX       | Uso Principal                                                    |
| :------------------- | :-------- | :--------------------------------------------------------------- |
| **Pele Clara/Média** | `#D9B9A2` | Tons de pele base.                                               |
| **Pele Retinta**     | `#4A2C22` | Tons de pele base.                                               |
| **Muted Violet**     | `#6B4E71` | Símbolos, Nêmesis, elementos místicos (roxo acinzentado).        |
| **Soft Gold**        | `#E3C18D` | Destaques de interface, luzes de lâmpadas, interações positivas. |
| **Warn Red**         | `#9E2A2B` | Momentos de perigo, tensão, alertas (vermelho fechado).          |

## 3. Notas de Implementação (Arte e Phaser)

- **Contornos (Outlines):** Utilize o **Zinnwaldite Brown (`#2C1A11`)** para contornos em vez de preto puro. Isso garante um aspecto mais orgânico e integrado ao cenário.
- **Iluminação (Phaser):** Estas cores funcionam bem com efeitos de vignette ou iluminação dinâmica. No Phaser, podemos usar `Blend Modes` (como `MULTIPLY` ou `ADD`) e máscaras (`Bitmaps Masks`) para criar áreas de penumbra e profundidade, especialmente usando o _Dark Gray_ ou o _Russet_ como luz ambiente de lâmpadas antigas.
- **Limite de Cores por Sprite:** Tente limitar cada personagem ou objeto a uma seleção de **4 a 6 cores** desta lista. Isso garante a consistência e a restrição visual clássica do estilo Pixel Art retro (lembrando as limitações de hardwares antigos).
- **Contraste e Legibilidade (UI):** Use o _Soft Gold_ para textos importantes ou itens interagíveis da UI quando o fundo for escuro (como o _MSU Green_).
