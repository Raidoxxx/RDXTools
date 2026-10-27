# PROMPT — Desenvolvimento do RDXCompressor

Você é um engenheiro de software sênior especializado em React, TypeScript, performance, SEO e interfaces SaaS modernas.

Sua missão é desenvolver do zero o **RDXCompressor**, um site gratuito de conversão e otimização de imagens, extremamente rápido, fácil de usar, responsivo e preparado para monetização com Google AdSense.

Não quero apenas uma landing page demonstrativa. Quero um produto completo, funcional e pronto para publicação.

## 1. Stack tecnológica

- React + Vite + TypeScript
- Tailwind CSS
- Lucide React para ícones
- React Router para navegação
- Canvas API, createImageBitmap e Blob para manipulação das imagens
- JSZip para downloads em lote
- Vitest para testes
- ESLint e configuração TypeScript rigorosa

Não utilizar backend, banco de dados, login ou APIs pagas no MVP.

Todas as conversões devem acontecer localmente no navegador do usuário.

## 2. Identidade visual

Criar uma identidade profissional, minimalista e moderna, inspirada na simplicidade de ferramentas como TinyPNG, Squoosh e iLovePDF, sem copiar suas interfaces.

**Paleta:**
- Primária: #2563EB
- Hover: #1D4ED8
- Background: #F8FAFC
- Cards: #FFFFFF
- Texto: #0F172A
- Texto secundário: #64748B
- Bordas: #E2E8F0

**Tipografia:**
- Títulos: Sora
- Interface: Inter

A interface deve passar confiança e parecer um serviço profissional estabelecido.

Evitar gradientes exagerados, ícones gigantes, sombras fortes, elementos decorativos sem finalidade e aparência genérica de templates gerados por IA.

Priorizar hierarquia visual, espaços bem definidos e interações suaves.

## 3. Ferramentas obrigatórias

### Conversor de imagens

Suportar inicialmente:
- PNG para JPG
- JPG para PNG
- PNG para WebP
- WebP para PNG
- JPG para WebP
- WebP para JPG

Disponibilizar AVIF somente quando o navegador oferecer suporte real de codificação e exportação.

Funcionalidades:
- Upload por clique
- Arrastar e soltar arquivos
- Colar imagem da área de transferência
- Seleção de vários arquivos
- Detecção automática do formato original
- Escolha do formato de saída
- Pré-visualização
- Qualidade ajustável quando suportada
- Conversão individual ou em lote
- Download individual ou ZIP
- Nome do arquivo preservado com extensão correta

Tratar corretamente imagens transparentes. Quando o formato de destino não suportar transparência, oferecer uma cor de fundo, sendo branco o padrão.

### Compressor de imagens

- Compressão de JPG e WebP com ajuste de qualidade
- Otimização de PNG apenas com técnicas realmente suportadas
- Exibir tamanho original e final
- Exibir percentual de redução
- Permitir escolher qualidade
- Não afirmar que houve redução quando o resultado ficou maior
- Permitir download do melhor resultado
- Sem limites artificiais de conversões

### Redimensionador de imagens

- Alterar largura e altura
- Manter proporção automaticamente
- Redimensionar por percentual
- Configurar dimensões exatas
- Oferecer presets comuns, incluindo 3x4 e imagens quadradas
- Escolher formato final
- Baixar o resultado

## 4. Interface principal

A homepage precisa ter:

**Header**
- Logo RDXCompressor
- Converter
- Comprimir
- Redimensionar
- Tema claro/escuro

**Hero**
Título: "Converta suas imagens em segundos."

Subtítulo: "Converta, comprima e redimensione imagens gratuitamente. Sem cadastro, sem instalação e sem complicação."

Área central de upload com borda tracejada, ícone de upload, arrastar e soltar e botão "Selecionar imagens".

Depois do upload:
- Mostrar miniaturas
- Nome do arquivo
- Tamanho
- Formato original
- Formato desejado
- Controles disponíveis
- Botão principal "Converter imagens"

Depois da conversão:
- Mostrar resultado
- Economia de espaço, quando aplicável
- Botão "Baixar"
- Botão "Baixar tudo"
- Botão "Converter outras imagens"

Todo o fluxo deve acontecer sem redirecionamentos desnecessários.

## 5. Performance e privacidade

Este ponto é extremamente importante.

