import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The .ots proof files under public/proofs are served as static assets,
  // so Next infers Content-Type from the file extension — and ".ots" is
  // also OpenDocument's spreadsheet-template extension, so it was being
  // served as application/vnd.oasis.opendocument.spreadsheet-template,
  // which some browsers/OSes try to open in spreadsheet software. There's
  // no registered MIME type for an OpenTimestamps proof, so this forces
  // the standard "just download it, don't guess" type instead.
  async headers() {
    return [
      {
        source: "/proofs/:file(.*\\.ots)",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Content-Disposition", value: "attachment" },
        ],
      },
    ];
  },
};

export default nextConfig;
