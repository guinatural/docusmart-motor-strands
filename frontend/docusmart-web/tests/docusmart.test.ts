import assert from 'node:assert/strict';
import { test } from 'node:test';

import { confiancaPct } from '../lib/docusmart/api';
import {
  sinistroEmProcessamento,
  statusSinistroMeta,
} from '../lib/docusmart/constants';
import { formatBRL, formatCpf, formatData, formatDataHora } from '../lib/docusmart/format';

test('formats Brazilian currency, dates, and CPF values', () => {
  assert.equal(formatBRL(null), '—');
  assert.equal(formatBRL(1234.5), 'R$ 1.234,50');
  assert.equal(formatData('2026-03-10'), '10/03/2026');
  assert.equal(formatDataHora('2026-03-10T15:02:11Z'), '10/03/2026 15:02');
  assert.equal(formatCpf('123.456.789-00'), '123.456.789-00');
  assert.equal(formatCpf('123'), '123');
});

test('normalizes confidence percentages from API formats', () => {
  assert.equal(confiancaPct('0,935'), 94);
  assert.equal(confiancaPct('95%'), 95);
  assert.equal(confiancaPct(''), null);
  assert.equal(confiancaPct('not-a-number'), null);
});

test('maps claim status and identifies statuses that keep polling', () => {
  assert.deepEqual(statusSinistroMeta('aprovado'), {
    label: 'Aprovado',
    tone: 'success',
  });
  assert.deepEqual(statusSinistroMeta('ERRO'), {
    label: 'Falha no processamento',
    tone: 'danger',
  });
  assert.equal(sinistroEmProcessamento('aberto'), true);
  assert.equal(sinistroEmProcessamento('APROVADO'), false);
});
