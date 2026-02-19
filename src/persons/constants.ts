/** Campo del schema de triaje que contiene la derivación interna (servicios extra) */
export const TRIAJE_DERIVATION_FIELD_ID = 'fld-60';

/** Slug del formulario de triaje */
export const FORM_SLUG_TRIAJE = 'triaje';

/** Mapeo valor en Derivación interna → slug del formulario */
export const DERIVATION_TO_FORM_SLUG: Record<string, string> = {
  trabajo_social: 'social',
  social: 'social',
  psicologia: 'psicologico',
  psicologico: 'psicologico',
  legal: 'legal',
  promocion_medios_vida: 'medios-vida',
  'medios-vida': 'medios-vida',
};
