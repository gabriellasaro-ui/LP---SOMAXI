# Somaxi Franchising: LP revisada

Rota: `/franquia-previsibilidade`. Execute `python app.py` e abra `http://localhost:5006/franquia-previsibilidade`.

## Revisão solicitada

A página foi reduzida de quinze blocos para sete seções: hero, modelo de negócio, estrutura da matriz, depoimentos, jornada, perguntas frequentes e chamada final. Foram removidos os rótulos de seção com traços, as tabelas financeiras sem dados, os cartões repetitivos, o bloco de fotos pendentes, as informações de território ainda indefinidas e o formulário duplicado.

A headline agora é: **Franquia de LGPD com receita recorrente.** A expressão sugerida de alta lucratividade não foi transformada em promessa porque margem e lucro continuam sem validação comercial.

Há um único formulário, em uma etapa, com nome, e-mail, telefone, perfil profissional e consentimento. Cidade, capital e prazo de início foram retirados para simplificar o contato inicial. O destino comercial precisará refletir essa alteração de campos. O CTA final retorna ao mesmo formulário.

O desenho usa uma foto real da operação em toda a hero, uma foto da equipe na seção de modelo, uma faixa com foto do escritório e parallax no desktop e os quatro vídeos fornecidos. As fotos da equipe representam a estrutura da matriz, sem apresentá-las como registros de franqueados. Os vídeos só carregam após o clique. O parallax fica desativado no celular e quando o visitante solicita movimento reduzido.

As fotos do evento Galáxia continuam fora da página, porque identificação e autorização de imagem seguem pendentes. Não há espaços vazios reservados para elas.

## Arquivos

- HTML: `templates/franquia-previsibilidade.html`.
- CSS compartilhado: `static/assets/css/franquia.css`.
- JavaScript compartilhado: `static/assets/js/franquia.js`.
- Fotos e miniaturas: `static/assets/images/franchising/`.
- Vídeos otimizados: `static/videos/franchising/`.

Não há dependências novas de produção, framework ou etapa de build. A rota é atendida pelo Flask existente.

## Verificação local

Foram executadas 44 verificações em Chrome: sete seções, um H1, um formulário com quatro campos, ausência de blocos pendentes, imagens, vídeos sob demanda, FAQ e modal por teclado, retorno do foco, menu mobile, telefone, atribuição, erro de envio, reenvio, deduplicação e sucesso confirmado. Não houve rolagem horizontal em 360, 375, 650, 768, 1024, 1440 e 1920 px.

As capturas de revisão e o relatório estão em `.local/`, pasta ignorada pelo Git. Todos os envios foram interceptados localmente em um domínio fictício. Nenhum lead de teste foi enviado ao comercial.

O script mantém os onze campos ocultos de atribuição, os metadados de origem, event_id e lead_id, e os eventos de tracking aplicáveis ao formulário de uma etapa. Não envia nome, e-mail ou telefone aos eventos de analytics. Campos retirados do formulário não são preenchidos artificialmente no payload.

## Pendências para publicação

A URL do webhook da Franchising ainda está vazia em `WEBHOOK_URLS`. Até sua configuração, o formulário informa indisponibilidade e não confirma recebimento. Depois de configurar, é necessário validar CORS, mapeamento no Pipedrive, deduplicação no destino e um envio completo com o comercial.

O `data-site` do Privamaxi ainda precisa ser confirmado em `COOKIE_SITE_ID`, junto da atualização do consentimento no GTM. O container é `GTM-MWBQBCPC`, com consentimento inicial negado.

Continuam pendentes: logo oficial prata da Franchising, identificação completa e autorizações dos depoimentos, dados cadastrais da franqueadora, política oficial de privacidade e termos aprovados. Os vídeos precisam de revisão editorial e corte final com CTA, conforme o briefing original. A identidade deve passar por novo ajuste após a aprovação do novo manual da marca.

Investimento, taxa de franquia, custos, royalties, margens, lucro, payback e regras de território precisam de validação comercial. Esses números e seus espaços reservados foram retirados do conteúdo da LP. Nenhuma promessa de resultado financeiro foi acrescentada.

Publicação desta versão aprovada e autorizada pelo usuário em 29/10/2026, pelo fluxo existente de Git e EasyPanel. A conexão do formulário ao atendimento continua pendente de configuração. DNS e campanhas ficam fora desta publicação.

## Ajustes finos posteriores

A prova da hero foi atualizada para +50 franqueados ativos em todo o Brasil, conforme o dado fornecido pelo usuário. O benefício de recorrência agora usa a frase solicitada sobre previsibilidade e baixo índice de churn, sem acrescentar uma taxa numérica. A foto de close foi substituída pela foto de grupo do acervo Somaxi, com enquadramento integral. O fluxo de prospecção foi retirado. Na jornada, título e subtítulo passaram a compor um cabeçalho centralizado no desktop e alinhado à esquerda no celular. O rodapé usa a mesma marca visual do header.
