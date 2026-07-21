import os
from PIL import Image

def converter_pasta_para_webp(diretorio):
    for nome_arquivo in os.listdir(diretorio):
        if nome_arquivo.lower().endswith('.png'):
            caminho_png = os.path.join(diretorio, nome_arquivo)
            
            try:
                imagem = Image.open(caminho_png)
                caminho_webp = os.path.splitext(caminho_png)[0] + '.webp'
                
                # Salva a imagem convertida
                imagem.save(caminho_webp, 'webp', quality=80)
                print(f"Convertido: {nome_arquivo} -> {caminho_webp}")
                
            except Exception as e:
                print(f"Erro ao converter {nome_arquivo}: {e}")

# Exemplo de uso (substitua pelo caminho da sua pasta):
converter_pasta_para_webp('static/img/LGPD-2026')