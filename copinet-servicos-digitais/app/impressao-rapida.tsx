import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, Image, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../src/theme/colors';
import { printerPartners } from '../src/data/uiCatalog';
import { supabase } from '../src/lib/supabase';

type PrintMode = 'pb' | 'color';
type PaperType = 'a4' | 'cartao' | 'foto';
type FileKind = 'image' | 'document';

type PrintFile = {
  id: string;
  name: string;
  size: number;
  pagesDetected: number;
  pagesSelected: string;
  copies: number;
  mode: PrintMode;
  paper: PaperType;
  message: string;
  uri?: string;
  uploading: boolean;
  converting: boolean;
  uploadedUrl?: string;
  storagePath?: string;
  convertedUrl?: string;
  convertedPath?: string;
  mimeType?: string;
  kind: FileKind;
};

type PartnerStats = Record<string, { aceites: number; recusas: number }>;

const priceLabel = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const storageBucket = 'impressao-rapida';

const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9.-]/gi, '_');

const isPdfName = (name: string) => name.toLowerCase().endsWith('.pdf');
const officeMimeTypes = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);
const isOfficeFile = (name?: string, mimeType?: string) => {
  if (mimeType && officeMimeTypes.has(mimeType)) return true;
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.ppt') || lower.endsWith('.pptx');
};

const detectPdfPagesWeb = async (file: File) => {
  return 1;
};

const parsePages = (value: string, maxPages: number) => {
  if (!value.trim()) return maxPages;
  const set = new Set<number>();
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const range = part.split('-').map((n) => n.trim());
      if (range.length === 1) {
        const page = Number(range[0]);
        if (!Number.isNaN(page) && page >= 1 && page <= maxPages) set.add(page);
      } else if (range.length === 2) {
        const start = Number(range[0]);
        const end = Number(range[1]);
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let i = min; i <= max; i += 1) set.add(i);
        }
      }
    });
  return set.size || maxPages;
};

const getPricePerPage = (paper: PaperType, mode: PrintMode) => {
  if (paper === 'cartao') return 4;
  if (paper === 'foto') return 9;
  return mode === 'color' ? 1.5 : 1;
};

