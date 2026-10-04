NanoFly brand fonts
-------------------
Your brand kit specifies:
  Posterama        - topic / primary display + subtopic   (commercial font)
  Sentic           - sub-headings                          (commercial font)
  Red Hat Display  - body / supporting copy                (free, loaded from Google Fonts)

Posterama and Sentic cannot be loaded from a free CDN. If you hold a web licence, drop the
converted .woff2 files in this folder using exactly these names and the portal picks them up
automatically (css/brand-fonts.css):

  Posterama-SemiBold.woff2   Posterama-Bold.woff2
  Sentic-SemiBold.woff2      Sentic-Bold.woff2

Until then the portal falls back to Jost (a close geometric match for Posterama) and
Red Hat Display (for Sentic), so it always looks on-brand.