- Nunca enviar os arquivos para servidores
- Priorizar processamento eficiente
- Utilizar Web Workers quando realmente fizer sentido
- Evitar congelamento da interface
- Processar arquivos grandes com limites de memória apropriados
- Tratar erros de arquivos corrompidos
- Evitar vazamentos de memória
- Liberar URLs temporárias com URL.revokeObjectURL
- Usar lazy loading onde necessário
- Mostrar progresso real de tarefas
- Permitir cancelar processamentos quando possível
- Não inventar suporte a formatos que o navegador não consegue produzir

Exibir uma mensagem de confiança:

"Suas imagens ficam no seu dispositivo. Nenhum arquivo é enviado aos nossos servidores."

Essa afirmação precisa ser verdadeira.

## 6. SEO e páginas individuais

Criar rotas específicas para buscas no Google:

- /
- /converter-png-para-jpg
- /converter-jpg-para-png
- /converter-png-para-webp
- /converter-webp-para-png
- /converter-jpg-para-webp
- /converter-webp-para-jpg
- /comprimir-imagem
- /redimensionar-imagem

Cada página precisa abrir a ferramenta correspondente com as configurações apropriadas já selecionadas.

Implementar:
- Titles e meta descriptions individuais
- URLs canônicas
- Open Graph
- Sitemap XML
- robots.txt
- Dados estruturados quando adequados
- HTML inicial indexável por motores de busca
- Conteúdo útil e original explicando cada ferramenta
- FAQ contextual
- Links internos relevantes

Evitar páginas repetitivas criadas apenas para capturar buscas.

Se a renderização exclusivamente client-side prejudicar a indexação, adotar pré-renderização estática das páginas públicas.

## 7. Monetização com Google AdSense

Preparar o site para anúncios sem comprometer a experiência.

Reservar espaços para publicidade:
- Um abaixo da ferramenta principal
- Um entre seções de conteúdo informativo
- Um na lateral apenas em telas grandes, quando houver espaço apropriado

Regras:
- Nunca bloquear o botão de download
- Nunca criar botões falsos de download
- Não forçar cliques
- Não usar pop-ups agressivos
- Não posicionar publicidade confundindo-a com controles
- Evitar deslocamento de layout ao carregar anúncios
- Não carregar scripts de redes de anúncios enquanto não houver configuração e aprovação necessárias

Criar um componente reutilizável AdSlot, preparado para a futura integração com o AdSense.

Incluir páginas:
- Política de Privacidade
- Termos de Uso
- Contato
- Sobre

Preparar gerenciamento de consentimento quando necessário conforme as regras de privacidade aplicáveis.

Não afirmar que a aprovação no AdSense é garantida.

## 8. Experiência mobile

O site deve funcionar perfeitamente em celulares.

- Upload confortável com toque
- Botões grandes
- Nenhum scroll horizontal
- Configurações organizadas
- Download funcionando em dispositivos móveis compatíveis
- Interface adaptativa
- Feedback visual para todas as ações
- Acessibilidade por teclado e leitores de tela

## 9. Qualidade do código

Organize o projeto separando:
- Components
- Pages
- Hooks
- Services
- Utils
- Types
- Tests

A lógica de conversão não deve ficar misturada com componentes visuais.

Criar testes para conversão, nomenclatura dos arquivos, tratamento de transparência, validação de formatos e redimensionamento.

Executar build, lint e testes. Corrigir os problemas encontrados.

## 10. Critérios de conclusão

Só considerar o projeto concluído quando:

1. Todas as seis conversões principais funcionarem.
2. A compressão mostrar resultados verdadeiros.
3. O redimensionamento respeitar as dimensões escolhidas.
4. O processamento em lote funcionar.
5. O download individual e ZIP funcionarem.
6. Nenhum arquivo for enviado ao servidor.
7. A interface funcionar em desktop e mobile.
8. As rotas de SEO funcionarem diretamente.
9. As páginas institucionais estiverem prontas.
10. A estrutura de anúncios estiver preparada.
11. Os testes e o build passarem.

**Importante:** implemente de verdade, não crie funcionalidades simuladas. Não fique apenas descrevendo o plano ou produzindo protótipos. Crie os arquivos, instale dependências, implemente as ferramentas e valide o projeto.

Priorize primeiro o núcleo de conversão, depois a interface, SEO e monetização. Não adicione recursos desnecessários fora do escopo.

O objetivo final é um site de utilidades que qualquer pessoa consiga utilizar em menos de 10 segundos, sem precisar aprender como ele funciona.