import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * clsx + tailwind-merge: последний конфликтующий класс побеждает (`hidden` поверх `inline-flex`, `px-7` поверх `px-5`).
 * Типографика проекта — кастомные утилиты (`text-h5`, `text-body-s`…): регистрируем их как font-size,
 * иначе tailwind-merge принял бы их за цвет текста и выкинул бы `text-dark-900`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-l', 'body-m', 'body-m-medium', 'body-s', 'body-s-medium', 'caption', 'overline', 'button-l', 'button-m', 'price-l', 'price-m'] }],
    },
  },
});

export const cn = (...v: ClassValue[]) => twMerge(clsx(v));
