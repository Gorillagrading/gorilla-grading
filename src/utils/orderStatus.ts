import type { OrderStatus } from '../../shared/domain';

type Bilingual = { es: string; en: string };

export const STATUS_LABEL: Record<OrderStatus, Bilingual> = {
  DRAFT: { es: 'Borrador', en: 'Draft' },
  SUBMITTED: { es: 'Enviado', en: 'Submitted' },
  PAYMENT_PENDING: { es: 'Pago pendiente', en: 'Payment pending' },
  PACKAGE_RECEIVED: { es: 'Paquete recibido', en: 'Package received' },
  PRE_INSPECTION: { es: 'Pre-inspección', en: 'Pre-inspection' },
  OPTICAL_GRADING: { es: 'Graduación óptica', en: 'Optical grading' },
  ENCAPSULATION: { es: 'Encapsulado', en: 'Encapsulation' },
  QUALITY_ASSURANCE: { es: 'Control de calidad', en: 'Quality assurance' },
  SHIPPED: { es: 'Enviado de vuelta', en: 'Shipped back' },
  DELIVERED: { es: 'Entregado', en: 'Delivered' },
  ON_HOLD: { es: 'En pausa', en: 'On hold' },
  CANCELLED: { es: 'Cancelado', en: 'Cancelled' },
  RETURNED: { es: 'Devuelto', en: 'Returned' },
};

/** Texto de las fases que aún no han ocurrido en el seguimiento de un pedido. */
export const STEP_COPY: Partial<Record<OrderStatus, { label: Bilingual; description: Bilingual }>> = {
  SUBMITTED: {
    label: { es: 'Envío registrado', en: 'Submission registered' },
    description: {
      es: 'El pedido está registrado y el paquete va de camino al laboratorio.',
      en: 'The order is registered and the package is on its way to the lab.',
    },
  },
  PACKAGE_RECEIVED: {
    label: { es: 'Paquete recibido en la bóveda', en: 'Package received in the vault' },
    description: {
      es: 'Recibimos el paquete y comprobamos que el precinto no se ha manipulado.',
      en: 'We receive the package and check that the seal has not been tampered with.',
    },
  },
  PRE_INSPECTION: {
    label: { es: 'Pre-inspección óptica', en: 'Optical pre-inspection' },
    description: {
      es: 'Identificamos cada carta y retiramos el polvo superficial.',
      en: 'We identify each card and remove surface dust.',
    },
  },
  OPTICAL_GRADING: {
    label: { es: 'Graduación óptica', en: 'Optical grading' },
    description: {
      es: 'Medimos centrado, esquinas, bordes y superficie, y registramos los defectos.',
      en: 'We measure centering, corners, edges and surface, and log any defects.',
    },
  },
  ENCAPSULATION: {
    label: { es: 'Encapsulado', en: 'Encapsulation' },
    description: {
      es: 'Sellamos cada carta en su slab, con número de serie y chip NFC.',
      en: 'We seal each card in its slab, with serial number and NFC chip.',
    },
  },
  QUALITY_ASSURANCE: {
    label: { es: 'Control de calidad', en: 'Quality assurance' },
    description: {
      es: 'Un segundo experto revisa la nota y firma el certificado.',
      en: 'A second expert reviews the grade and signs the certificate.',
    },
  },
  SHIPPED: {
    label: { es: 'Devolución en camino', en: 'Return shipment on its way' },
    description: {
      es: 'Tus cartas salen hacia ti con envío asegurado y firma.',
      en: 'Your cards are on their way back with insured, signed delivery.',
    },
  },
  DELIVERED: {
    label: { es: 'Entregado', en: 'Delivered' },
    description: { es: 'Pedido entregado.', en: 'Order delivered.' },
  },
};
