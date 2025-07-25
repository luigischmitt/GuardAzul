import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json
import time
import re
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TabuaDeMaresScrawler:
    
    def __init__(self, headless: bool = True, debug: bool = False):
        
        self.base_url = "https://tabuademares.com/br/paraiba/joao-pessoa"
        self.session = requests.Session()
        self.headless = headless
        self.debug = debug
        self.driver = None
        
        # Headers otimizados para melhor compatibilidade
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }
        self.session.headers.update(self.headers)
    
    def _setup_driver(self):
        """Configura o driver do Selenium com opções otimizadas"""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            
            # Opções para melhor performance e compatibilidade
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--disable-images")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument(f"--user-agent={self.headers['User-Agent']}")
            
            # Desabilita recursos desnecessários
            chrome_options.add_experimental_option("useAutomationExtension", False)
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(15)
            
            # Remove indicadores de automação
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            return True
        except Exception as e:
            logger.error(f"Erro ao configurar driver: {e}")
            return False
    
    def _close_driver(self):
        """Fecha o driver do Selenium"""
        if self.driver:
            self.driver.quit()
            self.driver = None
    
    def get_page_content(self, url: str, use_selenium: bool = True, wait_for_element: str = None) -> Optional[BeautifulSoup]:
        """
        Obtém o conteúdo HTML de uma página
        """
        try:
            if use_selenium:
                if not self.driver and not self._setup_driver():
                    return None
                
                logger.info(f"Acessando: {url}")
                self.driver.get(url)
                
                # Aguarda carregamento inicial
                time.sleep(3)
                
                # Se especificado, aguarda elemento específico
                if wait_for_element:
                    try:
                        WebDriverWait(self.driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_element))
                        )
                    except Exception as e:
                        logger.warning(f"Elemento {wait_for_element} não encontrado: {e}")
                
                # Executa JavaScript para garantir carregamento completo
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                self.driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(1)
                
                html = self.driver.page_source
                
                if self.debug:
                    # Salva HTML para debug
                    debug_file = f"debug_{url.split('/')[-1]}_{int(time.time())}.html"
                    with open(debug_file, 'w', encoding='utf-8') as f:
                        f.write(html)
                    logger.info(f"HTML salvo para debug: {debug_file}")
            else:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                html = response.text
            
            return BeautifulSoup(html, 'lxml')
        
        except Exception as e:
            logger.error(f"Erro ao obter conteúdo da página {url}: {e}")
            return None
    
    def scrape_tides_info(self) -> Dict:
        """
        Extrai informações completas sobre marés: hora, altura e coeficiente
        APENAS DO DIA ATUAL para automação diária (máximo 4 marés por dia)
        
        Returns:
            Dict: Dados das marés do dia atual com hora, altura e coeficiente
        """
        url = f"{self.base_url}/previsao/mares"
        soup = self.get_page_content(url, use_selenium=True, wait_for_element="body")
        
        if not soup:
            return {"error": "Não foi possível obter dados das marés"}
        
        from datetime import datetime
        today = datetime.now()
        weekday_names = {
            0: "segunda", 1: "terça", 2: "quarta", 3: "quinta", 
            4: "sexta", 5: "sábado", 6: "domingo"
        }
        today_name = weekday_names[today.weekday()]
        
        tides_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "date": today.strftime("%Y-%m-%d"),
            "weekday": today_name.title() + "-feira" if today_name not in ["sábado", "domingo"] else today_name.title(),
            "tide_data": []
        }
        
        try:
            import warnings
            warnings.filterwarnings("ignore", category=DeprecationWarning)
            
            # ESTRATÉGIA 1: Buscar seção específica do dia atual
            full_text = soup.get_text()
            
            # Identificar data de hoje no texto
            today_patterns = [
                today.strftime("%d %b").upper(),  # 24 JUL
                today.strftime("%d de %B").lower(),  # 24 de julho
                today.strftime("%d/%m/%Y"),  # 24/07/2025
                today.strftime("%d-%m-%Y"),  # 24-07-2025
            ]
            
            day_section = None
            for pattern in today_patterns:
                # Busca a seção do dia atual até o próximo dia
                day_match = re.search(f'{pattern}.*?(?=\\d{{1,2}}\\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)|$)', 
                                    full_text, re.IGNORECASE | re.DOTALL)
                if day_match:
                    day_section = day_match.group(0)
                    logger.info(f"Encontrada seção do dia com padrão: {pattern}")
                    break
            
            # Se encontrou a seção do dia, extrair apenas as marés dessa seção
            if day_section:
                # Padrão específico para marés: hora + altura + coeficiente (opcional)
                tide_pattern = r'(\d{1,2}:\d{2})\s+(\d+[.,]\d+)\s*m?\s*(\d+)?'
                matches = re.findall(tide_pattern, day_section)
                
                logger.info(f"Marés encontradas na seção do dia: {len(matches)}")
                
                for match in matches:
                    if len(tides_data["tide_data"]) >= 4:  # LIMITE: máximo 4 marés por dia
                        break
                        
                    time_str = match[0]
                    height_str = match[1] if len(match) > 1 else None
                    coef_str = match[2] if len(match) > 2 and match[2] else None
                    
                    if height_str:
                        height_val = float(height_str.replace(',', '.'))
                        tide_entry = {
                            "time": time_str,
                            "height": height_str.replace(',', '.') + 'm',
                            "coefficient": coef_str if coef_str else None,
                            "type": "alta" if height_val > 1.5 else "baixa"
                        }
                        tides_data["tide_data"].append(tide_entry)
            
            # ESTRATÉGIA 2: Fallback - buscar tabela do dia atual
            if len(tides_data["tide_data"]) < 4:
                logger.info("Fallback: buscando em tabelas...")
                tables = soup.find_all('table')
                
                for table in tables:
                    # Verificar se a tabela contém dados do dia atual
                    table_text = table.get_text()
                    is_today_table = any(pattern in table_text.upper() for pattern in today_patterns)
                    
                    if is_today_table or not today_patterns:  # Se não conseguiu identificar, tenta a primeira tabela
                        rows = table.find_all('tr')
                        current_day_rows = []
                        
                        # Identificar linhas do dia atual
                        for i, row in enumerate(rows):
                            row_text = row.get_text()
                            if any(pattern in row_text.upper() for pattern in today_patterns):
                                # Pegar esta linha e as próximas (que provavelmente contêm as marés)
                                current_day_rows = rows[i:i+5]  # Máximo 5 linhas (cabeçalho + 4 marés)
                                break
                        
                        # Se não encontrou linha específica do dia, usar as primeiras linhas com horários
                        if not current_day_rows:
                            current_day_rows = [row for row in rows if re.search(r'\d{1,2}:\d{2}', row.get_text())][:4]
                        
                        for row in current_day_rows:
                            if len(tides_data["tide_data"]) >= 4:  # LIMITE: máximo 4 marés
                                break
                                
                            cells = row.find_all(['td', 'th'])
                            if len(cells) >= 2:
                                # Primeira célula: horário
                                time_cell = cells[0].get_text().strip()
                                time_match = re.search(r'(\d{1,2}:\d{2})', time_cell)
                                
                                if time_match:
                                    time_str = time_match.group(1)
                                    
                                    # Segunda célula: altura
                                    height_cell = cells[1].get_text().strip()
                                    height_match = re.search(r'(\d+[.,]\d+)', height_cell)
                                    
                                    if height_match:
                                        height_str = height_match.group(1).replace(',', '.')
                                        
                                        # Terceira célula: coeficiente (se existir)
                                        coef_str = None
                                        if len(cells) > 2:
                                            coef_cell = cells[2].get_text().strip()
                                            coef_match = re.search(r'^(\d+)$', coef_cell)
                                            if coef_match:
                                                coef_str = coef_match.group(1)
                                        
                                        # Verificar se já foi adicionada
                                        existing = any(t["time"] == time_str for t in tides_data["tide_data"])
                                        if not existing:
                                            height_val = float(height_str)
                                            tide_entry = {
                                                "time": time_str,
                                                "height": height_str + 'm',
                                                "coefficient": coef_str,
                                                "type": "alta" if height_val > 1.5 else "baixa"
                                            }
                                            tides_data["tide_data"].append(tide_entry)
                        
                        # Se já encontrou marés nesta tabela, pode parar
                        if tides_data["tide_data"]:
                            break
            
            # ESTRATÉGIA 3: Último fallback - buscar primeiros 4 horários válidos
            if len(tides_data["tide_data"]) < 4:
                logger.warning("Último fallback: buscando primeiros 4 horários válidos...")
                
                # Buscar todos os horários no formato HH:MM
                time_elements = soup.find_all(string=re.compile(r'^\d{1,2}:\d{2}$'))
                
                for element in time_elements[:8]:  # Limitar busca aos primeiros 8 elementos
                    if len(tides_data["tide_data"]) >= 4:  # LIMITE: máximo 4 marés
                        break
                        
                    if element.parent:
                        parent = element.parent
                        time_text = element.strip()
                        
                        # Procurar altura no próximo elemento irmão
                        height_text = None
                        coef_text = None
                        
                        next_sibling = parent.find_next_sibling()
                        if next_sibling:
                            sibling_text = next_sibling.get_text().strip()
                            height_match = re.search(r'(\d+[.,]\d+)\s*m?', sibling_text)
                            if height_match:
                                height_text = height_match.group(1).replace(',', '.') + 'm'
                                
                                # Procurar coeficiente
                                coef_sibling = next_sibling.find_next_sibling()
                                if coef_sibling:
                                    coef_sibling_text = coef_sibling.get_text().strip()
                                    coef_match = re.search(r'^(\d+)$', coef_sibling_text)
                                    if coef_match:
                                        coef_text = coef_match.group(1)
                        
                        # Se encontrou horário e altura, adicionar
                        if time_text and height_text:
                            # Verificar se já existe
                            existing = any(t["time"] == time_text for t in tides_data["tide_data"])
                            if not existing:
                                height_val = float(height_text.replace('m', ''))
                                tide_entry = {
                                    "time": time_text,
                                    "height": height_text,
                                    "coefficient": coef_text,
                                    "type": "alta" if height_val > 1.5 else "baixa"
                                }
                                tides_data["tide_data"].append(tide_entry)
            
            # Ordenar marés por horário e garantir apenas 4
            tides_data["tide_data"].sort(key=lambda x: x["time"])
            tides_data["tide_data"] = tides_data["tide_data"][:4]  # FORÇAR LIMITE DE 4 MARÉS
            
            logger.info(f"Total final de marés capturadas: {len(tides_data['tide_data'])}")
            
            # Se ainda não conseguiu 4 marés, salvar HTML para debug
            if len(tides_data["tide_data"]) < 4:
                logger.warning(f"Apenas {len(tides_data['tide_data'])} marés encontradas (esperado: 4)")
                debug_file = f"debug_mares_{int(time.time())}.html"
                with open(debug_file, 'w', encoding='utf-8') as f:
                    f.write(soup.prettify())
                logger.info(f"HTML salvo para análise: {debug_file}")
            
        except Exception as e:
            logger.error(f"Erro ao extrair dados das marés: {e}")
            tides_data["error"] = str(e)
        
        finally:
            # Fechar driver para liberar recursos
            self._close_driver()
        
        return tides_data
    
    def scrape_waves_info(self) -> Dict:
        """
        Extrai informações sobre ondas (Altura máx e Altura min)
        
        Returns:
            Dict: Dados das ondas com altura máxima e mínima
        """
        url = f"{self.base_url}/previsao/ondas"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados das ondas"}
        
        waves_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "altura_maxima": None,
            "altura_minima": None
        }
        
        try:
            full_text = soup.get_text()
            
            # Estratégia 1: Procurar por "altura máxima" e "altura mínima" no texto
            max_height_patterns = [
                r'altura\s+m[aá]xima?\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'm[aá]xima?\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'max\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'altura\s+max\s*:?\s*(\d+[.,]?\d*)\s*m'
            ]
            
            min_height_patterns = [
                r'altura\s+m[ií]nima?\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'm[ií]nima?\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'min\s*:?\s*(\d+[.,]?\d*)\s*m',
                r'altura\s+min\s*:?\s*(\d+[.,]?\d*)\s*m'
            ]
            
            # Buscar altura máxima
            for pattern in max_height_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    waves_data["altura_maxima"] = match.group(1).replace(',', '.') + 'm'
                    break
            
            # Buscar altura mínima
            for pattern in min_height_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    waves_data["altura_minima"] = match.group(1).replace(',', '.') + 'm'
                    break
            
            # Estratégia 2: Buscar em tabelas
            if not waves_data["altura_maxima"] or not waves_data["altura_minima"]:
                tables = soup.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        row_text = row.get_text().lower()
                        cells = row.find_all(['td', 'th'])
                        
                        if 'max' in row_text or 'máx' in row_text:
                            for cell in cells:
                                height_match = re.search(r'(\d+[.,]?\d*)\s*m', cell.get_text())
                                if height_match and not waves_data["altura_maxima"]:
                                    waves_data["altura_maxima"] = height_match.group(1).replace(',', '.') + 'm'
                        
                        if 'min' in row_text or 'mín' in row_text:
                            for cell in cells:
                                height_match = re.search(r'(\d+[.,]?\d*)\s*m', cell.get_text())
                                if height_match and not waves_data["altura_minima"]:
                                    waves_data["altura_minima"] = height_match.group(1).replace(',', '.') + 'm'
            
            # Estratégia 3: Buscar por padrões gerais de altura (como fallback)
            if not waves_data["altura_maxima"] and not waves_data["altura_minima"]:
                # Buscar todos os números seguidos de 'm' e tentar identificar max/min
                height_matches = re.findall(r'(\d+[.,]?\d*)\s*m', full_text)
                if height_matches:
                    heights = [float(h.replace(',', '.')) for h in height_matches if h.replace(',', '.').replace('.', '').isdigit()]
                    if heights:
                        waves_data["altura_maxima"] = f"{max(heights):.1f}m"
                        waves_data["altura_minima"] = f"{min(heights):.1f}m"
            
            # Estratégia 4: Buscar em elementos específicos com classes ou IDs
            wave_elements = soup.find_all(['div', 'span', 'p'], class_=re.compile(r'(wave|onda|altura)', re.I))
            for element in wave_elements:
                element_text = element.get_text().lower()
                
                if 'max' in element_text or 'máx' in element_text:
                    height_match = re.search(r'(\d+[.,]?\d*)\s*m', element_text)
                    if height_match and not waves_data["altura_maxima"]:
                        waves_data["altura_maxima"] = height_match.group(1).replace(',', '.') + 'm'
                
                if 'min' in element_text or 'mín' in element_text:
                    height_match = re.search(r'(\d+[.,]?\d*)\s*m', element_text)
                    if height_match and not waves_data["altura_minima"]:
                        waves_data["altura_minima"] = height_match.group(1).replace(',', '.') + 'm'
            
        except Exception as e:
            logger.error(f"Erro ao extrair dados das ondas: {e}")
            waves_data["error"] = str(e)
        
        return waves_data
    
    def scrape_fishing_info(self) -> Dict:
        """
        Extrai informações sobre pescaria - focando na Atividade dos peixes
        
        Returns:
            Dict: Dados de pescaria com atividade dos peixes (Alta/Muito Alta/Média/Baixa)
        """
        url = f"{self.base_url}/previsao/pescaria"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de pescaria"}
        
        fishing_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "atividade_peixes": None,
            "indice_atividade": None
        }
        
        try:
            full_text = soup.get_text()
            
            # Estratégia 1: Buscar padrões específicos para atividade dos peixes
            activity_patterns = [
                r'atividade\s*dos?\s*peixes?[:\s]*(muito\s*alta|alta|média|baixa|excelente|boa|regular|ruim)',
                r'atividade[:\s]*(muito\s*alta|alta|média|baixa|excelente|boa|regular|ruim)',
                r'peixes?[:\s]*(muito\s*ativ[oa]s?|ativ[oa]s?|pouco\s*ativ[oa]s?|inativos?)',
                r'pesca[:\s]*(muito\s*boa|excelente|boa|regular|ruim|péssima)',
                r'(muito\s*alta|alta|média|baixa)\s*atividade',
                r'índice[:\s]*(\d+)%?',
                r'atividade[:\s]*(\d+)%?'
            ]
            
            # Buscar atividade dos peixes
            for pattern in activity_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    activity = matches[0].strip()
                    
                    # Se for um número (índice), processar diferente
                    if activity.isdigit():
                        fishing_data["indice_atividade"] = f"{activity}%"
                        # Converter índice para classificação
                        idx = int(activity)
                        if idx >= 80:
                            fishing_data["atividade_peixes"] = "Muito Alta"
                        elif idx >= 60:
                            fishing_data["atividade_peixes"] = "Alta"
                        elif idx >= 40:
                            fishing_data["atividade_peixes"] = "Média"
                        else:
                            fishing_data["atividade_peixes"] = "Baixa"
                    else:
                        # Normalizar texto para classificação padrão
                        activity_lower = activity.lower()
                        if "muito" in activity_lower and ("alta" in activity_lower or "boa" in activity_lower or "ativ" in activity_lower):
                            fishing_data["atividade_peixes"] = "Muito Alta"
                        elif "excelente" in activity_lower or ("muito" in activity_lower and "boa" in activity_lower):
                            fishing_data["atividade_peixes"] = "Muito Alta"
                        elif "alta" in activity_lower or "boa" in activity_lower or ("ativ" in activity_lower and "muito" not in activity_lower):
                            fishing_data["atividade_peixes"] = "Alta"
                        elif "média" in activity_lower or "regular" in activity_lower:
                            fishing_data["atividade_peixes"] = "Média"
                        elif "baixa" in activity_lower or "ruim" in activity_lower or "pouco" in activity_lower or "péssima" in activity_lower:
                            fishing_data["atividade_peixes"] = "Baixa"
                        else:
                            fishing_data["atividade_peixes"] = activity.title()
                    break
            
            # Estratégia 2: Buscar em tabelas
            if not fishing_data["atividade_peixes"]:
                tables = soup.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        row_text = row.get_text().lower()
                        if 'atividade' in row_text or 'peix' in row_text:
                            cells = row.find_all(['td', 'th'])
                            for cell in cells:
                                cell_text = cell.get_text().strip()
                                for level in ["muito alta", "alta", "média", "baixa", "excelente", "boa", "regular", "ruim"]:
                                    if level in cell_text.lower():
                                        if level in ["muito alta", "excelente"]:
                                            fishing_data["atividade_peixes"] = "Muito Alta"
                                        elif level in ["alta", "boa"]:
                                            fishing_data["atividade_peixes"] = "Alta"
                                        elif level in ["média", "regular"]:
                                            fishing_data["atividade_peixes"] = "Média"
                                        elif level in ["baixa", "ruim"]:
                                            fishing_data["atividade_peixes"] = "Baixa"
                                        break
                                if fishing_data["atividade_peixes"]:
                                    break
                        if fishing_data["atividade_peixes"]:
                            break
            
            # Estratégia 3: Buscar em elementos com classes relacionadas
            fishing_elements = soup.find_all(['div', 'span', 'p'], class_=re.compile(r'(fish|pesca|atividade)', re.I))
            for element in fishing_elements:
                element_text = element.get_text().lower()
                if 'atividade' in element_text or 'peix' in element_text:
                    for level in ["muito alta", "alta", "média", "baixa", "excelente", "boa", "regular", "ruim"]:
                        if level in element_text:
                            if level in ["muito alta", "excelente"]:
                                fishing_data["atividade_peixes"] = "Muito Alta"
                            elif level in ["alta", "boa"]:
                                fishing_data["atividade_peixes"] = "Alta"
                            elif level in ["média", "regular"]:
                                fishing_data["atividade_peixes"] = "Média"
                            elif level in ["baixa", "ruim"]:
                                fishing_data["atividade_peixes"] = "Baixa"
                            break
                    
                    # Buscar também por números/percentuais
                    if not fishing_data["indice_atividade"]:
                        index_match = re.search(r'(\d+)%?', element_text)
                        if index_match:
                            fishing_data["indice_atividade"] = f"{index_match.group(1)}%"
            
        except Exception as e:
            logger.error(f"Erro ao extrair dados de pescaria: {e}")
            fishing_data["error"] = str(e)
        
        return fishing_data
    
    def scrape_sun_info(self) -> Dict:
        """
        Extrai informações sobre saída e pôr do sol - formato específico do site
        
        Returns:
            Dict: Dados do sol (sunrise e sunset)
        """
        url = f"{self.base_url}/previsao/saida-por-sol"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados do sol"}
        
        sun_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "sun_info": {
                "sunrise": None,
                "sunset": None,
                "daylight_duration": None,
                "solar_noon": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrão específico baseado na análise do debug:
            # SAÍDA DO SOL PÔR DO SOL     5:31:24     17:20:16
            
            # Busca pelo padrão específico com horários completos (com segundos)
            sun_pattern = r'SAÍDA\s*DO\s*SOL\s*PÔR\s*DO\s*SOL\s*(\d{1,2}:\d{2}:\d{2})\s*(\d{1,2}:\d{2}:\d{2})'
            matches = re.search(sun_pattern, full_text, re.IGNORECASE)
            
            if matches:
                sun_data["sun_info"]["sunrise"] = matches.group(1)  # 5:31:24
                sun_data["sun_info"]["sunset"] = matches.group(2)   # 17:20:16
            else:
                # Fallback: busca por padrões mais simples
                sunrise_pattern = r'SAÍDA\s*DO\s*SOL.*?(\d{1,2}:\d{2}(?::\d{2})?)'
                sunset_pattern = r'PÔR\s*DO\s*SOL.*?(\d{1,2}:\d{2}(?::\d{2})?)'
                
                sunrise_match = re.search(sunrise_pattern, full_text, re.IGNORECASE)
                if sunrise_match:
                    sun_data["sun_info"]["sunrise"] = sunrise_match.group(1)
                
                sunset_match = re.search(sunset_pattern, full_text, re.IGNORECASE)
                if sunset_match:
                    sun_data["sun_info"]["sunset"] = sunset_match.group(1)
            
            # Se ainda não encontrou, tenta buscar os horários do dia atual (hoje)
            if not sun_data["sun_info"]["sunrise"] or not sun_data["sun_info"]["sunset"]:
                # Busca por data de hoje
                today = datetime.now().strftime("%d %b").upper()  # 24 JUL
                today_patterns = [
                    today.replace(" ", r"\s+"),
                    today.replace(" JUL", r"\s+JUL"),
                    r"24\s+JUL"  # específico para hoje
                ]
                
                for date_pattern in today_patterns:
                    # Busca a seção do dia atual
                    day_pattern = date_pattern + r'.*?SAÍDA\s*DO\s*SOL\s*PÔR\s*DO\s*SOL\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(\d{1,2}:\d{2}(?::\d{2})?)'
                    day_match = re.search(day_pattern, full_text, re.IGNORECASE | re.DOTALL)
                    
                    if day_match:
                        sun_data["sun_info"]["sunrise"] = day_match.group(1)
                        sun_data["sun_info"]["sunset"] = day_match.group(2)
                        break
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados do sol: {e}")
            sun_data["error"] = str(e)
        
        return sun_data
    
    def scrape_moon_info(self) -> Dict:
        """
        Extrai informações sobre saída e pôr da lua - formato específico do site
        
        Returns:
            Dict: Dados da lua (moonrise e moonset)
        """
        url = f"{self.base_url}/previsao/saida-por-lua"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados da lua"}
        
        moon_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "moon_info": {
                "moonrise": None,
                "moonset": None,
                "phase": None,
                "illumination": None,
                "lunar_noon": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrão específico baseado na análise do debug:
            # SAÍDA DA LUA PÔR DA LUA     5:19     17:19
            
            # Busca pelo padrão específico da lua
            moon_pattern = r'SAÍDA\s*DA\s*LUA\s*PÔR\s*DA\s*LUA\s*(\d{1,2}:\d{2})\s*(\d{1,2}:\d{2})'
            matches = re.search(moon_pattern, full_text, re.IGNORECASE)
            
            if matches:
                moon_data["moon_info"]["moonrise"] = matches.group(1)  # 5:19
                moon_data["moon_info"]["moonset"] = matches.group(2)   # 17:19
            else:
                # Fallback: busca por padrões mais simples
                moonrise_pattern = r'SAÍDA\s*DA\s*LUA.*?(\d{1,2}:\d{2})'
                moonset_pattern = r'PÔR\s*DA\s*LUA.*?(\d{1,2}:\d{2})'
                
                moonrise_match = re.search(moonrise_pattern, full_text, re.IGNORECASE)
                if moonrise_match:
                    moon_data["moon_info"]["moonrise"] = moonrise_match.group(1)
                
                moonset_match = re.search(moonset_pattern, full_text, re.IGNORECASE)
                if moonset_match:
                    moon_data["moon_info"]["moonset"] = moonset_match.group(1)
                
                # Se ainda não encontrou, busca por horários em sequência
                if not moon_data["moon_info"]["moonrise"] or not moon_data["moon_info"]["moonset"]:
                    all_times = re.findall(r'(\d{1,2}:\d{2})', full_text)
                    if len(all_times) >= 2:
                        moon_data["moon_info"]["moonrise"] = all_times[0]
                        moon_data["moon_info"]["moonset"] = all_times[1]
            
            # Busca informações da fase da lua
            phase_patterns = [
                r'Fase\s*da\s*Lua[:\s]*([^0-9]+)',
                r'LUA\s+(NOVA|CRESCENTE|CHEIA|MINGUANTE)',
                r'FASE[:\s]+([^0-9]+)'
            ]
            
            for pattern in phase_patterns:
                phase_match = re.search(pattern, full_text, re.IGNORECASE)
                if phase_match:
                    phase = phase_match.group(1).strip()
                    if len(phase) > 2:  # Evita capturas muito pequenas
                        moon_data["moon_info"]["phase"] = phase
                        break
            
            # Busca porcentagem de iluminação
            illumination_patterns = [
                r'(\d+)%\s*(?:de\s*)?(?:iluminação|iluminada)',
                r'iluminação[:\s]*(\d+)%',
                r'(\d+)\s*%.*luz'
            ]
            
            for pattern in illumination_patterns:
                illum_match = re.search(pattern, full_text, re.IGNORECASE)
                if illum_match:
                    moon_data["moon_info"]["illumination"] = f"{illum_match.group(1)}%"
                    break
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados da lua: {e}")
            moon_data["error"] = str(e)
        
        return moon_data
    
    def scrape_uv_index(self) -> Dict:
        """
        Extrai informações sobre índice ultravioleta
        
        Returns:
            Dict: Dados do índice UV
        """
        url = f"{self.base_url}/previsao/indice-ultravioleta"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados do índice UV"}
        
        uv_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "uv": {
                "index": None,
                "level": None,
                "max_time": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para UV
            patterns = {
                "index": r'(?:índice|uv)[:\s]*(\d+[.,]?\d*)',
                "level": r'(?:nível|categoria)[:\s]*(baixo|moderado|alto|muito alto|extremo)',
                "max_time": r'(?:máximo|pico)[:\s]*(\d{1,2}:\d{2})'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    uv_data["uv"][key] = matches[0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados do índice UV: {e}")
            uv_data["error"] = str(e)
        
        return uv_data
    
    def scrape_rain_probability(self) -> Dict:
        """
        Extrai informações sobre probabilidade de chuva
        
        Returns:
            Dict: Dados de probabilidade de chuva
        """
        url = f"{self.base_url}/previsao/probabilidade-chuva"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de probabilidade de chuva"}
        
        rain_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "rain": {
                "probability": None,
                "intensity": None,
                "precipitation": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para chuva
            patterns = {
                "probability": r'(?:probabilidade|chance)[:\s]*(\d+)%',
                "intensity": r'(?:intensidade)[:\s]*(fraca|moderada|forte)',
                "precipitation": r'(?:precipitação)[:\s]*(\d+[.,]?\d*)\s*mm'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    rain_data["rain"][key] = matches[0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de chuva: {e}")
            rain_data["error"] = str(e)
        
        return rain_data
    
    def scrape_temperature(self) -> Dict:
        """
        Extrai informações detalhadas sobre temperatura
        
        Returns:
            Dict: Dados de temperatura
        """
        url = f"{self.base_url}/previsao/temperatura"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de temperatura"}
        
        temp_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "temperature": {
                "current": None,
                "max": None,
                "min": None,
                "feels_like": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para temperatura
            patterns = {
                "current": r'(?:atual|agora)[:\s]*(\d+)[°º]?\s*C',
                "max": r'(?:máxima|max)[:\s]*(\d+)[°º]?\s*C',
                "min": r'(?:mínima|min)[:\s]*(\d+)[°º]?\s*C',
                "feels_like": r'(?:sensação|percebida)[:\s]*(\d+)[°º]?\s*C'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    temp_data["temperature"][key] = matches[0] + "°C"
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de temperatura: {e}")
            temp_data["error"] = str(e)
        
        return temp_data
    
    def scrape_humidity(self) -> Dict:
        """
        Extrai informações sobre umidade
        
        Returns:
            Dict: Dados de umidade
        """
        url = f"{self.base_url}/previsao/umidade"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de umidade"}
        
        humidity_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "humidity": {
                "current": None,
                "max": None,
                "min": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para umidade
            patterns = {
                "current": r'(?:umidade|atual)[:\s]*(\d+)%',
                "max": r'(?:máxima)[:\s]*(\d+)%',
                "min": r'(?:mínima)[:\s]*(\d+)%'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    humidity_data["humidity"][key] = matches[0] + "%"
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de umidade: {e}")
            humidity_data["error"] = str(e)
        
        return humidity_data
    
    def scrape_visibility(self) -> Dict:
        """
        Extrai informações sobre visibilidade
        
        Returns:
            Dict: Dados de visibilidade
        """
        url = f"{self.base_url}/previsao/visibilidade"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de visibilidade"}
        
        visibility_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "visibility": {
                "distance": None,
                "condition": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para visibilidade
            patterns = {
                "distance": r'(?:visibilidade)[:\s]*(\d+[.,]?\d*)\s*km',
                "condition": r'(?:condição)[:\s]*(boa|regular|ruim|excelente)'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    if key == "distance":
                        visibility_data["visibility"][key] = matches[0] + " km"
                    else:
                        visibility_data["visibility"][key] = matches[0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de visibilidade: {e}")
            visibility_data["error"] = str(e)
        
        return visibility_data
    
    def scrape_pressure(self) -> Dict:
        """
        Extrai informações sobre pressão atmosférica
        
        Returns:
            Dict: Dados de pressão atmosférica
        """
        url = f"{self.base_url}/previsao/pressao-atmosferica"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de pressão atmosférica"}
        
        pressure_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "pressure": {
                "current": None,
                "trend": None,
                "sea_level": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para pressão
            patterns = {
                "current": r'(?:pressão)[:\s]*(\d+[.,]?\d*)\s*hPa',
                "trend": r'(?:tendência)[:\s]*(subindo|descendo|estável)',
                "sea_level": r'(?:nível.*mar)[:\s]*(\d+[.,]?\d*)\s*hPa'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    if key in ["current", "sea_level"]:
                        pressure_data["pressure"][key] = matches[0] + " hPa"
                    else:
                        pressure_data["pressure"][key] = matches[0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de pressão: {e}")
            pressure_data["error"] = str(e)
        
        return pressure_data
    
    def scrape_wind(self) -> Dict:
        """
        Extrai informações sobre vento
        
        Returns:
            Dict: Dados do vento
        """
        url = f"{self.base_url}/previsao/vento"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados do vento"}
        
        wind_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "wind": {
                "speed": None,
                "direction": None,
                "gusts": None,
                "beaufort_scale": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para vento
            patterns = {
                "speed": r'(?:velocidade|vento)[:\s]*(\d+[.,]?\d*)\s*km/h',
                "direction": r'(?:direção)[:\s]*([NSEWLO]+|norte|sul|leste|oeste)',
                "gusts": r'(?:rajadas)[:\s]*(\d+[.,]?\d*)\s*km/h',
                "beaufort_scale": r'(?:beaufort|escala)[:\s]*(\d+)'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    if key in ["speed", "gusts"]:
                        wind_data["wind"][key] = matches[0] + " km/h"
                    else:
                        wind_data["wind"][key] = matches[0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados do vento: {e}")
            wind_data["error"] = str(e)
        
        return wind_data
    
    def scrape_water_temperature(self) -> Dict:
        """
        Extrai informações sobre temperatura da água
        
        Returns:
            Dict: Dados da temperatura da água
        """
        url = f"{self.base_url}/previsao/temperatura-agua"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados da temperatura da água"}
        
        water_temp_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "water_temperature": {
                "current": None,
                "surface": None,
                "depth": None
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para temperatura da água
            patterns = {
                "current": r'(?:água|temperatura)[:\s]*(\d+[.,]?\d*)[°º]?\s*C',
                "surface": r'(?:superfície)[:\s]*(\d+[.,]?\d*)[°º]?\s*C',
                "depth": r'(?:profundidade)[:\s]*(\d+[.,]?\d*)[°º]?\s*C'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    water_temp_data["water_temperature"][key] = matches[0] + "°C"
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados da temperatura da água: {e}")
            water_temp_data["error"] = str(e)
        
        return water_temp_data
    
    def scrape_weather_info(self) -> Dict:
        """
        Extrai informações meteorológicas da aba tempo com previsão horária
        
        Returns:
            Dict: Dados meteorológicos gerais com previsão por hora
        """
        url = f"{self.base_url}/previsao/tempo"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados meteorológicos"}
        
        weather_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "weather": {
                "description": None,
                "temperature": None,
                "humidity": None,
                "wind_speed": None,
                "wind_direction": None,
                "pressure": None,
                "visibility": None,
                "clouds": None
            },
            "hourly_forecast": []
        }
        
        try:
            full_text = soup.get_text()
            
            # Busca previsão horária como no exemplo fornecido
            # Padrão para horário + condição + descrição
            hourly_patterns = [
                r'(\d{1,2}:\d{2})\s*([^\n\r]*?)\s*([^\n\r]*?)(?=\d{1,2}:\d{2}|$)',
                r'(\d{1,2}:\d{2})\s*\n\s*([^\n\r]+)\s*\n\s*([^\n\r]+)',
                r'(\d{1,2}:\d{2})\s*(.*?)(?=\d{1,2}:\d{2}|\n\n|$)'
            ]
            
            for pattern in hourly_patterns:
                matches = re.findall(pattern, full_text, re.DOTALL | re.MULTILINE)
                if matches and len(matches) > 5:  # Se encontrar várias previsões horárias
                    for match in matches:
                        if len(match) >= 2:
                            hour = match[0].strip()
                            condition1 = match[1].strip() if len(match) > 1 else ""
                            condition2 = match[2].strip() if len(match) > 2 else ""
                            
                            # Filtra condições válidas
                            if condition1 and len(condition1) > 3 and len(condition1) < 50:
                                forecast_entry = {
                                    "hour": hour,
                                    "condition": condition1,
                                    "description": condition2 if condition2 and len(condition2) > 3 and len(condition2) < 50 else None
                                }
                                weather_data["hourly_forecast"].append(forecast_entry)
                    
                    if weather_data["hourly_forecast"]:
                        break
            
            # Se não encontrou previsão horária, busca em estruturas HTML
            if not weather_data["hourly_forecast"]:
                # Busca em listas
                for ul in soup.find_all('ul'):
                    items = ul.find_all('li')
                    if len(items) > 10:  # Provável previsão horária
                        for item in items:
                            text = item.get_text().strip()
                            time_match = re.search(r'(\d{1,2}:\d{2})', text)
                            if time_match:
                                hour = time_match.group(1)
                                # Remove a hora do texto para pegar o resto
                                remaining_text = re.sub(r'\d{1,2}:\d{2}\s*', '', text).strip()
                                lines = [line.strip() for line in remaining_text.split('\n') if line.strip()]
                                
                                forecast_entry = {
                                    "hour": hour,
                                    "condition": lines[0] if lines else None,
                                    "description": lines[1] if len(lines) > 1 else None
                                }
                                weather_data["hourly_forecast"].append(forecast_entry)
                
                # Busca em tabelas
                for table in soup.find_all('table'):
                    rows = table.find_all('tr')
                    for row in rows:
                        cells = row.find_all(['td', 'th'])
                        if len(cells) >= 2:
                            first_cell = cells[0].get_text().strip()
                            time_match = re.search(r'(\d{1,2}:\d{2})', first_cell)
                            if time_match:
                                hour = time_match.group(1)
                                condition = cells[1].get_text().strip() if len(cells) > 1 else None
                                description = cells[2].get_text().strip() if len(cells) > 2 else None
                                
                                forecast_entry = {
                                    "hour": hour,
                                    "condition": condition,
                                    "description": description
                                }
                                weather_data["hourly_forecast"].append(forecast_entry)
            
            # Padrões para dados meteorológicos gerais
            patterns = {
                "temperature": r'(\d+)[°º]\s*C',
                "humidity": r'umidade[:\s]*(\d+)%',
                "wind_speed": r'vento[:\s]*(\d+)\s*km/h',
                "pressure": r'pressão[:\s]*(\d+)\s*hPa',
                "visibility": r'visibilidade[:\s]*(\d+)\s*km',
                "clouds": r'nuvens[:\s]*(\d+)%',
                "description": r'(ensolarado|nublado|chuvoso|parcialmente nublado|limpo|despejado|aguaceiros?)'
            }
            
            for key, pattern in patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    value = matches[0]
                    if key == "temperature":
                        weather_data["weather"][key] = value + "°C"
                    elif key in ["humidity", "clouds"]:
                        weather_data["weather"][key] = value + "%"
                    elif key == "wind_speed":
                        weather_data["weather"][key] = value + " km/h"
                    elif key == "pressure":
                        weather_data["weather"][key] = value + " hPa"
                    elif key == "visibility":
                        weather_data["weather"][key] = value + " km"
                    else:
                        weather_data["weather"][key] = value
            
            # Limita a previsão horária se muito extensa
            if len(weather_data["hourly_forecast"]) > 24:
                weather_data["hourly_forecast"] = weather_data["hourly_forecast"][:24]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados meteorológicos: {e}")
            weather_data["error"] = str(e)
        
        return weather_data
    
    def scrape_rain_probability_info(self) -> Dict:
        """
        Extrai informações sobre probabilidade de chuva
        
        Returns:
            Dict: Dados sobre probabilidade de chuva
        """
        url = f"{self.base_url}/previsao/probabilidade-de-chuva"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de probabilidade de chuva"}
        
        rain_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "rain_probability": []
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para probabilidade de chuva
            rain_patterns = [
                r'probabilidade[:\s]*(\d+)%',
                r'chuva[:\s]*(\d+)%',
                r'(\d+)%\s*de\s*chuva'
            ]
            
            for pattern in rain_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                for match in matches:
                    rain_data["rain_probability"].append(match + "%")
            
            # Remove duplicatas
            rain_data["rain_probability"] = list(set(rain_data["rain_probability"]))
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de probabilidade de chuva: {e}")
            rain_data["error"] = str(e)
        
        return rain_data
    
    def scrape_temperature_info(self) -> Dict:
        """
        Extrai informações de temperatura específica
        
        Returns:
            Dict: Dados detalhados de temperatura
        """
        url = f"{self.base_url}/previsao/temperatura"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de temperatura"}
        
        temp_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "temperatures": {
                "current": None,
                "max": None,
                "min": None,
                "forecast": []
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para temperaturas
            temp_patterns = {
                "current": r'temperatura\s*atual[:\s]*(\d+)[°º]',
                "max": r'máxima[:\s]*(\d+)[°º]',
                "min": r'mínima[:\s]*(\d+)[°º]',
                "general": r'(\d+)[°º]\s*C'
            }
            
            for key, pattern in temp_patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    if key == "general":
                        temp_data["temperatures"]["forecast"].extend([match + "°C" for match in matches])
                    else:
                        temp_data["temperatures"][key] = matches[0] + "°C"
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de temperatura: {e}")
            temp_data["error"] = str(e)
        
        return temp_data
    
    def scrape_humidity_info(self) -> Dict:
        """
        Extrai informações de umidade específica
        
        Returns:
            Dict: Dados detalhados de umidade
        """
        url = f"{self.base_url}/previsao/umidade"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de umidade"}
        
        humidity_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "humidity": {
                "current": None,
                "forecast": []
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para umidade
            humidity_patterns = [
                r'umidade[:\s]*(\d+)%',
                r'(\d+)%\s*umidade'
            ]
            
            for pattern in humidity_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                for match in matches:
                    humidity_data["humidity"]["forecast"].append(match + "%")
            
            # Primeira como atual
            if humidity_data["humidity"]["forecast"]:
                humidity_data["humidity"]["current"] = humidity_data["humidity"]["forecast"][0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de umidade: {e}")
            humidity_data["error"] = str(e)
        
        return humidity_data
    
    def scrape_visibility_info(self) -> Dict:
        """
        Extrai informações de visibilidade específica
        
        Returns:
            Dict: Dados detalhados de visibilidade
        """
        url = f"{self.base_url}/previsao/visibilidade"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de visibilidade"}
        
        visibility_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "visibility": {
                "current": None,
                "forecast": []
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para visibilidade
            visibility_patterns = [
                r'visibilidade[:\s]*(\d+)\s*km',
                r'(\d+)\s*km\s*visibilidade'
            ]
            
            for pattern in visibility_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                for match in matches:
                    visibility_data["visibility"]["forecast"].append(match + " km")
            
            # Primeira como atual
            if visibility_data["visibility"]["forecast"]:
                visibility_data["visibility"]["current"] = visibility_data["visibility"]["forecast"][0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de visibilidade: {e}")
            visibility_data["error"] = str(e)
        
        return visibility_data
    
    def scrape_pressure_info(self) -> Dict:
        """
        Extrai informações de pressão atmosférica específica
        
        Returns:
            Dict: Dados detalhados de pressão atmosférica
        """
        url = f"{self.base_url}/previsao/pressao-atmosferica"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de pressão atmosférica"}
        
        pressure_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "pressure": {
                "current": None,
                "forecast": []
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para pressão atmosférica
            pressure_patterns = [
                r'pressão[:\s]*(\d+)\s*hPa',
                r'(\d+)\s*hPa',
                r'pressão\s*atmosférica[:\s]*(\d+)'
            ]
            
            for pattern in pressure_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                for match in matches:
                    if pattern.endswith(r'(\d+)'):
                        pressure_data["pressure"]["forecast"].append(match + " hPa")
                    else:
                        pressure_data["pressure"]["forecast"].append(match + " hPa")
            
            # Primeira como atual
            if pressure_data["pressure"]["forecast"]:
                pressure_data["pressure"]["current"] = pressure_data["pressure"]["forecast"][0]
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de pressão atmosférica: {e}")
            pressure_data["error"] = str(e)
        
        return pressure_data
    
    def scrape_wind_info(self) -> Dict:
        """
        Extrai informações de vento específica
        
        Returns:
            Dict: Dados detalhados de vento
        """
        url = f"{self.base_url}/previsao/vento"
        soup = self.get_page_content(url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de vento"}
        
        wind_data = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "location": "João Pessoa, PB",
            "wind": {
                "speed": None,
                "direction": None,
                "forecast": []
            }
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões para vento
            wind_patterns = {
                "speed": r'vento[:\s]*(\d+)\s*km/h',
                "direction": r'direção[:\s]*([NSEOSWNE]+)',
                "general": r'(\d+)\s*km/h\s*([NSEOSWNE]+)'
            }
            
            # Velocidade do vento
            speed_matches = re.findall(wind_patterns["speed"], full_text, re.IGNORECASE)
            if speed_matches:
                wind_data["wind"]["speed"] = speed_matches[0] + " km/h"
            
            # Direção do vento
            direction_matches = re.findall(wind_patterns["direction"], full_text, re.IGNORECASE)
            if direction_matches:
                wind_data["wind"]["direction"] = direction_matches[0]
            
            # Dados gerais de vento
            general_matches = re.findall(wind_patterns["general"], full_text, re.IGNORECASE)
            for speed, direction in general_matches:
                wind_data["wind"]["forecast"].append({
                    "speed": speed + " km/h",
                    "direction": direction
                })
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados de vento: {e}")
            wind_data["error"] = str(e)
        
        return wind_data
    
    def scrape_sun_moon_info(self) -> Dict:
        """
        Extrai informações sobre saída/pôr do sol e lua
        """
        soup = self.get_page_content(self.base_url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados solunares"}
        
        sun_moon_data = {
            "timestamp": datetime.now().isoformat(),
            "url": self.base_url,
            "location": "João Pessoa, PB",
            "sun": {
                "sunrise": None,
                "sunset": None
            },
            "moon": {
                "moonrise": None,
                "moonset": None,
                "phase": None
            },
            "solar_periods": []
        }
        
        try:
            # Busca por elementos relacionados ao sol
            sun_elements = soup.find_all(text=re.compile(r'(nascer|saída|pôr|sol)', re.I))
            
            for element in sun_elements:
                if element.parent:
                    text = element.parent.get_text()
                    # Busca por horários no formato HH:MM
                    times = re.findall(r'\b\d{1,2}:\d{2}\b', text)
                    
                    if 'nascer' in text.lower() or 'saída' in text.lower():
                        if times and not sun_moon_data["sun"]["sunrise"]:
                            sun_moon_data["sun"]["sunrise"] = times[0]
                    
                    if 'pôr' in text.lower() or 'ocaso' in text.lower():
                        if times and not sun_moon_data["sun"]["sunset"]:
                            sun_moon_data["sun"]["sunset"] = times[-1]
            
            # Busca por elementos relacionados à lua
            moon_elements = soup.find_all(text=re.compile(r'(lua|lunar)', re.I))
            
            for element in moon_elements:
                if element.parent:
                    text = element.parent.get_text()
                    times = re.findall(r'\b\d{1,2}:\d{2}\b', text)
                    
                    if 'saída' in text.lower() or 'nascer' in text.lower():
                        if times and not sun_moon_data["moon"]["moonrise"]:
                            sun_moon_data["moon"]["moonrise"] = times[0]
                    
                    if 'pôr' in text.lower() or 'ocaso' in text.lower():
                        if times and not sun_moon_data["moon"]["moonset"]:
                            sun_moon_data["moon"]["moonset"] = times[-1]
                    
                    # Fases da lua
                    phases = re.findall(r'(nova|crescente|cheia|minguante)', text.lower())
                    if phases and not sun_moon_data["moon"]["phase"]:
                        sun_moon_data["moon"]["phase"] = phases[0]
            
            # Busca períodos solunares
            solunar_text = soup.get_text()
            periods = re.findall(r'período\s+(\w+)[:\s]*(\d{1,2}:\d{2})', solunar_text, re.I)
            
            for period_type, time in periods:
                sun_moon_data["solar_periods"].append({
                    "type": period_type,
                    "time": time
                })
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados solunares: {e}")
            sun_moon_data["error"] = str(e)
        
        return sun_moon_data
    
    def scrape_detailed_weather(self) -> Dict:
        """
        Extrai informações meteorológicas detalhadas da página principal
        """
        soup = self.get_page_content(self.base_url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados meteorológicos detalhados"}
        
        detailed_weather = {
            "timestamp": datetime.now().isoformat(),
            "url": self.base_url,
            "location": "João Pessoa, PB",
            "current_weather": {
                "temperature": None,
                "humidity": None,
                "pressure": None,
                "visibility": None,
                "wind_speed": None,
                "wind_direction": None,
                "rain_probability": None,
                "uv_index": None
            },
            "water_temperature": None
        }
        
        try:
            full_text = soup.get_text()
            
            # Padrões específicos para dados meteorológicos detalhados
            detailed_patterns = {
                "temperature": r'temperatura[:\s]*(\d+)[°º]?\s*C',
                "humidity": r'umidade[:\s]*(\d+)%',
                "pressure": r'pressão[:\s]*(\d+)\s*(hPa|mb)',
                "visibility": r'visibilidade[:\s]*(\d+)\s*km',
                "wind_speed": r'vento[:\s]*(\d+)\s*km/h',
                "rain_probability": r'chuva[:\s]*(\d+)%',
                "uv_index": r'(uv|ultravioleta)[:\s]*(\d+)',
                "water_temperature": r'água[:\s]*(\d+)[°º]?\s*C'
            }
            
            for key, pattern in detailed_patterns.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    if key == "uv_index":
                        value = matches[0][1] if isinstance(matches[0], tuple) else matches[0]
                    else:
                        value = matches[0] if not isinstance(matches[0], tuple) else matches[0][0]
                    
                    if key == "water_temperature":
                        detailed_weather[key] = value + "°C"
                    elif key in ["temperature", "humidity", "rain_probability"]:
                        detailed_weather["current_weather"][key] = value + ("°C" if key == "temperature" else "%")
                    elif key in ["pressure"]:
                        detailed_weather["current_weather"][key] = value + " hPa"
                    elif key in ["visibility"]:
                        detailed_weather["current_weather"][key] = value + " km"
                    elif key in ["wind_speed"]:
                        detailed_weather["current_weather"][key] = value + " km/h"
                    else:
                        detailed_weather["current_weather"][key] = value
            
            # Busca por elementos específicos com classes/IDs relacionados ao clima
            weather_containers = soup.find_all(['div', 'span', 'p'], 
                                               class_=re.compile(r'(weather|tempo|clima)', re.I))
            
            for container in weather_containers:
                text = container.get_text()
                
                # Extrai números e unidades
                temp_match = re.search(r'(\d+)[°º]\s*C', text)
                if temp_match and not detailed_weather["current_weather"]["temperature"]:
                    detailed_weather["current_weather"]["temperature"] = temp_match.group(1) + "°C"
                
                humidity_match = re.search(r'(\d+)%', text)
                if humidity_match and 'umidade' in text.lower():
                    detailed_weather["current_weather"]["humidity"] = humidity_match.group(1) + "%"
        
        except Exception as e:
            logger.error(f"Erro ao extrair dados meteorológicos detalhados: {e}")
            detailed_weather["error"] = str(e)
        
        return detailed_weather
    
    def scrape_water_temperature(self) -> Dict:
        """
        Extrai informações sobre temperatura da água
        """
        soup = self.get_page_content(self.base_url, use_selenium=True)
        
        if not soup:
            return {"error": "Não foi possível obter dados de temperatura da água"}
        
        water_data = {
            "timestamp": datetime.now().isoformat(),
            "url": self.base_url,
            "location": "João Pessoa, PB",
            "water_temperature": {
                "current": None,
                "average": None,
                "min": None,
                "max": None
            }
        }
        
        try:
            # Busca específica por seção de temperatura da água
            water_sections = soup.find_all(text=re.compile(r'temperatura.*água', re.I))
            
            for section in water_sections:
                if section.parent:
                    container = section.parent.parent if section.parent.parent else section.parent
                    text = container.get_text()
                    
                    # Busca por temperaturas
                    temps = re.findall(r'(\d+)[°º]?\s*C', text)
                    
                    if temps:
                        if not water_data["water_temperature"]["current"]:
                            water_data["water_temperature"]["current"] = temps[0] + "°C"
                        
                        if len(temps) > 1:
                            water_data["water_temperature"]["average"] = temps[1] + "°C"
            
            # Busca geral no texto
            full_text = soup.get_text()
            water_temp_pattern = r'água[:\s]*(\d+)[°º]?\s*C'
            water_matches = re.findall(water_temp_pattern, full_text, re.I)
            
            if water_matches and not water_data["water_temperature"]["current"]:
                water_data["water_temperature"]["current"] = water_matches[0] + "°C"
        
        except Exception as e:
            logger.error(f"Erro ao extrair temperatura da água: {e}")
            water_data["error"] = str(e)
        
        return water_data
    
    def scrape_all_data(self) -> Dict:
        """
        Executa o scraping de todas as 14 categorias de dados disponíveis:
        - Marés
        - Pescaria  
        - Saída e pôr do sol
        - Saída e pôr da lua
        - Índice ultravioleta
        - Tempo (informações meteorológicas gerais)
        - Probabilidade de chuva
        - Temperatura
        - Umidade
        - Visibilidade
        - Pressão atmosférica
        - Vento
        - Ondas
        - Temperatura da água
        
        Returns:
            Dict: Todos os dados coletados das 14 categorias
        """
        all_data = {
            "timestamp": datetime.now().isoformat(),
            "location": "João Pessoa, PB",
            "data_sources": []
        }
        
        # Lista de todos os métodos de scraping com suas URLs correspondentes
        scraping_methods = [
            ("tides", self.scrape_tides_info, "Informações de marés"),
            ("fishing", self.scrape_fishing_info, "Informações de pescaria"),
            ("sun", self.scrape_sun_info, "Informações de nascer e pôr do sol"),
            ("moon", self.scrape_moon_info, "Informações de lua"),
            ("uv_index", self.scrape_uv_index, "Índice ultravioleta"),
            ("weather", self.scrape_weather_info, "Informações meteorológicas gerais"),
            ("rain_probability", self.scrape_rain_probability_info, "Probabilidade de chuva"),
            ("temperature", self.scrape_temperature_info, "Informações de temperatura"),
            ("humidity", self.scrape_humidity_info, "Informações de umidade"),
            ("visibility", self.scrape_visibility_info, "Informações de visibilidade"),
            ("pressure", self.scrape_pressure_info, "Pressão atmosférica"),
            ("wind", self.scrape_wind_info, "Informações de vento"),
            ("waves", self.scrape_waves_info, "Informações de ondas"),
            ("water_temperature", self.scrape_water_temperature, "Temperatura da água")
        ]
        
        logger.info("Iniciando scraping completo de todas as 14 categorias de dados...")
        
        for data_type, method, description in scraping_methods:
            try:
                logger.info(f"Coletando {description}...")
                data = method()
                all_data[data_type] = data
                all_data["data_sources"].append({
                    "type": data_type,
                    "description": description,
                    "status": "success" if "error" not in data else "error",
                    "timestamp": data.get("timestamp"),
                    "url": data.get("url")
                })
                logger.info(f"✓ {description} coletadas com sucesso")
                
                # Pausa entre requisições para evitar sobrecarga
                time.sleep(2)
                
            except Exception as e:
                error_msg = f"Erro ao coletar {description}: {e}"
                logger.error(error_msg)
                all_data[data_type] = {"error": str(e)}
                all_data["data_sources"].append({
                    "type": data_type,
                    "description": description,
                    "status": "error",
                    "error": str(e)
                })
        
        # Estatísticas finais
        successful_sources = len([s for s in all_data["data_sources"] if s["status"] == "success"])
        total_sources = len(all_data["data_sources"])
        
        all_data["summary"] = {
            "total_data_sources": total_sources,
            "successful_extractions": successful_sources,
            "failed_extractions": total_sources - successful_sources,
            "success_rate": f"{(successful_sources/total_sources)*100:.1f}%" if total_sources > 0 else "0%"
        }
        
        logger.info(f"Scraping completo finalizado: {successful_sources}/{total_sources} fontes coletadas com sucesso")
        
        return all_data
    
    def scrape_essential_data(self) -> Dict:
        """
        Executa o scraping otimizado salvando apenas dados essenciais de forma limpa
        
        Returns:
            Dict: Dados limpos e otimizados para integração
        """
        essential_data = {
            "collected_at": datetime.now().isoformat(),
            "location": "João Pessoa, PB"
        }
        
        # Lista apenas dos métodos essenciais que você quer manter
        essential_methods = [
            ("tides", self.scrape_tides_info, "mares"),
            ("waves", self.scrape_waves_info, "ondas"), 
            ("fishing", self.scrape_fishing_info, "pescaria"),
            ("sun", self.scrape_sun_info, "sol"),
            ("moon", self.scrape_moon_info, "lua"),
            ("weather", self.scrape_weather_info, "tempo"),
            ("wind", self.scrape_wind_info, "vento"),
            ("temperature", self.scrape_temperature_info, "temperatura"),
            ("water_temperature", self.scrape_water_temperature, "temp_agua")
        ]
        
        logger.info("Coletando dados essenciais otimizados...")
        
        for data_type, method, key in essential_methods:
            try:
                raw_data = method()
                
                # Extrair apenas os dados úteis de cada categoria
                if data_type == "tides" and "tide_data" in raw_data:
                    essential_data[key] = raw_data["tide_data"]
                    
                elif data_type == "waves" and "wave_info" in raw_data:
                    wave_info = raw_data["wave_info"]
                    essential_data[key] = {
                        "altura_max": wave_info.get("altura_max"),
                        "altura_min": wave_info.get("altura_min")
                    }
                    
                elif data_type == "fishing" and "fishing_info" in raw_data:
                    essential_data[key] = {
                        "atividade": raw_data["fishing_info"].get("atividade_dos_peixes")
                    }
                    
                elif data_type == "sun" and "sun_info" in raw_data:
                    sun_info = raw_data["sun_info"]
                    essential_data[key] = {
                        "nascer": sun_info.get("sunrise"),
                        "por": sun_info.get("sunset")
                    }
                    
                elif data_type == "moon" and "moon_info" in raw_data:
                    moon_info = raw_data["moon_info"]
                    essential_data[key] = {
                        "nascer": moon_info.get("moonrise"),
                        "por": moon_info.get("moonset"),
                        "fase": moon_info.get("phase")
                    }
                    
                elif data_type == "weather" and "weather_info" in raw_data:
                    weather_info = raw_data["weather_info"]
                    essential_data[key] = {
                        "previsao_24h": weather_info.get("hourly_forecast", [])[:24]  # Apenas 24h
                    }
                    
                elif data_type == "wind" and "wind_info" in raw_data:
                    wind_info = raw_data["wind_info"]
                    essential_data[key] = {
                        "velocidade": wind_info.get("speed"),
                        "direcao": wind_info.get("direction")
                    }
                    
                elif data_type == "temperature" and "temperature_info" in raw_data:
                    temp_info = raw_data["temperature_info"]
                    essential_data[key] = {
                        "atual": temp_info.get("current"),
                        "max": temp_info.get("max"),
                        "min": temp_info.get("min")
                    }
                    
                elif data_type == "water_temperature" and "water_temp" in raw_data:
                    essential_data[key] = {
                        "temperatura": raw_data["water_temp"].get("temperature")
                    }
                
                logger.info(f"✓ {key} coletado")
                time.sleep(1)  # Pausa menor para dados essenciais
                
            except Exception as e:
                logger.error(f"Erro ao coletar {key}: {e}")
                essential_data[key] = None
        
        logger.info(f"Dados essenciais coletados: {len([k for k, v in essential_data.items() if v is not None and k not in ['collected_at', 'location']])} categorias")
        return essential_data
    
    def scrape_unified_data(self) -> Dict:
        """
        Executa scraping unificado com todas as informações essenciais em um único JSON
        APENAS DADOS DO DIA ATUAL para automação diária
        Exclui: pressão atmosférica, visibilidade, umidade, índice UV, temperatura da água
        
        Returns:
            Dict: Dados unificados e diretos do dia atual
        """
        from datetime import datetime
        today = datetime.now()
        
        unified_data = {
            "timestamp": today.isoformat(),
            "date": today.strftime("%Y-%m-%d"),
            "day_of_week": today.strftime("%A"),
            "location": "João Pessoa, PB",
            
            # Dados do Sol
            "nascer_sol": None,
            "por_sol": None,
            
            # Dados da Lua  
            "nascer_lua": None,
            "por_lua": None,
            "fase_lua": None,
            
            # Marés (apenas do dia atual)
            "mares": [],
            
            # Ondas
            "ondas_max": None,
            "ondas_min": None,
            
            # Pescaria
            "atividade_peixes": None
        }
        
        logger.info(f"Coletando dados unificados do dia {today.strftime('%d/%m/%Y')} ({today.strftime('%A')})...")
        
        # 1. SOL
        try:
            logger.info("Coletando dados do sol...")
            sun_data = self.scrape_sun_info()
            if "sun_info" in sun_data:
                sun_info = sun_data["sun_info"]
                unified_data["nascer_sol"] = sun_info.get("sunrise")
                unified_data["por_sol"] = sun_info.get("sunset")
            logger.info("✓ Sol coletado")
        except Exception as e:
            logger.error(f"Erro ao coletar sol: {e}")
        
        # 2. LUA
        try:
            logger.info("Coletando dados da lua...")
            moon_data = self.scrape_moon_info()
            if "moon_info" in moon_data:
                moon_info = moon_data["moon_info"]
                unified_data["nascer_lua"] = moon_info.get("moonrise")
                unified_data["por_lua"] = moon_info.get("moonset")
                unified_data["fase_lua"] = moon_info.get("phase")
            logger.info("✓ Lua coletada")
        except Exception as e:
            logger.error(f"Erro ao coletar lua: {e}")
        
        # 3. MARÉS (apenas do dia atual)
        try:
            logger.info("Coletando marés do dia atual...")
            tides_data = self.scrape_tides_info()
            if "tide_data" in tides_data and tides_data["tide_data"]:
                # Formatar dados das marés com hora, altura e coeficiente
                unified_data["mares"] = []
                for item in tides_data["tide_data"]:
                    mare_entry = f"{item.get('time', '')}, {item.get('height', '')}"
                    if item.get('coefficient'):
                        mare_entry += f", {item.get('coefficient')}"
                    unified_data["mares"].append(mare_entry)
            logger.info(f"✓ Marés coletadas: {len(unified_data['mares'])} do dia atual")
        except Exception as e:
            logger.error(f"Erro ao coletar marés: {e}")
        
        # 4. ONDAS
        try:
            logger.info("Coletando ondas...")
            waves_data = self.scrape_waves_info()
            unified_data["ondas_max"] = waves_data.get("altura_maxima")
            unified_data["ondas_min"] = waves_data.get("altura_minima")
            logger.info("✓ Ondas coletadas")
        except Exception as e:
            logger.error(f"Erro ao coletar ondas: {e}")
        
        # 5. PESCARIA
        try:
            logger.info("Coletando pescaria...")
            fishing_data = self.scrape_fishing_info()
            unified_data["atividade_peixes"] = fishing_data.get("atividade_peixes")
            if fishing_data.get("indice_atividade"):
                unified_data["indice_atividade"] = fishing_data.get("indice_atividade")
            logger.info("✓ Pescaria coletada")
        except Exception as e:
            logger.error(f"Erro ao coletar pescaria: {e}")
            logger.error(f"Erro ao coletar ondas: {e}")
        
        # 5. PESCARIA
        try:
            logger.info("Coletando pescaria...")
            fishing_data = self.scrape_fishing_info()
            if "fishing_info" in fishing_data:
                unified_data["atividade_peixes"] = fishing_data["fishing_info"].get("atividade_dos_peixes")
            logger.info("✓ Pescaria coletada")
        except Exception as e:
            logger.error(f"Erro ao coletar pescaria: {e}")
        
        
        # Contar dados coletados com sucesso
        collected_count = sum(1 for k, v in unified_data.items() 
                            if k not in ['timestamp', 'location'] and v is not None and v != [])
        
        logger.info(f"Dados unificados coletados: {collected_count} categorias com dados")
        return unified_data

    def scrape_custom_data(self, categories: List[str] = None) -> Dict:
        """
        Executa scraping customizado de categorias específicas
        
        Args:
            categories (List[str]): Lista de categorias para coletar.
                                   Opções: 'mares', 'ondas', 'pescaria', 'sol', 'lua', 
                                          'tempo', 'vento', 'temperatura', 'temp_agua'
        
        Returns:
            Dict: Dados limpos das categorias selecionadas
        """
        if categories is None:
            categories = ['mares', 'ondas', 'pescaria', 'sol', 'lua']  # Padrão
        
        clean_data = {
            "timestamp": datetime.now().isoformat(),
            "location": "João Pessoa, PB"
        }
        
        # Mapeamento de categorias para métodos
        category_mapping = {
            "mares": (self.scrape_tides_info, self._extract_tides_data),
            "ondas": (self.scrape_waves_info, self._extract_waves_data),
            "pescaria": (self.scrape_fishing_info, self._extract_fishing_data),
            "sol": (self.scrape_sun_info, self._extract_sun_data),
            "lua": (self.scrape_moon_info, self._extract_moon_data),
            "tempo": (self.scrape_weather_info, self._extract_weather_data),
            "vento": (self.scrape_wind_info, self._extract_wind_data),
            "temperatura": (self.scrape_temperature_info, self._extract_temperature_data),
            "temp_agua": (self.scrape_water_temperature, self._extract_water_temp_data)
        }
        
        logger.info(f"Coletando dados customizados: {', '.join(categories)}")
        
        for category in categories:
            if category in category_mapping:
                try:
                    scrape_method, extract_method = category_mapping[category]
                    raw_data = scrape_method()
                    clean_data[category] = extract_method(raw_data)
                    logger.info(f"✓ {category} coletado")
                    time.sleep(1)
                except Exception as e:
                    logger.error(f"Erro ao coletar {category}: {e}")
                    clean_data[category] = None
            else:
                logger.warning(f"Categoria desconhecida: {category}")
                clean_data[category] = None
        
        return clean_data
    
    # Métodos auxiliares para extrair apenas dados úteis
    def _extract_tides_data(self, raw_data: Dict) -> List[Dict]:
        """Extrai dados limpos das marés"""
        if "tide_data" in raw_data:
            return [
                {
                    "hora": item.get("time"),
                    "altura": item.get("height"),
                    "tipo": "alta" if item.get("type") == "high" else "baixa"
                }
                for item in raw_data["tide_data"]
                if item.get("time") and item.get("height")
            ]
        return []
    
    def _extract_waves_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos das ondas"""
        if "wave_info" in raw_data:
            wave_info = raw_data["wave_info"]
            return {
                "max": wave_info.get("altura_max"),
                "min": wave_info.get("altura_min")
            }
        return {}
    
    def _extract_fishing_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos da pescaria"""
        if "fishing_info" in raw_data:
            return {
                "atividade": raw_data["fishing_info"].get("atividade_dos_peixes")
            }
        return {}
    
    def _extract_sun_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos do sol"""
        if "sun_info" in raw_data:
            sun_info = raw_data["sun_info"]
            return {
                "nascer": sun_info.get("sunrise"),
                "por": sun_info.get("sunset")
            }
        return {}
    
    def _extract_moon_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos da lua"""
        if "moon_info" in raw_data:
            moon_info = raw_data["moon_info"]
            return {
                "nascer": moon_info.get("moonrise"),
                "por": moon_info.get("moonset"),
                "fase": moon_info.get("phase")
            }
        return {}
    
    def _extract_weather_data(self, raw_data: Dict) -> List[Dict]:
        """Extrai dados limpos do tempo"""
        if "weather_info" in raw_data and "hourly_forecast" in raw_data["weather_info"]:
            forecast = raw_data["weather_info"]["hourly_forecast"]
            return [
                {
                    "hora": item.get("time"),
                    "temp": item.get("temperature"),
                    "condicao": item.get("condition")
                }
                for item in forecast[:12]  # Apenas próximas 12 horas
                if item.get("time")
            ]
        return []
    
    def _extract_wind_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos do vento"""
        if "wind_info" in raw_data:
            wind_info = raw_data["wind_info"]
            return {
                "velocidade": wind_info.get("speed"),
                "direcao": wind_info.get("direction")
            }
        return {}
    
    def _extract_temperature_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos da temperatura"""
        if "temperature_info" in raw_data:
            temp_info = raw_data["temperature_info"]
            return {
                "atual": temp_info.get("current"),
                "max": temp_info.get("max"),
                "min": temp_info.get("min")
            }
        return {}
    
    def _extract_water_temp_data(self, raw_data: Dict) -> Dict:
        """Extrai dados limpos da temperatura da água"""
        if "water_temp" in raw_data:
            return {
                "temperatura": raw_data["water_temp"].get("temperature")
            }
        return {}

    def save_data_to_file(self, data: Dict, filename: str = None) -> str:
        """
        Salva os dados coletados em um arquivo JSON
        
        Args:
            data (Dict): Dados para salvar
            filename (str): Nome do arquivo (opcional)
            
        Returns:
            str: Caminho do arquivo salvo
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tabua_mares_data_{timestamp}.json"
        
        filepath = f"data/{filename}"
        
        # Cria diretório se não existir
        os.makedirs("data", exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Dados salvos em: {filepath}")
        return filepath


def main():
    """Função principal - gera o JSON final otimizado com dados do dia"""
    scraper = TabuaDeMaresScrawler(headless=True)
    
    try:
        # Coleta dados unificados do dia atual
        logger.info("=== INICIANDO COLETA DE DADOS DO DIA ===")
        
        # Cria pasta data se não existir
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        # Define nome do arquivo baseado na data atual
        current_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"dados_mares_{current_date}.json"
        filepath = os.path.join(data_dir, filename)
        
        # Verifica se arquivo do dia já existe
        if os.path.exists(filepath):
            logger.info(f"Arquivo do dia {current_date} já existe: {filename}")
            # Carrega dados existentes
            with open(filepath, 'r', encoding='utf-8') as f:
                unified_data = json.load(f)
        else:
            # Coleta novos dados
            unified_data = scraper.scrape_unified_data()
            
            # Salva o arquivo final na pasta data
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(unified_data, f, ensure_ascii=False, indent=2)
            logger.info(f"Novo arquivo criado: {filename}")
        
        # Cria/atualiza link simbólico para arquivo mais recente na pasta data
        latest_link = os.path.join(data_dir, "dados_hoje.json")
        if os.path.exists(latest_link):
            os.remove(latest_link)
        os.symlink(filename, latest_link)
        
        # Calcula tamanho do arquivo
        file_size = os.path.getsize(filepath)
        
        # Exibe resumo
        print(f"\n=== COLETA FINALIZADA ===")
        print(f"Data: {unified_data['date']} ({unified_data['day_of_week']})")
        print(f"Local: {unified_data['location']}")
        print(f"Arquivo: data/{filename}")
        print(f"Tamanho: {file_size} bytes")
        print(f"Marés coletadas: {len(unified_data.get('mares', []))}")
        print(f"Link: data/dados_hoje.json -> {filename}")
        
        # Limpa arquivos antigos (manter apenas 7 dias)
        cleanup_old_files()
        
        return unified_data
    
    except Exception as e:
        logger.error(f"Erro na execução principal: {e}")
        return {"error": str(e)}


def cleanup_old_files():
    """Remove arquivos de dados antigos (manter apenas 7 dias)"""
    try:
        import glob
        from datetime import datetime, timedelta
        
        # Data limite (7 dias atrás)
        cutoff_date = datetime.now() - timedelta(days=7)
        
        # Busca arquivos de dados antigos na pasta data
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        pattern = os.path.join(data_dir, "dados_mares_*.json")
        for filepath in glob.glob(pattern):
            filename = os.path.basename(filepath)
            # Extrai data do nome do arquivo
            try:
                date_str = filename.replace("dados_mares_", "").replace(".json", "")
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                
                if file_date < cutoff_date:
                    os.remove(filepath)
                    logger.info(f"Arquivo antigo removido: data/{filename}")
            except (ValueError, OSError) as e:
                logger.warning(f"Erro ao processar arquivo {filename}: {e}")
                
    except Exception as e:
        logger.warning(f"Erro na limpeza de arquivos antigos: {e}")


if __name__ == "__main__":
    # Executa o scraper
    result = main()
    print(json.dumps(result, ensure_ascii=False, indent=2))
