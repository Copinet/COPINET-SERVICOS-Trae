type PixParams = {
  chave: string;
  nome: string;
  cidade: string;
  valor?: number;
  txid?: string;
  infoAdicional?: string;
};

const format = (id: string, value: string) => {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
};

function crc16(payload: string) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function buildPixPayload({ chave, nome, cidade, valor, txid = 'COPINET', infoAdicional }: PixParams) {
  const GUI = format('00', 'BR.GOV.BCB.PIX');
  const KEY = format('01', chave);
  const MERCHANT_ACCOUNT = format('26', GUI + KEY);

  const MERCHANT_CATEGORY = format('52', '0000');
  const TRANSACTION_CURRENCY = format('53', '986');
  const TRANSACTION_AMOUNT = valor ? format('54', valor.toFixed(2)) : '';
  const COUNTRY_CODE = format('58', 'BR');
  const MERCHANT_NAME = format('59', nome.slice(0, 25));
  const MERCHANT_CITY = format('60', cidade.slice(0, 15));
  const ADDITIONAL_DATA = format('62', format('05', txid));
  const ADDITIONAL_INFO = infoAdicional ? format('62', format('50', infoAdicional)) : '';

  const payloadSemCRC =
    format('00', '01') +
    format('01', '12') +
    MERCHANT_ACCOUNT +
    MERCHANT_CATEGORY +
    TRANSACTION_CURRENCY +
    TRANSACTION_AMOUNT +
    COUNTRY_CODE +
    MERCHANT_NAME +
    MERCHANT_CITY +
    ADDITIONAL_DATA +
    ADDITIONAL_INFO +
    '6304';

  const checksum = crc16(payloadSemCRC);
  return payloadSemCRC + checksum;
}
