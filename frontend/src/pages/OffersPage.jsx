import { useMemo } from "react";

const STORE_MENU_PDF_PATH = "/menu/Odisha_Pizza_Menu.pdf";

export default function OffersPage() {
  const viewerSrc = useMemo(() => `${STORE_MENU_PDF_PATH}#toolbar=1&navpanes=0`, []);

  return (
    <section style={{ minHeight: "100vh", background: "#f7f7f8", padding: 0 }}>
      <iframe
        title="Store Menu PDF"
        src={viewerSrc}
        style={{ width: "100%", height: "100vh", border: "none", borderRadius: 0, background: "#fff" }}
      />
    </section>
  );
}
