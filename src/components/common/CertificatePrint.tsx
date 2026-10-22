import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import type { PublicCertificate } from '../../api/certificates';
import type { CardDefect } from '../../types';
import { cardYear } from '../../utils/cardDisplay';

/**
 * Dossier de impresión del certificado: una hoja A4 sobria, solo visible al imprimir
 * (index.css oculta la web en papel y este bloque en pantalla). Se monta fuera de #root.
 */

type Lang = 'es' | 'en';

const T = {
  es: {
    kicker: 'Certificado de autenticación y graduación',
    cert: 'Certificado',
    slab: 'Slab',
    issued: 'Emitido',
    finalGrade: 'Calificación final',
    subgrades: 'Subcalificaciones',
    centering: 'Centrado',
    corners: 'Esquinas',
    edges: 'Bordes',
    surface: 'Superficie',
    front: 'Anverso',
    back: 'Reverso',
    noPhoto: 'Sin foto',
    defects: 'Defectos registrados',
    noDefects: 'El laboratorio no registró ningún defecto en esta carta.',
    side: 'Cara',
    category: 'Categoría',
    severity: 'Gravedad',
    detail: 'Descripción',
    notes: 'Observaciones del laboratorio',
    verify: 'Verificación en línea',
    verifyText: 'Escanea el código o visita la dirección para comprobar que este certificado sigue vigente.',
    signature: 'Firma digital Ed25519',
    unsigned: 'Certificado registrado sin firma digital.',
    key: 'Clave',
    game: 'Juego',
    set: 'Expansión',
    number: 'Número',
    year: 'Año',
    language: 'Idioma',
    authentic: 'Auténtica',
    notAuthentic: 'No auténtica',
    revoked: 'REVOCADO',
    superseded: 'SUSTITUIDO',
    disclaimer:
      'Este documento es una copia impresa del registro público de Gorilla Grading. La validez del certificado se comprueba siempre en línea: el registro en línea prevalece sobre cualquier copia impresa.',
    printed: 'Impreso el',
    severityLabel: { flawless: 'Sin defecto', minor: 'Leve', moderate: 'Moderado', critical: 'Grave' },
  },
  en: {
    kicker: 'Certificate of authentication and grading',
    cert: 'Certificate',
    slab: 'Slab',
    issued: 'Issued',
    finalGrade: 'Final grade',
    subgrades: 'Subgrades',
    centering: 'Centering',
    corners: 'Corners',
    edges: 'Edges',
    surface: 'Surface',
    front: 'Front',
    back: 'Back',
    noPhoto: 'No photo',
    defects: 'Recorded defects',
    noDefects: 'The laboratory recorded no defects on this card.',
    side: 'Side',
    category: 'Category',
    severity: 'Severity',
    detail: 'Description',
    notes: 'Laboratory notes',
    verify: 'Online verification',
    verifyText: 'Scan the code or visit the address to check that this certificate is still valid.',
    signature: 'Ed25519 digital signature',
    unsigned: 'Certificate registered without a digital signature.',
    key: 'Key',
    game: 'Game',
    set: 'Set',
    number: 'Number',
    year: 'Year',
    language: 'Language',
    authentic: 'Authentic',
    notAuthentic: 'Not authentic',
    revoked: 'REVOKED',
    superseded: 'SUPERSEDED',
    disclaimer:
      'This document is a printed copy of the Gorilla Grading public registry. Certificate validity is always checked online: the online registry prevails over any printed copy.',
    printed: 'Printed on',
    severityLabel: { flawless: 'Flawless', minor: 'Minor', moderate: 'Moderate', critical: 'Critical' },
  },
} as const;

const CATEGORY_KEY = { Centering: 'centering', Corners: 'corners', Edges: 'edges', Surface: 'surface' } as const;

const fmt = (n: number) => n.toFixed(1);

const formatDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

/** Foto de una cara con los defectos numerados, en la misma posición que en la web. */
const CardFace: React.FC<{ src: string; label: string; empty: string; defects: { n: number; d: CardDefect }[] }> = ({ src, label, empty, defects }) => (
  <figure className="cp-face">
    <div className="cp-face-frame">
      {src ? (
        <div className="cp-face-img">
          <img src={src} alt={label} />
          {defects.map(({ n, d }) => (
            <span key={d.id} className="cp-pin" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
              {n}
            </span>
          ))}
        </div>
      ) : (
        <div className="cp-face-empty">{empty}</div>
      )}
    </div>
    <figcaption>{label}</figcaption>
  </figure>
);

