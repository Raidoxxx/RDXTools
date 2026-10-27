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

O build verifica TypeScript, gera assets e pré-renderiza as 13 páginas públicas e a página 404. `build/` inclui HTML completo por rota, sitemap e robots.txt. O servidor de preview abre em `http://127.0.0.1:4173`.

Testes de navegador verificam as seis conversões com MIME real, transparência, dimensões, compressão, ZIP com nomes duplicados, downloads, arquivos inválidos, tema, layout mobile e HTML indexável. As capturas de validação ficam em `test-results/`.

## Antes de publicar

Copie `.env.example` para `.env.local` e configure:

```dotenv
VITE_SITE_URL=https://seu-dominio.com.br
VITE_CONTACT_EMAIL=seu-email@seu-dominio.com.br
```

O domínio padrão `https://rdxcompressor.example` é um marcador, não um endereço público. O build alerta quando ele é utilizado. Sem e-mail configurado, a página de contato informa que o canal ainda não está disponível; não há formulário com envio simulado.

Execute `npm run build` novamente e publique o conteúdo de `build/` em uma hospedagem estática com HTTPS. Configure a resolução de `/rota` para `/rota/index.html` e use `404.html` nas rotas inexistentes. Não redirecione todas as rotas para a homepage: cada rota já tem HTML próprio. No Netlify, os diretórios de páginas e o arquivo `_headers` são utilizados automaticamente. Em outros provedores, aplique os cabeçalhos de `public/_headers` na configuração da hospedagem.

Revise os textos institucionais com os dados do responsável e as práticas do provedor escolhido. O projeto não foi publicado automaticamente.

## Hospedagem na Discloud

O arquivo `discloud.config` está na raiz. Ele usa o runtime `latest` da Discloud (o projeto requer Node.js 22.12 ou superior), `TYPE=site`, 512 MB de RAM, build com `npm run build` e início com `npm start`. O servidor `server.mjs` escuta em `0.0.0.0:8080` por padrão, entrega o HTML individual de cada rota, preserva os cabeçalhos de segurança e retorna a página 404 para endereços inexistentes. Ele só entrega arquivos estáticos; as imagens continuam sendo processadas no navegador. Para testes locais em outra porta, defina `PORT`; na Discloud, mantenha 8080.

1. Reserve um subdomínio na sua conta Discloud e ajuste `ID=rdxcompressor` para o nome reservado, sem `.discloud.app`.
2. Configure `VITE_SITE_URL` com o endereço público e `VITE_CONTACT_EMAIL` com seu contato nas variáveis do ambiente de build da Discloud. Por exemplo, use `https://rdxcompressor.discloud.app` apenas se esse for o subdomínio reservado. Essas variáveis são incorporadas durante o build; ao alterá-las, gere outro build.
3. Envie o projeto pela integração com GitHub ou pelo método de upload da Discloud. Inclua os arquivos fonte, `package.json`, `package-lock.json`, `discloud.config`, `server.mjs` e configurações da ferramenta. Não use instalação com `--omit=dev`: o build precisa das dependências de desenvolvimento.
4. A Discloud executará o build e depois iniciará o servidor. Tanto `npm run build` quanto `npm run build:discloud` geram o resultado em `build/`. Isso também atende integrações que executam automaticamente `npm run build --if-present`. A pasta `dist/` fica disponível para o uso interno da plataforma.

Para conferir localmente:

```sh
npm run build:discloud
npm start
```

