const mobileLayoutQuery = '(max-width: 700px)'
const standaloneQuery = '(display-mode: standalone)'

const isMobileLayout = () => window.matchMedia(mobileLayoutQuery).matches
const isStandaloneApp = () => window.matchMedia(standaloneQuery).matches

export { isMobileLayout, isStandaloneApp }
