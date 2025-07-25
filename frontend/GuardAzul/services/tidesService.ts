import { API_CONFIG } from '../constants/Config';

export interface TideData {
  time: string;
  height: string;
  coefficient: string;
}

export interface TidesResponse {
  success: boolean;
  data: {
    mares: string[];
    nascer_sol: string;
    por_sol: string;
    location: string;
    timestamp: string;
    date: string;
    day_of_week: string;
    nascer_lua: string;
    por_lua: string;
    fase_lua: string;
    ondas_max: string;
    ondas_min: string;
    atividade_peixes: string;
  };
  last_update: string;
  source: string;
}

export interface ProcessedTidesData {
  tides: TideData[];
  sunrise: string;
  sunset: string;
  location: string;
  moonrise: string;
  moonset: string;
  moonPhase: string;
  waveMax: string;
  waveMin: string;
  fishActivity: string;
}

/**
 * Busca dados de marés da API
 */
export const fetchTidesData = async (): Promise<ProcessedTidesData> => {
  try {
    console.log('🌊 Buscando dados de marés...');
    const response = await fetch(`${API_CONFIG.BASE_URL}/mares`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const apiResponse: TidesResponse = await response.json();
    console.log('📊 Dados recebidos:', apiResponse);
    
    // Verificar se os dados existem
    if (!apiResponse.success || !apiResponse.data || !apiResponse.data.mares) {
      throw new Error('Dados de marés não encontrados na resposta');
    }
    
    // Processar dados das marés
    const tides: TideData[] = apiResponse.data.mares.map(mare => {
      // Formato: "15:54, 2.4m, 86"
      const parts = mare.split(',').map(part => part.trim());
      return {
        time: parts[0],
        height: parts[1],
        coefficient: parts[2]
      };
    });
    
    return {
      tides,
      sunrise: apiResponse.data.nascer_sol,
      sunset: apiResponse.data.por_sol,
      location: apiResponse.data.location,
      moonrise: apiResponse.data.nascer_lua,
      moonset: apiResponse.data.por_lua,
      moonPhase: apiResponse.data.fase_lua,
      waveMax: apiResponse.data.ondas_max,
      waveMin: apiResponse.data.ondas_min,
      fishActivity: apiResponse.data.atividade_peixes
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados de marés:', error);
    throw error;
  }
};

/**
 * Formatar horário para display (remover segundos se houver)
 */
export const formatTime = (time: string): string => {
  // Se tem segundos (formato HH:MM:SS), remover
  if (time.includes(':') && time.split(':').length === 3) {
    return time.substring(0, 5); // Pega apenas HH:MM
  }
  return time;
};

/**
 * Determinar se é maré alta ou baixa baseado na altura
 */
export const getTideType = (height: string): 'alta' | 'baixa' => {
  const heightValue = parseFloat(height.replace('m', ''));
  return heightValue > 1.5 ? 'alta' : 'baixa';
};