export default function ImpressaoRapidaScreen() {
  const [files, setFiles] = useState<PrintFile[]>([]);
  const [partnerList, setPartnerList] = useState(printerPartners);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'accepted' | 'timeout'>('idle');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [readyAt, setReadyAt] = useState<string | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({});
  const [previewFile, setPreviewFile] = useState<PrintFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedOrder = useRef<string | null>(null);

  const selectedPartner = useMemo(
    () => partnerList.find((partner) => partner.id === selectedPartnerId) ?? null,
    [partnerList, selectedPartnerId]
  );

  useEffect(() => {
    if (status !== 'waiting' || !selectedPartner) return;
    const acceptTimer = setTimeout(() => {
      if (!selectedPartner.autoAccept) return;
      setStatus('accepted');
      setOrderId(`CP-${Date.now().toString().slice(-6)}`);
      const totalEta = selectedPartner.etaMinutes + selectedPartner.queue * 2;
      setReadyAt(`${totalEta} min`);
      setPartnerStats((prev) => ({
        ...prev,
        [selectedPartner.id]: {
          aceites: (prev[selectedPartner.id]?.aceites ?? 0) + 1,
          recusas: prev[selectedPartner.id]?.recusas ?? 0
        }
      }));
    }, 5000);

    const timeoutTimer = setTimeout(() => {
      if (selectedPartner.autoAccept) return;
      setStatus('timeout');
      setPartnerList((prev) => prev.filter((partner) => partner.id !== selectedPartner.id));
      setPartnerStats((prev) => ({
        ...prev,
        [selectedPartner.id]: {
          aceites: prev[selectedPartner.id]?.aceites ?? 0,
          recusas: (prev[selectedPartner.id]?.recusas ?? 0) + 1
        }
      }));
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(acceptTimer);
      clearTimeout(timeoutTimer);
    };
  }, [status, selectedPartner]);

  const updateFile = (id: string, changes: Partial<PrintFile>) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...changes } : file)));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const selectPartner = (id: string) => {
    setSelectedPartnerId(id);
    setStatus('waiting');
  };

  const resetPartnerSelection = () => {
    setSelectedPartnerId(null);
    setStatus('idle');
  };

  const uploadWebFile = async (id: string, file: File) => {
    const safeName = sanitizeFileName(file.name);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (error) throw error;
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
    updateFile(id, { storagePath: path, uploadedUrl: data.publicUrl });
    return { path, publicUrl: data.publicUrl };
  };

  const uploadNativeFile = async (id: string, asset: DocumentPicker.DocumentPickerAsset) => {
    const fileName = asset.name ?? `arquivo-${Date.now()}`;
    const safeName = sanitizeFileName(fileName);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(storageBucket).upload(path, blob, { contentType: asset.mimeType ?? 'application/octet-stream' });
    if (error) throw error;
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
    updateFile(id, { storagePath: path, uploadedUrl: data.publicUrl });
    return { path, publicUrl: data.publicUrl };
  };

  const convertOfficeFile = async (id: string, storagePath: string, fileName: string) => {
    if (!supabase) return;
    updateFile(id, { converting: true });
    try {
      const { data, error } = await supabase.functions.invoke('convert-office', {
        body: { storagePath, fileName, bucket: storageBucket }
      });
      if (error || !data?.convertedUrl) {
        Alert.alert('Falha na conversão', 'Não foi possível converter o arquivo para PDF.');
        return;
      }
      updateFile(id, { convertedPath: data.convertedPath, convertedUrl: data.convertedUrl });
    } catch {
      Alert.alert('Falha na conversão', 'Não foi possível converter o arquivo para PDF.');
    } finally {
      updateFile(id, { converting: false });
    }
  };

  const handleWebFile = async (id: string, file: File) => {
    updateFile(id, { uploading: !!supabase });
    try {
      if (file.type === 'application/pdf' || isPdfName(file.name)) {
        const pages = await detectPdfPagesWeb(file);
        updateFile(id, { pagesDetected: Math.max(1, pages) });
      }
    } catch {
      updateFile(id, { pagesDetected: 1 });
    }
    if (!supabase) {
      updateFile(id, { uploading: false });
      return;
    }
    try {
      const result = await uploadWebFile(id, file);
      if (isOfficeFile(file.name, file.type)) {
        await convertOfficeFile(id, result.path, file.name);
      }
    } catch (err) {
      Alert.alert('Falha no upload', 'Não foi possível enviar o arquivo para o Supabase.');
    } finally {
      updateFile(id, { uploading: false });
    }
  };

  const handleNativeFile = async (id: string, asset: DocumentPicker.DocumentPickerAsset) => {
    updateFile(id, { uploading: !!supabase });
    if (!supabase) {
      updateFile(id, { uploading: false });
      return;
    }
    try {
      const result = await uploadNativeFile(id, asset);
      if (isOfficeFile(asset.name, asset.mimeType)) {
        await convertOfficeFile(id, result.path, asset.name ?? 'arquivo');
      }
    } catch {
      Alert.alert('Falha no upload', 'Não foi possível enviar o arquivo para o Supabase.');
    } finally {
      updateFile(id, { uploading: false });
    }
  };

  const addFilesFromInput = (list: FileList) => {
    const entries = Array.from(list).map((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const item: PrintFile = {
        id,
        name: file.name,
        size: file.size,
        pagesDetected: 1,
        pagesSelected: '',
        copies: 1,
        mode: 'pb',
        paper: 'a4',
        message: '',
        uri: Platform.OS === 'web' ? URL.createObjectURL(file) : undefined,
        uploading: !!supabase,
        converting: false,
        mimeType: file.type,
        kind: file.type.startsWith('image/') ? 'image' : 'document'
      };
      return { file, item };
    });
    setFiles((prev) => [...prev, ...entries.map((entry) => entry.item)]);
    entries.forEach((entry) => {
      if (Platform.OS === 'web') handleWebFile(entry.item.id, entry.file);
    });
  };

  const pickNativeFiles = async (kind: FileKind) => {
    if (!supabase) {
      Alert.alert('Supabase não configurado', 'Defina as variáveis EXPO_PUBLIC do Supabase para enviar arquivos.');
    }
    const typeList = kind === 'image'
      ? ['image/*']
      : [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
    const result = await DocumentPicker.getDocumentAsync({ type: typeList, multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const assets = result.assets ?? [];
    const created = assets.map((asset) => {
      const id = `${asset.name ?? 'arquivo'}-${Date.now()}-${Math.random()}`;
      const fileKind: FileKind = asset.mimeType?.startsWith('image/') ? 'image' : 'document';
      const item: PrintFile = {
        id,
        name: asset.name ?? 'arquivo',
        size: asset.size ?? 0,
        pagesDetected: 1,
        pagesSelected: '',
        copies: 1,
        mode: 'pb',
        paper: 'a4',
        message: '',
        uri: asset.uri,
        uploading: !!supabase,
        converting: false,
        mimeType: asset.mimeType ?? undefined,
        kind: fileKind
      };
      return { asset, item };
    });
    setFiles((prev) => [...prev, ...created.map((entry) => entry.item)]);
    created.forEach((entry) => handleNativeFile(entry.item.id, entry.asset));
  };

  const totalPrice = useMemo(() => {
    return files.reduce((sum, file) => {
      const pages = parsePages(file.pagesSelected, file.pagesDetected);
      return sum + pages * file.copies * getPricePerPage(file.paper, file.mode);
    }, 0);
  }, [files]);

  useEffect(() => {
    if (!supabase || status !== 'accepted' || !orderId || !selectedPartner) return;
    if (lastSavedOrder.current === orderId) return;
    lastSavedOrder.current = orderId;
    const descricao = `Impressão rápida · ${selectedPartner.name} · ${files.length} arquivo(s) · ${priceLabel(totalPrice)}`;
    supabase.from('pedidos').insert([{ nome: 'Impressão Rápida', descricao, status: 'aguardando retirada' }]);
  }, [status, orderId, selectedPartner, totalPrice, files.length]);

  const qrData = useMemo(() => {
    if (!selectedPartner || !orderId || !readyAt) return '';
    return `Pedido ${orderId} | ${selectedPartner.name} | ${selectedPartner.address} | Pronto em ${readyAt}`;
  }, [selectedPartner, orderId, readyAt]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}><Text style={styles.heroIcon}>🖨️</Text></View>
          <Text style={styles.heroTitle}>Impressão Rápida</Text>
          <Text style={styles.heroSub}>Envie PDFs, Word ou imagens, configure e retire na loja</Text>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adicionar Arquivos</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.uploadRow}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
              onChange={(e) => {
                const list = e.target.files;
                if (list && list.length > 0) addFilesFromInput(list);
              }}
            />
          </View>
        ) : (
          <View style={styles.uploadGrid}>
            <Pressable style={styles.uploadCard} onPress={() => pickNativeFiles('document')}>
              <Text style={styles.uploadIcon}>📄</Text>
              <Text style={styles.uploadText}>PDF, Word ou Documento</Text>
            </Pressable>
            <Pressable style={styles.uploadCard} onPress={() => pickNativeFiles('image')}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadText}>Imagens da Galeria</Text>
            </Pressable>
          </View>
        )}
        {files.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>☁️</Text>
            <Text style={styles.emptyTitle}>Nenhum arquivo adicionado</Text>
            <Text style={styles.emptySub}>Toque nos botões acima para selecionar PDFs, Word ou imagens</Text>
          </View>
        )}
      </View>

      {files.map((file, index) => {
        const pagesCount = parsePages(file.pagesSelected, file.pagesDetected);
        const pricePerPage = getPricePerPage(file.paper, file.mode);
        const subtotal = pagesCount * file.copies * pricePerPage;
        return (
          <View key={file.id} style={styles.fileSection}>
            <Text style={styles.fileHeader}>ARQUIVO {index + 1} DE {files.length}</Text>
            <View style={styles.pageDetect}>
              <Text style={styles.pageDetectText}>{file.pagesDetected} página detectada. Corrija se necessário:</Text>
              <View style={styles.pageButtons}>
                <Pressable style={styles.pageBtn} onPress={() => updateFile(file.id, { pagesDetected: Math.max(1, file.pagesDetected - 1) })}>
                  <Text style={styles.pageBtnText}>−</Text>
                </Pressable>
                <Pressable style={styles.pageBtn} onPress={() => updateFile(file.id, { pagesDetected: file.pagesDetected + 1 })}>
                  <Text style={styles.pageBtnText}>＋</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.fileCard}>
              <View style={styles.fileRow}>
                <View style={styles.fileIconWrap}><Text style={styles.fileIcon}>📄</Text></View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileMeta}>{file.pagesDetected} página · {Math.round(file.size / 1024)} KB</Text>
                    {file.uploading && <ActivityIndicator size="small" color={colors.textMuted} />}
                    {file.converting && <Text style={styles.fileMetaTag}>Convertendo...</Text>}
                  </View>
                </View>
                <Pressable style={styles.previewBtn} onPress={() => setPreviewFile(file)}>
                  <Text style={styles.previewText}>Ver</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => removeFile(file.id)}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </Pressable>
              </View>

              <Text style={styles.blockTitle}>Tipo de Impressão</Text>
              <View style={styles.optionRow}>
                <Pressable style={[styles.optionCard, file.mode === 'pb' && styles.optionActive]} onPress={() => updateFile(file.id, { mode: 'pb' })}>
                  <Text style={[styles.optionTitle, file.mode === 'pb' && styles.optionTitleActive]}>Preto e Branco</Text>
                  <Text style={[styles.optionPrice, file.mode === 'pb' && styles.optionTitleActive]}>R$ 1,00/pg</Text>
                </Pressable>
                <Pressable style={[styles.optionCard, file.mode === 'color' && styles.optionActive]} onPress={() => updateFile(file.id, { mode: 'color' })}>
                  <Text style={[styles.optionTitle, file.mode === 'color' && styles.optionTitleActive]}>Colorido</Text>
                  <Text style={[styles.optionPrice, file.mode === 'color' && styles.optionTitleActive]}>R$ 1,50/pg</Text>
                </Pressable>
              </View>

              <Text style={styles.blockTitle}>Quantidade de Cópias</Text>
              <View style={styles.counterRow}>
                <Pressable style={styles.counterBtn} onPress={() => updateFile(file.id, { copies: Math.max(1, file.copies - 1) })}>
                  <Text style={styles.counterText}>−</Text>
                </Pressable>
                <View style={styles.counterValue}><Text style={styles.counterValueText}>{file.copies}</Text></View>
                <Pressable style={styles.counterBtn} onPress={() => updateFile(file.id, { copies: file.copies + 1 })}>
                  <Text style={styles.counterText}>＋</Text>
                </Pressable>
              </View>

              <Text style={styles.blockTitle}>Papel</Text>
              <View style={styles.paperRow}>
                <Pressable style={[styles.paperChip, file.paper === 'a4' && styles.paperChipActive]} onPress={() => updateFile(file.id, { paper: 'a4' })}>
                  <Text style={[styles.paperText, file.paper === 'a4' && styles.paperTextActive]}>Papel Comum A4</Text>
                </Pressable>
                <Pressable style={[styles.paperChip, file.paper === 'foto' && styles.paperChipActive]} onPress={() => updateFile(file.id, { paper: 'foto' })}>
                  <Text style={[styles.paperText, file.paper === 'foto' && styles.paperTextActive]}>Papel Fotográfico</Text>
                </Pressable>
                <Pressable style={[styles.paperChip, file.paper === 'cartao' && styles.paperChipActive]} onPress={() => updateFile(file.id, { paper: 'cartao' })}>
                  <Text style={[styles.paperText, file.paper === 'cartao' && styles.paperTextActive]}>Papel Cartão</Text>
                </Pressable>
              </View>

              <Text style={styles.blockTitle}>Páginas para imprimir</Text>
              <TextInput
                style={styles.input}
                value={file.pagesSelected}
                onChangeText={(value) => updateFile(file.id, { pagesSelected: value })}
                placeholder="Ex: 1-3,5"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.blockTitle}>Mensagem / Orientação (opcional)</Text>
              <TextInput
                style={styles.input}
                value={file.message}
                onChangeText={(value) => updateFile(file.id, { message: value })}
                placeholder="Ex: arquivo com senha 1234, imprimir frente e verso"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.subtotalRow}>
                <View>
                  <Text style={styles.subtotalLabel}>Subtotal deste arquivo</Text>
                  <Text style={styles.subtotalMeta}>{pagesCount} pg x {file.copies} cópia x {priceLabel(pricePerPage)}</Text>
                </View>
                <Text style={styles.subtotalValue}>{priceLabel(subtotal)}</Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecione onde retirar sua impressão</Text>
        <View style={styles.mapCard}>
          {Platform.OS === 'web' ? (
            <iframe
              title="Mapa parceiros impressão"
              width="100%"
              height="220"
              style={{ border: 0, borderRadius: 14 }}
              loading="lazy"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3678.48003044605!2d-46.427!3d-23.511!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce1c8e4b0b5cfd%3A0x0!2sCubat%C3%A3o%2C%20SP!5e0!3m2!1spt-BR!2sbr!4v1710000000000"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>📍</Text>
              <Text style={styles.mapText}>Mapa de parceiros disponível no site</Text>
            </View>
          )}
        </View>
        {status === 'waiting' && (
          <View style={styles.waitCard}>
            <Text style={styles.waitTitle}>Aguardando aceite da impressão...</Text>
            <Text style={styles.waitSub}>Tempo estimado: 5-10 min. Você será notificado quando aceito.</Text>
          </View>
        )}
        {status === 'timeout' && (
          <View style={styles.waitCard}>
            <Text style={styles.waitTitle}>Desculpe pelo inconveniente</Text>
            <Text style={styles.waitSub}>Escolha outro parceiro para retirar sua impressão.</Text>
            <Pressable style={styles.retryBtn} onPress={resetPartnerSelection}>
              <Text style={styles.retryText}>Escolher outro parceiro</Text>
            </Pressable>
          </View>
        )}
        {status === 'accepted' && selectedPartner && orderId && readyAt && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Pedido aguardando sua retirada</Text>
            <Text style={styles.successSub}>Pedido {orderId} · Pronto em {readyAt}</Text>
            <Text style={styles.successSub}>{selectedPartner.name}</Text>
            <Text style={styles.successSub}>{selectedPartner.address}</Text>
            <Image source={{ uri: `https://quickchart.io/qr?size=200&text=${encodeURIComponent(qrData)}` }} style={styles.qr} />
          </View>
        )}
        {status === 'idle' && (
          <View style={styles.partnerList}>
            {partnerList.map((partner) => {
              const stats = partnerStats[partner.id] ?? { aceites: 0, recusas: 0 };
              const score = Math.max(1, 5 - stats.recusas);
              return (
                <Pressable key={partner.id} style={styles.partnerCard} onPress={() => selectPartner(partner.id)}>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <Text style={styles.partnerAddress}>{partner.address}</Text>
                    <Text style={styles.partnerMeta}>Fila: {partner.queue} · {partner.etaMinutes} min</Text>
                  </View>
                  <View style={styles.partnerBadge}>
                    <Text style={styles.partnerScore}>★ {score.toFixed(1)}</Text>
                    <Text style={styles.partnerScoreSub}>Aceites {stats.aceites} · Recusas {stats.recusas}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {files.length > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.totalValue}>{priceLabel(totalPrice)}</Text>
        </View>
      )}
      <Modal transparent visible={!!previewFile} animationType="fade" onRequestClose={() => setPreviewFile(null)}>
        <View style={styles.previewBackdrop}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{previewFile?.name}</Text>
            {previewFile?.kind === 'image' && previewFile?.uri ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewDoc}>
                <View style={styles.previewSheet} />
                <Text style={styles.previewDocText}>Prévia do documento</Text>
              </View>
            )}
            {!!previewFile?.uploadedUrl && (
              <Pressable
                style={styles.previewOpen}
                onPress={() => {
                  if (previewFile?.uploadedUrl) Linking.openURL(previewFile.uploadedUrl);
                }}
              >
                <Text style={styles.previewOpenText}>Abrir arquivo enviado</Text>
              </Pressable>
            )}
            {!!previewFile?.convertedUrl && (
              <Pressable
                style={styles.previewOpen}
                onPress={() => {
                  if (previewFile?.convertedUrl) Linking.openURL(previewFile.convertedUrl);
                }}
              >
                <Text style={styles.previewOpenText}>Abrir PDF convertido</Text>
              </Pressable>
            )}
            <Pressable style={styles.previewClose} onPress={() => setPreviewFile(null)}>
              <Text style={styles.previewCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, backgroundColor: colors.background },
  hero: { backgroundColor: colors.cardDark, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20, gap: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3A3747', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 28, color: colors.gold },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 15, color: '#CFCBDA', textAlign: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  uploadRow: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  uploadGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  uploadCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border },
  uploadIcon: { fontSize: 24 },
  uploadText: { fontSize: 13, textAlign: 'center', color: colors.text, fontWeight: '600' },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  fileSection: { gap: 10 },
  fileHeader: { fontSize: 14, fontWeight: '700', color: colors.gold },
  pageDetect: { backgroundColor: '#EAF1FF', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageDetectText: { fontSize: 13, color: '#2B5CD7', flex: 1, paddingRight: 10 },
  pageButtons: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D6E3FF' },
  pageBtnText: { fontSize: 18, color: '#2B5CD7', fontWeight: '700' },
  fileCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  fileIcon: { fontSize: 18 },
  fileInfo: { flex: 1, gap: 4, minWidth: 0 },
  fileName: { fontSize: 15, fontWeight: '700', color: colors.text },
  fileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileMeta: { fontSize: 12, color: colors.textMuted },
  fileMetaTag: { fontSize: 11, color: colors.text, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  previewBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  previewText: { fontSize: 12, color: colors.text },
  deleteBtn: { paddingHorizontal: 8 },
  deleteText: { fontSize: 16, color: '#E05555' },
  blockTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionCard: { flex: 1, backgroundColor: colors.background, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 6 },
  optionActive: { backgroundColor: colors.cardDark, borderColor: colors.cardDark },
  optionTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  optionTitleActive: { color: '#fff' },
  optionPrice: { fontSize: 12, color: colors.textMuted },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 18, color: colors.text },
  counterValue: { width: 54, height: 40, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  counterValueText: { fontSize: 16, fontWeight: '700', color: colors.text },
  paperRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paperChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  paperChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  paperText: { fontSize: 12, color: colors.text },
  paperTextActive: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.text },
  subtotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  subtotalLabel: { fontSize: 12, color: colors.textMuted },
  subtotalMeta: { fontSize: 12, color: colors.textMuted },
  subtotalValue: { fontSize: 18, fontWeight: '700', color: colors.gold },
  mapCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  mapPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapIcon: { fontSize: 26 },
  mapText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  partnerList: { gap: 12 },
  partnerCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  partnerInfo: { flex: 1, gap: 4 },
  partnerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  partnerAddress: { fontSize: 12, color: colors.textMuted },
  partnerMeta: { fontSize: 12, color: colors.textMuted },
  partnerBadge: { alignItems: 'flex-end', gap: 4 },
  partnerScore: { fontSize: 14, fontWeight: '700', color: colors.gold },
  partnerScoreSub: { fontSize: 11, color: colors.textMuted },
  waitCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  waitTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  waitSub: { fontSize: 13, color: colors.textMuted },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.gold, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  successCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  successTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  successSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  qr: { width: 160, height: 160, marginTop: 6 },
  totalCard: { backgroundColor: colors.cardDark, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  totalLabel: { fontSize: 14, color: '#C7C4D2' },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.gold },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  previewCard: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  previewImage: { width: '100%', height: 320, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  previewDoc: { width: '100%', alignItems: 'center', gap: 10, paddingVertical: 12 },
  previewSheet: { width: '100%', height: 260, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  previewDocText: { fontSize: 13, color: colors.textMuted },
  previewOpen: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  previewOpenText: { fontSize: 12, fontWeight: '700', color: colors.text },
  previewClose: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  previewCloseText: { color: colors.text, fontWeight: '700' }
});
