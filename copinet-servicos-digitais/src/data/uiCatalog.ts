export type UiCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  tone: 'gold' | 'blue' | 'green' | 'neutral';
};

export type PopularItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  eta: string;
  categoryId: string;
  serviceId: string;
  partner?: boolean;
  icon: string;
};

export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  support: {
    whatsapp: string;
    chatEnabled: boolean;
    whatsappEnabled: boolean;
    supportHours: string;
  };
};

export type PrinterPartner = {
  id: string;
  name: string;
  address: string;
  etaMinutes: number;
  queue: number;
  autoAccept: boolean;
};

export const uiCategories: UiCategory[] = [
  { id: 'documentos', title: 'Documentos', subtitle: 'Emissão e cópias de documentos', icon: '📄', count: 4, tone: 'gold' },
  { id: 'copias', title: 'Cópias e Impressões', subtitle: 'Impressão, cópia e digitalização', icon: '🖨️', count: 4, tone: 'neutral' },
  { id: 'graficos', title: 'Serviços Gráficos', subtitle: 'Design, cartões, banners e mais', icon: '🎨', count: 4, tone: 'green' },
  { id: 'fazemos', title: 'Fazemos pra Você', subtitle: 'Certidões e documentos via parceiros', icon: '🖐️', count: 6, tone: 'blue' }
];

export const popularItems: PopularItem[] = [
  { id: 'p1', title: 'Cópia Preto e Branco', subtitle: 'Cópia simples em preto e branco', price: 0.3, eta: '5 minutos', categoryId: 'copias', serviceId: 'print_doc', icon: '📄' },
  { id: 'p2', title: 'Impressão de Documento', subtitle: 'Impressão de arquivo digital', price: 1, eta: '10 minutos', categoryId: 'copias', serviceId: 'print_doc', icon: '🖨️' },
  { id: 'p3', title: 'Foto 3x4', subtitle: 'Foto para documentos padrão', price: 15, eta: '15 minutos', categoryId: 'graficos', serviceId: 'foto_3x4', icon: '📸' },
  { id: 'p4', title: 'Cartão de Visita', subtitle: 'Design e impressão de 100 cartões', price: 45, eta: '3 dias úteis', categoryId: 'graficos', serviceId: 'print_photo', icon: '💳' },
  { id: 'p5', title: 'Certidão de Nascimento', subtitle: 'Emissão de 2ª via de certidão', price: 65, eta: '5 a 10 dias úteis', categoryId: 'fazemos', serviceId: 'crlv', partner: true, icon: '👤' },
  { id: 'p6', title: 'Regularização de CPF', subtitle: 'Consulta de situação cadastral', price: 25, eta: '1 a 3 dias úteis', categoryId: 'fazemos', serviceId: 'debitos', partner: true, icon: '🔎' }
];

export const stores: StoreLocation[] = [
  {
    id: 'centro',
    name: 'Copinet Centro',
    address: 'Rua Marechal Deodoro, 250 - Centro, Cubatão - SP',
    hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 13h',
    support: {
      whatsapp: '5513999990000',
      chatEnabled: true,
      whatsappEnabled: true,
      supportHours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 13h'
    }
  },
  {
    id: 'vila-nova',
    name: 'Copinet Vila Nova',
    address: 'Av. Nove de Abril, 1500 - Vila Nova, Cubatão - SP',
    hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 13h',
    support: {
      whatsapp: '5513988880000',
      chatEnabled: true,
      whatsappEnabled: false,
      supportHours: 'Seg-Sex: 9h às 17h | Sáb: 9h às 12h'
    }
  }
];

export const printerPartners: PrinterPartner[] = [
  { id: 'parceiro-centro', name: 'Parceiro Centro', address: 'Rua São Paulo, 180 - Centro, Cubatão - SP', etaMinutes: 10, queue: 3, autoAccept: true },
  { id: 'parceiro-vila', name: 'Parceiro Vila Nova', address: 'Av. Nove de Abril, 1300 - Vila Nova, Cubatão - SP', etaMinutes: 12, queue: 4, autoAccept: false },
  { id: 'parceiro-jardim', name: 'Parceiro Jardim', address: 'Av. Martins Fontes, 500 - Jardim, Cubatão - SP', etaMinutes: 8, queue: 2, autoAccept: true }
];
