// Instrumentacao de desempenho (PRD secao 8, Fase 4). Mede o tempo de parede de
// cada estagio do pipeline e, junto com o custo por fonte (vindo dos CostEvent),
// alimenta o anexo "Desempenho e custo" do relatorio. Sem teto rigido de tempo:
// qualidade vence velocidade; a medicao serve para visibilidade e para o aceite
// de performance medida.

import type { DesempenhoResumo, PerfEstagio } from "@/lib/pipeline/types";

/** Cronometro acumulativo: envolve cada estagio e guarda o tempo gasto. */
export class Cronometro {
  private marcas: PerfEstagio[] = [];

  async medir<T>(estagio: string, fn: () => Promise<T> | T): Promise<T> {
    const inicio = Date.now();
    try {
      return await fn();
    } finally {
      this.marcas.push({ estagio, ms: Date.now() - inicio });
    }
  }

  estagios(): PerfEstagio[] {
    return [...this.marcas];
  }

  totalMs(): number {
    return this.marcas.reduce((acc, m) => acc + m.ms, 0);
  }

  /** Monta o resumo de desempenho, com o custo por fonte ja agregado. */
  resumo(custoPorFonte: DesempenhoResumo["custoPorFonte"]): DesempenhoResumo {
    return { estagios: this.estagios(), totalMs: this.totalMs(), custoPorFonte };
  }
}
