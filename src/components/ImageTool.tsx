import { ArrowDown, ArrowDownToLine, ArrowLeftRight, ArrowRight, Check, CheckCheck, ChevronDown, FileImage, FolderArchive, ImagePlus, LoaderCircle, LockKeyhole, Maximize, Plus, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PageData } from '../data/pages';
import { useImageQueue } from '../hooks/useImageQueue';
import type { ImageFormat, QueueItem } from '../types';
import { defaultOptions, FORMATS, formatBytes, savings } from '../utils/images';
import { supportedFormats } from '../services/processor';
import { downloadBlob, downloadZip } from '../services/download';

function ResultCard({ item, busy, onRemove, onProcess }: { item: QueueItem; busy: boolean; onRemove: () => void; onProcess: () => void }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const result = item.result;
  const reduction = result ? savings(item.file.size, result.blob.size) : 0;
  return <article className={`file-card ${item.status}`}>
    <div className="file-preview"><img src={result && !showOriginal ? result.url : item.preview} alt={`Prévia de ${item.file.name}`} loading="lazy" />{item.status === 'processing' && <span className="preview-loading"><LoaderCircle className="spin" /></span>}</div>
    <div className="file-details"><strong title={item.file.name}>{item.file.name}</strong><div className="file-meta"><span>{formatBytes(item.file.size)}</span><span className="format-tag">{FORMATS.find(f => f.value === item.format)?.label}</span>{result && <><ArrowRight size={13} /><span>{formatBytes(result.blob.size)}</span></>}</div>
      {result && <div className="result-info"><span className={reduction > 0 ? 'saving' : 'neutral-result'}>{reduction > 0 ? <><ArrowDown size={12} /> {reduction}% menor</> : result.keptOriginal ? 'Original mantido · sem redução' : result.blob.size > item.file.size ? 'Resultado maior que o original' : 'Mesmo tamanho'}</span><span>{result.width} × {result.height} px</span></div>}
      {item.error && <p className="file-error" role="alert">{item.error}</p>}
      {item.status === 'cancelled' && <small>Processamento cancelado. Você pode tentar novamente.</small>}
      {item.status === 'processing' && <small role="status">Processando no seu dispositivo…</small>}
    </div>
    <div className="file-actions">{result ? <><button className="text-button compare-button" onClick={() => setShowOriginal(!showOriginal)}>{showOriginal ? 'Ver resultado' : 'Ver original'}</button><button className="button button-small" onClick={() => downloadBlob(result.blob, result.name)}><ArrowDownToLine size={15} />Baixar</button></> : <button className="button button-small button-secondary" disabled={busy} onClick={onProcess}>{item.status === 'processing' ? <LoaderCircle size={15} className="spin" /> : <ArrowRight size={15} />}Processar</button>}<button className="icon-button remove-button" aria-label={`Remover ${item.file.name}`} disabled={busy} onClick={onRemove}><X size={16} /></button></div>
  </article>;
}

