# Certificate images

The original zip did not contain the actual certificate image binaries
(Certificates/1.png … 17.png did not exist on disk — the <img> tags were
pointing at files that were missing, silently falling back to the
placeholder logo via the onerror handler).

Every certificate reference has been renamed to a distinct, descriptive
filename and now expects the real image to live in this folder, e.g.:

  Certificates/images/certificate-surendran-b.png
  Certificates/images/certificate-mk-prasanna.png
  Certificates/images/certificate-musthaq-ahamed-r.png
  ...

Drop the real certificate image for each person into this folder using
the exact filename referenced in Certificates/<name>.html and
certification.html. See MAPPING.txt in this folder for the full list.
