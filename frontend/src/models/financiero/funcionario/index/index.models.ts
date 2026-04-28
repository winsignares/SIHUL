export interface FuncionarioDashboardHomeProps {
  onGoToRegistrar: () => void;
  onGoToConsultar: () => void;
}

export interface FuncionarioStatsApi {
  total_facturas: number;
  vencidas: number;
  atrasadas: number;
  por_estado: Record<string, number>;
}