export function ImageTool({ page }: { page: PageData }) {
  const queue = useImageQueue();
  const [options, setOptions] = useState({ ...defaultOptions, mode: page.mode, format: page.format ?? defaultOptions.format });
  const [formats, setFormats] = useState<ImageFormat[]>(['image/jpeg', 'image/png']);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const { addFiles } = queue;
  useEffect(() => { void supportedFormats().then(setFormats); }, []);
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (queue.busy || queue.loading || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName))) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) { event.preventDefault(); void addFiles(files); }
    };
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [addFiles, queue.busy, queue.loading]);
  const done = queue.items.filter(item => item.result);
  const finished = queue.items.filter(item => ['done', 'error', 'cancelled'].includes(item.status)).length;
  const allPNG = queue.items.length > 0 && queue.items.every(item => item.format === 'image/png');
  const lossless = options.mode === 'compress' ? allPNG : options.format === 'image/png';
  const available = formats.includes(options.format);
  const blocked = queue.busy || queue.loading;
  const totalOriginal = done.reduce((sum, item) => sum + item.file.size, 0);
  const totalResult = done.reduce((sum, item) => sum + (item.result?.blob.size ?? 0), 0);
  function drop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!blocked) void addFiles(Array.from(event.dataTransfer.files));
  }
  function preset(width: number, height: number) { setOptions({ ...options, resizeMode: 'dimensions', width, height, keepRatio: false }); }
  const action = options.mode === 'compress' ? 'Comprimir' : options.mode === 'resize' ? 'Redimensionar' : 'Converter';
  async function zip() {
    setZipping(true); setDownloadError('');
    try { await downloadZip(done); } catch { setDownloadError('Não foi possível criar o ZIP. Tente baixar individualmente ou use um lote menor.'); }
    finally { setZipping(false); }
  }
  return <section className="tool" aria-label="Ferramenta de imagens">
    <div className="tool-tabs" role="navigation" aria-label="Escolher ferramenta">
      <Link to="/" className={options.mode === 'convert' ? 'selected' : ''}><ArrowLeftRight size={17} />Converter</Link>
      <Link to="/comprimir-imagem" className={options.mode === 'compress' ? 'selected' : ''}><SlidersHorizontal size={17} />Comprimir</Link>
      <Link to="/redimensionar-imagem" className={options.mode === 'resize' ? 'selected' : ''}><Maximize size={17} />Redimensionar</Link>
      <span className="tool-local"><LockKeyhole size={13} />Processamento local</span>
    </div>
    <div className="workspace">
      <div className="upload-column">
        <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragEnter={event => { event.preventDefault(); dragDepth.current++; setDragging(true); }} onDragLeave={event => { event.preventDefault(); if (--dragDepth.current === 0) setDragging(false); }} onDragOver={event => event.preventDefault()} onDrop={drop}>
          <input ref={input} type="file" aria-label="Selecionar arquivos de imagem" tabIndex={-1} multiple accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="visually-hidden" id="image-upload" disabled={blocked} onChange={event => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
          <div className="upload-symbol"><FileImage size={35} strokeWidth={1.4} /><span><Plus size={13} strokeWidth={3} /></span></div>
          <h2>{dragging ? 'Pode soltar suas imagens aqui' : queue.items.length ? 'Mais imagens? Pode trazer.' : 'Suas imagens começam aqui'}</h2>
          <p>Arraste e solte seus arquivos ou</p>
          <button className="button upload-button" onClick={() => input.current?.click()} disabled={blocked}>{queue.loading ? <LoaderCircle size={18} className="spin" /> : <Upload size={18} />}Selecionar imagens<Plus size={16} /></button>
          <span className="paste-hint">Você também pode colar uma imagem com <kbd>Ctrl</kbd> + <kbd>V</kbd></span>
          <div className="accepted-formats"><span>JPG</span><span>PNG</span><span>WebP</span><i />Até 40 MB por imagem</div>
        </div>
        <div className="privacy-line"><ShieldCheck size={16} /><span>Suas imagens ficam no seu dispositivo.<br className="mobile-break" /> Nenhum arquivo é enviado aos nossos servidores.</span></div>
      </div>
      <aside className="settings" aria-label="Configurações de processamento"><div className="settings-heading"><SlidersHorizontal size={16} /><h2>Do seu jeito</h2></div>
        <fieldset disabled={blocked}>
          {options.mode !== 'compress' ? <><label htmlFor="output-format">Converter para</label><div className="select-wrap"><select id="output-format" value={options.format} onChange={event => setOptions({ ...options, format: event.target.value as ImageFormat })}>{FORMATS.filter(f => formats.includes(f.value)).map(format => <option key={format.value} value={format.value}>{format.label}{format.value === 'image/webp' ? ' — leve e versátil' : format.value === 'image/png' ? ' — sem perdas' : format.value === 'image/jpeg' ? ' — compatível' : ''}</option>)}</select><ChevronDown size={15} /></div>{!available && <p className="setting-warning">Seu navegador não exporta o formato selecionado. Escolha outro formato.</p>}</> : <div className="preserve-format"><FileImage size={16} /><span>Formato original preservado</span></div>}
          {options.mode === 'resize' && <div className="resize-options"><div className="segmented"><button type="button" className={options.resizeMode === 'dimensions' ? 'active' : ''} onClick={() => setOptions({ ...options, resizeMode: 'dimensions' })}>Em pixels</button><button type="button" className={options.resizeMode === 'percent' ? 'active' : ''} onClick={() => setOptions({ ...options, resizeMode: 'percent' })}>Percentual</button></div>{options.resizeMode === 'dimensions' ? <><div className="dimension-inputs"><label>Largura<input type="number" min="1" max="16384" value={options.width || ''} onChange={event => setOptions({ ...options, width: Number(event.target.value) })} /></label><span>×</span><label>Altura<input type="number" min="1" max="16384" value={options.height || ''} onChange={event => setOptions({ ...options, height: Number(event.target.value) })} /></label></div><label className="checkbox-label"><input type="checkbox" checked={options.keepRatio} onChange={event => setOptions({ ...options, keepRatio: event.target.checked })} />Manter proporção</label><p className="setting-help">{options.keepRatio ? 'Encaixa nos limites sem cortar ou deformar.' : 'Dimensões exatas. Pode deformar a imagem.'}</p></> : <label>Escala (%)<input aria-label="Escala em percentual" type="number" min="1" max="400" value={options.percent || ''} onChange={event => setOptions({ ...options, percent: Number(event.target.value) })} /></label>}<div className="presets"><button onClick={() => preset(354, 472)}>3×4</button><button onClick={() => preset(1080, 1080)}>Quadrado</button><button onClick={() => preset(1920, 1080)}>Full HD</button></div></div>}
          <div className="quality-label"><label htmlFor="quality">Qualidade</label><output htmlFor="quality">{lossless ? 'Sem perdas' : `${Math.round(options.quality * 100)}%`}</output></div>
          <input id="quality" type="range" min="10" max="100" step="1" disabled={lossless} value={Math.round(options.quality * 100)} onChange={event => setOptions({ ...options, quality: Number(event.target.value) / 100 })} />
          <div className="range-labels"><span>Menor arquivo</span><span>Mais detalhes</span></div>
          <p className="setting-help">{lossless ? 'PNG não usa ajuste de qualidade. A redução de tamanho não é garantida.' : 'Um bom equilíbrio entre leveza e qualidade. O tamanho final pode variar.'}</p>
          {((options.mode !== 'compress' && options.format === 'image/jpeg') || (options.mode === 'compress' && queue.items.some(item => item.format === 'image/jpeg'))) && <label className="background-control">Fundo para transparência<span><input aria-label="Cor de fundo" type="color" value={options.background} onChange={event => setOptions({ ...options, background: event.target.value })} /><code>{options.background}</code></span></label>}
          <div className="settings-note"><Check size={14} /><span>{options.mode === 'compress' ? 'Se não ficar menor, mantemos o original.' : options.format === 'image/jpeg' ? 'Transparência recebe a cor de fundo.' : 'Transparência preservada quando presente.'}</span></div>
        </fieldset>
      </aside>
    </div>
    {(queue.items.length > 0 || queue.messages.length > 0) && <div className="queue-area">
      {queue.messages.length > 0 && <div className="upload-errors" role="alert">{queue.messages.map((message, index) => <p key={index}>{message}</p>)}</div>}
      {queue.items.length > 0 && <><div className="queue-header"><h3><ImagePlus size={18} />{queue.items.length} {queue.items.length === 1 ? 'imagem' : 'imagens'}<span className="count-badge">{done.length} pronta{done.length === 1 ? '' : 's'}</span></h3><button className="text-button" onClick={queue.clear} disabled={blocked}><Trash2 size={14} />Limpar</button></div>
        <div className="file-list">{queue.items.map(item => <ResultCard key={item.id} item={item} busy={blocked} onRemove={() => queue.remove(item.id)} onProcess={() => void queue.process(options, item.id)} />)}</div>
        {queue.busy && <div className="progress-wrap" role="status"><span>Processando imagens · {finished} de {queue.items.length}</span><progress max={queue.items.length} value={finished} aria-label="Imagens finalizadas" /></div>}
        {done.length > 0 && !queue.busy && <div className="batch-summary"><CheckCheck size={17} /><span>{done.length} {done.length === 1 ? 'imagem pronta' : 'imagens prontas'}{totalResult < totalOriginal ? ` · ${formatBytes(totalOriginal - totalResult)} economizados` : ' · confira os resultados antes de baixar'}</span></div>}
        <div className="queue-toolbar">{queue.busy ? <button className="button button-secondary" onClick={queue.cancel}><X size={16} />Cancelar processamento</button> : <button className="button" disabled={blocked || (options.mode !== 'compress' && !available)} onClick={() => void queue.process(options)}><Sparkles size={17} />{done.length === queue.items.length ? 'Processar novamente' : `${action} ${queue.items.length > 1 ? 'imagens' : 'imagem'}`}<ArrowRight size={17} /></button>}
          {done.length > 0 && <button className="button button-secondary" disabled={zipping || queue.busy} onClick={() => void zip()}>{zipping ? <LoaderCircle size={17} className="spin" /> : <FolderArchive size={17} />}Baixar tudo (ZIP)</button>}
          {done.length > 0 && !queue.busy && <button className="text-button reset-button" onClick={() => { queue.clear(); input.current?.click(); }}>Converter outras imagens</button>}
        </div>{downloadError && <p role="alert" className="file-error">{downloadError}</p>}</>}
    </div>}
    <div className="tool-footer"><span><Check size={14} />Sem cadastro</span><span><Check size={14} />Sem limite de conversões</span><span><Check size={14} />Sem instalar nada</span></div>
  </section>;
}
