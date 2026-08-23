import { FormFieldOption } from '../../shared/presentation/components/dynamic-form/dynamic-form.component';

/** Opcións de colores comúns para máscaras (usados no select de cor do formulario). */
export const PET_COLOR_OPTIONS: FormFieldOption[] = [
  { label: 'Negro', value: 'black' },
  { label: 'Branco', value: 'white' },
  { label: 'Marrón', value: 'brown' },
  { label: 'Cremoso', value: 'cream' },
  { label: 'Gris', value: 'gray' },
  { label: 'Manchas / Atigrado', value: 'spotted' },
  { label: 'Rubio', value: 'golden' },
  { label: 'Marrón claro', value: 'light_brown' },
  { label: 'Negro con branco', value: 'black_white' },
  { label: 'Otro', value: 'other' }
];

/** Valor por defecto para o select de cor cando non se especifica. */
export const DEFAULT_PET_COLOR: FormFieldOption = {
  label: 'Seleccionar color',
  value: ''
};
