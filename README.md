# RDXCompressor

Ferramentas gratuitas de conversão, compressão e redimensionamento de imagens. React, Vite, TypeScript rigoroso, Tailwind CSS, Lucide, React Router e JSZip. Processamento inteiramente no navegador, sem backend ou serviços pagos.

## Executar

Requer Node.js 22.12 ou superior (ou uma versão LTS compatível com o Vite instalado).

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://127.0.0.1:5173`.

## Validar e gerar produção

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

O build verifica TypeScript, gera assets e pré-renderiza as 13 páginas públicas e a página 404. `dist/` inclui HTML completo por rota, sitemap e robots.txt. O servidor de preview abre em `http://127.0.0.1:4173`.

Testes de navegador verificam as seis conversões com MIME real, transparência, dimensões, compressão, ZIP com nomes duplicados, downloads, arquivos inválidos, tema, layout mobile e HTML indexável. As capturas de validação ficam em `test-results/`.

## Antes de publicar

Copie `.env.example` para `.env.local` e configure:

```dotenv
VITE_SITE_URL=https://seu-dominio.com.br
VITE_CONTACT_EMAIL=seu-email@seu-dominio.com.br
```

O domínio padrão `https://rdxcompressor.example` é um marcador, não um endereço público. O build alerta quando ele é utilizado. Sem e-mail configurado, a página de contato informa que o canal ainda não está disponível; não há formulário com envio simulado.

Execute `npm run build` novamente e publique o conteúdo de `dist/` em uma hospedagem estática com HTTPS. Configure a resolução de `/rota` para `/rota/index.html` e use `404.html` nas rotas inexistentes. Não redirecione todas as rotas para a homepage: cada rota já tem HTML próprio. No Netlify, os diretórios de páginas e o arquivo `_headers` são utilizados automaticamente. Em outros provedores, aplique os cabeçalhos de `public/_headers` na configuração da hospedagem.

Revise os textos institucionais com os dados do responsável e as práticas do provedor escolhido. O projeto não foi publicado automaticamente.

## Como funciona

- Entradas PNG, JPG e WebP validadas pela assinatura do arquivo, não só pela extensão.
- Exportação PNG e JPG, WebP quando suportado e AVIF apenas se uma exportação de teste retornar o MIME correto. A exportação real também é verificada para evitar um PNG com extensão incorreta.
- Cada imagem é processada sequencialmente em um Web Worker com `createImageBitmap` e `OffscreenCanvas`, quando disponíveis. Há fallback para Canvas no fluxo principal em navegadores sem essas APIs.
- Cancelar termina o Worker atual e interrompe o lote. No fallback, a exportação nativa em andamento pode terminar antes de liberar a memória, mas seu resultado é descartado após o cancelamento.
- Limites técnicos por imagem: 40 MB, 32 megapixels e 16.384 pixels por lado. Não há limite artificial de quantidade de conversões. Lotes extensos e ZIPs grandes continuam limitados pela memória disponível no dispositivo.
- Compressão mantém o formato de cada entrada. JPG/WebP têm qualidade ajustável. PNG é recodificado sem perdas de pixels, sem alegar compressão que o navegador não oferece. Se o arquivo não diminuir, o original é mantido, byte a byte.
- Com proporção ligada, largura/altura são uma caixa de limites máximos. Desligada, são dimensões exatas. Presets 3×4 (354×472), quadrado (1080×1080) e Full HD (1920×1080) usam dimensões exatas. O preset 3×4 não garante conformidade com regras de documentos.
- JPG preenche transparência com a cor escolhida. PNG/WebP preservam o canal alfa quando suportado.
- O navegador pode remover metadados e perfis de cor ao recodificar. Animações viram imagens estáticas. Converter uma imagem não recupera detalhes perdidos anteriormente.
- URLs de prévia são liberadas ao remover arquivos, limpar a lista ou desmontar a ferramenta. Bitmaps e canvases são liberados após cada tarefa.
- ZIP é importado sob demanda e mantém nomes únicos em caso de duplicatas.
- Fontes Inter e Sora são servidas localmente. Nenhum script de anúncio ou analytics está ativo. A preferência de tema é o único valor armazenado localmente pelo aplicativo.

## Estrutura

```text
src/components/  Interface, upload, controles, resultados e AdSlot
src/pages/       Ferramentas e páginas institucionais
src/hooks/       Fila, cancelamento e ciclo de vida de URLs
src/services/    Engine Canvas, Worker, exportação e downloads
src/utils/       Assinaturas, nomes, dimensões e testes de lógica
src/types/       Contratos de processamento
src/data/        Conteúdo das rotas e metadados
scripts/         Pré-renderização de produção
tests/           Testes reais de navegador com Playwright
```

## Publicidade e consentimento

`AdSlot` reserva dimensões sem carregar anúncios: abaixo da ferramenta, entre seções e em espaço lateral nas telas grandes. Não existem botões de download falsos ou anúncios bloqueando controles. Para ativar uma rede no futuro, configure e obtenha as aprovações necessárias, integre uma solução de consentimento adequada e impeça que scripts dependentes de consentimento carreguem antes da escolha do visitante. Atualize a política de privacidade com as práticas reais. A aprovação do AdSense não é garantida.

## Referências técnicas

- [Build e hospedagem estática com Vite](https://vite.dev/guide/static-deploy)
- [Canvas toBlob: formatos, qualidade e fallback de codificação](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

## Mapa técnico auxiliar

O diretório local `graphify-out/`, ignorado pelo Git, contém `graph.html`, `graph.json` e `GRAPH_REPORT.md`, com a extração estrutural de `src/`. O mapa identifica os módulos da interface, fila, processamento e SEO. Há limitações do extrator: três arquivos sem símbolos modelados, uma referência sem endpoint e três relações de mesmos endpoints colapsadas. Esses detalhes estão no relatório; o mapa não substitui o código e os testes.