export const CertificatePrint: React.FC<{ card: PublicCertificate; lang: Lang }> = ({ card, lang }) => {
  const t = T[lang];
  const [qr, setQr] = useState('');
  const verifyUrl = `${window.location.origin}/certificates/${card.certNumber}`;
  const slab = typeof card.signedRecord?.slab === 'string' ? card.signedRecord.slab : null;

  useEffect(() => {
    QRCode.toString(verifyUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [verifyUrl]);

  // Numeración única de los defectos: el número de la foto es el de la tabla.
  const numbered = card.defects.map((d, i) => ({ n: i + 1, d }));
  const onSide = (side: 'front' | 'back') => numbered.filter(({ d }) => (d.side ?? 'front') === side);

  const meta: [string, string][] = [
    [t.game, card.game],
    [t.set, card.set],
    [t.number, card.cardNumber],
    [t.year, cardYear(card.year) ?? ''],
    [t.language, card.language],
  ].filter(([, v]) => !!v) as [string, string][];

  const s = card.subgrades;
  const sideText = (x: { frontScore: number; backScore: number }) =>
    [x.frontScore > 0 ? `${t.front} ${fmt(x.frontScore)}` : '', x.backScore > 0 ? `${t.back} ${fmt(x.backScore)}` : ''].filter(Boolean).join(' · ');
  const subRows: [string, number, string][] = [
    [t.centering, s.centering.score, [s.centering.frontRatio && `${t.front} ${s.centering.frontRatio}`, s.centering.backRatio && `${t.back} ${s.centering.backRatio}`].filter(Boolean).join(' · ')],
    [t.corners, s.corners.score, sideText(s.corners)],
    [t.edges, s.edges.score, sideText(s.edges)],
    [t.surface, s.surface.score, sideText(s.surface)],
  ];
  const notes: [string, string][] = (
    [
      [t.centering, s.centering.description],
      [t.corners, s.corners.description],
      [t.edges, s.edges.description],
      [t.surface, s.surface.description],
    ] as [string, string][]
  ).filter(([, v]) => !!v);

  const watermark = card.status === 'revoked' ? t.revoked : card.status === 'superseded' ? t.superseded : null;

  return createPortal(
    <div className="print-dossier" lang={lang}>
      {watermark && <div className="cp-watermark">{watermark}</div>}

      <header className="cp-header">
        <div className="cp-brand">
          <img src="/brand/logo-green.png" alt="" />
          <div>
            <div className="cp-brand-name">GORILLA</div>
            <div className="cp-brand-sub">GRADING</div>
          </div>
        </div>
        <div className="cp-header-right">
          <div className="cp-kicker">{t.kicker}</div>
          <div className="cp-number">{card.certNumber}</div>
          <div className="cp-small">
            {slab && <>{t.slab} {slab} · </>}
            {t.issued} {formatDate(card.issuedAt, lang)}
          </div>
        </div>
      </header>

      <section className="cp-main">
        <div className="cp-identity">
          <h1>{card.name}</h1>
          <dl className="cp-meta">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="cp-grade">
            <div className="cp-grade-box">
              <div className="cp-label">{t.finalGrade}</div>
              {card.isAuthentic ? (
                <>
                  <div className="cp-grade-value">{fmt(card.grade)}</div>
                  <div className="cp-grade-label">{card.gradeLabel}</div>
                </>
              ) : (
                <div className="cp-grade-label">{t.notAuthentic}</div>
              )}
            </div>
            <table className="cp-subgrades">
              <thead>
                <tr>
                  <th colSpan={3}>{t.subgrades}</th>
                </tr>
              </thead>
              <tbody>
                {subRows.map(([name, score, detail]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td className="cp-num">{fmt(score)}</td>
                    <td className="cp-detail">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="cp-verify">
          <div className="cp-label">{t.verify}</div>
          {qr ? <div className="cp-qr" dangerouslySetInnerHTML={{ __html: qr }} /> : <div className="cp-qr" />}
          <p>{t.verifyText}</p>
          <div className="cp-url">{verifyUrl.replace(/^https?:\/\//, '')}</div>
        </aside>
      </section>

      <section className="cp-faces">
        <CardFace src={card.frontImage} label={t.front} empty={t.noPhoto} defects={onSide('front')} />
        <CardFace src={card.backImage} label={t.back} empty={t.noPhoto} defects={onSide('back')} />
      </section>

      <section className="cp-block">
        <h2>{t.defects}</h2>
        {numbered.length === 0 ? (
          <p className="cp-muted">{t.noDefects}</p>
        ) : (
          <table className="cp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t.side}</th>
                <th>{t.category}</th>
                <th>{t.severity}</th>
                <th>{t.detail}</th>
              </tr>
            </thead>
            <tbody>
              {numbered.map(({ n, d }) => (
                <tr key={d.id}>
                  <td className="cp-num">{n}</td>
                  <td>{(d.side ?? 'front') === 'front' ? t.front : t.back}</td>
                  <td>{t[CATEGORY_KEY[d.category]]}</td>
                  <td>{t.severityLabel[d.severity]}</td>
                  <td>
                    <strong>{d.title}</strong>
                    {d.description && <> — {d.description}</>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {notes.length > 0 && (
        <section className="cp-block">
          <h2>{t.notes}</h2>
          <dl className="cp-notes">
            {notes.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="cp-block cp-signature">
        <h2>{t.signature}</h2>
        {card.signature ? (
          <>
            <div className="cp-sig">{card.signature}</div>
            {card.keyId && (
              <div className="cp-small">
                {t.key}: {card.keyId}
              </div>
            )}
          </>
        ) : (
          <p className="cp-muted">{t.unsigned}</p>
        )}
      </section>

      <footer className="cp-footer">
        <p>{t.disclaimer}</p>
        <p>
          {t.printed} {formatDate(new Date().toISOString(), lang)} · gorillagrading.com
        </p>
      </footer>
    </div>,
    document.body,
  );
};
