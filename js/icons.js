/* Íconos de línea (SVG inline, sin dependencias). */
const ICON={
  resumen:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  propiedades:'<path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16"/><path d="M15 9h4a1 1 0 011 1v11"/><path d="M8 8h3M8 12h3M8 16h3"/><path d="M2 21h20"/>',
  contribuciones:'<path d="M5 3h11l3 3v15H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  documentos:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  contratos:'<path d="M8 3h8l4 4v14H4V3z" transform="translate(0 0)"/><path d="M9 12l2 2 4-4"/><path d="M8 18h8"/>',
  pagos:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
  gastos:'<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  informes:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  ajustes:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  chevron:'<path d="M9 6l6 6-6 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  logout:'<path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9"/>',
  inflow:'<path d="M12 4v12M7 12l5 5 5-5"/>',
  outflow:'<path d="M12 20V8M7 12l5-5 5 5"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  box:'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
};
const ico=(n,cls)=>`<svg viewBox="0 0 24 24" aria-hidden="true"${cls?` class="${cls}"`:""}>${ICON[n]||""}</svg>`;
