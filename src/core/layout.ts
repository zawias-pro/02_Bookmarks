const mobileLayoutQuery = '(max-width: 700px)'

const isMobileLayout = () => window.matchMedia(mobileLayoutQuery).matches

export { isMobileLayout }
