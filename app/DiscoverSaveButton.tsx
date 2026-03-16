"use client";

import { useState } from "react";
import SaveModal from "../components/SaveModal";
import { toast } from "../lib/toast";

export default function DiscoverSaveButton(props: any) {
  const designId = props?.designId || props?.id || props?.design?.id || "";
  const designTitle = props?.designTitle || props?.title || props?.design?.title || "Tasarım";

  const [open, setOpen] = useState(false);

  if (!designId) {
    // props yanlış geldiyse build kırılmasın
    return (
      <button
        className={props?.className || "rounded-xl border px-3 py-2 text-sm"}
        onClick={() => toast("Kaydet: designId bulunamadı")}
      >
        Kaydet
      </button>
    );
  }

  return (
    <>
      <button
        className={props?.className || "rounded-xl bg-black px-3 py-2 text-sm text-white"}
        onClick={() => setOpen(true)}
      >
        {props?.children || "Kaydet"}
      </button>

      <SaveModal
        open={open}
        onClose={() => setOpen(false)}
        designId={designId}
        designTitle={designTitle}
      />
    </>
  );
}
