// Пресет PrimeVue из токенов дизайн-системы Marscap (тот же объект, что src/base/pv-preset.js)
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export default definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '6px', sm: '8px', md: '12px', lg: '14px', xl: '18px' },
    blue: { 50: '#EEF4FF', 100: '#C2D8FF', 200: '#C2D8FF', 300: '#97BEFF', 400: '#699FFF', 500: '#3D7EFC', 600: '#1A5FE5', 700: '#0244BE', 800: '#02379B', 900: '#022F84', 950: '#021D52' },
    ink:  { 0: '#FFFFFF', 50: '#F5F7FB', 100: '#EEF0F4', 200: '#DBDEE5', 300: '#C0C4CD', 400: '#9FA5B0', 500: '#7D8391', 600: '#596070', 700: '#384050', 800: '#222A3A', 900: '#0E1420', 950: '#090D18' },
    green: { 400: '#63D18F', 600: '#006B35' }, amber: { 400: '#EEB154', 600: '#9A5B00' }, red: { 400: '#F97770', 600: '#B8262A' }
  },
  semantic: {
    primary: { 50: '{blue.50}', 100: '{blue.100}', 200: '{blue.200}', 300: '{blue.300}', 400: '{blue.400}', 500: '{blue.500}', 600: '{blue.600}', 700: '{blue.700}', 800: '{blue.800}', 900: '{blue.900}', 950: '{blue.950}' },
    focusRing: { width: '2px', style: 'solid', color: '{primary.300}', offset: '2px' },
    formField: { paddingX: '0.875rem', paddingY: '0.7rem', borderRadius: '{border.radius.md}', focusRing: { width: '3px', style: 'solid', color: 'color-mix(in oklab, {primary.500} 30%, transparent)', offset: '0' } },
    colorScheme: {
      light: {
        surface: { 0: '#FFFFFF', 50: '{ink.50}', 100: '{ink.100}', 200: '{ink.200}', 300: '{ink.300}', 400: '{ink.400}', 500: '{ink.500}', 600: '{ink.600}', 700: '{ink.700}', 800: '{ink.800}', 900: '{ink.900}', 950: '{ink.950}' },
        primary: { color: '{primary.600}', contrastColor: '#FFFFFF', hoverColor: '{primary.500}', activeColor: '{primary.700}' },
        highlight: { background: 'color-mix(in oklab, {primary.500} 12%, #EDF0F6)', focusBackground: 'color-mix(in oklab, {primary.500} 18%, #EDF0F6)', color: '#0E1420', focusColor: '#0E1420' },
        text: { color: '#384050', hoverColor: '#0E1420', mutedColor: '#596070', hoverMutedColor: '#384050' },
        formField: { background: '#EDF0F6', disabledBackground: '#E4E8EF', filledBackground: '#EDF0F6', borderColor: '#CACED6', hoverBorderColor: '{ink.600}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.600}', color: '#0E1420', placeholderColor: '#5E6776', invalidPlaceholderColor: '{red.600}', iconColor: '#5E6776', shadow: 'none' },
        content: { background: '#FDFDFF', hoverBackground: '#E4E8EF', borderColor: '#DBDEE5', color: '#384050', hoverColor: '#0E1420' }
      },
      dark: {
        surface: { 0: '#FFFFFF', 50: '{ink.50}', 100: '{ink.100}', 200: '{ink.200}', 300: '{ink.300}', 400: '{ink.400}', 500: '{ink.500}', 600: '{ink.600}', 700: '{ink.700}', 800: '{ink.800}', 900: '{ink.900}', 950: '{ink.950}' },
        primary: { color: '{primary.600}', contrastColor: '#FFFFFF', hoverColor: '{primary.500}', activeColor: '{primary.700}' },
        highlight: { background: 'color-mix(in oklab, {primary.500} 12%, #171E2C)', focusBackground: 'color-mix(in oklab, {primary.500} 18%, #171E2C)', color: '#EEF0F4', focusColor: '#EEF0F4' },
        text: { color: '#C0C4CD', hoverColor: '#EEF0F4', mutedColor: '#9FA5B0', hoverMutedColor: '#C0C4CD' },
        formField: { background: '#171E2C', disabledBackground: '#0E1420', filledBackground: '#171E2C', borderColor: '#303848', hoverBorderColor: '{ink.600}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.400}', color: '#EEF0F4', placeholderColor: '#7D8391', invalidPlaceholderColor: '{red.400}', iconColor: '#7D8391', shadow: 'none' },
        content: { background: '#0E1420', hoverBackground: '#222A3A', borderColor: '#262E3D', color: '#C0C4CD', hoverColor: '#EEF0F4' }
      }
    }
  },
  components: {
    button: { root: { borderRadius: '{border.radius.md}', paddingX: '1.375rem', paddingY: '0.75rem', gap: '0.5rem', label: { fontWeight: '600' }, sm: { paddingX: '1rem', paddingY: '0.5rem', fontSize: '0.84rem' } },
              colorScheme: { light: { secondary: { background: 'rgba(14,20,32,.03)', hoverBackground: 'rgba(14,20,32,.07)', borderColor: '#CACED6', hoverBorderColor: '{ink.600}', color: '#384050', hoverColor: '#0E1420' } },
                             dark:  { secondary: { background: 'rgba(255,255,255,.02)', hoverBackground: 'rgba(255,255,255,.06)', borderColor: '#303848', hoverBorderColor: '{ink.600}', color: '#C0C4CD', hoverColor: '#EEF0F4' } } } },
    togglebutton: { root: { borderRadius: '{border.radius.lg}', padding: '0.875rem 1rem', gap: '0.25rem' } },
    selectbutton: { root: { borderRadius: '{border.radius.md}' } },
    inputtext: { root: { paddingX: '0.875rem', paddingY: '0.7rem' } },
    tabs: { tab: { padding: '0.55rem 0.9rem', fontWeight: '500', borderWidth: '0 0 1px 0' }, tablist: { background: 'transparent' }, activeBar: { height: '2px' } },
    message: { root: { borderRadius: '{border.radius.md}' }, simple: { content: { padding: '0' } } },
    toast: { root: { borderRadius: '{border.radius.md}', width: 'min(360px, calc(100vw - 32px))' } }
  }
})
