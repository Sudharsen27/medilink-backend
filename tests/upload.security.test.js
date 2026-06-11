const path = require("path");

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt",
]);

const isSafeMedicalRecordPath = (recordUrl, uploadsRoot) => {
  const filePath = path.resolve(
    path.join(__dirname, ".."),
    recordUrl.replace(/^\//, "")
  );
  return filePath.startsWith(uploadsRoot);
};

describe("medical record download path safety", () => {
  const uploadsRoot = path.resolve(__dirname, "..", "uploads", "medical-records");

  test("allows files inside uploads root", () => {
    expect(
      isSafeMedicalRecordPath(
        "/uploads/medical-records/medical-record-123.pdf",
        uploadsRoot
      )
    ).toBe(true);
  });

  test("blocks path traversal outside uploads root", () => {
    expect(
      isSafeMedicalRecordPath("/uploads/../server.js", uploadsRoot)
    ).toBe(false);
  });

  test("extension whitelist includes pdf and images", () => {
    expect(ALLOWED_EXTENSIONS.has(".pdf")).toBe(true);
    expect(ALLOWED_EXTENSIONS.has(".exe")).toBe(false);
  });
});