Abra `http://localhost:8080`. O arquivo `.discloudignore` exclui dependências locais, credenciais e arquivos temporários dos uploads que respeitam esse formato. A pasta de produção `build/` é permitida em uploads locais. Se criar um ZIP manualmente, aplique as mesmas exclusões e mantenha `discloud.config` diretamente na raiz do ZIP. Segundo a [documentação da Discloud](https://docs.discloud.com/how-to-host/websites-and-apis), sites precisam de um plano Platinum ou superior. O subdomínio deste arquivo é uma configuração inicial; ele não é reservado automaticamente. Nenhum deploy é executado apenas por criar estes arquivos.

### Erro `ENOENT: realpath '/home/node/build'` na inicialização

O build pode terminar na etapa de construção, mas a pasta gerada não estar disponível no sistema de arquivos usado ao iniciar a aplicação. O servidor agora verifica o HTML pré-renderizado, a página 404, os cabeçalhos, sitemap, robots.txt e os assets referenciados antes de iniciar. Se algum deles estiver ausente, executa `npm run build` no diretório do projeto e verifica o resultado novamente. Essa verificação funciona tanto com `npm start` quanto com a execução direta de `server.mjs`.

Se o build já está completo, a aplicação inicia sem compilar novamente. Se precisar gerá-lo durante a inicialização, haverá uma espera adicional; mantenha as dependências de desenvolvimento instaladas e as variáveis `VITE_SITE_URL`/`VITE_CONTACT_EMAIL` disponíveis também nessa etapa. Falhas de compilação são exibidas no console com uma mensagem específica. Não é criada uma pasta vazia para esconder o erro.

### Erro do npm `Cannot read properties of null (reading 'edgesOut')`

Essa mensagem corresponde a falhas conhecidas do resolvedor de peers do npm 10. O `.npmrc` deste projeto usa `legacy-peer-deps=true` para evitar a resolução automática de peers opcionais. React e Vite, necessários ao projeto, continuam explicitamente declarados. `include=dev` mantém as ferramentas necessárias ao build. O Vitest está fixado na versão validada, e o lockfile deve acompanhar o código.

Se o instalador da integração GitHub copiar apenas `package.json` antes de executar `npm install`, ele poderá não ler o `.npmrc`. Nesse caso, adicione `NPM_CONFIG_LEGACY_PEER_DEPS=true` e `NPM_CONFIG_INCLUDE=dev` nas variáveis de ambiente do **build** no painel da Discloud, antes da instalação, e reconstrua o aplicativo. Adicionar a flag só ao comando `BUILD` não resolve uma falha que acontece no `npm install` anterior.

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
- Fontes Inter e Sora são servidas localmente. O Google AdSense está integrado para anúncios automáticos. A preferência de tema é o único valor armazenado localmente pelo código próprio do aplicativo; a rede de publicidade pode utilizar cookies e outros identificadores conforme suas configurações e o consentimento aplicável.

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

O código de anúncios automáticos do Google AdSense está no `<head>` de `index.html`, com o cliente `ca-pub-4579887849659560`. A pré-renderização replica o código uma única vez em cada página. O arquivo `public/ads.txt` publica a autorização para `pub-4579887849659560`. A exibição depende do status do site e das configurações da conta no AdSense; inserir o código não garante aprovação nem anúncios imediatamente.

O servidor adiciona um nonce criptográfico novo a cada resposta HTML, aplica esse nonce aos scripts e usa `strict-dynamic` conforme a [orientação de CSP do Google AdSense](https://support.google.com/adsense/answer/16283098). Os cabeçalhos permitem os recursos HTTPS necessários aos anúncios, mantendo bloqueios de objetos e enquadramento do site. Em hospedagem estática, `_headers` fornece uma política de compatibilidade sem nonce; uma política estrita exige nonce dinâmico na hospedagem.

No painel do AdSense, ative os anúncios automáticos, revise formatos e configure áreas excluídas para proteger a ferramenta e seus controles. Configure também as mensagens de privacidade e uma CMP certificada quando exigida para o público atendido. O projeto não cria um banner próprio que simule essa certificação. A política de privacidade descreve a integração com o Google; revise-a com as configurações efetivamente utilizadas.

`AdSlot` continua reservando espaços de layout e não solicita blocos manuais: o código fornecido é de anúncios automáticos. Para preencher posições específicas, são necessários os IDs de blocos gerados na conta. A verificação de inicialização usa a versão do pacote para reconstruir HTML antigo após uma atualização.

## Referências técnicas

- [Build e hospedagem estática com Vite](https://vite.dev/guide/static-deploy)
- [Canvas toBlob: formatos, qualidade e fallback de codificação](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

## Mapa técnico auxiliar

O diretório local `graphify-out/`, ignorado pelo Git, contém `graph.html`, `graph.json` e `GRAPH_REPORT.md`, com a extração estrutural de `src/`. O mapa identifica os módulos da interface, fila, processamento e SEO. Há limitações do extrator: três arquivos sem símbolos modelados, uma referência sem endpoint e três relações de mesmos endpoints colapsadas. Esses detalhes estão no relatório; o mapa não substitui o código e os testes.
