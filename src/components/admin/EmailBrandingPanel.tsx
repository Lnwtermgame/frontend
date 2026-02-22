import React from "react";

type Branding = {
  logoUrl?: string;
  siteName?: string;
  logoWidth?: number;
  logoHeight?: number;
  headerBgColor?: string;
  headerTextColor?: string;
  showLogoInHeader?: boolean;
  headerText?: string | null;
  footerBgColor?: string;
  footerTextColor?: string;
  showSocialLinks?: boolean;
};

export default function EmailBrandingPanel(props: {
  branding: Branding | null;
  onUpdate: (payload: Partial<Branding>) => void;
}) {
  const { branding, onUpdate } = props;
  const [local, setLocal] = React.useState<Branding>(branding || {});

  React.useEffect(() => {
    if (branding) setLocal(branding);
  }, [branding]);

  const handleChange = (key: keyof Branding, value: any) => {
    const next = { ...local, [key]: value } as Branding;
    setLocal(next);
  };

  const handleSave = () => {
    onUpdate(local);
  };

  return (
    <div
      className="space-y-4 p-4 border-[3px] border-black bg-white"
      style={{ boxShadow: "4px 4px 0 0 #000" }}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-6 h-6 bg-brutal-pink" />
        <h3 className="font-bold text-lg">Branding</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Logo URL</label>
          <input
            className="w-full px-3 py-2 border border-black"
            value={local.logoUrl || ""}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Site Name</label>
          <input
            className="w-full px-3 py-2 border border-black"
            value={local.siteName || ""}
            onChange={(e) => handleChange("siteName", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Header BG Color
          </label>
          <input
            type="color"
            className="w-20 h-10 border"
            value={local.headerBgColor || "#1E3A8A"}
            onChange={(e) => handleChange("headerBgColor", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Header Text Color
          </label>
          <input
            type="color"
            className="w-20 h-10 border"
            value={local.headerTextColor || "#ffffff"}
            onChange={(e) => handleChange("headerTextColor", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Show Logo in Header
          </label>
          <input
            type="checkbox"
            checked={local.showLogoInHeader ?? true}
            onChange={(e) => handleChange("showLogoInHeader", e.target.checked)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Header Text</label>
          <input
            className="w-full px-3 py-2 border border-black"
            value={local.headerText || ""}
            onChange={(e) => handleChange("headerText", e.target.value)}
            placeholder="Your brand"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Footer BG Color
          </label>
          <input
            type="color"
            className="w-20 h-10 border"
            value={local.footerBgColor || "#F9FAFB"}
            onChange={(e) => handleChange("footerBgColor", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Footer Text Color
          </label>
          <input
            type="color"
            className="w-20 h-10 border"
            value={local.footerTextColor || "#6B7280"}
            onChange={(e) => handleChange("footerTextColor", e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 items-center justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-brutal-pink text-white border border-black font-bold"
        >
          Save Branding
        </button>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-gray-50 p-4 border border-black rounded">
          <strong>Preview:</strong>
          <div className="mt-2 border rounded p-3" style={{ minHeight: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {local.logoUrl && (
                <img src={local.logoUrl} alt="logo" style={{ height: 40 }} />
              )}
              <span style={{ fontWeight: 700 }}>
                {local.siteName || "Site"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
