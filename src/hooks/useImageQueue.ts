import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProcessOptions, QueueItem } from '../types';
import { inspectFile, outputName } from '../utils/images';
import { runImage } from '../services/processor';

export function useImageQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const current = useRef(items);
  const active = useRef<AbortController | null>(null);
  const urls = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => { current.current = items; }, [items]);
  useEffect(() => {
    mounted.current = true;
    const allocated = urls.current;
    return () => {
      mounted.current = false;
      active.current?.abort();
      for (const url of allocated) URL.revokeObjectURL(url);
      allocated.clear();
    };
  }, []);
  const release = (url: string) => { URL.revokeObjectURL(url); urls.current.delete(url); };
  const addFiles = useCallback(async (files: File[]) => {
    setLoading(true);
    const accepted: QueueItem[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        const format = await inspectFile(file);
        if (!mounted.current) break;
        const preview = URL.createObjectURL(file);
        urls.current.add(preview);
        accepted.push({ id: crypto.randomUUID(), file, format, preview, status: 'ready' });
      } catch (error) { errors.push(error instanceof Error ? error.message : 'Falha ao ler arquivo.'); }
    }
    if (mounted.current) {
      setItems(previous => [...previous, ...accepted]);
      setMessages(errors);
      setLoading(false);
    }
  }, []);
  const remove = (id: string) => {
    const item = current.current.find(item => item.id === id);
    if (item) { release(item.preview); if (item.result) release(item.result.url); }
    setItems(previous => previous.filter(item => item.id !== id));
  };
  const clear = () => {
    active.current?.abort();
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
    setItems([]);
    setMessages([]);
  };
  const process = async (options: ProcessOptions, onlyId?: string) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessages([]);
    const batch = current.current.filter(item => !onlyId || item.id === onlyId);
    const batchIds = new Set(batch.map(item => item.id));
    setItems(previous => previous.map(item => batchIds.has(item.id) ? { ...item, status: 'ready' } : item));
    for (const item of batch) {
      if (controller.signal.aborted) break;
      if (item.result) release(item.result.url);
      setItems(previous => previous.map(entry => entry.id === item.id ? { ...entry, status: 'processing', result: undefined, error: undefined } : entry));
      try {
        const effective = { ...options, format: options.mode === 'compress' ? item.format : options.format };
        const result = await runImage(item.file, effective, controller.signal);
        if (controller.signal.aborted || !mounted.current) break;
        const url = URL.createObjectURL(result.blob);
        urls.current.add(url);
        setItems(previous => previous.map(entry => entry.id === item.id ? { ...entry, status: 'done', result: { ...result, url, name: outputName(item.file.name, result.format) } } : entry));
      } catch (error) {
        const cancelled = controller.signal.aborted;
        if (mounted.current) setItems(previous => previous.map(entry => entry.id === item.id ? { ...entry, status: cancelled ? 'cancelled' : 'error', error: cancelled ? undefined : error instanceof Error ? error.message : 'Não foi possível processar a imagem.' } : entry));
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    active.current = null;
    if (mounted.current) setBusy(false);
  };
  return { items, busy, loading, messages, addFiles, remove, clear, process, cancel: () => active.current?.abort() };
}
