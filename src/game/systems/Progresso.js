// Zera todo o progresso salvo no registro global do jogo (compartilhado entre todos os cômodos).
// Usado tanto ao iniciar uma partida nova quanto ao clicar em "Reiniciar" no menu de pausa — em
// qualquer um dos dois casos o jogo deve voltar exatamente ao estado inicial, sem herdar progresso
// de uma partida anterior.
export function resetarTodoProgresso(registry) {
  registry.set("tempoRestante", 600);
  registry.set("resultadoFinal", "sucesso");

  // Fase 1 — Sala
  registry.set("estanteEmpurrada", false);
  registry.set("espelhoResolvido", false);

  // Fase 3 — Escritório
  registry.set("papelMontado", false);
  registry.set("gavetaAberta", false);

  // Fase 4 — Quarto de Casal
  registry.set("camaExaminada", false);
  registry.set("temPilulas", false);
  registry.set("temTranca", false);
  registry.set("portaTravada", false);

  // Fase 5 — Sala de Estar
  registry.set("verdadesColetadasFlags", [false, false, false]);
  registry.set("celularUsado", false);
}
