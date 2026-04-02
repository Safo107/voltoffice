import { getDb } from "./mongodb";

export interface CompanyData {
  companyName: string;
  companyAddress: string;
  companyZip: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  taxNumber: string;
  vatId: string;
  companyTaxId: string;
  companyLogoBase64: string | null;
}

export async function getCompanyData(userId: string): Promise<CompanyData> {
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ uid: userId });
    return {
      companyName:       user?.companyName       || "",
      companyAddress:    user?.companyAddress     || "",
      companyZip:        user?.companyZip         || "",
      companyCity:       user?.companyCity        || "",
      companyPhone:      user?.companyPhone       || "",
      companyEmail:      user?.companyEmail       || "",
      companyWebsite:    user?.companyWebsite     || "",
      taxNumber:         user?.taxNumber          || "",
      vatId:             user?.vatId              || "",
      companyTaxId:      user?.taxNumber          || user?.vatId || "",
      companyLogoBase64: user?.companyLogoBase64  || null,
    };
  } catch {
    return {
      companyName: "", companyAddress: "", companyZip: "", companyCity: "",
      companyPhone: "", companyEmail: "", companyWebsite: "",
      taxNumber: "", vatId: "", companyTaxId: "", companyLogoBase64: null,
    };
  }
}
