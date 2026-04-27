import type { CSSProperties } from 'react'

export interface DesignTokens {
  name: string
  font: string
  bg: string
  fg: string
  fgMuted: string
  accent: string
  accentSoft: string
  warn: string
  warnSoft: string
  hairline: string
  chipBg: string
  chipBorder: string
  kbdBg: string

  sidebarWidth: number
  sidebarPad: number
  sidebarBg: string
  sidebarBorder: string
  sidebarBlur: string

  navItem: CSSProperties
  navGap: number
  navActiveBg: string
  navActiveFg: string
  sectionLabel: CSSProperties

  toolbarHeight: number
  toolbarBg: string
  toolbarBlur: string
  titleSize: number
  titleWeight: number
  inputRadius: number

  heroSize: number
  heroWeight: number
  contentPad: string

  cardBg: string
  cardRadius: number
  cardBorder: string
  cardShadow: string
  groupHeaderPad: string
  rowPad: string
  rowBorder: string
  rowSize: number
  checkboxBorder: string
}

export const STYLE_THINGS: DesignTokens = {
  name: 'Things · 极简温暖',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
  bg: '#FAF8F5',
  fg: '#2A2926',
  fgMuted: '#8E8A82',
  accent: '#C9622D',
  accentSoft: 'rgba(201,98,45,0.10)',
  warn: '#B8730F',
  warnSoft: 'rgba(184,115,15,0.10)',
  hairline: '1px solid #EDE8E1',
  chipBg: '#F0EBE2',
  chipBorder: 'none',
  kbdBg: '#E5DFD3',

  sidebarWidth: 210,
  sidebarPad: 10,
  sidebarBg: '#F3EEE5',
  sidebarBorder: '1px solid #EAE3D5',
  sidebarBlur: 'none',

  navItem: {
    padding: '7px 14px',
    borderRadius: 7,
    fontSize: 13,
    cursor: 'default',
    letterSpacing: 0.1,
  },
  navGap: 3,
  navActiveBg: 'rgba(201,98,45,0.14)',
  navActiveFg: '#C9622D',
  sectionLabel: {
    padding: '14px 16px 6px',
    fontSize: 10.5,
    fontWeight: 600,
    color: '#A39C8E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  toolbarHeight: 54,
  toolbarBg: 'rgba(250,248,245,0.9)',
  toolbarBlur: 'blur(16px)',
  titleSize: 14,
  titleWeight: 600,
  inputRadius: 8,

  heroSize: 28,
  heroWeight: 700,
  contentPad: '28px 36px',

  cardBg: '#FFFFFF',
  cardRadius: 14,
  cardBorder: '1px solid #EDE8E1',
  cardShadow: '0 1px 2px rgba(80,60,30,0.04)',
  groupHeaderPad: '14px 18px 8px',
  rowPad: '10px 18px',
  rowBorder: 'none',
  rowSize: 13.5,
  checkboxBorder: '#C9C2B4',
}

export const S = STYLE_THINGS
