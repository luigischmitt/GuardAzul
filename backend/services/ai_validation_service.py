# services/ai_validation_service.py
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

from google.cloud import vision
import json
import logging
from typing import Dict, List, Tuple

class SmartDenunciaValidator:
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()
        
        # Mapeamento categoria -> objetos esperados na imagem
        self.category_expected_objects = {
            'poluicao_aguas': [
                'water', 'ocean', 'sea', 'river', 'pollution', 'oil', 'waste',
                'sewage', 'chemical', 'barrel', 'pipe', 'industrial', 'spill'
            ],
            'desmatamento': [
                'tree', 'forest', 'mangrove', 'vegetation', 'deforestation',
                'cut', 'chainsaw', 'logging', 'cleared land', 'stump', 'wood'
            ],
            'erosao_costeira': [
                'beach', 'coast', 'erosion', 'cliff', 'sand', 'shore',
                'wave', 'damage', 'collapse', 'coastal', 'dune'
            ],
            'poluicao_solo': [
                'trash', 'garbage', 'waste', 'plastic', 'bottle', 'bag',
                'dump', 'landfill', 'litter', 'debris', 'contamination'
            ],
            'fauna_marinha': [
                'turtle', 'fish', 'marine', 'animal', 'dead', 'net', 'plastic',
                'sea turtle', 'dolphin', 'whale', 'fishing', 'bird', 'crab'
            ],
            'flora_marinha': [
                'coral', 'algae', 'seaweed', 'marine plant', 'underwater vegetation',
                'reef', 'aquatic plant', 'kelp', 'sea grass', 'plankton'
            ],
            'poluicao_sonora': [
                'noise', 'sound', 'loud', 'boat', 'ship', 'motor', 'engine',
                'construction', 'machinery', 'industrial noise'
            ],
            'construcoes_irregulares': [
                'construction', 'building', 'house', 'structure', 'concrete',
                'unauthorized', 'illegal building', 'pier', 'dock', 'foundation'
            ],
            'exploracao_recursos': [
                'mining', 'extraction', 'sand', 'mineral', 'excavation', 'quarry',
                'dredging', 'drilling', 'heavy machinery', 'truck', 'equipment'
            ],
            'turismo_predatorio': [
                'tourist', 'crowd', 'vehicle on beach', 'camping', 'fires', 'tent',
                'atv', 'motorcycle', 'car on sand', 'trampling', 'disturbance'
            ],
            'outros': [
                'environmental damage', 'pollution', 'waste', 'problem', 'issue',
                'concern', 'violation', 'illegal activity', 'harm'
            ]
        }
    
    async def validate_denuncia_complete(self, 
                                       image_path: str, 
                                       category: str, 
                                       description: str, 
                                       location: Dict) -> Dict:
        """
        Validação completa cruzando TODOS os dados
        """
        try:
            # 1. Análise da imagem com Google Vision
            vision_results = await self.analyze_image_with_vision(image_path)
            
            # 2. Validação cruzada: categoria vs imagem
            category_match_score = self.validate_category_vs_image(category, vision_results)
            
            # 3. Validação: descrição vs imagem  
            description_match_score = self.validate_description_vs_image(description, vision_results)
            
            # 4. Validação geográfica
            location_score = self.validate_location_context(location, category)
            
            # 5. Detecção de spam/fake
            spam_score = self.detect_spam_patterns(description, vision_results)
            
            # 6. Cálculo final
            final_result = self.calculate_final_validation(
                category_match_score,
                description_match_score, 
                location_score,
                spam_score,
                vision_results
            )
            
            return final_result
            
        except Exception as e:
            logging.error(f"AI Validation error: {e}")
            return self.fallback_validation()
    
    async def analyze_image_with_vision(self, image_path: str) -> Dict:
        """Análise completa da imagem com Google Vision"""
        
        with open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        
        # Múltiplas análises em paralelo
        requests = [
            # Detectar objetos/labels
            {"image": image, "features": [{"type_": vision.Feature.Type.LABEL_DETECTION, "max_results": 20}]},
            # Detectar texto (útil para placas, documentos)
            {"image": image, "features": [{"type_": vision.Feature.Type.TEXT_DETECTION}]},
            # Safe search (detectar conteúdo inadequado)
            {"image": image, "features": [{"type_": vision.Feature.Type.SAFE_SEARCH_DETECTION}]},
            # Detectar landmarks (praias, locais conhecidos)
            {"image": image, "features": [{"type_": vision.Feature.Type.LANDMARK_DETECTION}]}
        ]
        
        responses = self.client.batch_annotate_images(requests=requests)
        
        return {
            "labels": [label.description.lower() for label in responses.responses[0].label_annotations],
            "text": responses.responses[1].full_text_annotation.text if responses.responses[1].full_text_annotation else "",
            "safe_search": responses.responses[2].safe_search_annotation,
            "landmarks": [landmark.description.lower() for landmark in responses.responses[3].landmark_annotations]
        }
    
    def validate_category_vs_image(self, category: str, vision_results: Dict) -> int:
        """Verifica se a categoria bate com o que foi detectado na imagem"""
        
        expected_objects = self.category_expected_objects.get(category, [])
        detected_labels = vision_results["labels"]
        
        matches = 0
        for expected in expected_objects:
            if any(expected in label for label in detected_labels):
                matches += 1
        
        # Score baseado na % de match
        if not expected_objects:
            return 20  # Categoria não mapeada, score neutro
        
        match_percentage = (matches / len(expected_objects)) * 100
        return min(40, int(match_percentage * 0.4))  # Max 40 pontos
    
    def validate_description_vs_image(self, description: str, vision_results: Dict) -> int:
        """Verifica se a descrição bate com o que vê na imagem"""
        
        desc_words = description.lower().split()
        detected_labels = vision_results["labels"]
        detected_text = vision_results["text"].lower()
        
        # Palavras da descrição que aparecem na imagem
        matches = 0
        relevant_words = [word for word in desc_words if len(word) > 3]  # Só palavras relevantes
        
        for word in relevant_words:
            if (any(word in label for label in detected_labels) or 
                word in detected_text):
                matches += 1
        
        if not relevant_words:
            return 10
        
        match_percentage = (matches / len(relevant_words)) * 100
        return min(30, int(match_percentage * 0.3))  # Max 30 pontos
    
    def validate_location_context(self, location: Dict, category: str) -> int:
        """Valida se a localização faz sentido para a categoria"""
        
        latitude = location.get('latitude', 0)
        longitude = location.get('longitude', 0)
        address = location.get('address', '').lower()
        
        score = 0
        
        # Verifica se é área costeira (relevante para denúncias marinhas)
        if self.is_coastal_area(latitude, longitude):
            score += 15
        
        # Verifica contexto no endereço
        coastal_words = ['praia', 'beach', 'costa', 'mar', 'oceano', 'litoral']
        if any(word in address for word in coastal_words):
            score += 10
        
        # Categoria específica vs localização
        if category in ['poluicao_aguas', 'fauna_marinha', 'erosao_costeira']:
            if self.is_coastal_area(latitude, longitude):
                score += 10
        
        return min(25, score)  # Max 25 pontos
    
    def detect_spam_patterns(self, description: str, vision_results: Dict) -> int:
        """Detecta padrões de spam ou denúncias falsas"""
        
        spam_indicators = [
            'teste', 'test', 'fake', 'brincadeira', 'joke', 'meme',
            'asdf', 'qwerty', '123', 'abc'
        ]
        
        # Verificar descrição muito curta ou suspeita
        if len(description.strip()) < 10:
            return -20
        
        desc_lower = description.lower()
        spam_count = sum(1 for indicator in spam_indicators if indicator in desc_lower)
        
        if spam_count > 0:
            return -30
        
        # Verificar se é selfie ou foto não relacionada
        labels = vision_results["labels"]
        non_environmental = ['person', 'selfie', 'food', 'party', 'celebration', 'indoor']
        
        if any(label in labels for label in non_environmental):
            if not any(env_word in labels for env_word in ['water', 'nature', 'outdoor', 'pollution']):
                return -25
        
        return 0  # Sem penalidades
    
    def calculate_final_validation(self, category_score: int, description_score: int, 
                                 location_score: int, spam_score: int, vision_results: Dict) -> Dict:
        """Calcula validação final e retorna resultado completo - VERSÃO RIGOROSA"""
        
        total_score = category_score + description_score + location_score + spam_score
        
        # 🚨 DETECÇÃO RIGOROSA DE IMAGENS IRRELEVANTES
        detected_labels = vision_results["labels"]
        
        # 🚫 REJEITAR IMAGENS CLARAMENTE IRRELEVANTES
        irrelevant_indicators = [
            'person', 'people', 'human face', 'selfie', 'portrait',
            'food', 'meal', 'restaurant', 'kitchen', 'cooking',
            'party', 'celebration', 'festival', 'concert', 'music',
            'indoor', 'bedroom', 'living room', 'office', 'classroom',
            'car interior', 'vehicle interior', 'airplane', 'train',
            'meme', 'text overlay', 'screenshot', 'computer screen',
            'animal (pet)', 'cat', 'dog', 'domestic animal'
        ]
        
        irrelevant_detected = [label for label in detected_labels 
                              if any(irrelevant in label.lower() for irrelevant in irrelevant_indicators)]
        
        if irrelevant_detected:
            print(f"🚫 IMAGEM IRRELEVANTE detectada: {irrelevant_detected}")
            total_score -= 40  # Penalidade SEVERA
        
        # 🌍 BONUS RIGOROSO por detecção de problemas ambientais
        environmental_labels = ['pollution', 'waste', 'garbage', 'oil', 'dead', 'damage', 'litter', 'plastic', 'trash']
        environmental_detected = [label for label in detected_labels if any(env_word in label for env_word in environmental_labels)]
        
        environmental_bonus = 0
        if environmental_detected:
            environmental_bonus = len(environmental_detected) * 12  # 12 pontos por label ambiental
            total_score += min(35, environmental_bonus)  # Máximo 35 pontos de bonus
            print(f"🌍 Labels ambientais detectadas: {environmental_detected} (+{min(35, environmental_bonus)} pontos)")
        
        # 🌊 BONUS EXTRA para poluição aquática específica  
        water_pollution_labels = ['water', 'ocean', 'sea', 'marine', 'aquatic', 'beach', 'coast']
        water_detected = any(water_word in label for label in detected_labels for water_word in water_pollution_labels)
        
        if water_detected and environmental_detected:
            total_score += 25  # Bonus extra para poluição marinha
            print(f"🌊 Poluição aquática detectada! (+25 pontos)")
        
        # 🔍 VERIFICAÇÃO RIGOROSA DE CONTEXTO AMBIENTAL
        outdoor_context = any(word in label.lower() for label in detected_labels 
                             for word in ['outdoor', 'nature', 'landscape', 'sky', 'ground'])
        
        if not outdoor_context and not environmental_detected:
            print(f"⚠️ SEM CONTEXTO AMBIENTAL detectado")
            total_score -= 25  # Penalidade por falta de contexto ambiental
        
        # Safe search - penalizar conteúdo inadequado
        safe_search = vision_results.get("safe_search")
        if safe_search and (safe_search.adult.name != 'VERY_UNLIKELY' or 
                           safe_search.violence.name != 'VERY_UNLIKELY'):
            total_score -= 30
        
        # 📊 SCORING MAIS RIGOROSO
        # Normalizar score (0-100) - Base menor e threshold maior
        final_score = max(0, min(100, total_score + 45))  # Base 45 (era 60)
        
        # 🎯 THRESHOLD MAIS RIGOROSO: 65 ao invés de 50
        is_valid = final_score >= 65  # Era 50, agora 65
        
        # ⚡ REGRAS EXTRAS DE REJEIÇÃO
        if irrelevant_detected and len(environmental_detected) == 0:
            is_valid = False  # Rejeitar automaticamente se irrelevante e sem ambiente
            final_score = min(final_score, 30)  # Cap no score
        
        if final_score < 40:  # Score muito baixo = automático rejeitado
            is_valid = False
        
        validation_details = {
            "category_match": category_score,
            "description_match": description_score,
            "location_relevance": location_score,
            "spam_detection": spam_score,
            "environmental_bonus": environmental_bonus,
            "detected_labels": detected_labels[:10],
            "environmental_labels": environmental_detected,
            "irrelevant_labels": irrelevant_detected,
            "has_outdoor_context": outdoor_context,
            "validation_method": "google_vision_ai_rigorous_v3"
        }
        
        print(f"📊 Score final: {final_score}/100 ({'✅ VÁLIDA' if is_valid else '❌ INVÁLIDA'})")
        
        return {
            "is_valid": is_valid,
            "confidence_score": final_score,
            "details": validation_details
        }
    
    def is_coastal_area(self, lat: float, lng: float) -> bool:
        """Verifica se coordenadas são de área costeira"""
        # Para Paraíba (pode expandir para outras regiões) - Área costeira da PB: aproximadamente
        pb_coastal_bounds = {
            "lat_min": -7.5, "lat_max": -6.5,
            "lng_min": -35.2, "lng_max": -34.8
        }
        
        return (pb_coastal_bounds["lat_min"] <= lat <= pb_coastal_bounds["lat_max"] and
                pb_coastal_bounds["lng_min"] <= lng <= pb_coastal_bounds["lng_max"])
    
    def fallback_validation(self) -> Dict:
        """Validação fallback se API falhar"""
        return {
            "is_valid": True,  # Em caso de erro, aprova (para não bloquear)
            "confidence_score": 50,
            "details": {"validation_method": "fallback_manual_review_needed"}
        }
    