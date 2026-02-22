export type ServiceFlow = 'sozinho' | 'fazemos';

export type ServiceItem = {
  id: string;
  title: string;
  flows: ServiceFlow[];
  price?: number;
};

export type ServiceGroup = {
  id: string;
  label: string;
  banner?: string;
  subServices: ServiceItem[];
};

export const serviceDirectory: Record<string, ServiceGroup> = {
  detran: {
    id: 'detran',
    label: 'DETRAN',
    banner: 'Senha gov.br necessária (Prata/Ouro)',
    subServices: [
      { id: 'crlv', title: 'CRLV-e (Licenciamento)', flows: ['fazemos'] },
      { id: 'pontos', title: 'Consulta de Pontos CNH', flows: ['fazemos'] },
      { id: 'debitos', title: 'Pesquisa de Débitos do Veículo', flows: ['fazemos'] }
    ]
  },
  imobiliario: {
    id: 'imobiliario',
    label: 'Contratos Imobiliários',
    subServices: [
      { id: 'locacao', title: 'Contrato de Locação', flows: ['sozinho', 'fazemos'] },
      { id: 'compra_venda', title: 'Contrato de Compra e Venda', flows: ['sozinho', 'fazemos'] },
      { id: 'vistoria', title: 'Laudo de Vistoria com Fotos', flows: ['sozinho', 'fazemos'] }
    ]
  },
  trabalho: {
    id: 'trabalho',
    label: 'Trabalho',
    subServices: [
      { id: 'curriculo', title: 'Currículos com importação LinkedIn', flows: ['sozinho', 'fazemos'] },
      { id: 'ctps', title: 'CTPS Digital', flows: ['fazemos'] },
      { id: 'contratos', title: 'Contratos de Serviço', flows: ['sozinho', 'fazemos'] }
    ]
  },
  servicos_graficos: {
    id: 'servicos_graficos',
    label: 'Serviços Gráficos Rápidos',
    subServices: [
      { id: 'print_doc', title: 'Impressão de Documentos (P&B/Color)', flows: ['sozinho', 'fazemos'], price: 1.0 },
      { id: 'print_photo', title: 'Impressão de Fotos (10x15 a A4)', flows: ['sozinho', 'fazemos'], price: 3.0 },
      { id: 'foto_3x4', title: 'Foto 3x4 (com edição de fundo)', flows: ['sozinho', 'fazemos'], price: 5.0 }
    ]
  }
};
